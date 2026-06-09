"use client";

import type { ColorMode } from "@/types/domain";
import { useTheme } from "@/components/theme/theme-provider";

const modes: Array<{ label: string; value: ColorMode }> = [
  { label: "System", value: "system" },
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" }
];

export function ThemeSelector() {
  const { colorMode, setColorMode } = useTheme();

  return (
    <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
      Color mode
      <select
        value={colorMode}
        onChange={(event) => setColorMode(event.target.value as ColorMode)}
        className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-zinc-900 shadow-sm outline-none transition focus:border-[var(--app-accent)] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      >
        {modes.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
