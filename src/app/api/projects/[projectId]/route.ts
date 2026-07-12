import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { badRequestResponse } from "@/lib/api-responses";
import { parseJsonBody } from "@/lib/api-request";
import { areValidNoteIds, syncEntityNoteLinks } from "@/lib/entity-note-links";
import { connectDatabase } from "@/lib/mongoose";
import {
  getCurrentUserId,
  notFoundResponse,
  sanitizeMutation,
  unauthorizedResponse
} from "@/lib/session";
import { recordActivityEvent } from "@/lib/activity-events";
import { projectUpdateSchema } from "@/lib/validation-schemas";
import { Checklist } from "@/models/checklist";
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
  const { newTasks, newChecklists, noteIds, ...projectData } = data;
  const payload = sanitizeMutation(projectData);

  if (noteIds?.length && !(await areValidNoteIds(noteIds, ownerId))) {
    return badRequestResponse("One or more linked notes are invalid.");
  }

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

  const createdChecklists = await Promise.all(
    (newChecklists ?? []).map((checklist, index) =>
      Checklist.create({
        title: checklist.title,
        ownerId,
        parentType: "project",
        parentId: project._id,
        position: (project.checklistIds?.length ?? 0) + index
      })
    )
  );

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

  if (createdChecklists.length) {
    await Project.updateOne(
      { _id: project._id, ownerId, archivedAt: null },
      { $addToSet: { checklistIds: { $each: createdChecklists.map((checklist) => checklist._id) } } }
    );
  }

  if (noteIds) {
    await syncEntityNoteLinks({
      ownerId,
      targetType: "project",
      targetId: project.id,
      noteIds
    });
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
