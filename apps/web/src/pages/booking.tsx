import React from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { apiCreateAppointment, apiGetSlots, apiListServices } from "../lib/api";
import { initTelegramUi, haptic } from "../lib/telegram";
import { ymdTodayUtc, fmtHuman } from "../lib/time";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import type { Service } from "../lib/types";
import { AppShell } from "../ui/app-shell";

export function BookingPage() {
  const { masterId = "" } = useParams();
  const [sp] = useSearchParams();
  const nav = useNavigate();

  const [services, setServices] = React.useState<Service[]>([]);
  const [serviceId, setServiceId] = React.useState(sp.get("serviceId") ?? "");
  const [fromDate, setFromDate] = React.useState(ymdTodayUtc());
  const [slots, setSlots] = React.useState<Record<string, string[]>>({});
  const [selected, setSelected] = React.useState<string>("");
  const [phone, setPhone] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    initTelegramUi();
    (async () => {
      try {
        setLoading(true);
        const s = await apiListServices(masterId);
        setServices(s.services);
        if (!serviceId && s.services[0]?.id) setServiceId(s.services[0].id);
      } finally {
        setLoading(false);
      }
    })();
  }, [masterId]);

  React.useEffect(() => {
    if (!serviceId) return;
    (async () => {
      try {
        setError(null);
        const res = await apiGetSlots({ masterId, serviceId, fromDate, days: 7 });
        setSlots(res.slots);
        setSelected("");
      } catch (e: any) {
        setError(e.message ?? "Ошибка");
      }
    })();
  }, [masterId, serviceId, fromDate]);

  const service = services.find((s) => s.id === serviceId) ?? null;
  const days = Object.keys(slots);

  return (
    <AppShell
      subtitle="Запись"
      title={service ? service.title : "Выбор времени"}
      right={
        <button className="text-sm text-neutral-300 hover:text-white" onClick={() => nav("/me")}>
          Мои записи
        </button>
      }
    >
      <div className="flex items-center justify-between">
        <button className="text-sm text-neutral-300 hover:text-white" onClick={() => nav(`/m/${masterId}`)}>
          ← Назад
        </button>
        {service && (
          <div className="chip">
            {service.duration_min} мин • {service.price_rub} ₽
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="text-sm font-medium">Параметры</div>
          <div className="muted">Услуга → дата → слот</div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="text-xs text-neutral-400">Услуга</div>
            <Select value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} • {s.duration_min} мин • {s.price_rub} ₽
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <div className="text-xs text-neutral-400">С какой даты показывать</div>
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>

          {error && <div className="text-sm text-red-300">{error}</div>}

          <div className="space-y-2">
            <div className="text-xs text-neutral-400">Слоты</div>
            <div className="space-y-2">
              {loading && <div className="text-sm text-neutral-400">Загрузка…</div>}
              {!loading && days.length === 0 && <div className="text-sm text-neutral-400">Нет слотов.</div>}
              {!loading &&
                days.map((d) => (
                  <div key={d} className="rounded-2xl border border-neutral-800/70 bg-neutral-950/30">
                    <div className="px-4 py-3 text-xs text-neutral-300 border-b border-neutral-800/70">{d}</div>
                    <div className="p-2 flex flex-wrap gap-2">
                      {(slots[d] ?? []).slice(0, 30).map((iso) => (
                        <button
                          key={iso}
                          onClick={() => {
                            haptic("light");
                            setSelected(iso);
                          }}
                          className={
                            "rounded-xl px-3 py-2 text-xs border transition " +
                            (selected === iso
                              ? "bg-white text-black border-white"
                              : "bg-neutral-950/40 text-neutral-200 border-neutral-800/70 hover:bg-neutral-900/60")
                          }
                        >
                          {fmtHuman(iso)}
                        </button>
                      ))}
                      {(slots[d] ?? []).length > 30 && <div className="px-2 py-2 text-xs text-neutral-400">… ещё</div>}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs text-neutral-400">Телефон (необязательно)</div>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7…" />
          </div>

          <Button
            disabled={!selected || creating}
            onClick={async () => {
              if (!service || !selected) return;
              try {
                setCreating(true);
                setError(null);
                const res = await apiCreateAppointment({
                  masterId,
                  serviceId: service.id,
                  startAt: selected,
                  phone: phone.trim() || undefined
                });
                haptic("medium");
                nav(`/me?created=${res.appointment.id}`);
              } catch (e: any) {
                const msg = e.message ?? "Ошибка";
                setError(msg.includes("slot_taken") ? "Этот слот уже занят. Выберите другой." : msg);
              } finally {
                setCreating(false);
              }
            }}
          >
            {creating ? "Записываю…" : "Записаться"}
          </Button>

          <div className="text-xs text-neutral-500">Отмена/перенос доступны в “Мои записи”.</div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
