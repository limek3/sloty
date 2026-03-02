import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { apiCreateAppointment, apiGetSlots, apiListServices } from "../lib/api";
import { haptic, initTelegramUi } from "../lib/telegram";
import { fmtHuman, ymdTodayUtc } from "../lib/time";
import { AppShell } from "../ui/app-shell";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { Badge } from "../ui/badge";
const wd = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
function ymdToDate(ymd) {
    const [y, m, d] = ymd.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
}
export function BookingPage() {
    const { masterId = "" } = useParams();
    const [sp] = useSearchParams();
    const nav = useNavigate();
    const [services, setServices] = React.useState([]);
    const [serviceId, setServiceId] = React.useState(sp.get("serviceId") ?? "");
    const [fromDate, setFromDate] = React.useState(ymdTodayUtc());
    const [activeDay, setActiveDay] = React.useState(ymdTodayUtc());
    const [slots, setSlots] = React.useState({});
    const [selected, setSelected] = React.useState("");
    const [phone, setPhone] = React.useState("");
    const [loading, setLoading] = React.useState(true);
    const [creating, setCreating] = React.useState(false);
    const [error, setError] = React.useState(null);
    React.useEffect(() => {
        initTelegramUi();
        (async () => {
            try {
                setLoading(true);
                const s = await apiListServices(masterId);
                setServices(s.services);
                if (!serviceId && s.services[0]?.id)
                    setServiceId(s.services[0].id);
            }
            catch (e) {
                const msg = e instanceof Error ? e.message : "Ошибка загрузки услуг";
                setError(msg);
            }
            finally {
                setLoading(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [masterId]);
    React.useEffect(() => {
        if (!serviceId)
            return;
        (async () => {
            try {
                setError(null);
                const res = await apiGetSlots({ masterId, serviceId, fromDate, days: 7 });
                setSlots(res.slots);
                const keys = Object.keys(res.slots);
                const firstNonEmpty = keys.find((k) => (res.slots[k] ?? []).length > 0) ?? keys[0] ?? fromDate;
                setActiveDay(firstNonEmpty);
                setSelected("");
            }
            catch (e) {
                const msg = e instanceof Error ? e.message : "Ошибка слотов";
                setError(msg);
            }
        })();
    }, [masterId, serviceId, fromDate]);
    const service = services.find((s) => s.id === serviceId) ?? null;
    const days = Object.keys(slots);
    const daySlots = slots[activeDay] ?? [];
    return (_jsxs(AppShell, { subtitle: "\u041D\u043E\u0432\u0430\u044F \u0437\u0430\u043F\u0438\u0441\u044C", title: service ? service.title : "Выбор времени", showNav: false, right: _jsx("button", { style: { color: "var(--muted)", fontSize: 14 }, onClick: () => nav(`/m/${masterId}`), children: "\u041D\u0430\u0437\u0430\u0434" }), children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("div", { className: "muted", children: "\u0423\u0441\u043B\u0443\u0433\u0430 \u2192 \u0434\u0435\u043D\u044C \u2192 \u0432\u0440\u0435\u043C\u044F" }), service && _jsxs(Badge, { tone: "accent", children: [service.duration_min, " \u043C\u0438\u043D \u2022 ", service.price_rub, " \u20BD"] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx("div", { className: "text-sm font-semibold", children: "\u041F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u044B" }), _jsx("div", { className: "muted", children: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0443\u0441\u043B\u0443\u0433\u0443 \u0438 \u0441\u043B\u043E\u0442" })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("div", { className: "muted", children: "\u0423\u0441\u043B\u0443\u0433\u0430" }), _jsx(Select, { value: serviceId, onChange: (e) => setServiceId(e.target.value), children: services.map((s) => (_jsxs("option", { value: s.id, children: [s.title, " \u2022 ", s.duration_min, " \u043C\u0438\u043D \u2022 ", s.price_rub, " \u20BD"] }, s.id))) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("div", { className: "muted", children: "\u0414\u0430\u0442\u0430 (\u0441\u0442\u0430\u0440\u0442 \u043D\u0435\u0434\u0435\u043B\u0438)" }), _jsx(Input, { type: "date", value: fromDate, onChange: (e) => {
                                            setFromDate(e.target.value);
                                            setSelected("");
                                        } })] }), error && _jsx("div", { className: "text-sm", style: { color: "var(--danger)" }, children: error }), _jsxs("div", { className: "space-y-2", children: [_jsx("div", { className: "muted", children: "\u041D\u0435\u0434\u0435\u043B\u044F" }), _jsx("div", { className: "flex gap-2 overflow-auto pb-1", children: days.map((d) => {
                                            const date = ymdToDate(d);
                                            const weekday = wd[(date.getUTCDay() + 6) % 7];
                                            const dd = String(date.getUTCDate()).padStart(2, "0");
                                            const active = d === activeDay;
                                            const hasSlots = (slots[d] ?? []).length > 0;
                                            return (_jsxs("button", { onClick: () => {
                                                    haptic("light");
                                                    setActiveDay(d);
                                                    setSelected("");
                                                }, className: "px-3 py-2 text-xs font-semibold", style: {
                                                    whiteSpace: "nowrap",
                                                    borderRadius: 16,
                                                    border: `1px solid ${active ? "rgba(47,102,255,0.28)" : "var(--border)"}`,
                                                    background: active ? "var(--accent-weak)" : "var(--surface)",
                                                    color: active ? "var(--accent)" : "var(--text)",
                                                    opacity: hasSlots ? 1 : 0.55
                                                }, children: [_jsx("div", { style: { lineHeight: "14px" }, children: weekday }), _jsx("div", { style: { lineHeight: "14px", color: active ? "var(--accent)" : "var(--muted)" }, children: dd })] }, d));
                                        }) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("div", { className: "muted", children: "\u0412\u0440\u0435\u043C\u044F" }), loading && _jsx("div", { className: "muted", children: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430\u2026" }), !loading && daySlots.length === 0 && _jsx("div", { className: "muted", children: "\u041D\u0430 \u044D\u0442\u043E\u0442 \u0434\u0435\u043D\u044C \u0441\u043B\u043E\u0442\u043E\u0432 \u043D\u0435\u0442." }), _jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }, children: daySlots.slice(0, 24).map((iso) => {
                                            const active = iso === selected;
                                            const timeOnly = fmtHuman(iso).split(", ").slice(-1)[0];
                                            return (_jsx("button", { onClick: () => {
                                                    haptic("light");
                                                    setSelected(iso);
                                                }, className: "py-3 text-xs font-semibold transition", style: {
                                                    borderRadius: 16,
                                                    border: `1px solid ${active ? "rgba(47,102,255,0.38)" : "var(--border)"}`,
                                                    background: active ? "var(--accent)" : "var(--surface)",
                                                    color: active ? "var(--accent-fg)" : "var(--text)"
                                                }, children: timeOnly }, iso));
                                        }) }), daySlots.length > 24 && _jsx("div", { className: "muted", children: "\u2026 \u0435\u0449\u0451 \u0441\u043B\u043E\u0442\u044B" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("div", { className: "muted", children: "\u0422\u0435\u043B\u0435\u0444\u043E\u043D (\u043D\u0435\u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E)" }), _jsx(Input, { value: phone, onChange: (e) => setPhone(e.target.value), placeholder: "+7 900 123-45-67" })] }), _jsx(Button, { disabled: !selected || creating, onClick: async () => {
                                    if (!service || !selected)
                                        return;
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
                                    }
                                    catch (e) {
                                        const msg = e instanceof Error ? e.message : "Ошибка";
                                        setError(msg.includes("slot_taken") ? "Этот слот уже занят. Выберите другой." : msg);
                                    }
                                    finally {
                                        setCreating(false);
                                    }
                                }, children: creating ? "Записываю…" : "Записать и отправить в TG" }), _jsx("div", { className: "muted", children: "\u041E\u0442\u043C\u0435\u043D\u0430/\u043F\u0435\u0440\u0435\u043D\u043E\u0441 \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u044B \u0432 \u201C\u041C\u043E\u0438 \u0437\u0430\u043F\u0438\u0441\u0438\u201D." })] })] })] }));
}
