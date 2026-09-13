import { NextRequest, NextResponse } from "next/server";
import { badRequestResponse, tooManyRequestsResponse } from "@/lib/api-responses";
import { parseJsonBody } from "@/lib/api-request";
import { validChecklistParent } from "@/lib/entity-relations";
import { connectDatabase } from "@/lib/mongoose";
import { getCurrentUserId, sanitizeMutation, unauthorizedResponse } from "@/lib/session";
import { recordActivityEvent } from "@/lib/activity-events";
import { checkRateLimit } from "@/lib/rate-limit";
import { checklistCreateSchema } from "@/lib/validation-schemas";
import { Checklist } from "@/models/checklist";

export async function GET() {
  const ownerId = await getCurrentUserId();

  if (!ownerId) {
    return unauthorizedResponse();
  }

  await connectDatabase();
  const checklists = await Checklist.find({ ownerId, archivedAt: null }).sort({
    position: 1,
    updatedAt: -1
  });

  return NextResponse.json({ checklists });
}

export async function POST(request: NextRequest) {
  const ownerId = await getCurrentUserId();

  if (!ownerId) {
    return unauthorizedResponse();
  }

  const rateLimit = checkRateLimit({
    key: `checklists:create:${ownerId}`,
    limit: 60,
    windowMs: 60_000
  });

  if (!rateLimit.allowed) {
    return tooManyRequestsResponse(rateLimit.retryAfterSeconds);
  }

  const { data, error } = await parseJsonBody(request, checklistCreateSchema);

  if (!data) {
    return badRequestResponse(error);
  }

  await connectDatabase();
  const payload = sanitizeMutation(data);

  if (
    !(await validChecklistParent({
      ownerId,
      parentType: payload.parentType as "task" | "project" | null | undefined,
      parentId: payload.parentId as string | null | undefined
    }))
  ) {
    return badRequestResponse("Selected parent item does not exist.");
  }

  const checklist = await Checklist.create({ ...payload, ownerId });
  await recordActivityEvent({
    ownerId,
    entityType: "checklist",
    entityId: checklist.id,
    action: "created"
  });

  return NextResponse.json({ checklist }, { status: 201 });
}
