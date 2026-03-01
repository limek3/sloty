import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiGetMaster, apiListServices } from "../lib/api";
import { initTelegramUi, haptic } from "../lib/telegram";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import type { Master, Service } from "../lib/types";
import { AppShell } from "../ui/app-shell";
import { Badge } from "../ui/badge";

export function MasterProfilePage() {
  const { masterId = "" } = useParams();
  const nav = useNavigate();

  const [master, setMaster] = React.useState<Master | null>(null);
  const [services, setServices] = React.useState<Service[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    initTelegramUi();
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const m = await apiGetMaster(masterId);
        const s = await apiListServices(masterId);
        setMaster(m.master);
        setServices(s.services);
      } catch (e: any) {
        setError(e?.message ?? "Ошибка");
      } finally {
        setLoading(false);
      }
    })();
  }, [masterId]);

  return (
    <AppShell
      subtitle="Запись"
      title={loading ? "…" : master?.display_name ?? "Мастер"}
      right={master?.city ? <Badge>{master.city}</Badge> : null}
    >
      {master?.bio && <div className="muted">{master.bio}</div>}
      {error && <div className="text-sm text-red-300">{error}</div>}

      <Card>
        <CardHeader>
          <div className="text-sm font-medium">Услуги</div>
          <div className="muted">Выберите услугу и время</div>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && (
            <>
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
            </>
          )}

          {!loading && services.length === 0 && <div className="text-sm text-neutral-400">Пока нет услуг.</div>}

          {!loading &&
            services.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  haptic("light");
                  nav(`/m/${masterId}/book?serviceId=${s.id}`);
                }}
                className="w-full rounded-3xl border border-neutral-800/70 bg-neutral-950/35 px-4 py-3 text-left hover:bg-neutral-900/60 transition"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{s.title}</div>
                    <div className="text-xs text-neutral-400">{s.duration_min} мин</div>
                  </div>
                  <div className="text-sm font-semibold whitespace-nowrap">{s.price_rub} ₽</div>
                </div>
              </button>
            ))}

          <div className="pt-1">
            <Button variant="secondary" onClick={() => nav("/me")}>
              Мои записи
            </Button>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
