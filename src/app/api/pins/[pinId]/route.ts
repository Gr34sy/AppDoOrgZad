import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { badRequestResponse, tooManyRequestsResponse } from "@/lib/api-responses";
import { parseJsonBody } from "@/lib/api-request";
import { connectDatabase } from "@/lib/mongoose";
import { recordActivityEvent } from "@/lib/activity-events";
import { getCurrentUserId, notFoundResponse, unauthorizedResponse } from "@/lib/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { pinUpdateSchema } from "@/lib/validation-schemas";
import { Pin } from "@/models/pin";

type RouteContext = {
  params: {
    pinId: string;
  };
};

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const ownerId = await getCurrentUserId();

  if (!ownerId) {
    return unauthorizedResponse();
  }

  if (!isValidObjectId(params.pinId)) {
    return notFoundResponse();
  }

  await connectDatabase();
  const pin = await Pin.findOne({ _id: params.pinId, ownerId });

  if (!pin) {
    return notFoundResponse();
  }

  return NextResponse.json({ pin });
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const ownerId = await getCurrentUserId();

  if (!ownerId) {
    return unauthorizedResponse();
  }

  if (!isValidObjectId(params.pinId)) {
    return notFoundResponse();
  }

  const rateLimit = checkRateLimit({
    key: `pins:update:${ownerId}`,
    limit: 120,
    windowMs: 60_000
  });

  if (!rateLimit.allowed) {
    return tooManyRequestsResponse(rateLimit.retryAfterSeconds);
  }

  const { data, error } = await parseJsonBody(request, pinUpdateSchema);

  if (!data) {
    return badRequestResponse(error);
  }

  await connectDatabase();
  const pin = await Pin.findOneAndUpdate(
    { _id: params.pinId, ownerId },
    { $set: { position: data.position } },
    { new: true, runValidators: true }
  );

  if (!pin) {
    return notFoundResponse();
  }

  await recordActivityEvent({
    ownerId,
    entityType: pin.targetType,
    entityId: pin.targetId.toString(),
    action: "updated"
  });

  return NextResponse.json({ pin });
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const ownerId = await getCurrentUserId();

  if (!ownerId) {
    return unauthorizedResponse();
  }

  if (!isValidObjectId(params.pinId)) {
    return notFoundResponse();
  }

  const rateLimit = checkRateLimit({
    key: `pins:delete:${ownerId}`,
    limit: 120,
    windowMs: 60_000
  });

  if (!rateLimit.allowed) {
    return tooManyRequestsResponse(rateLimit.retryAfterSeconds);
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
