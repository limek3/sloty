import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { Card, CardContent, CardHeader } from "./card";
import { Button } from "./button";
export class ErrorBoundary extends React.Component {
    state = { hasError: false };
    static getDerivedStateFromError(err) {
        return { hasError: true, message: err instanceof Error ? err.message : String(err) };
    }
    componentDidCatch(err) {
        console.error("UI crashed:", err);
    }
    render() {
        if (!this.state.hasError)
            return this.props.children;
        return (_jsx("div", { className: "mx-auto max-w-md px-4 py-6", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx("div", { className: "text-sm font-semibold", children: this.props.title ?? "Ошибка" }), _jsx("div", { className: "muted", children: "\u041F\u0435\u0440\u0435\u0437\u0430\u0433\u0440\u0443\u0437\u0438 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0443." })] }), _jsxs(CardContent, { className: "space-y-2", children: [_jsx("div", { className: "text-xs", style: {
                                    border: "1px solid var(--border)",
                                    background: "var(--surface)",
                                    borderRadius: 16,
                                    padding: "12px 14px",
                                    wordBreak: "break-word"
                                }, children: this.state.message ?? "unknown" }), _jsx(Button, { onClick: () => window.location.reload(), children: "\u041F\u0435\u0440\u0435\u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C" }), _jsx(Button, { variant: "secondary", onClick: () => (window.location.href = "/"), children: "\u041D\u0430 \u0433\u043B\u0430\u0432\u043D\u0443\u044E" })] })] }) }));
    }
}
