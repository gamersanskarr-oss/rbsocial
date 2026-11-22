"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { assignClient } from "@/app/actions/admin";
import { useToast } from "@/components/toast";

const WIDTH = 192; // w-48

export default function AssignSelect({
  clientId,
  currentIds,
  employees,
}: {
  clientId: string;
  currentIds: string[];
  employees: { id: string; name: string; team?: string | null }[];
}) {
  const router = useRouter();
  const btnRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set(currentIds));
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  // Keep local state in sync when the server data refreshes
  useEffect(() => setChecked(new Set(currentIds)), [currentIds]);

  // Close the popover on scroll — its fixed position would go stale
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const toggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({
        top: r.bottom + 6,
        left: Math.max(8, r.right - WIDTH),
      });
    }
    setOpen((o) => !o);
  };

  const toggleId = (id: string) => {
    const next = new Set(checked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setChecked(next);
    const fd = new FormData();
    fd.set("clientId", clientId);
    next.forEach((v) => fd.append("assignedToIds", v));
    startTransition(async () => {
      try {
        await assignClient(fd);
        toast("success", "Assignment saved.");
        router.refresh();
      } catch {
        toast("error", "Could not save the assignment.");
      }
    });
  };

  const names = employees
    .filter((e) => checked.has(e.id))
    .map((e) => (e.team ? `${e.name} (${e.team === "DESIGN" ? "Design" : e.team === "IT" ? "IT" : e.team})` : e.name));

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        className="flex w-44 cursor-pointer items-center justify-between gap-2 rounded-xl border border-line bg-elevated px-3 py-2 text-sm font-medium shadow-sm transition hover:bg-panel"
      >
        <span className={`truncate ${names.length ? "text-ink" : "text-faint"}`}>
          {names.length ? names.join(", ") : "Unassigned"}
        </span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-3.5 w-3.5 shrink-0 text-faint transition ${open ? "rotate-180" : ""}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && pos && (
        <>
          {/* click-outside + scroll-block layer */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="fixed z-50 w-48 space-y-1 rounded-xl border border-line bg-elevated p-2 shadow-lift"
            style={{ top: pos.top, left: pos.left }}
          >
            {employees.map((e) => (
              <label
                key={e.id}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-ink transition hover:bg-panel"
              >
                <input
                  type="checkbox"
                  checked={checked.has(e.id)}
                  onChange={() => toggleId(e.id)}
                  className="h-3.5 w-3.5 accent-brand"
                />
                {e.name}
                {e.team && (
                  <span className="text-[10px] font-bold uppercase tracking-wide text-faint">
                    {e.team === "DESIGN" ? "Design" : e.team === "IT" ? "IT" : e.team}
                  </span>
                )}
              </label>
            ))}
            {employees.length === 0 && (
              <p className="px-2 py-1.5 text-xs text-faint">No employees yet.</p>
            )}
            {pending && (
              <p className="px-2 pb-1 text-[11px] font-medium text-faint">Saving…</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
