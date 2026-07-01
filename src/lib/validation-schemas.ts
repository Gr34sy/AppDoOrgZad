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

const tagListSchema = z.array(z.string().trim().min(1).max(60)).max(20);
const objectIdStringSchema = z.string().trim().min(1).max(80);
const optionalDateStringSchema = z.string().datetime().nullable();
const prioritySchema = z.enum(["low", "medium", "high", "urgent"]);
const lifecycleStatusSchema = z.enum(["active", "paused", "completed", "archived"]);

export const checklistItemSchema = z
  .object({
    title: z.string().trim().min(1).max(180),
    isCompleted: z.boolean().optional(),
    completedAt: optionalDateStringSchema.optional(),
    position: z.number().finite().optional()
  })
  .strict();

export const checklistCreateSchema = z
  .object({
    title: z.string().trim().min(1).max(160),
    description: z.string().max(2000).optional(),
    items: z.array(checklistItemSchema).max(200).optional(),
    tags: tagListSchema.optional(),
    parentType: z.enum(["task", "project"]).nullable().optional(),
    parentId: objectIdStringSchema.nullable().optional(),
    position: z.number().finite().optional()
  })
  .strict();

export const checklistUpdateSchema = checklistCreateSchema.partial().refine(
  (payload) => Object.keys(payload).length > 0,
  "At least one checklist field is required"
);

export const taskCreateSchema = z
  .object({
    title: z.string().trim().min(1).max(180),
    description: z.string().max(10000).optional(),
    priority: prioritySchema.optional(),
    statusId: z.string().trim().min(1).max(80).optional(),
    projectId: objectIdStringSchema.nullable().optional(),
    dueDate: optionalDateStringSchema.optional(),
    estimatedMinutes: z.number().finite().min(0).nullable().optional(),
    tags: tagListSchema.optional(),
    checklistIds: z.array(objectIdStringSchema).max(100).optional(),
    position: z.number().finite().optional(),
    completedAt: optionalDateStringSchema.optional()
  })
  .strict();

export const taskUpdateSchema = taskCreateSchema.partial().refine(
  (payload) => Object.keys(payload).length > 0,
  "At least one task field is required"
);

export const projectCreateSchema = z
  .object({
    title: z.string().trim().min(1).max(180),
    description: z.string().max(12000).optional(),
    priority: prioritySchema.optional(),
    lifecycleStatus: lifecycleStatusSchema.optional(),
    dueDate: optionalDateStringSchema.optional(),
    estimatedMinutes: z.number().finite().min(0).nullable().optional(),
    tags: tagListSchema.optional(),
    checklistIds: z.array(objectIdStringSchema).max(100).optional(),
    taskIds: z.array(objectIdStringSchema).max(200).optional(),
    position: z.number().finite().optional(),
    completedAt: optionalDateStringSchema.optional()
  })
  .strict();

export const projectUpdateSchema = projectCreateSchema.partial().refine(
  (payload) => Object.keys(payload).length > 0,
  "At least one project field is required"
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

export const pinCreateSchema = z
  .object({
    targetType: z.enum(["note", "checklist", "task", "project"]),
    targetId: z.string().trim().min(1),
    position: z.number().finite().optional()
  })
  .strict();

export const pinUpdateSchema = z
  .object({
    position: z.number().finite()
  })
  .strict();
