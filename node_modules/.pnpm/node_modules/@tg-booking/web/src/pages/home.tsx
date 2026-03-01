import React from "react";
import { isInTelegram } from "../lib/telegram";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader } from "../ui/card";
import { AppShell } from "../ui/app-shell";
import { Badge } from "../ui/badge";

export function HomePage() {
  const inTg = isInTelegram();

  return (
    <AppShell
      subtitle="TG Booking"
      title="Запись на услуги"
      right={<Badge tone={inTg ? "good" : "neutral"}>{inTg ? "WebApp OK" : "Browser"}</Badge>}
    >
      <Card className="overflow-hidden">
        <div className="h-28 w-full bg-gradient-to-br from-white/10 via-white/0 to-white/5" />
        <CardHeader>
          <div className="text-sm font-medium">{inTg ? "Готово" : "Откройте в Telegram"}</div>
          <div className="muted">
            {inTg
              ? "Можно управлять записями и кабинетом."
              : "Эта страница для браузера. Полный функционал работает в Telegram Mini App (нужен initData)."}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {!inTg && (
            <div className="text-sm text-neutral-300">
              Открой бота → <span className="chip">Открыть кабинет</span> или ссылку мастера → тогда всё заработает.
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 pt-2">
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
