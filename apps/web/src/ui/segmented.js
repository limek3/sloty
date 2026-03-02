import { jsx as _jsx } from "react/jsx-runtime";
export function Segmented(props) {
    return (_jsx("div", { className: "p-1", style: {
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: "999px"
        }, children: _jsx("div", { className: "grid gap-1", style: { gridTemplateColumns: `repeat(${props.items.length}, 1fr)` }, children: props.items.map((it) => {
                const active = props.value === it.id;
                return (_jsx("button", { onClick: () => props.onChange(it.id), className: "py-2 text-xs font-medium transition", style: {
                        borderRadius: "999px",
                        background: active ? "var(--surface)" : "transparent",
                        boxShadow: active ? "0 6px 16px rgba(16,24,40,0.08)" : "none",
                        color: active ? "var(--text)" : "var(--muted)"
                    }, children: it.label }, it.id));
            }) }) }));
}
