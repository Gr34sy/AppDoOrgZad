import type { ColorMode, ColorSettings } from "@/types/domain";

export const defaultLightColors: ColorSettings = {
  accent: "#2563eb",
  upcoming: "#16a085",
  todo: "#0284c7",
  inProgress: "#c026d3",
  completed: "#27272a",
  calendar: "#2563eb"
};

export const defaultDarkColors: ColorSettings = {
  accent: "#60a5fa",
  upcoming: "#22d3ee",
  todo: "#38bdf8",
  inProgress: "#e879f9",
  completed: "#71717a",
  calendar: "#60a5fa"
};

export function getDefaultColorsForMode(mode: ColorMode) {
  if (mode === "dark") {
    return defaultDarkColors;
  }

  return defaultLightColors;
}

export function normalizeColorSettings(
  mode: ColorMode,
  colors?: Partial<ColorSettings> | null
): ColorSettings {
  return {
    ...getDefaultColorsForMode(mode),
    ...(colors ?? {})
  };
}
