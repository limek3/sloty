import React from "react";

type Tone = "success" | "warn" | "neutral" | "danger";

export function StatusPill(props: React.PropsWithChildren<{ tone?: Tone }>) {
  const tone = props.tone ?? "neutral";
  const bg =
    tone === "success" ? "var(--success-weak)" :
    tone === "warn" ? "var(--warn-weak)" :
    tone === "danger" ? "var(--danger-weak)" :
    "rgba(102,112,133,0.14)";

  const fg =
    tone === "success" ? "var(--success)" :
    tone === "warn" ? "var(--warn)" :
    tone === "danger" ? "var(--danger)" :
    "var(--muted)";

  return (
    <span
      className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium"
      style={{ borderRadius: "999px", background: bg, color: fg }}
    >
      {props.children}
    </span>
  );
}