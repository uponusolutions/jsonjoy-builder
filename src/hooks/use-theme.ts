import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";

const THEME_STORAGE_KEY = "jsonjoy-theme";
const THEME_CHANGE_EVENT = "jsonjoy-theme-change";

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
}

function setStoredTheme(theme: Theme): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: theme }));
}

/**
 * Hook for standalone usage of jsonjoy-builder with theme persistence.
 * For embedded usage, prefer the `theme` prop on SchemaVisualEditor.
 */
export function useTheme(defaultTheme: Theme = "light") {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = getStoredTheme();
    return stored ?? defaultTheme;
  });

  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() => {
    const stored = getStoredTheme();
    if (stored && stored !== "system") return stored;
    return getSystemTheme();
  });

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    setStoredTheme(newTheme);
  }, []);

  // Listen for theme changes from other components
  useEffect(() => {
    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<Theme>;
      setThemeState(customEvent.detail);
    };

    window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange);
    return () =>
      window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange);
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      if (theme === "system") {
        setResolvedTheme(getSystemTheme());
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  // Update resolved theme when theme changes
  useEffect(() => {
    if (theme === "system") {
      setResolvedTheme(getSystemTheme());
    } else {
      setResolvedTheme(theme);
    }
  }, [theme]);

  return {
    theme,
    setTheme,
    resolvedTheme,
    isDark: resolvedTheme === "dark",
  };
}
