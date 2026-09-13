import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { badRequestResponse, tooManyRequestsResponse } from "@/lib/api-responses";
import { parseJsonBody } from "@/lib/api-request";
import { cleanupEntityReferences, validChecklistParent } from "@/lib/entity-relations";
import { connectDatabase } from "@/lib/mongoose";
import {
  getCurrentUserId,
  notFoundResponse,
  sanitizeMutation,
  unauthorizedResponse
} from "@/lib/session";
import { recordActivityEvent } from "@/lib/activity-events";
import { checkRateLimit } from "@/lib/rate-limit";
import { checklistUpdateSchema } from "@/lib/validation-schemas";
import { Checklist } from "@/models/checklist";

type RouteContext = {
  params: {
    checklistId: string;
  };
};

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const ownerId = await getCurrentUserId();

  if (!ownerId) {
    return unauthorizedResponse();
  }

  if (!isValidObjectId(params.checklistId)) {
    return notFoundResponse();
  }

  await connectDatabase();
  const checklist = await Checklist.findOne({ _id: params.checklistId, ownerId, archivedAt: null });

  if (!checklist) {
    return notFoundResponse();
  }

  return NextResponse.json({ checklist });
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const ownerId = await getCurrentUserId();

  if (!ownerId) {
    return unauthorizedResponse();
  }

  if (!isValidObjectId(params.checklistId)) {
    return notFoundResponse();
  }

  const rateLimit = checkRateLimit({
    key: `checklists:update:${ownerId}`,
    limit: 120,
    windowMs: 60_000
  });

  if (!rateLimit.allowed) {
    return tooManyRequestsResponse(rateLimit.retryAfterSeconds);
  }

  const { data, error } = await parseJsonBody(request, checklistUpdateSchema);

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

  const checklist = await Checklist.findOneAndUpdate(
    { _id: params.checklistId, ownerId, archivedAt: null },
    { $set: payload },
    { new: true, runValidators: true }
  );

  if (!checklist) {
    return notFoundResponse();
  }

  await recordActivityEvent({
    ownerId,
    entityType: "checklist",
    entityId: checklist.id,
    action: "updated"
  });

  return NextResponse.json({ checklist });
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const ownerId = await getCurrentUserId();

  if (!ownerId) {
    return unauthorizedResponse();
  }

  if (!isValidObjectId(params.checklistId)) {
    return notFoundResponse();
  }

  const rateLimit = checkRateLimit({
    key: `checklists:delete:${ownerId}`,
    limit: 60,
    windowMs: 60_000
  });

  if (!rateLimit.allowed) {
    return tooManyRequestsResponse(rateLimit.retryAfterSeconds);
  }

  await connectDatabase();
  const checklist = await Checklist.findOneAndUpdate(
    { _id: params.checklistId, ownerId, archivedAt: null },
    { $set: { archivedAt: new Date() } },
    { new: true }
  );

  if (!checklist) {
    return notFoundResponse();
  }

  await cleanupEntityReferences({
    ownerId,
    targetType: "checklist",
    targetId: checklist.id
  });

  await recordActivityEvent({
    ownerId,
    entityType: "checklist",
    entityId: checklist.id,
    action: "deleted"
  });

  return NextResponse.json({ checklist });
}
