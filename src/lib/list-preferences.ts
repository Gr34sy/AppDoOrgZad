import { z } from "zod";
import { getSearchParam, type SearchParams } from "@/lib/list-query";

export const listPreferenceScopes = ["dashboard", "archive", "notes", "checklists", "tasks", "projects"] as const;
export type ListPreferenceScope = (typeof listPreferenceScopes)[number];
const entityTypes = ["note", "checklist", "task", "project"] as const;

export const listControlSettingsSchema = z.object({
  sort: z.enum(["position", "updated", "created", "title", "description", "due", "priority", "archived"]),
  direction: z.enum(["asc", "desc"]),
  priority: z.enum(["", "low", "medium", "high", "urgent"]),
  linked: z.enum(["", "unlinked", "linked", "project", "task"]),
  types: z.array(z.enum(entityTypes)).max(4)
}).strict();
export type ListControlSettings = z.infer<typeof listControlSettingsSchema>;

export function defaultListSettings(scope: ListPreferenceScope): ListControlSettings {
  return {
    sort: scope === "archive" ? "archived" : "position",
    direction: scope === "archive" ? "desc" : "asc",
    priority: "",
    linked: "",
    types: [...entityTypes]
  };
}

export function allowedListSorts(scope: ListPreferenceScope) {
  const common = ["updated", "created", "title"];
  if (scope === "archive") return [...common, "description", "archived"];
  if (scope === "checklists") return [...common, "position"];
  if (scope === "tasks" || scope === "projects") return [...common, "position", "description", "due", "priority"];
  return [...common, "position", "description"];
}

export const listControlUpdateSchema = z.object({
  scope: z.enum(listPreferenceScopes),
  settings: listControlSettingsSchema
}).strict().superRefine(({ scope, settings }, context) => {
  if (!allowedListSorts(scope).includes(settings.sort)) {
    context.addIssue({ code: "custom", message: "Unsupported sort for this list", path: ["settings", "sort"] });
  }
  if (settings.sort === "position" && settings.direction !== "asc") {
    context.addIssue({ code: "custom", message: "User's order requires ascending direction", path: ["settings", "direction"] });
  }
});

export function resolveListSettings(
  scope: ListPreferenceScope,
  saved: unknown,
  params?: SearchParams
): ListControlSettings {
  const parsed = listControlUpdateSchema.safeParse({ scope, settings: saved });
  const defaults = parsed.success ? parsed.data.settings : defaultListSettings(scope);
  const requested = {
    ...defaults,
    ...(params?.sort !== undefined ? { sort: getSearchParam(params.sort) || "position" } : {}),
    ...(params?.direction !== undefined ? { direction: getSearchParam(params.direction) } : {}),
    ...(params?.priority !== undefined ? { priority: getSearchParam(params.priority) } : {}),
    ...(params?.linked !== undefined ? { linked: getSearchParam(params.linked) === "all" ? "" : getSearchParam(params.linked) } : {})
  };
  if (requested.sort === "position") requested.direction = "asc";
  const resolved = listControlUpdateSchema.safeParse({ scope, settings: requested });
  return resolved.success ? resolved.data.settings : defaults;
}
