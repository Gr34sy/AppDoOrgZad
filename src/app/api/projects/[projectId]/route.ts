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
import { projectUpdateSchema } from "@/lib/validation-schemas";
import { Project } from "@/models/project";
import { Task } from "@/models/task";

type RouteContext = {
  params: {
    projectId: string;
  };
};

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const ownerId = await getCurrentUserId();

  if (!ownerId) {
    return unauthorizedResponse();
  }

  if (!isValidObjectId(params.projectId)) {
    return notFoundResponse();
  }

  await connectDatabase();
  const project = await Project.findOne({ _id: params.projectId, ownerId, archivedAt: null });

  if (!project) {
    return notFoundResponse();
  }

  return NextResponse.json({ project });
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const ownerId = await getCurrentUserId();

  if (!ownerId) {
    return unauthorizedResponse();
  }

  if (!isValidObjectId(params.projectId)) {
    return notFoundResponse();
  }

  const { data, error } = await parseJsonBody(request, projectUpdateSchema);

  if (!data) {
    return badRequestResponse(error);
  }

  await connectDatabase();
  const { newTasks, ...projectData } = data;
  const payload = sanitizeMutation(projectData);
  const hasProjectUpdates = Object.keys(payload).length > 0;
  const project = hasProjectUpdates
    ? await Project.findOneAndUpdate(
        { _id: params.projectId, ownerId, archivedAt: null },
        { $set: payload },
        { new: true, runValidators: true }
      )
    : await Project.findOne({ _id: params.projectId, ownerId, archivedAt: null });

  if (!project) {
    return notFoundResponse();
  }

  const createdTasks = await Promise.all(
    (newTasks ?? []).map((task) =>
      Task.create({
        ...sanitizeMutation(task),
        ownerId,
        projectId: project._id
      })
    )
  );

  if (createdTasks.length) {
    await Project.updateOne(
      { _id: project._id, ownerId, archivedAt: null },
      { $addToSet: { taskIds: { $each: createdTasks.map((task) => task._id) } } }
    );
  }

  await recordActivityEvent({
    ownerId,
    entityType: "project",
    entityId: project.id,
    action: "updated"
  });

  return NextResponse.json({ project });
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const ownerId = await getCurrentUserId();

  if (!ownerId) {
    return unauthorizedResponse();
  }

  if (!isValidObjectId(params.projectId)) {
    return notFoundResponse();
  }

  await connectDatabase();
  const project = await Project.findOneAndUpdate(
    { _id: params.projectId, ownerId, archivedAt: null },
    { $set: { archivedAt: new Date(), lifecycleStatus: "archived" } },
    { new: true }
  );

  if (!project) {
    return notFoundResponse();
  }

  await recordActivityEvent({
    ownerId,
    entityType: "project",
    entityId: project.id,
    action: "deleted"
  });

  return NextResponse.json({ project });
}
