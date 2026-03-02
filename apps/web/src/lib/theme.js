import React from "react";
import { tg } from "./telegram";
const ThemeContext = React.createContext(null);
const KEY = "sloty.theme";
function initialTheme() {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem(KEY) : null;
    if (saved === "light" || saved === "dark")
        return saved;
    return tg()?.colorScheme === "dark" ? "dark" : "light";
}
export function ThemeProvider(props) {
    const [theme, setThemeState] = React.useState(() => initialTheme());
    const setTheme = React.useCallback((t) => {
        setThemeState(t);
        window.localStorage.setItem(KEY, t);
    }, []);
    const toggle = React.useCallback(() => setTheme(theme === "dark" ? "light" : "dark"), [setTheme, theme]);
    React.useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        const w = tg();
        if (w) {
            const bg = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim() || (theme === "dark" ? "#0b1220" : "#f3f5f9");
            w.setHeaderColor(bg);
            w.setBackgroundColor(bg);
        }
    }, [theme]);
    return value;
    {
        {
            theme, setTheme, toggle;
        }
    }
     > { props, : .children } < /ThemeContext.Provider>;
}
export function useTheme() {
    const ctx = React.useContext(ThemeContext);
    if (!ctx)
        throw new Error("useTheme must be used within ThemeProvider");
    return ctx;
}
