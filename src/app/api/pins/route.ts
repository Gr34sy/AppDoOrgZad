import { NextRequest, NextResponse } from "next/server";
import { badRequestResponse, tooManyRequestsResponse } from "@/lib/api-responses";
import { parseJsonBody } from "@/lib/api-request";
import { connectDatabase } from "@/lib/mongoose";
import { recordActivityEvent } from "@/lib/activity-events";
import { ownedActiveEntityExists } from "@/lib/entity-relations";
import { getCurrentUserId, unauthorizedResponse } from "@/lib/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { pinCreateSchema } from "@/lib/validation-schemas";
import { Pin } from "@/models/pin";

export async function GET() {
  const ownerId = await getCurrentUserId();

  if (!ownerId) {
    return unauthorizedResponse();
  }

  await connectDatabase();
  const pins = await Pin.find({ ownerId }).sort({ position: 1, updatedAt: -1 });

  return NextResponse.json({ pins });
}

export async function POST(request: NextRequest) {
  const ownerId = await getCurrentUserId();

  if (!ownerId) {
    return unauthorizedResponse();
  }

  const rateLimit = checkRateLimit({
    key: `pins:create:${ownerId}`,
    limit: 60,
    windowMs: 60_000
  });

  if (!rateLimit.allowed) {
    return tooManyRequestsResponse(rateLimit.retryAfterSeconds);
  }

  await connectDatabase();
  const { data, error } = await parseJsonBody(request, pinCreateSchema);

  if (!data) {
    return badRequestResponse(error);
  }

  if (
    !(await ownedActiveEntityExists({
      ownerId,
      targetType: data.targetType,
      targetId: data.targetId
    }))
  ) {
    return badRequestResponse("Selected item does not exist.");
  }

  const existingPin = await Pin.findOne({
    ownerId,
    targetType: data.targetType,
    targetId: data.targetId
  });

  if (existingPin) {
    return NextResponse.json({ pin: existingPin });
  }

  const lastPin = await Pin.findOne({ ownerId }).sort({ position: -1 }).select({ position: 1 });
  const pin = await Pin.create({
    ...data,
    ownerId,
    position: data.position ?? (lastPin?.position ?? -1) + 1
  });

  await recordActivityEvent({
    ownerId,
    entityType: pin.targetType,
    entityId: pin.targetId.toString(),
    action: "pinned"
  });

  return NextResponse.json({ pin }, { status: 201 });
}
