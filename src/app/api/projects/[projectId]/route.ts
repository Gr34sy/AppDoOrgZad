import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDatabase } from "@/lib/mongoose";
import {
  getCurrentUserId,
  notFoundResponse,
  sanitizeMutation,
  unauthorizedResponse
} from "@/lib/session";
import { recordActivityEvent } from "@/lib/activity-events";
import { Project } from "@/models/project";

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

  await connectDatabase();
  const payload = sanitizeMutation(await request.json());
  const project = await Project.findOneAndUpdate(
    { _id: params.projectId, ownerId, archivedAt: null },
    { $set: payload },
    { new: true, runValidators: true }
  );

  if (!project) {
    return notFoundResponse();
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
