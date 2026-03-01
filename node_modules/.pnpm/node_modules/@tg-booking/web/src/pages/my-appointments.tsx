import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  apiCancelAppointment,
  apiGetSlots,
  apiMyAppointments,
  apiRescheduleAppointment
} from "../lib/api";
import { initTelegramUi, haptic } from "../lib/telegram";
import { fmtHuman, ymdTodayUtc, ymd } from "../lib/time";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import type { Appointment } from "../lib/types";
import { AppShell } from "../ui/app-shell";
import { Badge } from "../ui/badge";

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

  async function refresh() {
    setLoading(true);
    try {
      const res = await apiMyAppointments();
      setItems(res.appointments);
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

    const res = await apiGetSlots({
      masterId: mId,
      serviceId: a.service.id,
      fromDate: ymd(a.start_at),
      days: 7
    });
    setSlots(res.slots);
  }

  return (
    <AppShell
      subtitle="Профиль"
      title="Мои записи"
      right={
        <button className="text-sm text-neutral-300 hover:text-white" onClick={() => refresh()}>
          Обновить
        </button>
      }
    >
      <div className="flex items-center justify-between">
        <button className="text-sm text-neutral-300 hover:text-white" onClick={() => nav(-1)}>
          ← Назад
        </button>
        <Badge>{items.length} записей</Badge>
      </div>

      {createdId && (
        <div className="glass rounded-3xl px-4 py-3 text-sm">
          Запись создана ✅
        </div>
      )}

      {editAppt && (
        <Card>
          <CardHeader>
            <div className="text-sm font-medium">Перенос</div>
            <div className="muted">
              {editAppt.master?.display_name} • {editAppt.service.title}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-xs text-neutral-400">Новая дата (показ слотов)</div>
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

            <div className="space-y-2">
              {Object.keys(slots).map((d) => (
                <div key={d} className="rounded-2xl border border-neutral-800/70 bg-neutral-950/30">
                  <div className="px-4 py-3 text-xs text-neutral-300 border-b border-neutral-800/70">{d}</div>
                  <div className="p-2 flex flex-wrap gap-2">
                    {(slots[d] ?? []).slice(0, 24).map((iso) => (
                      <button
                        key={iso}
                        onClick={() => {
                          haptic("light");
                          setNewStart(iso);
                        }}
                        className={
                          "rounded-xl px-3 py-2 text-xs border transition " +
                          (newStart === iso
                            ? "bg-white text-black border-white"
                            : "bg-neutral-950/40 text-neutral-200 border-neutral-800/70 hover:bg-neutral-900/60")
                        }
                      >
                        {fmtHuman(iso)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                variant="primary"
                disabled={!newStart}
                onClick={async () => {
                  if (!newStart) return;
                  try {
                    setBusyId(editAppt.id);
                    await apiRescheduleAppointment(editAppt.id, newStart);
                    haptic("medium");
                    setEditAppt(null);
                    await refresh();
                  } catch (e: any) {
                    const msg = e.message ?? "Ошибка";
                    alert(msg.includes("slot_taken") ? "Слот уже занят. Выберите другой." : msg);
                  } finally {
                    setBusyId(null);
                  }
                }}
              >
                {busyId === editAppt.id ? "Переношу…" : "Подтвердить"}
              </Button>
              <Button variant="ghost" onClick={() => setEditAppt(null)}>
                Закрыть
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="text-sm font-medium">Список</div>
          <div className="muted">Отмена и перенос в один тап</div>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && <div className="text-sm text-neutral-400">Загрузка…</div>}
          {!loading && items.length === 0 && <div className="text-sm text-neutral-400">Пока нет записей.</div>}

          {!loading &&
            items.map((a) => (
              <div key={a.id} className="rounded-3xl border border-neutral-800/70 bg-neutral-950/35 px-4 py-3 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{a.master?.display_name ?? "Мастер"}</div>
                    <div className="text-xs text-neutral-400 truncate">{a.service.title}</div>
                  </div>
                  <Badge tone={a.status === "canceled" ? "bad" : "neutral"}>{a.status}</Badge>
                </div>

                <div className="text-sm">{fmtHuman(a.start_at)}</div>

                <div className="flex gap-2">
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
