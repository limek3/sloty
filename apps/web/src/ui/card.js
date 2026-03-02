import { jsx as _jsx } from "react/jsx-runtime";
export function Card(props) {
    return _jsx("div", { className: `surface ${props.className ?? ""}`, children: props.children });
}
export function CardHeader(props) {
    return _jsx("div", { className: `px-5 pt-5 pb-3 ${props.className ?? ""}`, children: props.children });
}
export function CardContent(props) {
    return _jsx("div", { className: `px-5 pb-5 ${props.className ?? ""}`, children: props.children });
}
