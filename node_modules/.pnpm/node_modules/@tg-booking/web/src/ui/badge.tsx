import React from "react";

type Props = React.PropsWithChildren<{ tone?: "neutral" | "good" | "bad"; className?: string }>;

export function Badge({ tone = "neutral", className, children }: Props) {
  const base = "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium";
  const styles =
    tone === "good"
      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
      : tone === "bad"
        ? "border-red-500/20 bg-red-500/10 text-red-200"
        : "border-neutral-800/70 bg-neutral-950/40 text-neutral-200";
  return <span className={`${base} ${styles} ${className ?? ""}`}>{children}</span>;
}
