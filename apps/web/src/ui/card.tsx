// apps/web/src/ui/card.tsx
import React from "react";

export function Card(props: React.PropsWithChildren<{ className?: string }>) {
  return <div className={`surface ${props.className ?? ""}`}>{props.children}</div>;
}

export function CardHeader(props: React.PropsWithChildren<{ className?: string }>) {
  return <div className={`px-5 pt-5 pb-3 ${props.className ?? ""}`}>{props.children}</div>;
}

export function CardContent(props: React.PropsWithChildren<{ className?: string }>) {
  return <div className={`px-5 pb-5 ${props.className ?? ""}`}>{props.children}</div>;
}