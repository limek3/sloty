// apps/web/src/pages/home.tsx
import React from "react";
import { isInTelegram } from "../lib/telegram";
import { AppShell } from "../ui/app-shell";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

export function HomePage() {
  const inTg = isInTelegram();

  return (
    <AppShell
      subtitle="Sloty"
      title="Запись"
      right={<Badge tone={inTg ? "good" : "neutral"}>{inTg ? "WebApp OK" : "Browser"}</Badge>}
    >
      <Card className="overflow-hidden">
        <div style={{ height: 120, background: "linear-gradient(135deg, rgba(47,102,255,0.12), rgba(47,102,255,0.00))" }} />
        <CardHeader>
          <div className="text-sm font-semibold">{inTg ? "Готово" : "Откройте в Telegram"}</div>
          <div className="muted">
            {inTg
              ? "Можно управлять записями и кабинетом."
              : "Это превью. Полный функционал работает внутри Telegram Mini App."}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {!inTg && (
            <div className="muted">
              Открой бота и запусти WebApp через кнопку — тогда появятся записи и кабинет.
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => (window.location.href = "/me")} disabled={!inTg}>
              Мои записи
            </Button>
            <Button variant="secondary" onClick={() => (window.location.href = "/master")} disabled={!inTg}>
              Кабинет
            </Button>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}