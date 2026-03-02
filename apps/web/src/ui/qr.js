import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { QRCodeCanvas } from "qrcode.react";
import { Button } from "./button";
export function QrCard(props) {
    return (_jsxs("div", { className: "glass rounded-3xl p-5 space-y-3", children: [_jsx("div", { className: "text-sm font-medium", children: props.title }), _jsxs("div", { className: "flex items-center justify-between gap-4", children: [_jsx("div", { className: "rounded-2xl p-3", style: { background: "rgba(127,127,127,0.08)", border: "1px solid var(--border)" }, children: _jsx(QRCodeCanvas, { value: props.url, size: 132 }) }), _jsxs("div", { className: "min-w-0 flex-1 space-y-2", children: [_jsx("div", { className: "muted break-all", children: props.url }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { full: false, size: "sm", variant: "secondary", onClick: async () => {
                                            await navigator.clipboard.writeText(props.url);
                                        }, children: "Copy" }), _jsx(Button, { full: false, size: "sm", variant: "secondary", onClick: async () => {
                                            if (navigator.share)
                                                await navigator.share({ url: props.url, title: "Запись" });
                                            else
                                                await navigator.clipboard.writeText(props.url);
                                        }, children: "Share" })] })] })] })] }));
}
