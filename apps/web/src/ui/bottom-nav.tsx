// apps/web/src/ui/bottom-nav.tsx
import React from "react";
import { NavLink } from "react-router-dom";

function IconHome({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        opacity={active ? 1 : 0.72}
      />
    </svg>
  );
}

function IconCalendar({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 3v3M17 3v3M4.5 8.5h15"
        stroke="currentColor"
        strokeWidth="1.7"
        opacity={active ? 1 : 0.72}
      />
      <path
        d="M6 6h12a2 2 0 0 1 2 2v11a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V8a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.7"
        opacity={active ? 1 : 0.72}
      />
    </svg>
  );
}

function IconUser({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 12a4.2 4.2 0 1 0-4.2-4.2A4.2 4.2 0 0 0 12 12Z"
        stroke="currentColor"
        strokeWidth="1.7"
        opacity={active ? 1 : 0.72}
      />
      <path
        d="M4.5 20.2c1.8-4.2 13.2-4.2 15 0"
        stroke="currentColor"
        strokeWidth="1.7"
        opacity={active ? 1 : 0.72}
      />
    </svg>
  );
}

type Item = {
  to: string;
  label: string;
  icon: (active: boolean) => React.ReactNode;
};

export function BottomNav() {
  const items: Item[] = [
    { to: "/", label: "Записи", icon: (a) => <IconHome active={a} /> },
    { to: "/me", label: "Мои", icon: (a) => <IconCalendar active={a} /> },
    { to: "/master", label: "Кабинет", icon: (a) => <IconUser active={a} /> }
  ];

  return (
    <div
      className="fixed left-0 right-0 bottom-0 z-50"
      style={{
        paddingBottom: "env(safe-area-inset-bottom)"
      }}
    >
      <div className="mx-auto max-w-md px-4 pb-4">
        <nav
          className="px-2 py-2"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "26px",
            boxShadow: "var(--shadow)"
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
            {items.map((it) => (
              <NavLink
                key={it.to}
                to={it.to}
                className="px-3 py-2"
                style={({ isActive }) => ({
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
                })}
              >
                {({ isActive }) => (
                  <>
                    <div style={{ color: isActive ? "var(--accent)" : "var(--muted)" }}>{it.icon(isActive)}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, lineHeight: "14px" }}>{it.label}</div>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}