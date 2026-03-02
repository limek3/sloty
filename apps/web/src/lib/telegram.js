export function tg() {
    return window.Telegram?.WebApp;
}
export function isInTelegram() {
    return Boolean(tg()?.initData);
}
export function initTelegramUi() {
    const w = tg();
    if (!w)
        return;
    w.ready();
    w.expand();
    w.setHeaderColor("#0a0a0a");
    w.setBackgroundColor("#0a0a0a");
}
export function getInitData() {
    return tg()?.initData ?? "";
}
export function haptic(kind = "light") {
    tg()?.HapticFeedback?.impactOccurred(kind);
}
