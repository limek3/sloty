// apps/web/src/ui/app-shell.tsx
import React from "react";
import { BottomNav } from "./bottom-nav";

type Props = React.PropsWithChildren<{
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
  showNav?: boolean;
}>;

export function AppShell({ title, subtitle, right, showNav = true, children }: Props) {
  return (
    <>
      <div className={`mx-auto max-w-md px-4 py-6 space-y-4 ${showNav ? "tabbar-safe" : ""}`}>
        {(title || subtitle || right) && (
          <header className="flex items-start justify-between gap-4">
            <div className="space-y-1 min-w-0">
              {subtitle && <div className="text-xs" style={{ color: "var(--muted)" }}>{subtitle}</div>}
              {title && <div className="title truncate">{title}</div>}
            </div>
            {right}
          </header>
        )}
        {children}
      </div>

      {showNav ? <BottomNav /> : null}
    </>
  );
}