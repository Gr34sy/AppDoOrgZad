import { Schema, model, models, type InferSchemaType } from "mongoose";
import type { ActivityAction, EntityType } from "@/types/domain";

const activityEventSchema = new Schema(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
      index: true
    },
    entityType: {
      type: String,
      enum: ["note", "checklist", "task", "project"] satisfies EntityType[],
      required: true,
      index: true
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true
    },
    action: {
      type: String,
      enum: ["created", "updated", "deleted", "moved", "pinned", "unpinned"] satisfies ActivityAction[],
      required: true,
      index: true
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    },
    occurredAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

activityEventSchema.index({ ownerId: 1, occurredAt: -1 });
activityEventSchema.index({ ownerId: 1, entityType: 1, entityId: 1, occurredAt: -1 });

export type ActivityEventDocument = InferSchemaType<typeof activityEventSchema>;

export const ActivityEvent =
  models.ActivityEvent || model("ActivityEvent", activityEventSchema);
