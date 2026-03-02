import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { NavLink } from "react-router-dom";
function IconHome({ active }) {
    return (_jsx("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", "aria-hidden": "true", children: _jsx("path", { d: "M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z", stroke: "currentColor", strokeWidth: "1.7", opacity: active ? 1 : 0.72 }) }));
}
function IconCalendar({ active }) {
    return (_jsxs("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", "aria-hidden": "true", children: [_jsx("path", { d: "M7 3v3M17 3v3M4.5 8.5h15", stroke: "currentColor", strokeWidth: "1.7", opacity: active ? 1 : 0.72 }), _jsx("path", { d: "M6 6h12a2 2 0 0 1 2 2v11a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V8a2 2 0 0 1 2-2Z", stroke: "currentColor", strokeWidth: "1.7", opacity: active ? 1 : 0.72 })] }));
}
function IconUser({ active }) {
    return (_jsxs("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", "aria-hidden": "true", children: [_jsx("path", { d: "M12 12a4.2 4.2 0 1 0-4.2-4.2A4.2 4.2 0 0 0 12 12Z", stroke: "currentColor", strokeWidth: "1.7", opacity: active ? 1 : 0.72 }), _jsx("path", { d: "M4.5 20.2c1.8-4.2 13.2-4.2 15 0", stroke: "currentColor", strokeWidth: "1.7", opacity: active ? 1 : 0.72 })] }));
}
export function BottomNav() {
    const items = [
        { to: "/", label: "Записи", icon: (a) => _jsx(IconHome, { active: a }) },
        { to: "/me", label: "Мои", icon: (a) => _jsx(IconCalendar, { active: a }) },
        { to: "/master", label: "Кабинет", icon: (a) => _jsx(IconUser, { active: a }) }
    ];
    return (_jsx("div", { className: "fixed left-0 right-0 bottom-0 z-50", style: {
            paddingBottom: "env(safe-area-inset-bottom)"
        }, children: _jsx("div", { className: "mx-auto max-w-md px-4 pb-4", children: _jsx("nav", { className: "px-2 py-2", style: {
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "26px",
                    boxShadow: "var(--shadow)"
                }, children: _jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }, children: items.map((it) => (_jsx(NavLink, { to: it.to, className: "px-3 py-2", style: ({ isActive }) => ({
                            borderRadius: "20px",
                            textDecoration: "none",
                            background: isActive ? "var(--accent-weak)" : "transparent",
                            border: isActive ? "1px solid rgba(47,102,255,0.22)" : "1px solid transparent",
                            color: isActive ? "var(--accent)" : "var(--muted)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexDirection: "column",
                            gap: 6,
                            transition: "background 160ms ease, border-color 160ms ease, color 160ms ease"
                        }), children: ({ isActive }) => (_jsxs(_Fragment, { children: [_jsx("div", { style: { color: isActive ? "var(--accent)" : "var(--muted)" }, children: it.icon(isActive) }), _jsx("div", { style: { fontSize: 11, fontWeight: 600, lineHeight: "14px" }, children: it.label })] })) }, it.to))) }) }) }) }));
}
