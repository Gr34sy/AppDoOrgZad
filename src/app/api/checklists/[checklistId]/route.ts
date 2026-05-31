import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/mongoose";
import {
  getCurrentUserId,
  notFoundResponse,
  sanitizeMutation,
  unauthorizedResponse
} from "@/lib/session";
import { recordActivityEvent } from "@/lib/activity-events";
import { Checklist } from "@/models/checklist";

type RouteContext = {
  params: {
    checklistId: string;
  };
};

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const ownerId = await getCurrentUserId();

  if (!ownerId) {
    return unauthorizedResponse();
  }

  await connectDatabase();
  const checklist = await Checklist.findOne({ _id: params.checklistId, ownerId, archivedAt: null });

  if (!checklist) {
    return notFoundResponse();
  }

  await recordActivityEvent({
    ownerId,
    entityType: "checklist",
    entityId: checklist.id,
    action: "updated"
  });

  return NextResponse.json({ checklist });
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const ownerId = await getCurrentUserId();

  if (!ownerId) {
    return unauthorizedResponse();
  }

  await connectDatabase();
  const payload = sanitizeMutation(await request.json());
  const checklist = await Checklist.findOneAndUpdate(
    { _id: params.checklistId, ownerId, archivedAt: null },
    { $set: payload },
    { new: true, runValidators: true }
  );

  if (!checklist) {
    return notFoundResponse();
  }

  await recordActivityEvent({
    ownerId,
    entityType: "checklist",
    entityId: checklist.id,
    action: "deleted"
  });

  return NextResponse.json({ checklist });
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const ownerId = await getCurrentUserId();

  if (!ownerId) {
    return unauthorizedResponse();
  }

  await connectDatabase();
  const checklist = await Checklist.findOneAndUpdate(
    { _id: params.checklistId, ownerId, archivedAt: null },
    { $set: { archivedAt: new Date() } },
    { new: true }
  );

  if (!checklist) {
    return notFoundResponse();
  }

  return NextResponse.json({ checklist });
}
