"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addTaskType, type ActionState } from "@/app/actions/admin";
import { useToast } from "@/components/toast";

export default function TaskTypesPanel({ taskTypes }: { taskTypes: string[] }) {
  const router = useRouter();
  const [newType, setNewType] = useState("");
  const [msg, setMsg] = useState<ActionState>({});
  const [adding, startAdding] = useTransition();
  const toast = useToast();

  const save = () => {
    const v = newType.trim();
    if (!v || adding) return;
    startAdding(async () => {
      const res = await addTaskType(v);
      setMsg(res);
      if (res.error) toast("error", res.error);
      else if (res.success) toast("success", res.success);
      if (res.success) setNewType("");
      router.refresh();
    });
  };

  return (
    <div className="card h-fit space-y-4 p-6">
      <div>
        <h2 className="text-sm font-bold text-ink">Task categories</h2>
        <p className="mt-0.5 text-xs text-muted">
          These appear in the Task type dropdown. Add your own if something is missing.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {taskTypes.map((t) => (
          <span
            key={t}
            className="rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-bold text-brand ring-1 ring-inset ring-brand-line"
          >
            {t}
          </span>
        ))}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <input
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            className="input flex-1 px-2.5 py-1.5 text-xs"
            placeholder="New category, e.g. Reels cover"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                save();
              }
            }}
          />
          <button
            type="button"
            onClick={save}
            disabled={adding || !newType.trim()}
            className="rounded-lg border border-line bg-elevated px-2.5 py-1.5 text-xs font-semibold text-ink shadow-sm transition hover:bg-panel disabled:opacity-50"
          >
            {adding ? "Adding…" : "+ Add"}
          </button>
        </div>
        {msg.error && <p className="text-xs font-medium text-bad">{msg.error}</p>}
        {msg.success && <p className="text-xs font-medium text-ok">{msg.success}</p>}
      </div>
    </div>
  );
}
