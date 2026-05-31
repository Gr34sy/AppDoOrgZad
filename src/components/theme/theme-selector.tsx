"use client";

import type { ThemeName } from "@/types/domain";
import { useTheme } from "@/components/theme/theme-provider";

const themes: Array<{ label: string; value: ThemeName }> = [
  { label: "System", value: "system" },
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
  { label: "Forest", value: "forest" },
  { label: "Sky", value: "sky" },
  { label: "Rose", value: "rose" }
];

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
      Theme
      <select
        value={theme}
        onChange={(event) => setTheme(event.target.value as ThemeName)}
        className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-zinc-900 shadow-sm outline-none transition focus:border-brand-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      >
        {themes.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
