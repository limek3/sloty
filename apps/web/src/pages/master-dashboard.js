import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React from "react";
import { apiMasterListAppointments, apiMasterListServices, apiMasterMe } from "../lib/api";
import { initTelegramUi, haptic } from "../lib/telegram";
import { fmtHuman, ymdTodayUtc } from "../lib/time";
import { AppShell } from "../ui/app-shell";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { Badge } from "../ui/badge";
import { Segmented } from "../ui/segmented";
function todayTitleRu() {
    const d = new Date();
    return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" }).format(d);
}
function buildClients(appts) {
    const map = new Map();
    for (const a of appts) {
        const id = a.client_tg_user_id ?? 0;
        if (!id)
            continue;
        const cur = map.get(id) ?? { tgId: id, name: `TG ${id}`, visits: 0 };
        cur.visits += 1;
        const ts = a.start_at;
        if (!cur.lastVisitIso || new Date(ts).getTime() > new Date(cur.lastVisitIso).getTime())
            cur.lastVisitIso = ts;
        map.set(id, cur);
    }
    return Array.from(map.values()).sort((a, b) => (b.lastVisitIso ? Date.parse(b.lastVisitIso) : 0) - (a.lastVisitIso ? Date.parse(a.lastVisitIso) : 0));
}
function InternalTabbar(props) {
    const items = [
        { id: "bookings", label: "Записи" },
        { id: "calendar", label: "Календарь" },
        { id: "clients", label: "Клиенты" }
    ];
    return (_jsx("div", { className: "fixed left-0 right-0 bottom-0 z-40", style: { paddingBottom: "env(safe-area-inset-bottom)" }, children: _jsx("div", { className: "mx-auto max-w-md px-4 pb-4", children: _jsxs("div", { className: "px-2 py-2", style: {
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 26,
                    boxShadow: "var(--shadow)",
                    display: "grid",
                    gridTemplateColumns: "1fr auto 1fr",
                    gap: 8,
                    alignItems: "center"
                }, children: [_jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6 }, children: items.slice(0, 2).map((it) => {
                            const active = props.value === it.id;
                            return (_jsx("button", { onClick: () => props.onChange(it.id), className: "py-2 text-xs font-semibold transition", style: {
                                    borderRadius: 18,
                                    background: active ? "var(--accent-weak)" : "transparent",
                                    border: active ? "1px solid rgba(47,102,255,0.22)" : "1px solid transparent",
                                    color: active ? "var(--accent)" : "var(--muted)"
                                }, children: it.label }, it.id));
                        }) }), _jsx("button", { onClick: props.onNew, className: "px-4 py-3 text-sm font-semibold transition active:scale-[0.99]", style: {
                            borderRadius: 18,
                            background: "var(--accent)",
                            color: "var(--accent-fg)",
                            border: "1px solid rgba(47,102,255,0.22)",
                            boxShadow: "0 10px 24px rgba(47,102,255,0.22)"
                        }, "aria-label": "\u041D\u043E\u0432\u0430\u044F \u0437\u0430\u043F\u0438\u0441\u044C", title: "\u041D\u043E\u0432\u0430\u044F \u0437\u0430\u043F\u0438\u0441\u044C", children: "\uFF0B" }), _jsx("div", { style: { display: "grid", gridTemplateColumns: "1fr", gap: 6 }, children: items.slice(2).map((it) => {
                            const active = props.value === it.id;
                            return (_jsx("button", { onClick: () => props.onChange(it.id), className: "py-2 text-xs font-semibold transition", style: {
                                    borderRadius: 18,
                                    background: active ? "var(--accent-weak)" : "transparent",
                                    border: active ? "1px solid rgba(47,102,255,0.22)" : "1px solid transparent",
                                    color: active ? "var(--accent)" : "var(--muted)"
                                }, children: it.label }, it.id));
                        }) })] }) }) }));
}
export function MasterDashboardPage() {
    const [master, setMaster] = React.useState(null);
    const [services, setServices] = React.useState([]);
    const [appts, setAppts] = React.useState([]);
    const [clients, setClients] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [tab, setTab] = React.useState("bookings");
    const [scope, setScope] = React.useState("day");
    const [mode, setMode] = React.useState("main");
    const [clientId, setClientId] = React.useState("");
    const [serviceId, setServiceId] = React.useState("");
    const [fromDate, setFromDate] = React.useState(ymdTodayUtc());
    const [hintIso, setHintIso] = React.useState("");
    const [shareUrl, setShareUrl] = React.useState("");
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
            if (!serviceId && svc.services[0]?.id)
                setServiceId(svc.services[0].id);
            if (!clientId && cls[0]?.tgId)
                setClientId(String(cls[0].tgId));
        }
        finally {
            setLoading(false);
        }
    }
    React.useEffect(() => {
        initTelegramUi();
        loadAll().catch(() => { });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const filteredClients = clients.filter((c) => {
        const q = clientSearch.trim().toLowerCase();
        if (!q)
            return true;
        return String(c.tgId).includes(q) || c.name.toLowerCase().includes(q);
    });
    function openNew() {
        setMode("new");
        setShareUrl("");
        setHintIso("");
        setFromDate(ymdTodayUtc());
        haptic("light");
    }
    function closeNew() {
        setMode("main");
        setShareUrl("");
        setHintIso("");
        haptic("light");
    }
    function makeShareLink() {
        if (!master)
            return;
        const base = window.location.origin;
        const url = new URL(`${base}/m/${master.id}`);
        if (serviceId)
            url.searchParams.set("serviceId", serviceId);
        if (fromDate)
            url.searchParams.set("fromDate", fromDate);
        if (hintIso)
            url.searchParams.set("hint", hintIso);
        setShareUrl(url.toString());
        haptic("medium");
    }
    async function copyOrShare(url) {
        try {
            if (navigator.share)
                await navigator.share({ url, title: "Запись" });
            else
                await navigator.clipboard.writeText(url);
            haptic("light");
        }
        catch {
            // ignore
        }
    }
    return (_jsxs(AppShell, { subtitle: `Сегодня, ${todayTitleRu()}`, title: mode === "new" ? "Новая запись" : "Кабинет", right: mode === "new" ? (_jsx(Button, { full: false, size: "sm", variant: "secondary", onClick: closeNew, children: "\u0417\u0430\u043A\u0440\u044B\u0442\u044C" })) : (_jsx(Button, { full: false, size: "sm", variant: "secondary", onClick: () => loadAll(), children: "\u041E\u0431\u043D\u043E\u0432\u0438\u0442\u044C" })), children: [_jsxs("div", { className: "tabbar-safe space-y-4", children: [mode === "new" && (_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx("div", { className: "text-sm font-semibold", children: "\u041D\u043E\u0432\u0430\u044F \u0437\u0430\u043F\u0438\u0441\u044C" }), _jsx("div", { className: "muted", children: "\u0421\u0444\u043E\u0440\u043C\u0438\u0440\u0443\u0439\u0442\u0435 \u0441\u0441\u044B\u043B\u043A\u0443 \u0438 \u043E\u0442\u043F\u0440\u0430\u0432\u044C\u0442\u0435 \u043A\u043B\u0438\u0435\u043D\u0442\u0443 \u0432 TG" })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("div", { className: "muted", children: "\u041A\u043B\u0438\u0435\u043D\u0442" }), _jsxs(Select, { value: clientId, onChange: (e) => setClientId(e.target.value), children: [clients.length === 0 && _jsx("option", { value: "", children: "\u041D\u0435\u0442 \u043A\u043B\u0438\u0435\u043D\u0442\u043E\u0432" }), clients.map((c) => (_jsxs("option", { value: String(c.tgId), children: [c.name, " \u2022 ", c.tgId] }, c.tgId)))] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("div", { className: "muted", children: "\u0423\u0441\u043B\u0443\u0433\u0430" }), _jsx(Select, { value: serviceId, onChange: (e) => setServiceId(e.target.value), children: services.map((s) => (_jsxs("option", { value: s.id, children: [s.title, " \u2022 ", s.duration_min, " \u043C\u0438\u043D \u2022 ", s.price_rub, " \u20BD"] }, s.id))) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("div", { className: "muted", children: "\u0414\u0430\u0442\u0430 (\u0441\u0442\u0430\u0440\u0442 \u043D\u0435\u0434\u0435\u043B\u0438)" }), _jsx(Input, { type: "date", value: fromDate, onChange: (e) => setFromDate(e.target.value) })] }), _jsxs("div", { className: "surface-soft p-4 space-y-2", children: [_jsx("div", { className: "text-sm font-semibold", children: "\u041F\u043E\u0434\u0441\u043A\u0430\u0437\u043A\u0430 \u0432\u0440\u0435\u043C\u0435\u043D\u0438" }), _jsx("div", { className: "muted", children: "\u041C\u043E\u0436\u043D\u043E \u0437\u0430\u0434\u0430\u0442\u044C \u201C\u043F\u0440\u0435\u0434\u043B\u0430\u0433\u0430\u0435\u043C\u043E\u0435 \u0432\u0440\u0435\u043C\u044F\u201D \u2014 \u043A\u043B\u0438\u0435\u043D\u0442 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442 \u0432 \u043C\u0438\u043D\u0438-\u0430\u043F\u043F\u0435." }), _jsx(Input, { type: "datetime-local", value: hintIso ? hintIso.slice(0, 16) : "", onChange: (e) => {
                                                    setHintIso(e.target.value ? new Date(e.target.value).toISOString() : "");
                                                } })] }), _jsx(Button, { onClick: makeShareLink, children: "\u0421\u0444\u043E\u0440\u043C\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0441\u0441\u044B\u043B\u043A\u0443" }), shareUrl && (_jsxs("div", { className: "surface-soft p-4 space-y-2", children: [_jsx("div", { className: "text-sm font-semibold", children: "\u0421\u0441\u044B\u043B\u043A\u0430" }), _jsx("div", { className: "muted", style: { wordBreak: "break-all" }, children: shareUrl }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { full: false, size: "sm", variant: "secondary", onClick: () => copyOrShare(shareUrl), children: "Share / Copy" }), _jsx(Button, { full: false, size: "sm", variant: "ghost", onClick: () => window.open(shareUrl, "_blank"), children: "\u041E\u0442\u043A\u0440\u044B\u0442\u044C" })] })] }))] })] })), mode === "main" && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("div", { className: "muted", children: tab === "bookings" ? "Записи" : tab === "calendar" ? "Календарь" : "Клиенты" }), _jsx(Badge, { tone: "accent", children: loading ? "…" : "PRO UI" })] }), tab === "bookings" && (_jsxs(_Fragment, { children: [_jsx(Segmented, { value: scope, onChange: setScope, items: [
                                            { id: "day", label: "День" },
                                            { id: "week", label: "Неделя" }
                                        ] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx("div", { className: "text-sm font-semibold", children: scope === "day" ? "Сегодня" : "Неделя" }), _jsxs("div", { className: "muted", children: ["\u0417\u0430\u043F\u0438\u0441\u0435\u0439: ", appts.length, " \u2022 \u041F\u043E\u0434\u0442\u0432: ", appts.filter((a) => a.status === "confirmed").length, " \u2022 \u041E\u0442\u043C\u0435\u043D:", " ", appts.filter((a) => a.status === "canceled").length] })] }), _jsxs(CardContent, { className: "space-y-2", children: [loading && _jsx("div", { className: "muted", children: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430\u2026" }), !loading && appts.length === 0 && _jsx("div", { className: "muted", children: "\u041F\u043E\u043A\u0430 \u043D\u0435\u0442 \u0437\u0430\u043F\u0438\u0441\u0435\u0439." }), !loading && scope === "day" && (_jsx("div", { className: "space-y-2", children: appts
                                                            .slice()
                                                            .sort((a, b) => Date.parse(a.start_at) - Date.parse(b.start_at))
                                                            .map((a) => (_jsx("div", { className: "px-4 py-3", style: {
                                                                background: "var(--surface)",
                                                                border: "1px solid var(--border)",
                                                                borderRadius: 18
                                                            }, children: _jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "text-sm font-semibold", children: fmtHuman(a.start_at).split(", ").slice(-1)[0] }), _jsx("div", { className: "text-sm font-semibold truncate", children: a.client_tg_user_id ? `Клиент TG ${a.client_tg_user_id}` : "Клиент" }), _jsx("div", { className: "muted", children: a.service.title })] }), _jsx(Badge, { tone: a.status === "confirmed"
                                                                            ? "good"
                                                                            : a.status === "pending"
                                                                                ? "warn"
                                                                                : a.status === "canceled"
                                                                                    ? "bad"
                                                                                    : "neutral", children: a.status === "confirmed" ? "Подтверждено" : a.status })] }) }, a.id))) })), !loading && scope === "week" && (_jsxs("div", { className: "surface-soft p-4", children: [_jsx("div", { className: "text-sm font-semibold", children: "\u041D\u0435\u0434\u0435\u043B\u044F" }), _jsx("div", { className: "muted", children: "\u0421\u043B\u0435\u0434\u0443\u044E\u0449\u0438\u043C \u0448\u0430\u0433\u043E\u043C \u0441\u0434\u0435\u043B\u0430\u0435\u043C \u043F\u043E\u043B\u043D\u043E\u0446\u0435\u043D\u043D\u0443\u044E \u0441\u0435\u0442\u043A\u0443 \u201C\u0434\u0435\u043D\u044C/\u0432\u0440\u0435\u043C\u044F\u201D \u043A\u0430\u043A \u0432 \u0440\u0435\u0444\u0435\u0440\u0435\u043D\u0441\u0435." })] }))] })] })] })), tab === "calendar" && (_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx("div", { className: "text-sm font-semibold", children: "\u041A\u0430\u043B\u0435\u043D\u0434\u0430\u0440\u044C" }), _jsx("div", { className: "muted", children: "MVP \u044D\u043A\u0440\u0430\u043D. \u0414\u0430\u043B\u044C\u0448\u0435 \u0441\u0434\u0435\u043B\u0430\u0435\u043C \u043A\u0430\u043A iOS." })] }), _jsxs(CardContent, { className: "space-y-3", children: [_jsxs("div", { className: "surface-soft p-4", children: [_jsx("div", { className: "text-sm font-semibold", children: "\u0421\u0435\u0433\u043E\u0434\u043D\u044F" }), _jsx("div", { className: "muted", children: ymdTodayUtc() })] }), _jsx(Button, { onClick: openNew, children: "\u041D\u043E\u0432\u0430\u044F \u0437\u0430\u043F\u0438\u0441\u044C" })] })] })), tab === "clients" && (_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx("div", { className: "text-sm font-semibold", children: "\u041A\u043B\u0438\u0435\u043D\u0442\u044B" }), _jsx("div", { className: "muted", children: "\u041F\u043E\u0438\u0441\u043A \u0438 \u0438\u0441\u0442\u043E\u0440\u0438\u044F \u0432\u0438\u0437\u0438\u0442\u043E\u0432" })] }), _jsxs(CardContent, { className: "space-y-3", children: [_jsx(Input, { value: clientSearch, onChange: (e) => setClientSearch(e.target.value), placeholder: "\u041F\u043E\u0438\u0441\u043A" }), filteredClients.length === 0 && _jsx("div", { className: "muted", children: "\u041F\u043E\u043A\u0430 \u043D\u0435\u0442 \u043A\u043B\u0438\u0435\u043D\u0442\u043E\u0432." }), _jsx("div", { className: "space-y-2", children: filteredClients.map((c) => (_jsxs("div", { className: "px-4 py-3", style: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18 }, children: [_jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "text-sm font-semibold truncate", children: c.name }), _jsxs("div", { className: "muted", children: ["\u041F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0439 \u0432\u0438\u0437\u0438\u0442: ", c.lastVisitIso ? fmtHuman(c.lastVisitIso) : "—"] })] }), _jsx(Badge, { tone: "neutral", children: c.visits })] }), _jsx("div", { className: "mt-3 flex gap-2", children: _jsx(Button, { full: false, size: "sm", variant: "secondary", onClick: () => {
                                                                    setClientId(String(c.tgId));
                                                                    openNew();
                                                                }, children: "\u041D\u043E\u0432\u0430\u044F \u0437\u0430\u043F\u0438\u0441\u044C" }) })] }, c.tgId))) })] })] }))] }))] }), _jsx(InternalTabbar, { value: tab, onChange: (t) => {
                    setTab(t);
                    if (mode !== "main")
                        setMode("main");
                    haptic("light");
                }, onNew: openNew })] }));
}
