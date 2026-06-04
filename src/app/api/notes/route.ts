import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/mongoose";
import { getCurrentUserId, unauthorizedResponse } from "@/lib/session";
import { recordActivityEvent } from "@/lib/activity-events";
import { sanitizeNoteMutation } from "@/lib/note-mutations";
import { Note } from "@/models/note";

export async function GET() {
  const ownerId = await getCurrentUserId();

  if (!ownerId) {
    return unauthorizedResponse();
  }

  await connectDatabase();
  const notes = await Note.find({ ownerId, archivedAt: null }).sort({ position: 1, updatedAt: -1 });

  return NextResponse.json({ notes });
}

export async function POST(request: NextRequest) {
  const ownerId = await getCurrentUserId();

  if (!ownerId) {
    return unauthorizedResponse();
  }

  await connectDatabase();
  const payload = sanitizeNoteMutation(await request.json());
  const note = await Note.create({ ...payload, ownerId });
  await recordActivityEvent({ ownerId, entityType: "note", entityId: note.id, action: "created" });

  return NextResponse.json({ note }, { status: 201 });
}
