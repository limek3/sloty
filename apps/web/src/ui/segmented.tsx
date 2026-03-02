import React from "react";

type Item<T extends string> = { id: T; label: string };

export function Segmented<T extends string>(props: {
  value: T;
  onChange: (v: T) => void;
  items: Item<T>[];
}) {
  return (
    <div
      className="p-1"
      style={{
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
        borderRadius: "999px"
      }}
    >
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${props.items.length}, 1fr)` }}>
        {props.items.map((it) => {
          const active = props.value === it.id;
          return (
            <button
              key={it.id}
              onClick={() => props.onChange(it.id)}
              className="py-2 text-xs font-medium transition"
              style={{
                borderRadius: "999px",
                background: active ? "var(--surface)" : "transparent",
                boxShadow: active ? "0 6px 16px rgba(16,24,40,0.08)" : "none",
                color: active ? "var(--text)" : "var(--muted)"
              }}
            >
              {it.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}