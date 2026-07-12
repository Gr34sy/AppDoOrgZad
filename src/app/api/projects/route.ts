import { NextRequest, NextResponse } from "next/server";
import { badRequestResponse } from "@/lib/api-responses";
import { parseJsonBody } from "@/lib/api-request";
import { areValidNoteIds, syncEntityNoteLinks } from "@/lib/entity-note-links";
import { connectDatabase } from "@/lib/mongoose";
import { getCurrentUserId, sanitizeMutation, unauthorizedResponse } from "@/lib/session";
import { recordActivityEvent } from "@/lib/activity-events";
import { projectCreateSchema } from "@/lib/validation-schemas";
import { Checklist } from "@/models/checklist";
import { Project } from "@/models/project";
import { Task } from "@/models/task";

export async function GET() {
  const ownerId = await getCurrentUserId();

  if (!ownerId) {
    return unauthorizedResponse();
  }

  await connectDatabase();
  const projects = await Project.find({ ownerId, archivedAt: null }).sort({
    lifecycleStatus: 1,
    position: 1,
    updatedAt: -1
  });

  return NextResponse.json({ projects });
}

export async function POST(request: NextRequest) {
  const ownerId = await getCurrentUserId();

  if (!ownerId) {
    return unauthorizedResponse();
  }

  const { data, error } = await parseJsonBody(request, projectCreateSchema);

  if (!data) {
    return badRequestResponse(error);
  }

  await connectDatabase();
  const { newTasks, newChecklists, noteIds, ...projectData } = data;
  const payload = sanitizeMutation(projectData);

  if (noteIds?.length && !(await areValidNoteIds(noteIds, ownerId))) {
    return badRequestResponse("One or more linked notes are invalid.");
  }

  const project = await Project.create({ ...payload, ownerId });
  const createdChecklists = await Promise.all(
    (newChecklists ?? []).map((checklist, index) =>
      Checklist.create({
        title: checklist.title,
        ownerId,
        parentType: "project",
        parentId: project._id,
        position: (payload.checklistIds?.length ?? 0) + index
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
    action: "created"
  });

  return NextResponse.json({ project }, { status: 201 });
}
