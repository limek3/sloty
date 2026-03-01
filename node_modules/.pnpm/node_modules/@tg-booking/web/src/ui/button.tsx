import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "md" | "sm";
};

export function Button({ variant = "primary", size = "md", className, ...rest }: Props) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-2xl font-medium transition " +
    "active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed " +
    "focus:outline-none focus:ring-2 focus:ring-white/15";

  const pad = size === "sm" ? "px-3 py-2 text-xs" : "px-4 py-3 text-sm";

  const styles =
    variant === "primary"
      ? "bg-white text-black hover:bg-neutral-100 shadow-soft"
      : variant === "secondary"
        ? "bg-neutral-900/70 text-white border border-neutral-800/70 hover:bg-neutral-900"
        : variant === "danger"
          ? "bg-red-500/90 text-white hover:bg-red-500 border border-red-500/20"
          : "bg-transparent text-neutral-200 border border-neutral-800/70 hover:bg-neutral-900/60";

  return <button className={`${base} ${pad} ${styles} ${className ?? ""}`} {...rest} />;
}
