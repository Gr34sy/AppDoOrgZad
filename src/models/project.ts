import { Schema, model, models, type InferSchemaType } from "mongoose";
import type { KanbanColumn, LifecycleStatus, Priority } from "@/types/domain";

const kanbanColumnSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },
    position: {
      type: Number,
      required: true
    },
    color: {
      type: String,
      default: "#71717a"
    },
    isDone: {
      type: Boolean,
      default: false
    }
  },
  {
    _id: false
  }
);

const projectSchema = new Schema(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
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
      maxlength: 12000,
      default: ""
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"] satisfies Priority[],
      default: "medium",
      index: true
    },
    lifecycleStatus: {
      type: String,
      enum: ["active", "paused", "completed", "archived"] satisfies LifecycleStatus[],
      default: "active",
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
    taskIds: {
      type: [Schema.Types.ObjectId],
      ref: "Task",
      default: []
    },
    kanbanColumns: {
      type: [kanbanColumnSchema],
      default: [
        { id: "backlog", title: "Backlog", position: 0, color: "#71717a", isDone: false },
        { id: "todo", title: "To do", position: 1, color: "#2563eb", isDone: false },
        { id: "in_progress", title: "In progress", position: 2, color: "#d97706", isDone: false },
        { id: "testing", title: "Testing", position: 3, color: "#7c3aed", isDone: false },
        { id: "done", title: "Done", position: 4, color: "#16a34a", isDone: true }
      ] satisfies KanbanColumn[]
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

projectSchema.index({ ownerId: 1, lifecycleStatus: 1, position: 1 });
projectSchema.index({ ownerId: 1, dueDate: 1, priority: 1 });

export type ProjectDocument = InferSchemaType<typeof projectSchema>;

export const Project = models.Project || model("Project", projectSchema);
