import { Schema, model, models, type InferSchemaType } from "mongoose";
import type { ColorMode } from "@/types/domain";

const userPreferenceSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
      unique: true,
      index: true
    },
    colorMode: {
      type: String,
      enum: ["system", "light", "dark"] satisfies ColorMode[],
      default: "system"
    },
    dashboardLayout: {
      type: String,
      enum: ["compact", "comfortable"],
      default: "comfortable"
    },
    colors: {
      accent: { type: String },
      upcoming: { type: String },
      todo: { type: String },
      inProgress: { type: String },
      completed: { type: String },
      calendar: { type: String }
    },
    savedThemes: [
      {
        name: { type: String, required: true, trim: true, maxlength: 80 },
        colors: {
          accent: { type: String, required: true },
          upcoming: { type: String, required: true },
          todo: { type: String, required: true },
          inProgress: { type: String, required: true },
          completed: { type: String, required: true },
          calendar: { type: String, required: true }
        },
        createdAt: { type: Date, default: Date.now }
      }
    ]
  },
  {
    timestamps: true
  }
);

export type UserPreferenceDocument = InferSchemaType<typeof userPreferenceSchema>;

export const UserPreference =
  models.UserPreference || model("UserPreference", userPreferenceSchema);
