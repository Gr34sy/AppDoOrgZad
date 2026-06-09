import { NextRequest, NextResponse } from "next/server";
import type { ColorSettings } from "@/components/theme/theme-provider";
import { connectDatabase } from "@/lib/mongoose";
import { getCurrentUserId, unauthorizedResponse } from "@/lib/session";
import { UserPreference } from "@/models/user-preference";
import type { ColorMode } from "@/types/domain";

const colorKeys = ["accent", "upcoming", "todo", "inProgress", "completed", "calendar"] as const;
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

function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
}

function sanitizeColors(value: unknown): Partial<ColorSettings> | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const colors: Partial<ColorSettings> = {};
  const payload = value as Record<string, unknown>;

  for (const key of colorKeys) {
    if (isHexColor(payload[key])) {
      colors[key] = payload[key];
    }
  }

  return Object.keys(colors).length ? colors : null;
}

function sanitizeCompleteColors(value: unknown): ColorSettings | null {
  const colors = sanitizeColors(value);

  if (!colors || colorKeys.some((key) => !colors[key])) {
    return null;
  }

  return colors as ColorSettings;
}

function serializePreference(preference: PreferencePayload | null) {
  const safePreference = preference ?? {
    colorMode: "system" satisfies ColorMode,
    colors: {},
    savedThemes: []
  };

  const colorMode = safePreference.colorMode ?? safePreference.theme ?? "system";

  return {
    colorMode,
    theme: colorMode,
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

async function getPreference(ownerId: string) {
  const preference = await UserPreference.findOneAndUpdate(
    { userId: ownerId },
    { $setOnInsert: { userId: ownerId } },
    { new: true, upsert: true }
  ).lean();

  return preference as PreferencePayload | null;
}

export async function GET() {
  const ownerId = await getCurrentUserId();

  if (!ownerId) {
    return unauthorizedResponse();
  }

  await connectDatabase();
  const preference = await getPreference(ownerId);

  return NextResponse.json({ preference: serializePreference(preference) });
}

export async function PUT(request: NextRequest) {
  const ownerId = await getCurrentUserId();

  if (!ownerId) {
    return unauthorizedResponse();
  }

  const body = await request.json();
  const updates: Record<string, unknown> = {};

  const nextColorMode = body.colorMode ?? body.theme;

  if (colorModes.includes(nextColorMode)) {
    updates.colorMode = nextColorMode;
    updates.theme = nextColorMode;
  }

  const colors = sanitizeColors(body.colors);

  if (colors) {
    updates.colors = colors;
  }

  await connectDatabase();
  const preference = (await UserPreference.findOneAndUpdate(
    { userId: ownerId },
    { $set: updates, $setOnInsert: { userId: ownerId } },
    { new: true, upsert: true }
  ).lean()) as PreferencePayload | null;

  return NextResponse.json({ preference: serializePreference(preference) });
}

export async function POST(request: NextRequest) {
  const ownerId = await getCurrentUserId();

  if (!ownerId) {
    return unauthorizedResponse();
  }

  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 80) : "";
  const colors = sanitizeCompleteColors(body.colors);

  if (!name || !colors) {
    return NextResponse.json({ message: "Invalid saved theme" }, { status: 400 });
  }

  await connectDatabase();
  const preference = (await UserPreference.findOneAndUpdate(
    { userId: ownerId },
    {
      $push: {
        savedThemes: {
          name,
          colors
        }
      },
      $setOnInsert: { userId: ownerId }
    },
    { new: true, upsert: true }
  ).lean()) as PreferencePayload | null;

  return NextResponse.json({ preference: serializePreference(preference) }, { status: 201 });
}
