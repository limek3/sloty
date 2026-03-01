import React from "react";
import { initTelegramUi, haptic } from "../lib/telegram";
import {
  apiMasterCancelAppointment,
  apiMasterGetWorkingHours,
  apiMasterListAppointments,
  apiMasterListServices,
  apiMasterMe,
  apiMasterSetWorkingHours,
  apiMasterUpsertService,
  apiMasterDeleteService,
  apiMasterUpdateProfile
} from "../lib/api";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import type { Appointment, Master, Service, WorkingHour } from "../lib/types";
import { fmtHuman } from "../lib/time";
import { AppShell } from "../ui/app-shell";
import { Badge } from "../ui/badge";
import { Segmented } from "../ui/segmented";

const weekdays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export function MasterDashboardPage() {
  const [master, setMaster] = React.useState<Master | null>(null);
  const [tab, setTab] = React.useState<"profile" | "services" | "schedule" | "appointments">("appointments");

  const [services, setServices] = React.useState<Service[]>([]);
  const [wh, setWh] = React.useState<WorkingHour[]>([]);
  const [appts, setAppts] = React.useState<Appointment[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [svcForm, setSvcForm] = React.useState<{ id?: string; title: string; duration_min: string; price_rub: string }>({
    title: "",
    duration_min: "60",
    price_rub: "0"
  });

  const [scheduleDraft, setScheduleDraft] = React.useState<Record<number, { start: string; end: string; enabled: boolean }>>(() => {
    const d: any = {};
    for (let i = 0; i < 7; i++) d[i] = { start: "10:00", end: "19:00", enabled: i < 5 };
    return d;
  });

  async function loadAll() {
    setLoading(true);
    try {
      const me = await apiMasterMe();
      setMaster(me.master);

      const [svc, hours, list] = await Promise.all([
        apiMasterListServices(),
        apiMasterGetWorkingHours(),
        apiMasterListAppointments()
      ]);

      setServices(svc.services);
      setWh(hours.working_hours);
      setAppts(list.appointments);

      const next = { ...scheduleDraft };
      for (let i = 0; i < 7; i++) next[i] = { ...next[i], enabled: false };
      for (const r of hours.working_hours) {
        next[r.weekday] = { start: r.start_time.slice(0, 5), end: r.end_time.slice(0, 5), enabled: true };
      }
      setScheduleDraft(next);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    initTelegramUi();
    loadAll().catch((e) => alert(e.message ?? e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveSchedule() {
    const intervals = Object.entries(scheduleDraft)
      .filter(([, v]) => v.enabled)
      .map(([k, v]) => ({ weekday: Number(k), start_time: v.start, end_time: v.end }));

    await apiMasterSetWorkingHours(intervals);
    haptic("medium");
    await loadAll();
  }

  async function saveService() {
    const title = svcForm.title.trim();
    if (!title) return alert("Название обязательно");
    const duration = Number(svcForm.duration_min);
    const price = Number(svcForm.price_rub);
    const res = await apiMasterUpsertService({
      id: svcForm.id,
      title,
      duration_min: Number.isFinite(duration) ? duration : 60,
      price_rub: Number.isFinite(price) ? price : 0,
      is_active: true
    });
    haptic("medium");
    setSvcForm({ title: "", duration_min: "60", price_rub: "0" });
    setServices((prev) => {
      const idx = prev.findIndex((x) => x.id === res.service.id);
      if (idx >= 0) return prev.map((x) => (x.id === res.service.id ? res.service : x));
      return [res.service, ...prev];
    });
  }

  async function cancelAppt(a: Appointment) {
    await apiMasterCancelAppointment(a.id, "Отменено мастером");
    haptic("light");
    await loadAll();
  }

  async function saveProfile(patch: Partial<Pick<Master, "display_name" | "city" | "bio">>) {
    const res = await apiMasterUpdateProfile(patch);
    setMaster(res.master);
    haptic("medium");
  }

  return (
    <AppShell
      subtitle="Кабинет"
      title={master?.display_name ?? "…"}
      right={<Badge>{loading ? "..." : "PRO (MVP)"}</Badge>}
    >
      <div className="muted">{loading ? "Загрузка…" : "Управление услугами, графиком и записями"}</div>

      <Segmented
        value={tab}
        onChange={setTab}
        items={[
          { id: "appointments", label: "Записи" },
          { id: "services", label: "Услуги" },
          { id: "schedule", label: "График" },
          { id: "profile", label: "Профиль" }
        ]}
      />

      {tab === "appointments" && (
        <Card>
          <CardHeader>
            <div className="text-sm font-medium">Записи</div>
            <div className="muted">На ближайшие 14 дней</div>
          </CardHeader>
          <CardContent className="space-y-3">
            {appts.length === 0 && <div className="text-sm text-neutral-400">Пока нет записей.</div>}
            {appts.map((a) => (
              <div key={a.id} className="rounded-3xl border border-neutral-800/70 bg-neutral-950/35 px-4 py-3 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{a.service.title}</div>
                    <div className="text-xs text-neutral-400 truncate">Клиент TG ID: {a.client_tg_user_id}</div>
                  </div>
                  <Badge tone={a.status === "canceled" ? "bad" : "neutral"}>{a.status}</Badge>
                </div>
                <div className="text-sm">{fmtHuman(a.start_at)}</div>

                <Button variant="danger" disabled={a.status === "canceled"} onClick={() => cancelAppt(a)}>
                  {a.status === "canceled" ? "Отменено" : "Отменить"}
                </Button>
              </div>
            ))}

            <Button variant="secondary" onClick={() => loadAll()}>
              Обновить
            </Button>
          </CardContent>
        </Card>
      )}

      {tab === "services" && (
        <Card>
          <CardHeader>
            <div className="text-sm font-medium">Услуги</div>
            <div className="muted">Добавить / редактировать</div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Input value={svcForm.title} onChange={(e) => setSvcForm((p) => ({ ...p, title: e.target.value }))} placeholder="Название услуги" />
              <div className="grid grid-cols-2 gap-2">
                <Input value={svcForm.duration_min} onChange={(e) => setSvcForm((p) => ({ ...p, duration_min: e.target.value }))} placeholder="Длительность (мин)" inputMode="numeric" />
                <Input value={svcForm.price_rub} onChange={(e) => setSvcForm((p) => ({ ...p, price_rub: e.target.value }))} placeholder="Цена (₽)" inputMode="numeric" />
              </div>
              <Button onClick={saveService}>{svcForm.id ? "Сохранить" : "Добавить"}</Button>
            </div>

            <div className="h-px bg-neutral-800/80" />

            {services.length === 0 && <div className="text-sm text-neutral-400">Добавьте первую услугу.</div>}

            {services.map((s) => (
              <div key={s.id} className="rounded-3xl border border-neutral-800/70 bg-neutral-950/35 px-4 py-3 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{s.title}</div>
                    <div className="text-xs text-neutral-400">
                      {s.duration_min} мин • {s.price_rub} ₽
                    </div>
                  </div>
                  {s.is_active === false ? <Badge tone="bad">скрыто</Badge> : null}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => setSvcForm({ id: s.id, title: s.title, duration_min: String(s.duration_min), price_rub: String(s.price_rub) })}
                  >
                    Редактировать
                  </Button>
                  <Button
                    variant="danger"
                    onClick={async () => {
                      await apiMasterDeleteService(s.id);
                      haptic("light");
                      setServices((p) => p.map((x) => (x.id === s.id ? { ...x, is_active: false } : x)));
                    }}
                  >
                    Скрыть
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {tab === "schedule" && (
        <Card>
          <CardHeader>
            <div className="text-sm font-medium">График</div>
            <div className="muted">Один интервал на день (MVP)</div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              {weekdays.map((w, i) => {
                const d = scheduleDraft[i];
                return (
                  <div key={w} className="rounded-3xl border border-neutral-800/70 bg-neutral-950/35 px-4 py-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">{w}</div>
                      <label className="text-xs text-neutral-300 flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={d.enabled}
                          onChange={(e) => setScheduleDraft((p) => ({ ...p, [i]: { ...p[i], enabled: e.target.checked } }))}
                        />
                        Рабочий день
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input type="time" value={d.start} onChange={(e) => setScheduleDraft((p) => ({ ...p, [i]: { ...p[i], start: e.target.value } }))} disabled={!d.enabled} />
                      <Input type="time" value={d.end} onChange={(e) => setScheduleDraft((p) => ({ ...p, [i]: { ...p[i], end: e.target.value } }))} disabled={!d.enabled} />
                    </div>
                  </div>
                );
              })}
            </div>

            <Button onClick={saveSchedule}>Сохранить</Button>
          </CardContent>
        </Card>
      )}

      {tab === "profile" && master && (
        <Card>
          <CardHeader>
            <div className="text-sm font-medium">Профиль</div>
            <div className="muted">Как вас видят клиенты</div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="text-xs text-neutral-400">Имя</div>
              <Input defaultValue={master.display_name} onBlur={(e) => saveProfile({ display_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <div className="text-xs text-neutral-400">Город</div>
              <Input defaultValue={master.city ?? ""} onBlur={(e) => saveProfile({ city: e.target.value || null })} />
            </div>
            <div className="space-y-2">
              <div className="text-xs text-neutral-400">Описание</div>
              <Input defaultValue={master.bio ?? ""} onBlur={(e) => saveProfile({ bio: e.target.value || null })} />
            </div>
            <div className="rounded-3xl border border-neutral-800/70 bg-neutral-950/35 px-4 py-3 text-xs text-neutral-400">
              masterId: <span className="text-neutral-200">{master.id}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
}
