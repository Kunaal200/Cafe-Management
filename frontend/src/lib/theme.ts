/**
 * Appearance theming. Each theme is an accent palette; a separate dark toggle
 * swaps the neutral surface/text tokens. Both are applied by overriding the CSS
 * design-token custom properties on <html>, so the whole app re-skins instantly.
 */

export interface Theme {
  id: string;
  name: string;
  primary: string;
  primaryHover: string;
  accent: string;
  /** Swatch color shown in the picker. */
  swatch: string;
}

export const THEMES: Theme[] = [
  { id: "forest", name: "Forest", primary: "#047857", primaryHover: "#036049", accent: "#0d9488", swatch: "#047857" },
  { id: "indigo", name: "Indigo", primary: "#4f46e5", primaryHover: "#4338ca", accent: "#0ea5e9", swatch: "#4f46e5" },
  { id: "emerald", name: "Emerald", primary: "#059669", primaryHover: "#047857", accent: "#14b8a6", swatch: "#059669" },
  { id: "rose", name: "Rose", primary: "#e11d48", primaryHover: "#be123c", accent: "#fb7185", swatch: "#e11d48" },
  { id: "amber", name: "Amber", primary: "#d97706", primaryHover: "#b45309", accent: "#f59e0b", swatch: "#d97706" },
  { id: "violet", name: "Violet", primary: "#7c3aed", primaryHover: "#6d28d9", accent: "#a855f7", swatch: "#7c3aed" },
  { id: "sky", name: "Ocean", primary: "#0284c7", primaryHover: "#0369a1", accent: "#06b6d4", swatch: "#0284c7" },
  { id: "slate", name: "Graphite", primary: "#475569", primaryHover: "#334155", accent: "#0ea5e9", swatch: "#475569" },
];

const NEUTRAL_LIGHT: Record<string, string> = {
  "--color-bg": "#f6f7f4",
  "--color-surface": "#ffffff",
  "--color-surface-muted": "#f1f3ef",
  "--color-border": "#e6e9e2",
  "--color-text": "#16241d",
  "--color-text-muted": "#677067",
};

const NEUTRAL_DARK: Record<string, string> = {
  "--color-bg": "#0c1a14",
  "--color-surface": "#11241b",
  "--color-surface-muted": "#1a3127",
  "--color-border": "#26402f",
  "--color-text": "#eef2ee",
  "--color-text-muted": "#9bb0a3",
};

const DEFAULT_THEME = "forest";

export const THEME_KEY = "cafe.themeId";
export const DARK_KEY = "cafe.dark";
export const VARS_KEY = "cafe.themeVars";

/** Compute the full set of CSS variable overrides for a theme + mode. */
export function computeThemeVars(themeId: string, dark: boolean): Record<string, string> {
  const theme = THEMES.find((t) => t.id === themeId) ?? THEMES[0];
  return {
    "--color-primary": theme.primary,
    "--color-primary-hover": theme.primaryHover,
    "--color-accent": theme.accent,
    ...(dark ? NEUTRAL_DARK : NEUTRAL_LIGHT),
  };
}

/** Apply CSS variable overrides to the document root. */
export function applyThemeVars(vars: Record<string, string>): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement.style;
  for (const [k, v] of Object.entries(vars)) root.setProperty(k, v);
}

export function loadThemeState(): { themeId: string; dark: boolean } {
  if (typeof window === "undefined") return { themeId: DEFAULT_THEME, dark: false };
  return {
    themeId: localStorage.getItem(THEME_KEY) ?? DEFAULT_THEME,
    dark: localStorage.getItem(DARK_KEY) === "1",
  };
}

export function persistTheme(themeId: string, dark: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(THEME_KEY, themeId);
  localStorage.setItem(DARK_KEY, dark ? "1" : "0");
  localStorage.setItem(VARS_KEY, JSON.stringify(computeThemeVars(themeId, dark)));
}
