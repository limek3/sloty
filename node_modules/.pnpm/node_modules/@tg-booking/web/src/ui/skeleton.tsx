import React from "react";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={
        "animate-pulse rounded-3xl bg-gradient-to-br from-neutral-800/60 to-neutral-900/40 " +
        (className ?? "")
      }
    />
  );
}
