const styles: Record<string, { cls: string; dot: string }> = {
  PENDING: { cls: "bg-warn-soft text-warn ring-warn-line", dot: "bg-amber-400" },
  COMPLETED: { cls: "bg-ok-soft text-ok ring-ok-line", dot: "bg-ok-soft0" },
  MISSED: { cls: "bg-bad-soft text-bad ring-bad-line", dot: "bg-bad-soft0" },
};

const label: Record<string, string> = {
  PENDING: "Pending",
  COMPLETED: "Completed",
  MISSED: "Missed",
};

export function StatusBadge({ status }: { status: string }) {
  const s = styles[status] ?? { cls: "bg-panel text-muted ring-line", dot: "bg-faint" };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${s.cls}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {label[status] ?? status}
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
