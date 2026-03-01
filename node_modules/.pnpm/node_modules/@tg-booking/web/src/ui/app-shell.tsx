import React from "react";

export function AppShell(
  props: React.PropsWithChildren<{ title?: string; subtitle?: string; right?: React.ReactNode }>
) {
  return (
    <div className="mx-auto max-w-md px-4 py-6 space-y-4">
      {(props.title || props.subtitle || props.right) && (
        <header className="flex items-start justify-between gap-4">
          <div className="space-y-1 min-w-0">
            {props.subtitle && <div className="text-xs text-neutral-400">{props.subtitle}</div>}
            {props.title && <div className="title truncate">{props.title}</div>}
          </div>
          {props.right}
        </header>
      )}
      {props.children}
    </div>
  );
}
