// apps/web/src/lib/theme.tsx
import React from "react";
import { tg } from "./telegram";

export type ThemeMode = "light" | "dark";

type Ctx = {
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  toggle: () => void;
};

const ThemeContext = React.createContext<Ctx | null>(null);
const KEY = "sloty.theme";

function initialTheme(): ThemeMode {
  const saved = typeof window !== "undefined" ? (window.localStorage.getItem(KEY) as ThemeMode | null) : null;
  if (saved === "light" || saved === "dark") return saved;
  return tg()?.colorScheme === "dark" ? "dark" : "light";
}

export function ThemeProvider(props: React.PropsWithChildren) {
  const [theme, setThemeState] = React.useState<ThemeMode>(() => initialTheme());

  const setTheme = React.useCallback((t: ThemeMode) => {
    setThemeState(t);
    window.localStorage.setItem(KEY, t);
  }, []);

  const toggle = React.useCallback(() => setTheme(theme === "dark" ? "light" : "dark"), [setTheme, theme]);

  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);

    const w = tg();
    if (w) {
      const bg =
        getComputedStyle(document.documentElement).getPropertyValue("--bg").trim() ||
        (theme === "dark" ? "#0b1220" : "#f3f5f9");
      w.setHeaderColor(bg);
      w.setBackgroundColor(bg);
    }
  }, [theme]);

  return <ThemeContext.Provider value={{ theme, setTheme, toggle }}>{props.children}</ThemeContext.Provider>;
}

export function useTheme(): Ctx {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}