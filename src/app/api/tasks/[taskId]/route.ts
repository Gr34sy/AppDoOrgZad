import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { badRequestResponse } from "@/lib/api-responses";
import { parseJsonBody } from "@/lib/api-request";
import { connectDatabase } from "@/lib/mongoose";
import {
  getCurrentUserId,
  notFoundResponse,
  sanitizeMutation,
  unauthorizedResponse
} from "@/lib/session";
import { recordActivityEvent } from "@/lib/activity-events";
import { taskUpdateSchema } from "@/lib/validation-schemas";
import { Project } from "@/models/project";
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

  if (!isValidObjectId(params.taskId)) {
    return notFoundResponse();
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

  if (!isValidObjectId(params.taskId)) {
    return notFoundResponse();
  }

  const { data, error } = await parseJsonBody(request, taskUpdateSchema);

  if (!data) {
    return badRequestResponse(error);
  }

  await connectDatabase();
  const payload = sanitizeMutation(data);
  if (payload.projectId) {
    const projectExists = await Project.exists({
      _id: payload.projectId,
      ownerId,
      archivedAt: null
    });

    if (!projectExists) {
      return badRequestResponse("Selected project does not exist.");
    }
  }

  const previousTask = await Task.findOne({
    _id: params.taskId,
    ownerId,
    archivedAt: null
  });

  if (!previousTask) {
    return notFoundResponse();
  }

  const task = await Task.findOneAndUpdate(
    { _id: params.taskId, ownerId, archivedAt: null },
    { $set: payload },
    { new: true, runValidators: true }
  );

  if (!task) {
    return notFoundResponse();
  }

  const previousProjectId = previousTask.projectId ? String(previousTask.projectId) : "";
  const nextProjectId = task.projectId ? String(task.projectId) : "";

  if (previousProjectId && previousProjectId !== nextProjectId) {
    await Project.updateOne(
      { _id: previousProjectId, ownerId },
      { $pull: { taskIds: task._id } }
    );
  }

  if (nextProjectId && previousProjectId !== nextProjectId) {
    await Project.updateOne(
      { _id: nextProjectId, ownerId, archivedAt: null },
      { $addToSet: { taskIds: task._id } }
    );
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

  if (!isValidObjectId(params.taskId)) {
    return notFoundResponse();
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

  if (task.projectId) {
    await Project.updateOne(
      { _id: task.projectId, ownerId },
      { $pull: { taskIds: task._id } }
    );
  }

  await recordActivityEvent({ ownerId, entityType: "task", entityId: task.id, action: "deleted" });

  return NextResponse.json({ task });
}
