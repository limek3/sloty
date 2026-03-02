// apps/web/src/pages/master-dashboard.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import {
  apiMasterListAppointments,
  apiMasterListServices,
  apiMasterMe
} from "../lib/api";
import { initTelegramUi, haptic } from "../lib/telegram";
import { fmtHuman, ymd, ymdTodayUtc } from "../lib/time";
import type { Appointment, Master, Service } from "../lib/types";
import { AppShell } from "../ui/app-shell";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { Badge } from "../ui/badge";
import { Segmented } from "../ui/segmented";

type Tab = "bookings" | "calendar" | "clients";
type Scope = "day" | "week";

type ClientItem = {
  tgId: number;
  name: string;
  phone?: string;
  lastVisitIso?: string;
  visits: number;
};

function todayTitleRu(): string {
  const d = new Date();
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" }).format(d);
}

function buildClients(appts: Appointment[]): ClientItem[] {
  const map = new Map<number, ClientItem>();
  for (const a of appts) {
    const id = a.client_tg_user_id ?? 0;
    if (!id) continue;
    const cur = map.get(id) ?? { tgId: id, name: `TG ${id}`, visits: 0 };
    cur.visits += 1;
    const ts = a.start_at;
    if (!cur.lastVisitIso || new Date(ts).getTime() > new Date(cur.lastVisitIso).getTime()) cur.lastVisitIso = ts;
    map.set(id, cur);
  }
  return Array.from(map.values()).sort((a, b) => (b.lastVisitIso ? Date.parse(b.lastVisitIso) : 0) - (a.lastVisitIso ? Date.parse(a.lastVisitIso) : 0));
}

function InternalTabbar(props: { value: Tab; onChange: (t: Tab) => void; onNew: () => void }) {
  const items: { id: Tab; label: string }[] = [
    { id: "bookings", label: "Записи" },
    { id: "calendar", label: "Календарь" },
    { id: "clients", label: "Клиенты" }
  ];

  return (
    <div
      className="fixed left-0 right-0 bottom-0 z-40"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto max-w-md px-4 pb-4">
        <div
          className="px-2 py-2"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 26,
            boxShadow: "var(--shadow)",
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            gap: 8,
            alignItems: "center"
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6 }}>
            {items.slice(0, 2).map((it) => {
              const active = props.value === it.id;
              return (
                <button
                  key={it.id}
                  onClick={() => props.onChange(it.id)}
                  className="py-2 text-xs font-semibold transition"
                  style={{
                    borderRadius: 18,
                    background: active ? "var(--accent-weak)" : "transparent",
                    border: active ? "1px solid rgba(47,102,255,0.22)" : "1px solid transparent",
                    color: active ? "var(--accent)" : "var(--muted)"
                  }}
                >
                  {it.label}
                </button>
              );
            })}
          </div>

          <button
            onClick={props.onNew}
            className="px-4 py-3 text-sm font-semibold transition active:scale-[0.99]"
            style={{
              borderRadius: 18,
              background: "var(--accent)",
              color: "var(--accent-fg)",
              border: "1px solid rgba(47,102,255,0.22)",
              boxShadow: "0 10px 24px rgba(47,102,255,0.22)"
            }}
            aria-label="Новая запись"
            title="Новая запись"
          >
            ＋
          </button>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 6 }}>
            {items.slice(2).map((it) => {
              const active = props.value === it.id;
              return (
                <button
                  key={it.id}
                  onClick={() => props.onChange(it.id)}
                  className="py-2 text-xs font-semibold transition"
                  style={{
                    borderRadius: 18,
                    background: active ? "var(--accent-weak)" : "transparent",
                    border: active ? "1px solid rgba(47,102,255,0.22)" : "1px solid transparent",
                    color: active ? "var(--accent)" : "var(--muted)"
                  }}
                >
                  {it.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export function MasterDashboardPage() {
  const nav = useNavigate();

  const [master, setMaster] = React.useState<Master | null>(null);
  const [services, setServices] = React.useState<Service[]>([]);
  const [appts, setAppts] = React.useState<Appointment[]>([]);
  const [clients, setClients] = React.useState<ClientItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [tab, setTab] = React.useState<Tab>("bookings");
  const [scope, setScope] = React.useState<Scope>("day");

  // New booking (screen like reference)
  const [mode, setMode] = React.useState<"main" | "new">("main");
  const [clientId, setClientId] = React.useState<string>("");
  const [serviceId, setServiceId] = React.useState<string>("");
  const [fromDate, setFromDate] = React.useState(ymdTodayUtc());
  const [slotDay, setSlotDay] = React.useState(ymdTodayUtc());
  const [slotTimeIso, setSlotTimeIso] = React.useState<string>("");
  const [shareUrl, setShareUrl] = React.useState<string>("");

  const [clientSearch, setClientSearch] = React.useState("");

  async function loadAll() {
    setLoading(true);
    try {
      const me = await apiMasterMe();
      setMaster(me.master);

      const [svc, list] = await Promise.all([apiMasterListServices(), apiMasterListAppointments()]);
      setServices(svc.services);
      setAppts(list.appointments);

      const cls = buildClients(list.appointments);
      setClients(cls);

      if (!serviceId && svc.services[0]?.id) setServiceId(svc.services[0].id);
      if (!clientId && cls[0]?.tgId) setClientId(String(cls[0].tgId));
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    initTelegramUi();
    loadAll().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredClients = clients.filter((c) => {
    const q = clientSearch.trim().toLowerCase();
    if (!q) return true;
    return String(c.tgId).includes(q) || (c.name ?? "").toLowerCase().includes(q);
  });

  function openNew() {
    setMode("new");
    setTab("bookings");
    setShareUrl("");
    setSlotTimeIso("");
    setFromDate(ymdTodayUtc());
    setSlotDay(ymdTodayUtc());
    haptic("light");
  }

  function closeNew() {
    setMode("main");
    setShareUrl("");
    setSlotTimeIso("");
    haptic("light");
  }

  function makeShareLink() {
    if (!master) return;
    // функционально: мастер выбирает услугу/дату/время -> отправляет клиенту ссылку
    // клиент откроет страницу мастера и увидит нужную услугу/неделю (и выберет слот)
    const base = window.location.origin;
    const url = new URL(`${base}/m/${master.id}`);
    if (serviceId) url.searchParams.set("serviceId", serviceId);
    if (fromDate) url.searchParams.set("fromDate", fromDate);
    if (slotTimeIso) url.searchParams.set("hint", slotTimeIso); // мягкая подсказка (UI можно позже подсветить)
    setShareUrl(url.toString());
  }

  async function copyOrShare(url: string) {
    haptic("light");
    try {
      if ((navigator as any).share) await (navigator as any).share({ url, title: "Запись" });
      else await navigator.clipboard.writeText(url);
    } catch {
      // ignore
    }
  }

  const todayYmd = ymdTodayUtc();

  return (
    <AppShell
      subtitle={`Сегодня, ${todayTitleRu()}`}
      title={mode === "new" ? "Новая запись" : "Кабинет"}
      right={
        mode === "new" ? (
          <Button full={false} size="sm" variant="secondary" onClick={closeNew}>
            Закрыть
          </Button>
        ) : (
          <Button full={false} size="sm" variant="secondary" onClick={() => loadAll()}>
            Обновить
          </Button>
        )
      }
    >
      <div className="tabbar-safe space-y-4">
        {/* MODE: NEW BOOKING */}
        {mode === "new" && (
          <Card>
            <CardHeader>
              <div className="text-sm font-semibold">Новая запись</div>
              <div className="muted">Сформируйте ссылку и отправьте клиенту в TG</div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="muted">Клиент</div>
                <Select value={clientId} onChange={(e) => setClientId(e.target.value)}>
                  {clients.length === 0 && <option value="">Нет клиентов</option>}
                  {clients.map((c) => (
                    <option key={c.tgId} value={String(c.tgId)}>
                      {c.name} • {c.tgId}
                    </option>
                  ))}
                </Select>
              </div>

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
                <div className="muted">Дата (старт)</div>
                <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              </div>

              <div className="surface-soft p-4 space-y-2">
                <div className="text-sm font-semibold">Подсказка времени</div>
                <div className="muted">Можно выбрать конкретное время (для удобства), но клиент подтвердит сам.</div>
                <Input
                  type="datetime-local"
                  value={slotTimeIso ? slotTimeIso.slice(0, 16) : ""}
                  onChange={(e) => setSlotTimeIso(e.target.value ? new Date(e.target.value).toISOString() : "")}
                />
              </div>

              <Button
                onClick={() => {
                  makeShareLink();
                  haptic("medium");
                }}
              >
                Сформировать ссылку
              </Button>

              {shareUrl && (
                <div className="surface-soft p-4 space-y-2">
                  <div className="text-sm font-semibold">Ссылка для клиента</div>
                  <div className="muted" style={{ wordBreak: "break-all" }}>
                    {shareUrl}
                  </div>
                  <div className="flex gap-2">
                    <Button full={false} size="sm" variant="secondary" onClick={() => copyOrShare(shareUrl)}>
                      Share / Copy
                    </Button>
                    <Button full={false} size="sm" variant="ghost" onClick={() => nav(`/m/${master?.id ?? ""}`)}>
                      Открыть
                    </Button>
                  </div>
                </div>
              )}

              <div className="muted">
                Следующий шаг (улучшим): “создать запись вручную” прямо из кабинета + авто-уведомление клиенту.
              </div>
            </CardContent>
          </Card>
        )}

        {/* MODE: MAIN */}
        {mode === "main" && (
          <>
            {/* Tabs header-like line */}
            <div className="flex items-center justify-between">
              <div className="muted">
                {tab === "bookings" ? "Записи" : tab === "calendar" ? "Календарь" : "Клиенты"}
              </div>
              <Badge tone="accent">{loading ? "…" : "PRO UI"}</Badge>
            </div>

            {tab === "bookings" && (
              <>
                <Segmented
                  value={scope}
                  onChange={setScope}
                  items={[
                    { id: "day", label: "День" },
                    { id: "week", label: "Неделя" }
                  ]}
                />

                <Card>
                  <CardHeader>
                    <div className="text-sm font-semibold">{scope === "day" ? "Сегодня" : "Неделя"}</div>
                    <div className="muted">
                      Записей: {appts.length} • Подтверждено: {appts.filter((a) => a.status === "confirmed").length} • Отмен:{" "}
                      {appts.filter((a) => a.status === "canceled").length}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {loading && <div className="muted">Загрузка…</div>}
                    {!loading && appts.length === 0 && <div className="muted">Пока нет записей.</div>}

                    {/* Day list */}
                    {!loading && scope === "day" && (
                      <div className="space-y-2">
                        {appts
                          .slice()
                          .sort((a, b) => Date.parse(a.start_at) - Date.parse(b.start_at))
                          .map((a) => (
                            <div
                              key={a.id}
                              className="px-4 py-3"
                              style={{
                                background: "var(--surface)",
                                border: "1px solid var(--border)",
                                borderRadius: 18
                              }}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="text-sm font-semibold">{fmtHuman(a.start_at).split(", ").slice(-1)[0]}</div>
                                  <div className="text-sm font-semibold truncate">{a.client_tg_user_id ? `Клиент TG ${a.client_tg_user_id}` : "Клиент"}</div>
                                  <div className="muted">{a.service.title}</div>
                                </div>
                                <Badge tone={a.status === "confirmed" ? "good" : a.status === "pending" ? "warn" : a.status === "canceled" ? "bad" : "neutral"}>
                                  {a.status === "confirmed" ? "Подтверждено" : a.status}
                                </Badge>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}

                    {/* Week view (MVP, красиво) */}
                    {!loading && scope === "week" && (
                      <div className="surface-soft p-4">
                        <div className="text-sm font-semibold">Неделя</div>
                        <div className="muted">Сделаю полноценную сетку “день/время” следующим шагом.</div>
                        <div className="mt-3 grid grid-cols-7 gap-2">
                          {Array.from({ length: 7 }).map((_, i) => (
                            <div
                              key={i}
                              className="py-2 text-center text-xs font-semibold"
                              style={{
                                borderRadius: 14,
                                background: "var(--surface)",
                                border: "1px solid var(--border)",
                                color: "var(--muted)"
                              }}
                            >
                              {i + 1}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            {tab === "calendar" && (
              <Card>
                <CardHeader>
                  <div className="text-sm font-semibold">Календарь</div>
                  <div className="muted">MVP: быстрый обзор. Дальше сделаем полноценный календарь как на iOS.</div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="surface-soft p-4">
                    <div className="text-sm font-semibold">Сегодня</div>
                    <div className="muted">{todayYmd}</div>
                  </div>
                  <Button onClick={openNew}>Новая запись</Button>
                </CardContent>
              </Card>
            )}

            {tab === "clients" && (
              <Card>
                <CardHeader>
                  <div className="text-sm font-semibold">Клиенты</div>
                  <div className="muted">Поиск и история визитов</div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} placeholder="Поиск" />

                  {filteredClients.length === 0 && <div className="muted">Пока нет клиентов.</div>}

                  <div className="space-y-2">
                    {filteredClients.map((c) => (
                      <div
                        key={c.tgId}
                        className="px-4 py-3"
                        style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18 }}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold truncate">{c.name}</div>
                            <div className="muted">Последний визит: {c.lastVisitIso ? fmtHuman(c.lastVisitIso) : "—"}</div>
                          </div>
                          <Badge tone="neutral">{c.visits}</Badge>
                        </div>

                        <div className="mt-3 flex gap-2">
                          <Button full={false} size="sm" variant="secondary" onClick={() => { setClientId(String(c.tgId)); openNew(); }}>
                            Новая запись
                          </Button>
                          <Button full={false} size="sm" variant="ghost" onClick={() => copyOrShare(`tg://user?id=${c.tgId}`)}>
                            TG
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Internal master tabbar like reference */}
      <InternalTabbar
        value={tab}
        onChange={(t) => {
          setTab(t);
          if (mode !== "main") setMode("main");
          haptic("light");
        }}
        onNew={() => openNew()}
      />
    </AppShell>
  );
}