import { Schema, model, models, type InferSchemaType } from "mongoose";
import type { Priority } from "@/types/domain";

const taskSchema = new Schema(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
      index: true
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      default: null,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180
    },
    description: {
      type: String,
      trim: true,
      maxlength: 10000,
      default: ""
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"] satisfies Priority[],
      default: "medium",
      index: true
    },
    statusId: {
      type: String,
      default: "todo",
      trim: true,
      maxlength: 80,
      index: true
    },
    dueDate: {
      type: Date,
      default: null,
      index: true
    },
    tags: {
      type: [String],
      default: [],
      index: true
    },
    checklistIds: {
      type: [Schema.Types.ObjectId],
      ref: "Checklist",
      default: []
    },
    position: {
      type: Number,
      default: 0
    },
    completedAt: {
      type: Date,
      default: null
    },
    archivedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

taskSchema.index({ ownerId: 1, projectId: 1, statusId: 1, position: 1 });
taskSchema.index({ ownerId: 1, dueDate: 1, priority: 1 });

export type TaskDocument = InferSchemaType<typeof taskSchema>;

export const Task = models.Task || model("Task", taskSchema);
