import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/mongoose";
import {
  getCurrentUserId,
  notFoundResponse,
  sanitizeMutation,
  unauthorizedResponse
} from "@/lib/session";
import { recordActivityEvent } from "@/lib/activity-events";
import { Task } from "@/models/task";

type RouteContext = {
  params: {
    taskId: string;
  };
};

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const ownerId = await getCurrentUserId();

  if (!ownerId) {
    return unauthorizedResponse();
  }

  await connectDatabase();
  const task = await Task.findOne({ _id: params.taskId, ownerId, archivedAt: null });

  if (!task) {
    return notFoundResponse();
  }

  return NextResponse.json({ task });
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const ownerId = await getCurrentUserId();

  if (!ownerId) {
    return unauthorizedResponse();
  }

  await connectDatabase();
  const payload = sanitizeMutation(await request.json());
  const task = await Task.findOneAndUpdate(
    { _id: params.taskId, ownerId, archivedAt: null },
    { $set: payload },
    { new: true, runValidators: true }
  );

  if (!task) {
    return notFoundResponse();
  }

  await recordActivityEvent({
    ownerId,
    entityType: "task",
    entityId: task.id,
    action: payload.statusId ? "moved" : "updated"
  });

  return NextResponse.json({ task });
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const ownerId = await getCurrentUserId();

  if (!ownerId) {
    return unauthorizedResponse();
  }

  await connectDatabase();
  const task = await Task.findOneAndUpdate(
    { _id: params.taskId, ownerId, archivedAt: null },
    { $set: { archivedAt: new Date() } },
    { new: true }
  );

  if (!task) {
    return notFoundResponse();
  }

  await recordActivityEvent({ ownerId, entityType: "task", entityId: task.id, action: "deleted" });

  return NextResponse.json({ task });
}
