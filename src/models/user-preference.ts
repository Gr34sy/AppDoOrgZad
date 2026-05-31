import { Schema, model, models, type InferSchemaType } from "mongoose";
import type { ThemeName } from "@/types/domain";

const userPreferenceSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
      unique: true,
      index: true
    },
    theme: {
      type: String,
      enum: ["system", "light", "dark", "forest", "sky", "rose"] satisfies ThemeName[],
      default: "system"
    },
    dashboardLayout: {
      type: String,
      enum: ["compact", "comfortable"],
      default: "comfortable"
    }
  },
  {
    timestamps: true
  }
);

export type UserPreferenceDocument = InferSchemaType<typeof userPreferenceSchema>;

export const UserPreference =
  models.UserPreference || model("UserPreference", userPreferenceSchema);
