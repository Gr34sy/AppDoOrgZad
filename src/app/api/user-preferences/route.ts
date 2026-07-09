import { NextRequest, NextResponse } from "next/server";
import {
  badRequestResponse,
  serviceUnavailableResponse,
  tooManyRequestsResponse
} from "@/lib/api-responses";
import { parseJsonBody } from "@/lib/api-request";
import { connectDatabase } from "@/lib/mongoose";
import { checkRateLimit } from "@/lib/rate-limit";
import { getCurrentUserId, unauthorizedResponse } from "@/lib/session";
import { savedThemeCreateSchema, userPreferenceUpdateSchema } from "@/lib/validation-schemas";
import { UserPreference } from "@/models/user-preference";
import type { ColorMode, ColorSettings } from "@/types/domain";

const colorModes: ColorMode[] = ["system", "light", "dark"];

type PreferencePayload = {
  theme?: ColorMode;
  colorMode?: ColorMode;
  colors?: Partial<ColorSettings>;
  savedThemes?: Array<{
    _id: unknown;
    name: string;
    colors: ColorSettings;
    createdAt?: Date | string;
  }>;
};

function isColorMode(value: unknown): value is ColorMode {
  return typeof value === "string" && colorModes.includes(value as ColorMode);
}

function serializePreference(preference: PreferencePayload | null) {
  const safePreference = preference ?? {
    colorMode: "system" satisfies ColorMode,
    colors: {},
    savedThemes: []
  };

  const colorMode = safePreference.colorMode ?? "system";

  return {
    colorMode,
    colors: safePreference.colors,
    savedThemes: (safePreference.savedThemes ?? []).map(
      (savedTheme: {
        _id: unknown;
        name: string;
        colors: ColorSettings;
        createdAt?: Date | string;
      }) => ({
        id: String(savedTheme._id),
        name: savedTheme.name,
        colors: savedTheme.colors,
        createdAt: savedTheme.createdAt
      })
    )
  };
}

function databaseUnavailableResponse() {
  return serviceUnavailableResponse("Database connection is currently unavailable.");
}

async function getPreference(ownerId: string) {
  const preference = await UserPreference.findOneAndUpdate(
    { userId: ownerId },
    { $setOnInsert: { userId: ownerId } },
    { new: true, upsert: true }
  ).lean();
  const legacyPreference = preference as PreferencePayload | null;

  if (legacyPreference && !legacyPreference.colorMode && isColorMode(legacyPreference.theme)) {
    await UserPreference.updateOne(
      { userId: ownerId },
      {
        $set: { colorMode: legacyPreference.theme },
        $unset: { theme: "" }
      }
    );

    return {
      ...legacyPreference,
      colorMode: legacyPreference.theme,
      theme: undefined
    } as PreferencePayload;
  }

  return legacyPreference;
}

export async function GET() {
  const ownerId = await getCurrentUserId();

  if (!ownerId) {
    return unauthorizedResponse();
  }

  try {
    await connectDatabase();
    const preference = await getPreference(ownerId);

    return NextResponse.json({ preference: serializePreference(preference) });
  } catch (error) {
    console.error("Unable to load user preferences", error);

    return NextResponse.json({
      preference: serializePreference(null),
      unavailable: true
    });
  }
}

export async function PUT(request: NextRequest) {
  const ownerId = await getCurrentUserId();

  if (!ownerId) {
    return unauthorizedResponse();
  }

  const rateLimit = checkRateLimit({
    key: `preferences:update:${ownerId}`,
    limit: 30,
    windowMs: 60_000
  });

  if (!rateLimit.allowed) {
    return tooManyRequestsResponse(rateLimit.retryAfterSeconds);
  }

  const { data, error } = await parseJsonBody(request, userPreferenceUpdateSchema);

  if (!data) {
    return badRequestResponse(error);
  }

  const updates: Record<string, unknown> = {};

  if (data.colorMode) {
    updates.colorMode = data.colorMode;
  }

  if (data.colors) {
    updates.colors = data.colors;
  }

  let preference: PreferencePayload | null;

  try {
    await connectDatabase();
    preference = (await UserPreference.findOneAndUpdate(
      { userId: ownerId },
      { $set: updates, $unset: { theme: "" }, $setOnInsert: { userId: ownerId } },
      { new: true, upsert: true }
    ).lean()) as PreferencePayload | null;
  } catch (error) {
    console.error("Unable to update user preferences", error);

    return databaseUnavailableResponse();
  }

  return NextResponse.json({ preference: serializePreference(preference) });
}

export async function POST(request: NextRequest) {
  const ownerId = await getCurrentUserId();

  if (!ownerId) {
    return unauthorizedResponse();
  }

  const rateLimit = checkRateLimit({
    key: `preferences:saved-themes:${ownerId}`,
    limit: 20,
    windowMs: 60_000
  });

  if (!rateLimit.allowed) {
    return tooManyRequestsResponse(rateLimit.retryAfterSeconds);
  }

  const { data, error } = await parseJsonBody(request, savedThemeCreateSchema);

  if (!data) {
    return badRequestResponse(error);
  }

  let preference: PreferencePayload | null;

  try {
    await connectDatabase();
    preference = (await UserPreference.findOneAndUpdate(
      { userId: ownerId },
      {
        $push: {
          savedThemes: {
            name: data.name,
            colors: data.colors
          }
        },
        $unset: { theme: "" },
        $setOnInsert: { userId: ownerId }
      },
      { new: true, upsert: true }
    ).lean()) as PreferencePayload | null;
  } catch (error) {
    console.error("Unable to save user theme", error);

    return databaseUnavailableResponse();
  }

  return NextResponse.json({ preference: serializePreference(preference) }, { status: 201 });
}
