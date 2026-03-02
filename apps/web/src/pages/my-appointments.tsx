// apps/web/src/pages/my-appointments.tsx
import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiCancelAppointment, apiGetSlots, apiMyAppointments, apiRescheduleAppointment } from "../lib/api";
import { haptic, initTelegramUi } from "../lib/telegram";
import { fmtHuman, ymd, ymdTodayUtc } from "../lib/time";
import type { Appointment } from "../lib/types";
import { AppShell } from "../ui/app-shell";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

export function MyAppointmentsPage() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const createdId = sp.get("created");

  const [items, setItems] = React.useState<Appointment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const [editAppt, setEditAppt] = React.useState<Appointment | null>(null);
  const [slots, setSlots] = React.useState<Record<string, string[]>>({});
  const [fromDate, setFromDate] = React.useState(ymdTodayUtc());
  const [newStart, setNewStart] = React.useState<string>("");
  const [error, setError] = React.useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      setError(null);
      const res = await apiMyAppointments();
      setItems(res.appointments);
    } catch (e: any) {
      setError(e?.message ?? "Ошибка");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    initTelegramUi();
    refresh();
  }, []);

  async function openReschedule(a: Appointment) {
    setEditAppt(a);
    setNewStart("");
    setFromDate(ymd(a.start_at));
    const mId = a.master?.id;
    if (!mId) return;

    const res = await apiGetSlots({ masterId: mId, serviceId: a.service.id, fromDate: ymd(a.start_at), days: 7 });
    setSlots(res.slots);
  }

  const toneFor = (status: string) =>
    status === "confirmed" ? "good" : status === "pending" ? "warn" : status === "canceled" ? "bad" : "neutral";

  return (
    <AppShell
      subtitle="Профиль"
      title="Мои записи"
      right={<button style={{ color: "var(--muted)", fontSize: 14 }} onClick={() => refresh()}>Обновить</button>}
    >
      <div className="flex items-center justify-between">
        <button style={{ color: "var(--muted)", fontSize: 14 }} onClick={() => nav(-1)}>← Назад</button>
        <Badge tone="neutral">{items.length} записей</Badge>
      </div>

      {createdId && (
        <div className="surface px-4 py-3 text-sm" style={{ borderRadius: 18, borderColor: "rgba(18,183,106,0.22)" }}>
          Запись создана ✅
        </div>
      )}

      {error && <div className="text-sm" style={{ color: "var(--danger)" }}>{error}</div>}

      {editAppt && (
        <Card>
          <CardHeader>
            <div className="text-sm font-semibold">Перенос</div>
            <div className="muted">{editAppt.master?.display_name} • {editAppt.service.title}</div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="muted">Новая дата</div>
            <Input
              type="date"
              value={fromDate}
              onChange={async (e) => {
                const v = e.target.value;
                setFromDate(v);
                const mId = editAppt.master?.id;
                if (!mId) return;
                const res = await apiGetSlots({ masterId: mId, serviceId: editAppt.service.id, fromDate: v, days: 7 });
                setSlots(res.slots);
                setNewStart("");
              }}
            />

            <div className="space-y-2 max-h-[320px] overflow-auto pr-1">
              {Object.keys(slots).map((d) => (
                <div key={d} className="surface-soft" style={{ padding: 10 }}>
                  <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>{d}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
                    {(slots[d] ?? []).slice(0, 24).map((iso) => {
                      const active = newStart === iso;
                      return (
                        <button
                          key={iso}
                          onClick={() => { haptic("light"); setNewStart(iso); }}
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
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                disabled={!newStart || busyId === editAppt.id}
                onClick={async () => {
                  if (!newStart) return;
                  try {
                    setBusyId(editAppt.id);
                    await apiRescheduleAppointment(editAppt.id, newStart);
                    haptic("medium");
                    setEditAppt(null);
                    await refresh();
                  } catch (e: any) {
                    const msg = e?.message ?? "Ошибка";
                    setError(msg.includes("slot_taken") ? "Слот уже занят. Выберите другой." : msg);
                  } finally {
                    setBusyId(null);
                  }
                }}
              >
                {busyId === editAppt.id ? "Переношу…" : "Подтвердить"}
              </Button>
              <Button variant="secondary" onClick={() => setEditAppt(null)}>Закрыть</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="text-sm font-semibold">Список</div>
          <div className="muted">Отмена и перенос</div>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading && <div className="muted">Загрузка…</div>}
          {!loading && items.length === 0 && <div className="muted">Пока нет записей.</div>}

          {!loading &&
            items.map((a) => (
              <div key={a.id} className="surface" style={{ padding: 14, borderRadius: 18 }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{a.master?.display_name ?? "Мастер"}</div>
                    <div className="muted">{a.service.title}</div>
                  </div>
                  <Badge tone={toneFor(a.status) as any}>{a.status}</Badge>
                </div>

                <div className="text-sm mt-2">{fmtHuman(a.start_at)}</div>

                <div className="flex gap-2 mt-3">
                  <Button variant="secondary" disabled={busyId === a.id || a.status === "canceled"} onClick={() => openReschedule(a)}>
                    Перенести
                  </Button>

                  <Button
                    variant="danger"
                    disabled={busyId === a.id || a.status === "canceled"}
                    onClick={async () => {
                      try {
                        setBusyId(a.id);
                        await apiCancelAppointment(a.id, "Отменено клиентом");
                        haptic("light");
                        await refresh();
                      } finally {
                        setBusyId(null);
                      }
                    }}
                  >
                    {a.status === "canceled" ? "Отменено" : busyId === a.id ? "Отменяю…" : "Отменить"}
                  </Button>
                </div>
              </div>
            ))}
        </CardContent>
      </Card>
    </AppShell>
  );
}