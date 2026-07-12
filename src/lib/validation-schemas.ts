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
    linkedItems: z.array(z.object({
      targetType: z.enum(["note", "checklist", "task", "project"]),
      targetId: z.string().trim().min(1).max(80)
    }).strict()).max(100).optional(),
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
const newChecklistSchema = z
  .object({
    title: z.string().trim().min(1).max(160)
  })
  .strict();

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
    items: z.array(checklistItemSchema).max(200).optional(),
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
    tags: tagListSchema.optional(),
    checklistIds: z.array(objectIdStringSchema).max(100).optional(),
    newChecklists: z.array(newChecklistSchema).max(50).optional(),
    noteIds: z.array(objectIdStringSchema).max(100).optional(),
    position: z.number().finite().optional(),
    completedAt: optionalDateStringSchema.optional()
  })
  .strict();

export const taskUpdateSchema = taskCreateSchema.partial().refine(
  (payload) => Object.keys(payload).length > 0,
  "At least one task field is required"
);

export const kanbanColumnSchema = z
  .object({
    id: z.string().trim().min(1).max(80),
    title: z.string().trim().min(1).max(80),
    position: z.number().finite(),
    color: hexColorSchema.optional(),
    isDone: z.boolean().optional()
  })
  .strict();

export const projectTaskCreateSchema = z
  .object({
    title: z.string().trim().min(1).max(180),
    description: z.string().max(10000).optional(),
    priority: prioritySchema.optional(),
    statusId: z.string().trim().min(1).max(80).optional(),
    dueDate: optionalDateStringSchema.optional(),
    tags: tagListSchema.optional()
  })
  .strict();

export const projectCreateSchema = z
  .object({
    title: z.string().trim().min(1).max(180),
    description: z.string().max(12000).optional(),
    priority: prioritySchema.optional(),
    lifecycleStatus: lifecycleStatusSchema.optional(),
    dueDate: optionalDateStringSchema.optional(),
    tags: tagListSchema.optional(),
    checklistIds: z.array(objectIdStringSchema).max(100).optional(),
    newChecklists: z.array(newChecklistSchema).max(50).optional(),
    noteIds: z.array(objectIdStringSchema).max(100).optional(),
    taskIds: z.array(objectIdStringSchema).max(200).optional(),
    newTasks: z.array(projectTaskCreateSchema).max(50).optional(),
    kanbanColumns: z.array(kanbanColumnSchema).min(1).max(12).optional(),
    taskView: z.enum(["kanban", "list"]).optional(),
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
