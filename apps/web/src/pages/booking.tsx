// apps/web/src/pages/booking.tsx
import React from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { apiCreateAppointment, apiGetSlots, apiListServices } from "../lib/api";
import { haptic, initTelegramUi } from "../lib/telegram";
import { fmtHuman, ymdTodayUtc } from "../lib/time";
import type { Service } from "../lib/types";
import { AppShell } from "../ui/app-shell";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { Badge } from "../ui/badge";

const wd = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function ymdToDate(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
}

export function BookingPage() {
  const { masterId = "" } = useParams();
  const [sp] = useSearchParams();
  const nav = useNavigate();

  const [services, setServices] = React.useState<Service[]>([]);
  const [serviceId, setServiceId] = React.useState(sp.get("serviceId") ?? "");
  const [fromDate, setFromDate] = React.useState(ymdTodayUtc());
  const [activeDay, setActiveDay] = React.useState<string>(ymdTodayUtc());

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
      } catch (e: any) {
        setError(e?.message ?? "Ошибка загрузки услуг");
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
        const keys = Object.keys(res.slots);
        const firstNonEmpty = keys.find((k) => (res.slots[k] ?? []).length > 0) ?? keys[0] ?? fromDate;
        setActiveDay(firstNonEmpty);
        setSelected("");
      } catch (e: any) {
        setError(e?.message ?? "Ошибка слотов");
      }
    })();
  }, [masterId, serviceId, fromDate]);

  const service = services.find((s) => s.id === serviceId) ?? null;
  const days = Object.keys(slots);
  const daySlots = slots[activeDay] ?? [];

  return (
    <AppShell
      subtitle="Новая запись"
      title={service ? service.title : "Выбор времени"}
      showNav={false}
      right={
        <button style={{ color: "var(--muted)", fontSize: 14 }} onClick={() => nav(`/m/${masterId}`)}>
          Назад
        </button>
      }
    >
      <div className="flex items-center justify-between">
        <div className="muted">Выберите услугу и время</div>
        {service && <Badge tone="accent">{service.duration_min} мин • {service.price_rub} ₽</Badge>}
      </div>

      <Card>
        <CardHeader>
          <div className="text-sm font-semibold">Параметры</div>
          <div className="muted">Услуга → день → слот</div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="muted">Услуга</div>
            <Select value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} • {s.duration_min} мин • {s.price_rub} ₽
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <div className="muted">Дата (старт недели)</div>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setSelected("");
              }}
            />
          </div>

          {error && (
            <div className="text-sm" style={{ color: "var(--danger)" }}>
              {error}
            </div>
          )}

          {/* Weekday chips */}
          <div className="space-y-2">
            <div className="muted">Неделя</div>
            <div className="flex gap-2 overflow-auto pb-1">
              {days.map((d) => {
                const date = ymdToDate(d);
                const weekday = wd[(date.getUTCDay() + 6) % 7];
                const dd = String(date.getUTCDate()).padStart(2, "0");
                const active = d === activeDay;
                const hasSlots = (slots[d] ?? []).length > 0;

                return (
                  <button
                    key={d}
                    onClick={() => {
                      haptic("light");
                      setActiveDay(d);
                      setSelected("");
                    }}
                    className="px-3 py-2 text-xs font-semibold"
                    style={{
                      whiteSpace: "nowrap",
                      borderRadius: 16,
                      border: `1px solid ${active ? "rgba(47,102,255,0.28)" : "var(--border)"}`,
                      background: active ? "var(--accent-weak)" : "var(--surface)",
                      color: active ? "var(--accent)" : "var(--text)",
                      opacity: hasSlots ? 1 : 0.55
                    }}
                  >
                    <div style={{ lineHeight: "14px" }}>{weekday}</div>
                    <div style={{ lineHeight: "14px", color: active ? "var(--accent)" : "var(--muted)" }}>{dd}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Slot grid */}
          <div className="space-y-2">
            <div className="muted">Время</div>

            {loading && <div className="muted">Загрузка…</div>}
            {!loading && daySlots.length === 0 && <div className="muted">На этот день слотов нет.</div>}

            <div
              className="gap-2"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))"
              }}
            >
              {daySlots.slice(0, 24).map((iso) => {
                const active = iso === selected;
                return (
                  <button
                    key={iso}
                    onClick={() => {
                      haptic("light");
                      setSelected(iso);
                    }}
                    className="py-3 text-xs font-semibold transition"
                    style={{
                      borderRadius: 16,
                      border: `1px solid ${active ? "rgba(47,102,255,0.38)" : "var(--border)"}`,
                      background: active ? "var(--accent)" : "var(--surface)",
                      color: active ? "var(--accent-fg)" : "var(--text)"
                    }}
                  >
                    {fmtHuman(iso).split(", ").slice(-1)[0]}
                  </button>
                );
              })}
            </div>

            {daySlots.length > 24 && <div className="muted">… ещё слоты</div>}
          </div>

          <div className="space-y-2">
            <div className="muted">Телефон (необязательно)</div>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 900 123-45-67" />
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
                const msg = e?.message ?? "Ошибка";
                setError(msg.includes("slot_taken") ? "Этот слот уже занят. Выберите другой." : msg);
              } finally {
                setCreating(false);
              }
            }}
          >
            {creating ? "Записываю…" : "Записать и отправить в TG"}
          </Button>

          <div className="muted">Отмена/перенос доступны в “Мои записи”.</div>
        </CardContent>
      </Card>
    </AppShell>
  );
}