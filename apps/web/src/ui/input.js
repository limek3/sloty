import { jsx as _jsx } from "react/jsx-runtime";
export function Input(props) {
    return (_jsx("input", { ...props, className: "w-full text-sm font-medium outline-none transition focus:ring-2 focus:ring-[color:var(--ring)] " +
            (props.className ?? ""), style: {
            borderRadius: 16,
            padding: "12px 14px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            color: "var(--text)"
        } }));
}
