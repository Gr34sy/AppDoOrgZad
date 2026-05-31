import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/mongoose";
import { recordActivityEvent } from "@/lib/activity-events";
import { getCurrentUserId, sanitizeMutation, unauthorizedResponse } from "@/lib/session";
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
  const payload = sanitizeMutation(await request.json());
  const pin = await Pin.create({ ...payload, ownerId });

  await recordActivityEvent({
    ownerId,
    entityType: pin.targetType,
    entityId: pin.targetId.toString(),
    action: "pinned"
  });

  return NextResponse.json({ pin }, { status: 201 });
}
