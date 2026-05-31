import { Schema, model, models, type InferSchemaType } from "mongoose";

const checklistItemSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180
    },
    isCompleted: {
      type: Boolean,
      default: false
    },
    completedAt: {
      type: Date,
      default: null
    },
    position: {
      type: Number,
      required: true,
      default: 0
    }
  },
  {
    _id: true
  }
);

const checklistSchema = new Schema(
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
      maxlength: 160
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: ""
    },
    items: {
      type: [checklistItemSchema],
      default: []
    },
    tags: {
      type: [String],
      default: [],
      index: true
    },
    parentType: {
      type: String,
      enum: ["task", "project", null],
      default: null,
      index: true
    },
    parentId: {
      type: Schema.Types.ObjectId,
      default: null,
      index: true
    },
    position: {
      type: Number,
      default: 0
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

checklistSchema.index({ ownerId: 1, parentType: 1, parentId: 1, position: 1 });

export type ChecklistDocument = InferSchemaType<typeof checklistSchema>;

export const Checklist = models.Checklist || model("Checklist", checklistSchema);
