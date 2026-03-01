export function tg(): any {
  return (window as any).Telegram?.WebApp;
}

export function isInTelegram(): boolean {
  return Boolean(tg()?.initData);
}

export function initTelegramUi() {
  const w = tg();
  if (!w) return;
  w.ready();
  w.expand();
  w.setHeaderColor("#0a0a0a");
  w.setBackgroundColor("#0a0a0a");
}

export function getInitData(): string {
  return tg()?.initData ?? "";
}

export function haptic(kind: "light" | "medium" | "heavy" = "light") {
  tg()?.HapticFeedback?.impactOccurred(kind);
}
