const styles: Record<string, { cls: string; dot: string }> = {
  PENDING: { cls: "bg-warn-soft text-warn ring-warn-line", dot: "bg-amber-400" },
  COMPLETED: { cls: "bg-ok-soft text-ok ring-ok-line", dot: "bg-emerald-500" },
  MISSED: { cls: "bg-bad-soft text-bad ring-bad-line", dot: "bg-rose-500" },
  REVIEW: { cls: "bg-info-soft text-info ring-info-line", dot: "bg-sky-400" },
};

const label: Record<string, string> = {
  PENDING: "Pending",
  COMPLETED: "Completed",
  MISSED: "Missed",
};

/** Review-aware display text for a task's state — shared by badges, CSV
    exports and anywhere else the workflow vocabulary is needed. */
export function taskStatusText(status: string, approval?: string | null): string {
  if (status === "COMPLETED") {
    if (approval === "PENDING") return "Pending review";
    if (!approval || approval === "NONE" || approval === "APPROVED") return "Approved";
    return "Completed";
  }
  if (status === "PENDING" && approval === "CHANGES") return "Changes requested";
  if (status === "PENDING" && approval === "REJECTED") return "Declined";
  return label[status] ?? status;
}

/** Review-aware task badge. A submitted task is "Pending review" until an
    admin/manager decides — it no longer reads as "Completed". Sent-back and
    rejected submissions surface as "Changes requested" / "Declined" while
    the task sits in PENDING again. Legacy completed tasks (no approval
    field) display as "Approved". */
export function StatusBadge({
  status,
  approval,
}: {
  status: string;
  approval?: string | null;
}) {
  let key = status;
  if (status === "COMPLETED") {
    key = approval === "PENDING" ? "REVIEW" : "COMPLETED";
  }
  const text = taskStatusText(status, approval);
  const s = styles[key] ?? { cls: "bg-panel text-muted ring-line", dot: "bg-faint" };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full pl-1.5 pr-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${s.cls}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {text}
    </span>
  );
}

export function TeamBadge({ team }: { team: string | null }) {
  if (!team) return null;
  const cls =
    team === "DESIGN"
      ? "bg-brand-soft text-brand ring-brand-line"
      : "bg-info-soft text-info ring-info-line";
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${cls}`}>
      {team === "DESIGN" ? "Graphic Design" : "IT Team"}
    </span>
  );
}

export function Card({
  title,
  value,
  hint,
}: {
  title: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="card p-5 hover:shadow-lift">
      <p className="text-[11px] font-bold uppercase tracking-wider text-faint">{title}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs font-medium text-muted">{hint}</p>}
    </div>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
      {subtitle && <p className="mt-1 text-sm font-medium text-muted">{subtitle}</p>}
    </div>
  );
}
