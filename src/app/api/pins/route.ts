import { NextRequest, NextResponse } from "next/server";
import { badRequestResponse } from "@/lib/api-responses";
import { parseJsonBody } from "@/lib/api-request";
import { connectDatabase } from "@/lib/mongoose";
import { recordActivityEvent } from "@/lib/activity-events";
import { getCurrentUserId, unauthorizedResponse } from "@/lib/session";
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

  await connectDatabase();
  const { data, error } = await parseJsonBody(request, pinCreateSchema);

  if (!data) {
    return badRequestResponse(error);
  }

  const pin = await Pin.create({ ...data, ownerId });

  await recordActivityEvent({
    ownerId,
    entityType: pin.targetType,
    entityId: pin.targetId.toString(),
    action: "pinned"
  });

  return NextResponse.json({ pin }, { status: 201 });
}
