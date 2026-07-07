import { NextRequest, NextResponse } from "next/server";
import { badRequestResponse } from "@/lib/api-responses";
import { parseJsonBody } from "@/lib/api-request";
import { connectDatabase } from "@/lib/mongoose";
import { getCurrentUserId, sanitizeMutation, unauthorizedResponse } from "@/lib/session";
import { recordActivityEvent } from "@/lib/activity-events";
import { projectCreateSchema } from "@/lib/validation-schemas";
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
  const { newTasks, ...projectData } = data;
  const payload = sanitizeMutation(projectData);
  const project = await Project.create({ ...payload, ownerId });
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
    action: "created"
  });

  return NextResponse.json({ project }, { status: 201 });
}
