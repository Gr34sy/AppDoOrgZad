import { sanitizeMutation } from "@/lib/sanitize-mutation";

const noteMutationFields = ["title", "content", "color", "tags", "position"] as const;
const noteColorMap: Record<string, string> = {
  blue: "#93c5fd",
  beige: "#f5f5dc",
  purple: "#c4b5fd",
  pink: "#f9a8d4",
  orange: "#fdba74",
  yellow: "#fde68a",
  turquoise: "#5eead4",
  grey: "#d1d5db",
  darkgrey: "#6b7280"
};

type NoteMutationField = (typeof noteMutationFields)[number];

export type NoteMutationPayload = Partial<Record<NoteMutationField, unknown>>;

function normalizeNoteColor(color: unknown) {
  if (typeof color !== "string") {
    return color;
  }

  const normalizedColor = color.trim().toLowerCase();
  return noteColorMap[normalizedColor] ?? color.trim();
}

export function sanitizeNoteMutation(payload: Record<string, unknown>) {
  const sanitizedPayload = sanitizeMutation(payload);
  const noteMutation: NoteMutationPayload = {};

  for (const field of noteMutationFields) {
    if (field in sanitizedPayload) {
      noteMutation[field] = sanitizedPayload[field];
    }
  }

  if ("color" in noteMutation) {
    noteMutation.color = normalizeNoteColor(noteMutation.color);
  }

  return noteMutation;
}
