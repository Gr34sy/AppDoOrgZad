import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { badRequestResponse } from "@/lib/api-responses";
import { enforceRateLimit, requireCurrentOwnerId } from "@/lib/api-guards";
import { parseJsonBody } from "@/lib/api-request";
import { connectDatabase } from "@/lib/mongoose";
import { reorderSchema } from "@/lib/validation-schemas";
import { Checklist } from "@/models/checklist";
import { Note } from "@/models/note";
import { Pin } from "@/models/pin";
import { Project } from "@/models/project";
import { Task } from "@/models/task";

const modelConfig = {
  pin: {
    model: Pin,
    baseFilter: {}
  },
  note: {
    model: Note,
    baseFilter: { archivedAt: null }
  },
  checklist: {
    model: Checklist,
    baseFilter: { archivedAt: null }
  },
  task: {
    model: Task,
    baseFilter: { archivedAt: null }
  },
  project: {
    model: Project,
    baseFilter: { archivedAt: null }
  }
};

export async function PATCH(request: NextRequest) {
  const ownerGuard = await requireCurrentOwnerId();

  if (!ownerGuard.ok) {
    return ownerGuard.response;
  }

  const ownerId = ownerGuard.ownerId;
  const rateLimitResponse = enforceRateLimit({
    key: `reorder:${ownerId}`,
    limit: 80,
    windowMs: 60_000
  });

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const { data, error } = await parseJsonBody(request, reorderSchema);

  if (!data) {
    return badRequestResponse(error);
  }

  const uniqueItemIds = new Set(data.items.map((item) => item.id));

  if (
    uniqueItemIds.size !== data.items.length ||
    data.items.some((item) => !isValidObjectId(item.id))
  ) {
    return badRequestResponse("Reorder items must contain unique valid identifiers.");
  }

  const config = modelConfig[data.entityType];

  await connectDatabase();
  const existingCount = await config.model.countDocuments({
    ...config.baseFilter,
    ownerId,
    _id: { $in: data.items.map((item) => item.id) }
  });

  if (existingCount !== data.items.length) {
    return badRequestResponse("One or more reordered items are invalid.");
  }

  await config.model.bulkWrite(
    data.items.map((item) => ({
      updateOne: {
        filter: {
          ...config.baseFilter,
          ownerId,
          _id: item.id
        },
        update: {
          $set: {
            position: item.position
          }
        }
      }
    }))
  );

  return NextResponse.json({ items: data.items });
}
