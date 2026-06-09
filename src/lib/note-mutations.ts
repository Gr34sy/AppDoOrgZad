import { sanitizeMutation } from "@/lib/sanitize-mutation";
import { normalizeNoteColor } from "@/lib/note-colors";

const noteMutationFields = ["title", "content", "color", "tags", "position"] as const;

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

  if ("color" in noteMutation) {
    noteMutation.color =
      typeof noteMutation.color === "string"
        ? normalizeNoteColor(noteMutation.color)
        : noteMutation.color;
  }

  return noteMutation;
}
