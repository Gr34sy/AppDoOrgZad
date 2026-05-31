import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/mongoose";
import { getCurrentUserId, sanitizeMutation, unauthorizedResponse } from "@/lib/session";
import { recordActivityEvent } from "@/lib/activity-events";
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

  await connectDatabase();
  const payload = sanitizeMutation(await request.json());
  const checklist = await Checklist.create({ ...payload, ownerId });
  await recordActivityEvent({
    ownerId,
    entityType: "checklist",
    entityId: checklist.id,
    action: "created"
  });

  return NextResponse.json({ checklist }, { status: 201 });
}
