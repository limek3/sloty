import React from "react";

type Item<T extends string> = { id: T; label: string };

export function Segmented<T extends string>(props: {
  value: T;
  onChange: (v: T) => void;
  items: Item<T>[];
}) {
  return (
    <div className="glass rounded-2xl p-1 flex gap-1">
      {props.items.map((it) => {
        const active = props.value === it.id;
        return (
          <button
            key={it.id}
            onClick={() => props.onChange(it.id)}
            className={
              "flex-1 rounded-2xl px-3 py-2 text-xs transition " +
              (active ? "bg-white text-black" : "text-neutral-200 hover:bg-neutral-900/60")
            }
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}
