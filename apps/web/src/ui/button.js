import { jsx as _jsx } from "react/jsx-runtime";
export function Button({ variant = "primary", size = "md", full = true, className, ...rest }) {
    const base = "inline-flex items-center justify-center gap-2 font-semibold transition active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed";
    const pad = size === "sm" ? "px-3 py-2 text-xs" : "px-4 py-3 text-sm";
    const width = full ? "w-full" : "";
    const radius = size === "sm" ? 14 : 16;
    const style = variant === "primary"
        ? {
            background: "var(--accent)",
            color: "var(--accent-fg)",
            border: "1px solid rgba(47,102,255,0.22)",
            boxShadow: "0 10px 24px rgba(47,102,255,0.22)",
            borderRadius: radius
        }
        : variant === "secondary"
            ? {
                background: "var(--surface)",
                color: "var(--text)",
                border: "1px solid var(--border)",
                borderRadius: radius
            }
            : variant === "danger"
                ? {
                    background: "var(--danger)",
                    color: "white",
                    border: "1px solid rgba(240,68,56,0.22)",
                    boxShadow: "0 10px 24px rgba(240,68,56,0.18)",
                    borderRadius: radius
                }
                : {
                    background: "transparent",
                    color: "var(--muted)",
                    border: "1px solid transparent",
                    borderRadius: radius
                };
    return _jsx("button", { style: style, className: `${base} ${pad} ${width} ${className ?? ""}`, ...rest });
}
