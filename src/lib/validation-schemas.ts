import { z } from "zod";
const hexColorSchema = z.string().regex(/^#[0-9a-f]{6}$/i);

export const colorSettingsSchema = z.object({
  accent: hexColorSchema,
  upcoming: hexColorSchema,
  todo: hexColorSchema,
  inProgress: hexColorSchema,
  completed: hexColorSchema,
  calendar: hexColorSchema
});

export const partialColorSettingsSchema = colorSettingsSchema.partial();

export const colorModeSchema = z.enum(["system", "light", "dark"]);

export const noteCreateSchema = z
  .object({
    title: z.string().trim().min(1).max(160),
    content: z.string().max(20000).optional(),
    color: z.string().trim().max(40).optional(),
    tags: z.array(z.string().trim().min(1).max(60)).max(20).optional(),
    position: z.number().finite().optional()
  })
  .strict();

export const noteUpdateSchema = noteCreateSchema.partial().refine(
  (payload) => Object.keys(payload).length > 0,
  "At least one note field is required"
);

export const userPreferenceUpdateSchema = z
  .object({
    colorMode: colorModeSchema.optional(),
    colors: partialColorSettingsSchema.optional()
  })
  .strict()
  .refine((payload) => payload.colorMode || payload.colors, "At least one preference field is required");

export const savedThemeCreateSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    colors: colorSettingsSchema
  })
  .strict();
