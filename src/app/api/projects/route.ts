import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/mongoose";
import { getCurrentUserId, sanitizeMutation, unauthorizedResponse } from "@/lib/session";
import { recordActivityEvent } from "@/lib/activity-events";
import { Project } from "@/models/project";

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

  await connectDatabase();
  const payload = sanitizeMutation(await request.json());
  const project = await Project.create({ ...payload, ownerId });
  await recordActivityEvent({
    ownerId,
    entityType: "project",
    entityId: project.id,
    action: "created"
  });

  return NextResponse.json({ project }, { status: 201 });
}
