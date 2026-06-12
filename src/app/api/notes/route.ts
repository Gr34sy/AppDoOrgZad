import { NextRequest, NextResponse } from "next/server";
import { badRequestResponse, tooManyRequestsResponse } from "@/lib/api-responses";
import { parseJsonBody } from "@/lib/api-request";
import { connectDatabase } from "@/lib/mongoose";
import { getCurrentUserId, unauthorizedResponse } from "@/lib/session";
import { recordActivityEvent } from "@/lib/activity-events";
import { sanitizeNoteMutation } from "@/lib/note-mutations";
import { checkRateLimit } from "@/lib/rate-limit";
import { noteCreateSchema } from "@/lib/validation-schemas";
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

  const rateLimit = checkRateLimit({
    key: `notes:create:${ownerId}`,
    limit: 30,
    windowMs: 60_000
  });

  if (!rateLimit.allowed) {
    return tooManyRequestsResponse(rateLimit.retryAfterSeconds);
  }

  const { data, error } = await parseJsonBody(request, noteCreateSchema);

  if (!data) {
    return badRequestResponse(error);
  }

  await connectDatabase();
  const payload = sanitizeNoteMutation(data);
  const note = await Note.create({ ...payload, ownerId });
  await recordActivityEvent({ ownerId, entityType: "note", entityId: note.id, action: "created" });

  return NextResponse.json({ note }, { status: 201 });
}
