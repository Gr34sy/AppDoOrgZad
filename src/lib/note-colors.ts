export const noteColorOptions = [
  { label: "Blue", value: "#93c5fd" },
  { label: "Beige", value: "#f5f5dc" },
  { label: "Purple", value: "#c4b5fd" },
  { label: "Pink", value: "#f9a8d4" },
  { label: "Orange", value: "#fdba74" },
  { label: "Yellow", value: "#fde68a" },
  { label: "Turquoise", value: "#5eead4" },
  { label: "Grey", value: "#d1d5db" },
  { label: "Dark grey", value: "#6b7280" }
] as const;

const legacyNoteColorMap: Record<string, string> = {
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

function getHexChannel(hexColor: string, start: number) {
  return Number.parseInt(hexColor.slice(start, start + 2), 16);
}

function getReadableTextColor(backgroundColor: string) {
  if (!/^#[0-9a-f]{6}$/i.test(backgroundColor)) {
    return "#18181b";
  }

  const red = getHexChannel(backgroundColor, 1);
  const green = getHexChannel(backgroundColor, 3);
  const blue = getHexChannel(backgroundColor, 5);
  const brightness = (red * 299 + green * 587 + blue * 114) / 1000;

  return brightness < 128 ? "#ffffff" : "#18181b";
}

export function normalizeNoteColor(color?: string | null) {
  const trimmedColor = color?.trim();

  if (!trimmedColor) {
    return "";
  }

  return legacyNoteColorMap[trimmedColor.toLowerCase()] ?? trimmedColor;
}

export function getNoteCardStyle(color?: string | null) {
  const noteColor = normalizeNoteColor(color);
  const backgroundColor = noteColor || "#ffffff";

  return {
    backgroundColor,
    borderColor: noteColor ? "transparent" : "#e4e4e7",
    color: getReadableTextColor(backgroundColor)
  };
}
