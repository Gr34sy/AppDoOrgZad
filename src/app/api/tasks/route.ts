import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/mongoose";
import { getCurrentUserId, sanitizeMutation, unauthorizedResponse } from "@/lib/session";
import { recordActivityEvent } from "@/lib/activity-events";
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

  await connectDatabase();
  const payload = sanitizeMutation(await request.json());
  const task = await Task.create({ ...payload, ownerId });
  if (task.projectId) {
    await Project.updateOne(
      { _id: task.projectId, ownerId, archivedAt: null },
      { $addToSet: { taskIds: task._id } }
    );
  }
  await recordActivityEvent({ ownerId, entityType: "task", entityId: task.id, action: "created" });

  return NextResponse.json({ task }, { status: 201 });
}
