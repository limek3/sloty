import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { BottomNav } from "./bottom-nav";
export function AppShell({ title, subtitle, right, showNav = true, children }) {
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: `mx-auto max-w-md px-4 py-6 space-y-4 ${showNav ? "tabbar-safe" : ""}`, children: [(title || subtitle || right) && (_jsxs("header", { className: "flex items-start justify-between gap-4", children: [_jsxs("div", { className: "space-y-1 min-w-0", children: [subtitle && _jsx("div", { className: "text-xs", style: { color: "var(--muted)" }, children: subtitle }), title && _jsx("div", { className: "title truncate", children: title })] }), right] })), children] }), showNav ? _jsx(BottomNav, {}) : null] }));
}
