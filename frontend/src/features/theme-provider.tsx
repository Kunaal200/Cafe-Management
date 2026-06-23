"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  applyThemeVars,
  computeThemeVars,
  loadThemeState,
  persistTheme,
  THEMES,
} from "@/lib/theme";

interface ThemeContextValue {
  themeId: string;
  dark: boolean;
  setTheme: (id: string) => void;
  setDark: (dark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Applies the saved theme on mount and exposes setters that persist + re-skin. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState("forest");
  const [dark, setDarkState] = useState(false);

  useEffect(() => {
    const s = loadThemeState();
    setThemeId(s.themeId);
    setDarkState(s.dark);
    applyThemeVars(computeThemeVars(s.themeId, s.dark));
  }, []);

  function setTheme(id: string) {
    setThemeId(id);
    applyThemeVars(computeThemeVars(id, dark));
    persistTheme(id, dark);
  }

  function setDark(value: boolean) {
    setDarkState(value);
    applyThemeVars(computeThemeVars(themeId, value));
    persistTheme(themeId, value);
  }

  return (
    <ThemeContext.Provider value={{ themeId, dark, setTheme, setDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}

export { THEMES };
