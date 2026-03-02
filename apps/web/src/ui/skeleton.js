import { jsx as _jsx } from "react/jsx-runtime";
export function Skeleton({ className }) {
    return (_jsx("div", { className: "animate-pulse rounded-3xl bg-gradient-to-br from-neutral-800/60 to-neutral-900/40 " +
            (className ?? "") }));
}
