import { jsx as _jsx } from "react/jsx-runtime";
export function Badge(props) {
    const tone = props.tone ?? "neutral";
    const bg = tone === "good"
        ? "var(--success-weak)"
        : tone === "warn"
            ? "var(--warn-weak)"
            : tone === "bad"
                ? "var(--danger-weak)"
                : tone === "accent"
                    ? "var(--accent-weak)"
                    : "rgba(102,112,133,0.14)";
    const fg = tone === "good"
        ? "var(--success)"
        : tone === "warn"
            ? "var(--warn)"
            : tone === "bad"
                ? "var(--danger)"
                : tone === "accent"
                    ? "var(--accent)"
                    : "var(--muted)";
    return (_jsx("span", { className: "inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold", style: { borderRadius: 999, background: bg, color: fg }, children: props.children }));
}
