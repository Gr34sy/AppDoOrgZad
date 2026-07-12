import { sanitizeMutation } from "@/lib/sanitize-mutation";
const noteMutationFields = ["title", "content", "linkedItems", "tags", "position"] as const;

type NoteMutationField = (typeof noteMutationFields)[number];

export type NoteMutationPayload = Partial<Record<NoteMutationField, unknown>>;

export function sanitizeNoteMutation(payload: Record<string, unknown>) {
  const sanitizedPayload = sanitizeMutation(payload);
  const noteMutation: NoteMutationPayload = {};

  for (const field of noteMutationFields) {
    if (field in sanitizedPayload) {
      noteMutation[field] = sanitizedPayload[field];
    }
  }

  return noteMutation;
}

export function hasNoteMutationFields(payload: NoteMutationPayload) {
  return Object.keys(payload).length > 0;
}

export function isValidNoteTitle(title: unknown) {
  return typeof title === "string" && title.trim().length > 0;
}
