import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/mongoose";
import {
  getCurrentUserId,
  notFoundResponse,
  sanitizeMutation,
  unauthorizedResponse
} from "@/lib/session";
import { recordActivityEvent } from "@/lib/activity-events";
import { Note } from "@/models/note";

type RouteContext = {
  params: {
    noteId: string;
  };
};

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const ownerId = await getCurrentUserId();

  if (!ownerId) {
    return unauthorizedResponse();
  }

  await connectDatabase();
  const note = await Note.findOne({ _id: params.noteId, ownerId, archivedAt: null });

  if (!note) {
    return notFoundResponse();
  }

  await recordActivityEvent({ ownerId, entityType: "note", entityId: note.id, action: "updated" });

  return NextResponse.json({ note });
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const ownerId = await getCurrentUserId();

  if (!ownerId) {
    return unauthorizedResponse();
  }

  await connectDatabase();
  const payload = sanitizeMutation(await request.json());
  const note = await Note.findOneAndUpdate(
    { _id: params.noteId, ownerId, archivedAt: null },
    { $set: payload },
    { new: true, runValidators: true }
  );

  if (!note) {
    return notFoundResponse();
  }

  await recordActivityEvent({ ownerId, entityType: "note", entityId: note.id, action: "deleted" });

  return NextResponse.json({ note });
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const ownerId = await getCurrentUserId();

  if (!ownerId) {
    return unauthorizedResponse();
  }

  await connectDatabase();
  const note = await Note.findOneAndUpdate(
    { _id: params.noteId, ownerId, archivedAt: null },
    { $set: { archivedAt: new Date() } },
    { new: true }
  );

  if (!note) {
    return notFoundResponse();
  }

  return NextResponse.json({ note });
}
