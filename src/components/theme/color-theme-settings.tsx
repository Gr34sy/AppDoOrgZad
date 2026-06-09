"use client";

import {
  defaultDarkColors,
  defaultLightColors,
  type ColorSettings
} from "@/components/theme/theme-provider";
import { useTheme } from "@/components/theme/theme-provider";
import type { ColorMode } from "@/types/domain";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const colorControls: Array<{ label: string; name: keyof ColorSettings }> = [
  { label: "Upcoming tile", name: "upcoming" },
  { label: "To do tile", name: "todo" },
  { label: "In progress tile", name: "inProgress" },
  { label: "Completed tile", name: "completed" }
];

const modeOptions: Array<{ label: string; value: ColorMode }> = [
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
  { label: "System", value: "system" }
];

type SavedTheme = {
  id: string;
  name: string;
  colors: ColorSettings;
};

const accentColorThemes = [
  { id: "preset-dark-gray", name: "Dark Gray", color: "#4b5563" },
  { id: "preset-sky-blue", name: "Sky Blue", color: "#38bdf8" },
  { id: "preset-orange", name: "Orange", color: "#f97316" },
  { id: "preset-turquoise", name: "Turquoise", color: "#14b8a6" },
  { id: "preset-purple", name: "Purple", color: "#8b5cf6" },
  { id: "preset-pink", name: "Pink", color: "#ec4899" },
  { id: "preset-light-green", name: "Light Green", color: "#84cc16" },
  { id: "preset-cream", name: "Cream", color: "#f5deb3" },
  { id: "preset-aquamarine", name: "Aquamarine", color: "#7fffd4" }
];

function getDefaultColors(mode: ColorMode) {
  if (mode === "dark") {
    return defaultDarkColors;
  }

  if (mode === "system" && typeof window !== "undefined") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? defaultDarkColors
      : defaultLightColors;
  }

  return defaultLightColors;
}

export function ColorThemeSettings() {
  const { colorMode, colors, setColor, setColorMode, setColors } = useTheme();
  const router = useRouter();
  const [savedThemes, setSavedThemes] = useState<SavedTheme[]>([]);
  const [selectedThemeId, setSelectedThemeId] = useState("");
  const [themeName, setThemeName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingChanges, setIsSavingChanges] = useState(false);

  useEffect(() => {
    void fetch("/api/user-preferences")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (payload?.preference?.savedThemes) {
          setSavedThemes(payload.preference.savedThemes);
        }
      })
      .catch(() => {
        setSavedThemes([]);
      });
  }, []);

  function applyThemeSelection(themeId: string) {
    const presetTheme = accentColorThemes.find((item) => item.id === themeId);

    if (presetTheme) {
      setSelectedThemeId(themeId);
      setColors({
        ...colors,
        accent: presetTheme.color,
        calendar: presetTheme.color
      });
      return;
    }

    const savedTheme = savedThemes.find((item) => item.id === themeId);

    setSelectedThemeId(themeId);

    if (savedTheme) {
      setColors(savedTheme.colors);
    }
  }

  function applyMode(mode: ColorMode) {
    setColorMode(mode);
  }

  async function saveCurrentTheme() {
    const name = themeName.trim();

    if (!name) {
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/user-preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, colors })
      });

      if (response.ok) {
        const payload = await response.json();
        setSavedThemes(payload.preference.savedThemes ?? []);
        setThemeName("");
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function saveChanges() {
    setIsSavingChanges(true);

    try {
      const response = await fetch("/api/user-preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ colorMode, colors })
      });

      if (response.ok) {
        const payload = await response.json();
        const databaseMode = (payload.preference?.colorMode ??
          payload.preference?.theme ??
          colorMode) as ColorMode;
        const databaseColors = {
          ...getDefaultColors(databaseMode),
          ...(payload.preference?.colors ?? {})
        } as ColorSettings;

        setColorMode(databaseMode);
        setColors(databaseColors);
        router.refresh();
      }
    } finally {
      setIsSavingChanges(false);
    }
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(22rem,1fr)_auto] lg:items-end">
        <label className="grid text-sm font-medium text-zinc-700 dark:text-zinc-200">
          <span className="sr-only">Select color theme</span>
          <select
            value={selectedThemeId}
            onChange={(event) => applyThemeSelection(event.target.value)}
            className="h-11 rounded-md border border-zinc-300 bg-white px-3 text-zinc-900 shadow-sm outline-none transition focus:border-[var(--app-accent)] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            <option value="">Select Theme</option>
            {accentColorThemes.map((presetTheme) => (
              <option key={presetTheme.id} value={presetTheme.id}>
                {presetTheme.name}
              </option>
            ))}
            {savedThemes.map((savedTheme) => (
              <option key={savedTheme.id} value={savedTheme.id}>
                {savedTheme.name}
              </option>
            ))}
          </select>
        </label>

        <div
          className="grid h-11 grid-cols-3 rounded-md border border-zinc-200 bg-zinc-50 p-1 text-sm font-medium dark:border-zinc-800 dark:bg-zinc-950"
          aria-label="Color mode"
        >
          {modeOptions.map((mode) => {
            const isActive = colorMode === mode.value;

            return (
              <button
                key={mode.value}
                type="button"
                aria-pressed={isActive}
                onClick={() => applyMode(mode.value)}
                className={`rounded px-3 py-2 transition ${
                  isActive
                    ? "bg-[var(--app-accent)] text-white shadow-sm"
                    : "text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white"
                }`}
              >
                {mode.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-normal text-zinc-500 dark:text-zinc-400">
          Create custom theme
        </h3>
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
          <label className="sr-only" htmlFor="saved-theme-name">
            Saved theme name
          </label>
          <input
            id="saved-theme-name"
            type="text"
            value={themeName}
            onChange={(event) => setThemeName(event.target.value)}
            placeholder="Theme name"
            className="h-11 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-[var(--app-accent)] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
          />
          <button
            type="button"
            onClick={saveCurrentTheme}
            disabled={!themeName.trim() || isSaving}
            className="h-11 rounded-md bg-[var(--app-accent)] px-4 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? "Saving" : "Save theme"}
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center justify-between gap-4 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
            <span>Accent color</span>
            <span className="flex items-center gap-2">
              <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                {colors.accent}
              </span>
              <input
                type="color"
                value={colors.accent}
                onChange={(event) => setColor("accent", event.target.value)}
                className="h-9 w-9 cursor-pointer rounded-md border border-zinc-300 bg-transparent p-1 dark:border-zinc-700"
                aria-label="Accent color"
              />
            </span>
          </label>

          <label className="flex items-center justify-between gap-4 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
            <span>Calendar color</span>
            <span className="flex items-center gap-2">
              <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                {colors.calendar}
              </span>
              <input
                type="color"
                value={colors.calendar}
                onChange={(event) => setColor("calendar", event.target.value)}
                className="h-9 w-9 cursor-pointer rounded-md border border-zinc-300 bg-transparent p-1 dark:border-zinc-700"
                aria-label="Calendar color"
              />
            </span>
          </label>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {colorControls.map((control) => (
          <label
            key={control.name}
            className="flex items-center justify-between gap-4 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
          >
            <span>{control.label}</span>
            <span className="flex items-center gap-2">
              <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                {colors[control.name]}
              </span>
              <input
                type="color"
                value={colors[control.name]}
                onChange={(event) => setColor(control.name, event.target.value)}
                className="h-9 w-9 cursor-pointer rounded-md border border-zinc-300 bg-transparent p-1 dark:border-zinc-700"
                aria-label={control.label}
              />
            </span>
          </label>
        ))}
      </div>

      <div>
        <button
          type="button"
          onClick={saveChanges}
          disabled={isSavingChanges}
          className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-[var(--app-accent)] hover:text-zinc-950 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-[var(--app-accent)] dark:hover:text-white"
        >
          {isSavingChanges ? "Saving" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
