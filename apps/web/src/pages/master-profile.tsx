// apps/web/src/pages/master-profile.tsx
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiGetMaster, apiListServices } from "../lib/api";
import { haptic, initTelegramUi } from "../lib/telegram";
import type { Master, Service } from "../lib/types";
import { AppShell } from "../ui/app-shell";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

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
      showNav={false}
      right={master?.city ? <Badge>{master.city}</Badge> : <button style={{ color: "var(--muted)", fontSize: 14 }} onClick={() => nav("/")}>Главная</button>}
    >
      {master?.bio && <div className="muted">{master.bio}</div>}
      {error && <div className="text-sm" style={{ color: "var(--danger)" }}>{error}</div>}

      <Card>
        <CardHeader>
          <div className="text-sm font-semibold">Услуги</div>
          <div className="muted">Выберите услугу и время</div>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading && (
            <>
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
            </>
          )}

          {!loading && services.length === 0 && <div className="muted">Пока нет услуг.</div>}

          {!loading &&
            services.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  haptic("light");
                  nav(`/m/${masterId}/book?serviceId=${s.id}`);
                }}
                className="w-full px-4 py-3 text-left transition"
                style={{
                  borderRadius: 18,
                  background: "var(--surface)",
                  border: "1px solid var(--border)"
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{s.title}</div>
                    <div className="muted">{s.duration_min} мин</div>
                  </div>
                  <div className="text-sm font-semibold">{s.price_rub} ₽</div>
                </div>
              </button>
            ))}
        </CardContent>
      </Card>
    </AppShell>
  );
}