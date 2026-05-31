"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ThemeName } from "@/types/domain";

type ThemeContextValue = {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const storageKey = "task-manager-theme";

function applyTheme(theme: ThemeName) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const shouldUseDark = theme === "dark" || (theme === "system" && prefersDark);

  root.classList.toggle("dark", shouldUseDark);
  root.dataset.theme = theme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>("system");

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(storageKey) as ThemeName | null;
    const initialTheme = storedTheme ?? "system";

    setThemeState(initialTheme);
    applyTheme(initialTheme);
  }, []);

  const value = useMemo(
    () => ({
      theme,
      setTheme(nextTheme: ThemeName) {
        window.localStorage.setItem(storageKey, nextTheme);
        setThemeState(nextTheme);
        applyTheme(nextTheme);
      }
    }),
    [theme]
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
