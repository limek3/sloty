import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function ListRow(props) {
    return (_jsx("button", { onClick: props.onClick, className: "w-full text-left px-4 py-3 transition", style: {
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "18px"
        }, children: _jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { className: "min-w-0", children: [props.children, props.sub && _jsx("div", { className: "muted mt-1", children: props.sub })] }), props.right] }) }));
}
