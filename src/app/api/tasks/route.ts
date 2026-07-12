import { NextRequest, NextResponse } from "next/server";
import { badRequestResponse } from "@/lib/api-responses";
import { parseJsonBody } from "@/lib/api-request";
import { areValidNoteIds, syncEntityNoteLinks } from "@/lib/entity-note-links";
import { connectDatabase } from "@/lib/mongoose";
import { getCurrentUserId, sanitizeMutation, unauthorizedResponse } from "@/lib/session";
import { recordActivityEvent } from "@/lib/activity-events";
import { taskCreateSchema } from "@/lib/validation-schemas";
import { Checklist } from "@/models/checklist";
import { Project } from "@/models/project";
import { Task } from "@/models/task";

export async function GET() {
  const ownerId = await getCurrentUserId();

  if (!ownerId) {
    return unauthorizedResponse();
  }

  await connectDatabase();
  const tasks = await Task.find({ ownerId, archivedAt: null }).sort({
    projectId: 1,
    statusId: 1,
    position: 1,
    updatedAt: -1
  });

  return NextResponse.json({ tasks });
}

export async function POST(request: NextRequest) {
  const ownerId = await getCurrentUserId();

  if (!ownerId) {
    return unauthorizedResponse();
  }

  const { data, error } = await parseJsonBody(request, taskCreateSchema);

  if (!data) {
    return badRequestResponse(error);
  }

  await connectDatabase();
  const { newChecklists, noteIds, ...taskData } = data;
  const payload = sanitizeMutation(taskData);
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

  if (noteIds?.length && !(await areValidNoteIds(noteIds, ownerId))) {
    return badRequestResponse("One or more linked notes are invalid.");
  }

  const task = await Task.create({ ...payload, ownerId });
  const createdChecklists = await Promise.all(
    (newChecklists ?? []).map((checklist, index) =>
      Checklist.create({
        title: checklist.title,
        ownerId,
        parentType: "task",
        parentId: task._id,
        position: (payload.checklistIds?.length ?? 0) + index
      })
    )
  );

  if (createdChecklists.length) {
    await Task.updateOne(
      { _id: task._id, ownerId, archivedAt: null },
      { $addToSet: { checklistIds: { $each: createdChecklists.map((checklist) => checklist._id) } } }
    );
  }

  if (noteIds) {
    await syncEntityNoteLinks({
      ownerId,
      targetType: "task",
      targetId: task.id,
      noteIds
    });
  }

  if (task.projectId) {
    await Project.updateOne(
      { _id: task.projectId, ownerId, archivedAt: null },
      { $addToSet: { taskIds: task._id } }
    );
  }
  await recordActivityEvent({ ownerId, entityType: "task", entityId: task.id, action: "created" });

  return NextResponse.json({ task }, { status: 201 });
}
