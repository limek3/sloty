import React from "react";

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={
        "w-full text-sm font-medium outline-none transition focus:ring-2 focus:ring-[color:var(--ring)] " +
        (props.className ?? "")
      }
      style={{
        borderRadius: 16,
        padding: "12px 14px",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        color: "var(--text)"
      }}
    />
  );
}