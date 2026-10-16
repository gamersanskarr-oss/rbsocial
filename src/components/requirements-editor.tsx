"use client";

import { useId, useState } from "react";

export type ClientRequirement = { type: string; qty: number; per: "WEEK" | "MONTH" };

type Row = { type: string; qty: string; per: "WEEK" | "MONTH" };

/**
 * "5× Static Post per week, 2× Video Edit per month" — repeatable rows that
 * serialize into a hidden `requirementsJson` field for the server action.
 */
export default function RequirementsEditor({
  types,
  initial,
}: {
  types: string[];
  initial?: ClientRequirement[] | null;
}) {
  const listId = useId();
  const [rows, setRows] = useState<Row[]>(
    (initial ?? []).map((r) => ({ type: r.type, qty: String(r.qty), per: r.per }))
  );

  const set = (i: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const remove = (i: number) => setRows((rs) => rs.filter((_, j) => j !== i));

  const serialized = JSON.stringify(
    rows
      .filter((r) => r.type.trim() && Number(r.qty) > 0)
      .map((r) => ({ type: r.type.trim(), qty: Number(r.qty), per: r.per }))
  );

  return (
    <div>
      <input type="hidden" name="requirementsJson" value={serialized} />
      <div className="mb-2 flex items-center justify-between">
        <label className="block text-sm font-medium text-muted">
          Content requirements <span className="text-faint">(optional — e.g. 5 posts/week)</span>
        </label>
        <button
          type="button"
          onClick={() => setRows((rs) => [...rs, { type: "", qty: "", per: "WEEK" }])}
          className="text-xs font-bold text-muted transition hover:text-ink"
        >
          + Add item
        </button>
      </div>

      <datalist id={listId}>
        {types.map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>

      <div className="space-y-2">
        {rows.length === 0 && (
          <p className="text-xs font-medium text-faint">
            No fixed requirements — add one if the client has a set deliverable count.
          </p>
        )}
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max="99"
              required
              value={r.qty}
              onChange={(e) => set(i, { qty: e.target.value })}
              className="input w-20 px-2.5 py-2 text-sm"
              placeholder="5"
              aria-label="Quantity"
            />
            <span className="text-sm font-semibold text-faint">×</span>
            <input
              list={listId}
              required
              value={r.type}
              onChange={(e) => set(i, { type: e.target.value })}
              className="input flex-1 px-3 py-2 text-sm"
              placeholder="Static Post, Carousel, Video Edit, Misc…"
              aria-label="Content type"
            />
            <select
              value={r.per}
              onChange={(e) => set(i, { per: e.target.value as "WEEK" | "MONTH" })}
              className="input w-auto px-2.5 py-2 text-sm"
              aria-label="Frequency"
            >
              <option value="WEEK">per week</option>
              <option value="MONTH">per month</option>
            </select>
            <button
              type="button"
              onClick={() => remove(i)}
              className="rounded-lg px-2 py-1.5 text-xs font-semibold text-faint transition hover:bg-hover hover:text-rose-500"
              aria-label="Remove requirement"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
