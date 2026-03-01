import React from "react";

export function Card(props: React.PropsWithChildren<{ className?: string }>) {
  return <div className={"glass rounded-3xl " + (props.className ?? "")}>{props.children}</div>;
}

export function CardHeader(props: React.PropsWithChildren<{ className?: string }>) {
  return <div className={"p-5 pb-3 " + (props.className ?? "")}>{props.children}</div>;
}

export function CardContent(props: React.PropsWithChildren<{ className?: string }>) {
  return <div className={"p-5 pt-2 " + (props.className ?? "")}>{props.children}</div>;
}
