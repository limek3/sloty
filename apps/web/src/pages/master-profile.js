import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// apps/web/src/pages/master-profile.tsx
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiGetMaster, apiListServices } from "../lib/api";
import { haptic, initTelegramUi } from "../lib/telegram";
import { AppShell } from "../ui/app-shell";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
export function MasterProfilePage() {
    const { masterId = "" } = useParams();
    const nav = useNavigate();
    const [master, setMaster] = React.useState(null);
    const [services, setServices] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
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
            }
            catch (e) {
                setError(e?.message ?? "Ошибка");
            }
            finally {
                setLoading(false);
            }
        })();
    }, [masterId]);
    return (_jsxs(AppShell, { subtitle: "\u0417\u0430\u043F\u0438\u0441\u044C", title: loading ? "…" : master?.display_name ?? "Мастер", showNav: false, right: master?.city ? _jsx(Badge, { children: master.city }) : _jsx("button", { style: { color: "var(--muted)", fontSize: 14 }, onClick: () => nav("/"), children: "\u0413\u043B\u0430\u0432\u043D\u0430\u044F" }), children: [master?.bio && _jsx("div", { className: "muted", children: master.bio }), error && _jsx("div", { className: "text-sm", style: { color: "var(--danger)" }, children: error }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx("div", { className: "text-sm font-semibold", children: "\u0423\u0441\u043B\u0443\u0433\u0438" }), _jsx("div", { className: "muted", children: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0443\u0441\u043B\u0443\u0433\u0443 \u0438 \u0432\u0440\u0435\u043C\u044F" })] }), _jsxs(CardContent, { className: "space-y-2", children: [loading && (_jsxs(_Fragment, { children: [_jsx(Skeleton, { className: "h-14" }), _jsx(Skeleton, { className: "h-14" }), _jsx(Skeleton, { className: "h-14" })] })), !loading && services.length === 0 && _jsx("div", { className: "muted", children: "\u041F\u043E\u043A\u0430 \u043D\u0435\u0442 \u0443\u0441\u043B\u0443\u0433." }), !loading &&
                                services.map((s) => (_jsx("button", { onClick: () => {
                                        haptic("light");
                                        nav(`/m/${masterId}/book?serviceId=${s.id}`);
                                    }, className: "w-full px-4 py-3 text-left transition", style: {
                                        borderRadius: 18,
                                        background: "var(--surface)",
                                        border: "1px solid var(--border)"
                                    }, children: _jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "text-sm font-semibold truncate", children: s.title }), _jsxs("div", { className: "muted", children: [s.duration_min, " \u043C\u0438\u043D"] })] }), _jsxs("div", { className: "text-sm font-semibold", children: [s.price_rub, " \u20BD"] })] }) }, s.id)))] })] })] }));
}
