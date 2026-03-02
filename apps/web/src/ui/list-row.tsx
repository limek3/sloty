import React from "react";

export function ListRow(props: React.PropsWithChildren<{ onClick?: () => void; right?: React.ReactNode; sub?: React.ReactNode }>) {
  return (
    <button
      onClick={props.onClick}
      className="w-full text-left px-4 py-3 transition"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "18px"
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {props.children}
          {props.sub && <div className="muted mt-1">{props.sub}</div>}
        </div>
        {props.right}
      </div>
    </button>
  );
}