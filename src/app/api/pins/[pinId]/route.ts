import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/mongoose";
import { recordActivityEvent } from "@/lib/activity-events";
import { getCurrentUserId, notFoundResponse, unauthorizedResponse } from "@/lib/session";
import { Pin } from "@/models/pin";

type RouteContext = {
  params: {
    pinId: string;
  };
};

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const ownerId = await getCurrentUserId();

  if (!ownerId) {
    return unauthorizedResponse();
  }

  await connectDatabase();
  const pin = await Pin.findOneAndDelete({ _id: params.pinId, ownerId });

  if (!pin) {
    return notFoundResponse();
  }

  await recordActivityEvent({
    ownerId,
    entityType: pin.targetType,
    entityId: pin.targetId.toString(),
    action: "unpinned"
  });

  return NextResponse.json({ pin });
}
