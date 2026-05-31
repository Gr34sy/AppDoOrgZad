import { Schema, model, models, type InferSchemaType } from "mongoose";
import type { PinTargetType } from "@/types/domain";

const pinSchema = new Schema(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
      index: true
    },
    targetType: {
      type: String,
      enum: ["note", "checklist", "task", "project"] satisfies PinTargetType[],
      required: true,
      index: true
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true
    },
    position: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

pinSchema.index({ ownerId: 1, targetType: 1, targetId: 1 }, { unique: true });
pinSchema.index({ ownerId: 1, position: 1 });

export type PinDocument = InferSchemaType<typeof pinSchema>;

export const Pin = models.Pin || model("Pin", pinSchema);
