import React from "react";
import { Card, CardContent, CardHeader } from "./card";
import { Button } from "./button";

type Props = React.PropsWithChildren<{ title?: string }>;
type State = { hasError: boolean; message?: string };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(err: unknown): State {
    return { hasError: true, message: err instanceof Error ? err.message : String(err) };
  }

  componentDidCatch(err: unknown) {
    console.error("UI crashed:", err);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="mx-auto max-w-md px-4 py-6">
        <Card>
          <CardHeader>
            <div className="text-sm font-semibold">{this.props.title ?? "Ошибка"}</div>
            <div className="muted">Перезагрузи страницу.</div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div
              className="text-xs"
              style={{
                border: "1px solid var(--border)",
                background: "var(--surface)",
                borderRadius: 16,
                padding: "12px 14px",
                wordBreak: "break-word"
              }}
            >
              {this.state.message ?? "unknown"}
            </div>
            <Button onClick={() => window.location.reload()}>Перезагрузить</Button>
            <Button variant="secondary" onClick={() => (window.location.href = "/")}>
              На главную
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
}