"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";

type Toast = { id: number; kind: "success" | "error"; msg: string };
type Push = (kind: Toast["kind"], msg: string) => void;

const ToastCtx = createContext<Push>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback<Push>((kind, msg) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  const dismiss = (id: number) =>
    setToasts((t) => t.filter((x) => x.id !== id));

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-72 flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-2.5 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-lift animate-toast-in ${
              t.kind === "success"
                ? "border-emerald-500/30 bg-[#0e2019] text-emerald-300"
                : "border-rose-500/30 bg-[#281114] text-rose-300"
            }`}
          >
            <span className="mt-px shrink-0">{t.kind === "success" ? "✓" : "✕"}</span>
            <span className="min-w-0 flex-1 leading-snug">{t.msg}</span>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => dismiss(t.id)}
              className="shrink-0 text-white/40 transition hover:text-white/80"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/** Fires a toast whenever a useActionState result object changes. */
export function useActionToast(
  state: { error?: string; success?: string } | null | undefined
) {
  const push = useToast();
  const last = useRef(state);
  useEffect(() => {
    if (state && state !== last.current) {
      if (state.error) push("error", state.error);
      else if (state.success) push("success", state.success);
    }
    last.current = state;
  }, [state, push]);
}

/** A <form> that calls a void server action inside a transition and toasts
    the result — use anywhere you would write `<form action={voidAction}>`. */
export function ToastForm({
  action,
  success,
  children,
  className,
}: {
  action: (formData: FormData) => Promise<unknown>;
  success: string;
  children: ReactNode;
  className?: string;
}) {
  const push = useToast();
  const [pending, startTransition] = useTransition();
  return (
    <form
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          try {
            await action(fd);
            push("success", success);
          } catch {
            push("error", "Something went wrong — try again.");
          }
        });
      }}
    >
      <fieldset disabled={pending} className="contents">
        {children}
      </fieldset>
    </form>
  );
}
