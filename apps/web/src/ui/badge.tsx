// apps/web/src/ui/badge.tsx
import React from "react";

type Tone = "neutral" | "good" | "warn" | "bad" | "accent";

export function Badge(props: React.PropsWithChildren<{ tone?: Tone }>) {
  const tone = props.tone ?? "neutral";

  const bg =
    tone === "good"
      ? "var(--success-weak)"
      : tone === "warn"
      ? "var(--warn-weak)"
      : tone === "bad"
      ? "var(--danger-weak)"
      : tone === "accent"
      ? "var(--accent-weak)"
      : "rgba(102,112,133,0.14)";

  const fg =
    tone === "good"
      ? "var(--success)"
      : tone === "warn"
      ? "var(--warn)"
      : tone === "bad"
      ? "var(--danger)"
      : tone === "accent"
      ? "var(--accent)"
      : "var(--muted)";

  return (
    <span
      className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold"
      style={{ borderRadius: 999, background: bg, color: fg }}
    >
      {props.children}
    </span>
  );
}