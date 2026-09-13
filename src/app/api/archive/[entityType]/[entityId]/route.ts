import { NextRequest, NextResponse } from "next/server";
import {
  enforceRateLimit,
  rejectInvalidObjectId,
  requireCurrentOwnerId
} from "@/lib/api-guards";
import { cleanupEntityReferences } from "@/lib/entity-relations";
import { connectDatabase } from "@/lib/mongoose";
import { notFoundResponse } from "@/lib/session";
import { recordActivityEvent } from "@/lib/activity-events";
import { Checklist } from "@/models/checklist";
import { Note } from "@/models/note";
import { Project } from "@/models/project";
import { Task } from "@/models/task";
import type { EntityType } from "@/types/domain";

type RouteContext = {
  params: {
    entityType: EntityType;
    entityId: string;
  };
};

const modelByEntityType = {
  note: Note,
  checklist: Checklist,
  task: Task,
  project: Project
};

function getEntityModel(entityType: string) {
  return modelByEntityType[entityType as EntityType];
}

export async function PATCH(_request: NextRequest, { params }: RouteContext) {
  const ownerGuard = await requireCurrentOwnerId();

  if (!ownerGuard.ok) {
    return ownerGuard.response;
  }

  const ownerId = ownerGuard.ownerId;
  const EntityModel = getEntityModel(params.entityType);
  const invalidIdResponse = rejectInvalidObjectId(params.entityId);

  if (!EntityModel || invalidIdResponse) {
    return invalidIdResponse ?? notFoundResponse();
  }

  const rateLimitResponse = enforceRateLimit({
    key: `archive:restore:${ownerId}`,
    limit: 80,
    windowMs: 60_000
  });

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  await connectDatabase();
  if (params.entityType === "project") {
    const archivedProject = await Project.findOne({
      _id: params.entityId,
      ownerId,
      archivedAt: { $ne: null }
    });

    if (!archivedProject) {
      return notFoundResponse();
    }

    const lifecycleStatus =
      archivedProject.previousLifecycleStatus &&
      archivedProject.previousLifecycleStatus !== "archived"
        ? archivedProject.previousLifecycleStatus
        : "active";
    const project = await Project.findOneAndUpdate(
      { _id: params.entityId, ownerId, archivedAt: { $ne: null } },
      {
        $set: {
          archivedAt: null,
          lifecycleStatus
        },
        $unset: {
          previousLifecycleStatus: ""
        }
      },
      { new: true, runValidators: true }
    );

    if (!project) {
      return notFoundResponse();
    }

    await recordActivityEvent({
      ownerId,
      entityType: params.entityType,
      entityId: project.id,
      action: "restored"
    });

    return NextResponse.json({ item: project });
  }

  const entity = await EntityModel.findOneAndUpdate(
    { _id: params.entityId, ownerId, archivedAt: { $ne: null } },
    {
      $set: {
        archivedAt: null
      }
    },
    { new: true, runValidators: true }
  );

  if (!entity) {
    return notFoundResponse();
  }

  await recordActivityEvent({
    ownerId,
    entityType: params.entityType,
    entityId: entity.id,
    action: "restored"
  });

  return NextResponse.json({ item: entity });
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const ownerGuard = await requireCurrentOwnerId();

  if (!ownerGuard.ok) {
    return ownerGuard.response;
  }

  const ownerId = ownerGuard.ownerId;
  const EntityModel = getEntityModel(params.entityType);
  const invalidIdResponse = rejectInvalidObjectId(params.entityId);

  if (!EntityModel || invalidIdResponse) {
    return invalidIdResponse ?? notFoundResponse();
  }

  const rateLimitResponse = enforceRateLimit({
    key: `archive:delete:${ownerId}`,
    limit: 40,
    windowMs: 60_000
  });

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  await connectDatabase();
  const entity = await EntityModel.findOneAndDelete({
    _id: params.entityId,
    ownerId,
    archivedAt: { $ne: null }
  });

  if (!entity) {
    return notFoundResponse();
  }

  await cleanupEntityReferences({
    ownerId,
    targetType: params.entityType,
    targetId: entity.id
  });

  await recordActivityEvent({
    ownerId,
    entityType: params.entityType,
    entityId: entity.id,
    action: "permanentlyDeleted"
  });

  return NextResponse.json({ item: entity });
}
