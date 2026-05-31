import type { ActivityAction, EntityType } from "@/types/domain";
import { ActivityEvent } from "@/models/activity-event";

type ActivityEventInput = {
  ownerId: string;
  entityType: EntityType;
  entityId: string;
  action: ActivityAction;
  metadata?: Record<string, unknown>;
};

export async function recordActivityEvent(input: ActivityEventInput) {
  return ActivityEvent.create({
    ownerId: input.ownerId,
    entityType: input.entityType,
    entityId: input.entityId,
    action: input.action,
    metadata: input.metadata ?? {}
  });
}
