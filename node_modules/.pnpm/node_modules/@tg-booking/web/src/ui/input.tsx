import React from "react";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={
        "w-full rounded-2xl border border-neutral-800/70 bg-neutral-950/35 px-4 py-3 text-sm " +
        "outline-none focus:border-neutral-600 focus:ring-2 focus:ring-white/10 transition " +
        (props.className ?? "")
      }
    />
  );
}
