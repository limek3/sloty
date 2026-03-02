import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
const Ctx = React.createContext(null);
function uid() {
    return Math.random().toString(16).slice(2) + Date.now().toString(16);
}
export function ToastProvider(props) {
    const [items, setItems] = React.useState([]);
    const push = React.useCallback((t) => {
        const id = uid();
        const toast = { id, ...t };
        setItems((p) => [toast, ...p].slice(0, 3));
        window.setTimeout(() => setItems((p) => p.filter((x) => x.id !== id)), 3200);
    }, []);
    const api = React.useMemo(() => ({
        push,
        success: (title, message) => push({ kind: "success", title, message }),
        error: (title, message) => push({ kind: "error", title, message }),
        info: (title, message) => push({ kind: "info", title, message })
    }), [push]);
    return (_jsxs(Ctx.Provider, { value: api, children: [props.children, _jsx("div", { className: "fixed top-0 left-0 right-0 z-[100]", children: _jsx("div", { className: "mx-auto max-w-md px-4 pt-4 space-y-2", children: items.map((t) => (_jsx("div", { className: "glass rounded-2xl px-4 py-3", style: {
                            borderColor: t.kind === "success"
                                ? "rgba(16,185,129,0.25)"
                                : t.kind === "error"
                                    ? "rgba(239,68,68,0.25)"
                                    : "var(--border)"
                        }, children: _jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "text-sm font-medium", children: t.title }), t.message && _jsx("div", { className: "muted mt-0.5", children: t.message })] }), _jsx("button", { className: "icon-btn", onClick: () => setItems((p) => p.filter((x) => x.id !== t.id)), "aria-label": "Close", type: "button", children: "\u2715" })] }) }, t.id))) }) })] }));
}
export function useToast() {
    const ctx = React.useContext(Ctx);
    if (!ctx)
        throw new Error("useToast must be used within ToastProvider");
    return ctx;
}
