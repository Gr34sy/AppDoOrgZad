import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { badRequestResponse, tooManyRequestsResponse } from "@/lib/api-responses";
import { parseJsonBody } from "@/lib/api-request";
import { connectDatabase } from "@/lib/mongoose";
import {
  getCurrentUserId,
  notFoundResponse,
  unauthorizedResponse
} from "@/lib/session";
import { recordActivityEvent } from "@/lib/activity-events";
import { sanitizeNoteMutation } from "@/lib/note-mutations";
import { areValidNoteLinks } from "@/lib/note-links";
import { checkRateLimit } from "@/lib/rate-limit";
import { noteUpdateSchema } from "@/lib/validation-schemas";
import { Note } from "@/models/note";
import { Pin } from "@/models/pin";

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

  if (!isValidObjectId(params.noteId)) {
    return notFoundResponse();
  }

  await connectDatabase();
  const note = await Note.findOne({ _id: params.noteId, ownerId, archivedAt: null });

  if (!note) {
    return notFoundResponse();
  }

  return NextResponse.json({ note });
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const ownerId = await getCurrentUserId();

  if (!ownerId) {
    return unauthorizedResponse();
  }

  if (!isValidObjectId(params.noteId)) {
    return notFoundResponse();
  }

  const rateLimit = checkRateLimit({
    key: `notes:update:${ownerId}`,
    limit: 60,
    windowMs: 60_000
  });

  if (!rateLimit.allowed) {
    return tooManyRequestsResponse(rateLimit.retryAfterSeconds);
  }

  const { data, error } = await parseJsonBody(request, noteUpdateSchema);

  if (!data) {
    return badRequestResponse(error);
  }

  await connectDatabase();
  if (data.linkedItems && !(await areValidNoteLinks(data.linkedItems, ownerId))) {
    return badRequestResponse("One or more linked items are invalid");
  }
  const payload = sanitizeNoteMutation(data);

  const note = await Note.findOneAndUpdate(
    { _id: params.noteId, ownerId, archivedAt: null },
    { $set: payload },
    { new: true, runValidators: true }
  );

  if (!note) {
    return notFoundResponse();
  }

  await recordActivityEvent({ ownerId, entityType: "note", entityId: note.id, action: "updated" });

  return NextResponse.json({ note });
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const ownerId = await getCurrentUserId();

  if (!ownerId) {
    return unauthorizedResponse();
  }

  if (!isValidObjectId(params.noteId)) {
    return notFoundResponse();
  }

  const rateLimit = checkRateLimit({
    key: `notes:delete:${ownerId}`,
    limit: 30,
    windowMs: 60_000
  });

  if (!rateLimit.allowed) {
    return tooManyRequestsResponse(rateLimit.retryAfterSeconds);
  }

  await connectDatabase();
  const note = await Note.findOneAndDelete({ _id: params.noteId, ownerId, archivedAt: null });

  if (!note) {
    return notFoundResponse();
  }

  await Pin.deleteMany({ ownerId, targetType: "note", targetId: params.noteId });
  await recordActivityEvent({ ownerId, entityType: "note", entityId: note.id, action: "deleted" });

  return NextResponse.json({ note });
}
