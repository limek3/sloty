import React from "react";

type ToastKind = "success" | "error" | "info";
type ToastItem = { id: string; kind: ToastKind; title: string; message?: string };

type ToastCtx = {
  push: (t: Omit<ToastItem, "id">) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
};

const Ctx = React.createContext<ToastCtx | null>(null);

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export function ToastProvider(props: React.PropsWithChildren) {
  const [items, setItems] = React.useState<ToastItem[]>([]);

  const push = React.useCallback((t: Omit<ToastItem, "id">) => {
    const id = uid();
    const toast: ToastItem = { id, ...t };
    setItems((p) => [toast, ...p].slice(0, 3));
    window.setTimeout(() => setItems((p) => p.filter((x) => x.id !== id)), 3200);
  }, []);

  const api: ToastCtx = React.useMemo(
    () => ({
      push,
      success: (title, message) => push({ kind: "success", title, message }),
      error: (title, message) => push({ kind: "error", title, message }),
      info: (title, message) => push({ kind: "info", title, message })
    }),
    [push]
  );

  return (
    <Ctx.Provider value={api}>
      {props.children}

      <div className="fixed top-0 left-0 right-0 z-[100]">
        <div className="mx-auto max-w-md px-4 pt-4 space-y-2">
          {items.map((t) => (
            <div
              key={t.id}
              className="glass rounded-2xl px-4 py-3"
              style={{
                borderColor:
                  t.kind === "success"
                    ? "rgba(16,185,129,0.25)"
                    : t.kind === "error"
                    ? "rgba(239,68,68,0.25)"
                    : "var(--border)"
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium">{t.title}</div>
                  {t.message && <div className="muted mt-0.5">{t.message}</div>}
                </div>
                <button
                  className="icon-btn"
                  onClick={() => setItems((p) => p.filter((x) => x.id !== t.id))}
                  aria-label="Close"
                  type="button"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Ctx.Provider>
  );
}

export function useToast(): ToastCtx {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}