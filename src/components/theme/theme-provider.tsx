"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
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

type ThemeContextValue = {
  colorMode: ColorMode;
  setColorMode: (mode: ColorMode) => void;
  colors: ColorSettings;
  setColor: (name: keyof ColorSettings, value: string) => void;
  setColors: (colors: ColorSettings) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const colorModeStorageKey = "task-manager-color-mode";
const legacyThemeStorageKey = "task-manager-theme";
const colorStorageKey = "task-manager-colors";

function readStoredColors() {
  const storedColors = window.localStorage.getItem(colorStorageKey);

  if (!storedColors) {
    return null;
  }

  try {
    return JSON.parse(storedColors) as Partial<ColorSettings>;
  } catch {
    return null;
  }
}

function applyColors(colors: ColorSettings) {
  const root = document.documentElement;

  root.style.setProperty("--app-accent", colors.accent);
  root.style.setProperty("--dashboard-accent", colors.upcoming);
  root.style.setProperty("--dashboard-upcoming-color", colors.upcoming);
  root.style.setProperty("--dashboard-todo-color", colors.todo);
  root.style.setProperty("--dashboard-progress-color", colors.inProgress);
  root.style.setProperty("--dashboard-completed-color", colors.completed);
  root.style.setProperty("--dashboard-calendar-color", colors.calendar);
}

function getDefaultColorsForMode(mode: ColorMode) {
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

function applyColorMode(mode: ColorMode) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const shouldUseDark = mode === "dark" || (mode === "system" && prefersDark);

  root.classList.toggle("dark", shouldUseDark);
  root.dataset.colorMode = mode;
  root.style.setProperty("--app-background", shouldUseDark ? "#0b0b0f" : "#fefefe");
}

function persistPreference(colorMode: ColorMode, colors: ColorSettings) {
  if (typeof window === "undefined" || !window.location.pathname.startsWith("/dashboard")) {
    return;
  }

  window.localStorage.setItem(
    "task-manager-pending-preference",
    JSON.stringify({ colorMode, colors })
  );
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorMode, setColorModeState] = useState<ColorMode>("system");
  const [colors, setColorState] = useState<ColorSettings>(defaultLightColors);

  useEffect(() => {
    const storedMode =
      (window.localStorage.getItem(colorModeStorageKey) as ColorMode | null) ??
      (window.localStorage.getItem(legacyThemeStorageKey) as ColorMode | null);
    const initialMode = storedMode ?? "system";
    const initialColors = { ...getDefaultColorsForMode(initialMode), ...readStoredColors() };

    setColorModeState(initialMode);
    setColorState(initialColors);
    applyColorMode(initialMode);
    applyColors(initialColors);

    void fetch("/api/user-preferences")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (!payload?.preference) {
          return;
        }

        const databaseMode = (payload.preference.colorMode ?? initialMode) as ColorMode;
        const databaseColors = {
          ...getDefaultColorsForMode(databaseMode),
          ...(payload.preference.colors ?? {})
        } as ColorSettings;

        window.localStorage.setItem(colorModeStorageKey, databaseMode);
        window.localStorage.setItem(colorStorageKey, JSON.stringify(databaseColors));
        setColorModeState(databaseMode);
        setColorState(databaseColors);
        applyColorMode(databaseMode);
        applyColors(databaseColors);
      })
      .catch(() => {
        // Keep the local preference when the user is offline or unauthenticated.
      });
  }, []);

  useEffect(() => {
    if (colorMode !== "system") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemModeChange = () => applyColorMode("system");

    mediaQuery.addEventListener("change", handleSystemModeChange);

    return () => mediaQuery.removeEventListener("change", handleSystemModeChange);
  }, [colorMode]);

  const value = useMemo(
    () => ({
      colorMode,
      setColorMode(nextMode: ColorMode) {
        window.localStorage.setItem(colorModeStorageKey, nextMode);
        setColorModeState(nextMode);
        applyColorMode(nextMode);
        persistPreference(nextMode, colors);
      },
      colors,
      setColor(name: keyof ColorSettings, value: string) {
        const nextColors = { ...colors, [name]: value };

        window.localStorage.setItem(colorStorageKey, JSON.stringify(nextColors));
        setColorState(nextColors);
        applyColors(nextColors);
        persistPreference(colorMode, nextColors);
      },
      setColors(nextColors: ColorSettings) {
        window.localStorage.setItem(colorStorageKey, JSON.stringify(nextColors));
        setColorState(nextColors);
        applyColors(nextColors);
        persistPreference(colorMode, nextColors);
      }
    }),
    [colorMode, colors]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return context;
}
