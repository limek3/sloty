import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { isInTelegram } from "../lib/telegram";
import { AppShell } from "../ui/app-shell";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
export function HomePage() {
    const inTg = isInTelegram();
    return (_jsx(AppShell, { subtitle: "Sloty", title: "\u0417\u0430\u043F\u0438\u0441\u044C", right: _jsx(Badge, { tone: inTg ? "good" : "neutral", children: inTg ? "WebApp OK" : "Browser" }), children: _jsxs(Card, { className: "overflow-hidden", children: [_jsx("div", { style: { height: 120, background: "linear-gradient(135deg, rgba(47,102,255,0.12), rgba(47,102,255,0.00))" } }), _jsxs(CardHeader, { children: [_jsx("div", { className: "text-sm font-semibold", children: inTg ? "Готово" : "Откройте в Telegram" }), _jsx("div", { className: "muted", children: inTg
                                ? "Можно управлять записями и кабинетом."
                                : "Это превью. Полный функционал работает внутри Telegram Mini App." })] }), _jsxs(CardContent, { className: "space-y-3", children: [!inTg && (_jsx("div", { className: "muted", children: "\u041E\u0442\u043A\u0440\u043E\u0439 \u0431\u043E\u0442\u0430 \u0438 \u0437\u0430\u043F\u0443\u0441\u0442\u0438 WebApp \u0447\u0435\u0440\u0435\u0437 \u043A\u043D\u043E\u043F\u043A\u0443 \u2014 \u0442\u043E\u0433\u0434\u0430 \u043F\u043E\u044F\u0432\u044F\u0442\u0441\u044F \u0437\u0430\u043F\u0438\u0441\u0438 \u0438 \u043A\u0430\u0431\u0438\u043D\u0435\u0442." })), _jsxs("div", { className: "grid grid-cols-2 gap-2", children: [_jsx(Button, { variant: "secondary", onClick: () => (window.location.href = "/me"), disabled: !inTg, children: "\u041C\u043E\u0438 \u0437\u0430\u043F\u0438\u0441\u0438" }), _jsx(Button, { variant: "secondary", onClick: () => (window.location.href = "/master"), disabled: !inTg, children: "\u041A\u0430\u0431\u0438\u043D\u0435\u0442" })] })] })] }) }));
}
