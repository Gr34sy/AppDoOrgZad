import { Schema, model, models, type InferSchemaType } from "mongoose";

const noteSchema = new Schema(
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
    content: {
      type: String,
      default: "",
      maxlength: 20000
    },
    color: {
      type: String,
      default: "#fff7cc"
    },
    tags: {
      type: [String],
      default: [],
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

noteSchema.index({ ownerId: 1, position: 1 });

export type NoteDocument = InferSchemaType<typeof noteSchema>;

export const Note = models.Note || model("Note", noteSchema);
