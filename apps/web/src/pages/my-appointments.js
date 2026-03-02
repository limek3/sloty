import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// apps/web/src/pages/my-appointments.tsx
import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiCancelAppointment, apiGetSlots, apiMyAppointments, apiRescheduleAppointment } from "../lib/api";
import { haptic, initTelegramUi } from "../lib/telegram";
import { fmtHuman, ymd, ymdTodayUtc } from "../lib/time";
import { AppShell } from "../ui/app-shell";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
export function MyAppointmentsPage() {
    const nav = useNavigate();
    const [sp] = useSearchParams();
    const createdId = sp.get("created");
    const [items, setItems] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [busyId, setBusyId] = React.useState(null);
    const [editAppt, setEditAppt] = React.useState(null);
    const [slots, setSlots] = React.useState({});
    const [fromDate, setFromDate] = React.useState(ymdTodayUtc());
    const [newStart, setNewStart] = React.useState("");
    const [error, setError] = React.useState(null);
    async function refresh() {
        setLoading(true);
        try {
            setError(null);
            const res = await apiMyAppointments();
            setItems(res.appointments);
        }
        catch (e) {
            setError(e?.message ?? "Ошибка");
        }
        finally {
            setLoading(false);
        }
    }
    React.useEffect(() => {
        initTelegramUi();
        refresh();
    }, []);
    async function openReschedule(a) {
        setEditAppt(a);
        setNewStart("");
        setFromDate(ymd(a.start_at));
        const mId = a.master?.id;
        if (!mId)
            return;
        const res = await apiGetSlots({ masterId: mId, serviceId: a.service.id, fromDate: ymd(a.start_at), days: 7 });
        setSlots(res.slots);
    }
    const toneFor = (status) => status === "confirmed" ? "good" : status === "pending" ? "warn" : status === "canceled" ? "bad" : "neutral";
    return (_jsxs(AppShell, { subtitle: "\u041F\u0440\u043E\u0444\u0438\u043B\u044C", title: "\u041C\u043E\u0438 \u0437\u0430\u043F\u0438\u0441\u0438", right: _jsx("button", { style: { color: "var(--muted)", fontSize: 14 }, onClick: () => refresh(), children: "\u041E\u0431\u043D\u043E\u0432\u0438\u0442\u044C" }), children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("button", { style: { color: "var(--muted)", fontSize: 14 }, onClick: () => nav(-1), children: "\u2190 \u041D\u0430\u0437\u0430\u0434" }), _jsxs(Badge, { tone: "neutral", children: [items.length, " \u0437\u0430\u043F\u0438\u0441\u0435\u0439"] })] }), createdId && (_jsx("div", { className: "surface px-4 py-3 text-sm", style: { borderRadius: 18, borderColor: "rgba(18,183,106,0.22)" }, children: "\u0417\u0430\u043F\u0438\u0441\u044C \u0441\u043E\u0437\u0434\u0430\u043D\u0430 \u2705" })), error && _jsx("div", { className: "text-sm", style: { color: "var(--danger)" }, children: error }), editAppt && (_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx("div", { className: "text-sm font-semibold", children: "\u041F\u0435\u0440\u0435\u043D\u043E\u0441" }), _jsxs("div", { className: "muted", children: [editAppt.master?.display_name, " \u2022 ", editAppt.service.title] })] }), _jsxs(CardContent, { className: "space-y-3", children: [_jsx("div", { className: "muted", children: "\u041D\u043E\u0432\u0430\u044F \u0434\u0430\u0442\u0430" }), _jsx(Input, { type: "date", value: fromDate, onChange: async (e) => {
                                    const v = e.target.value;
                                    setFromDate(v);
                                    const mId = editAppt.master?.id;
                                    if (!mId)
                                        return;
                                    const res = await apiGetSlots({ masterId: mId, serviceId: editAppt.service.id, fromDate: v, days: 7 });
                                    setSlots(res.slots);
                                    setNewStart("");
                                } }), _jsx("div", { className: "space-y-2 max-h-[320px] overflow-auto pr-1", children: Object.keys(slots).map((d) => (_jsxs("div", { className: "surface-soft", style: { padding: 10 }, children: [_jsx("div", { className: "muted", style: { fontSize: 12, marginBottom: 8 }, children: d }), _jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }, children: (slots[d] ?? []).slice(0, 24).map((iso) => {
                                                const active = newStart === iso;
                                                return (_jsx("button", { onClick: () => { haptic("light"); setNewStart(iso); }, className: "py-3 text-xs font-semibold transition", style: {
                                                        borderRadius: 16,
                                                        border: `1px solid ${active ? "rgba(47,102,255,0.38)" : "var(--border)"}`,
                                                        background: active ? "var(--accent)" : "var(--surface)",
                                                        color: active ? "var(--accent-fg)" : "var(--text)"
                                                    }, children: fmtHuman(iso).split(", ").slice(-1)[0] }, iso));
                                            }) })] }, d))) }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { disabled: !newStart || busyId === editAppt.id, onClick: async () => {
                                            if (!newStart)
                                                return;
                                            try {
                                                setBusyId(editAppt.id);
                                                await apiRescheduleAppointment(editAppt.id, newStart);
                                                haptic("medium");
                                                setEditAppt(null);
                                                await refresh();
                                            }
                                            catch (e) {
                                                const msg = e?.message ?? "Ошибка";
                                                setError(msg.includes("slot_taken") ? "Слот уже занят. Выберите другой." : msg);
                                            }
                                            finally {
                                                setBusyId(null);
                                            }
                                        }, children: busyId === editAppt.id ? "Переношу…" : "Подтвердить" }), _jsx(Button, { variant: "secondary", onClick: () => setEditAppt(null), children: "\u0417\u0430\u043A\u0440\u044B\u0442\u044C" })] })] })] })), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx("div", { className: "text-sm font-semibold", children: "\u0421\u043F\u0438\u0441\u043E\u043A" }), _jsx("div", { className: "muted", children: "\u041E\u0442\u043C\u0435\u043D\u0430 \u0438 \u043F\u0435\u0440\u0435\u043D\u043E\u0441" })] }), _jsxs(CardContent, { className: "space-y-2", children: [loading && _jsx("div", { className: "muted", children: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430\u2026" }), !loading && items.length === 0 && _jsx("div", { className: "muted", children: "\u041F\u043E\u043A\u0430 \u043D\u0435\u0442 \u0437\u0430\u043F\u0438\u0441\u0435\u0439." }), !loading &&
                                items.map((a) => (_jsxs("div", { className: "surface", style: { padding: 14, borderRadius: 18 }, children: [_jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "text-sm font-semibold truncate", children: a.master?.display_name ?? "Мастер" }), _jsx("div", { className: "muted", children: a.service.title })] }), _jsx(Badge, { tone: toneFor(a.status), children: a.status })] }), _jsx("div", { className: "text-sm mt-2", children: fmtHuman(a.start_at) }), _jsxs("div", { className: "flex gap-2 mt-3", children: [_jsx(Button, { variant: "secondary", disabled: busyId === a.id || a.status === "canceled", onClick: () => openReschedule(a), children: "\u041F\u0435\u0440\u0435\u043D\u0435\u0441\u0442\u0438" }), _jsx(Button, { variant: "danger", disabled: busyId === a.id || a.status === "canceled", onClick: async () => {
                                                        try {
                                                            setBusyId(a.id);
                                                            await apiCancelAppointment(a.id, "Отменено клиентом");
                                                            haptic("light");
                                                            await refresh();
                                                        }
                                                        finally {
                                                            setBusyId(null);
                                                        }
                                                    }, children: a.status === "canceled" ? "Отменено" : busyId === a.id ? "Отменяю…" : "Отменить" })] })] }, a.id)))] })] })] }));
}
