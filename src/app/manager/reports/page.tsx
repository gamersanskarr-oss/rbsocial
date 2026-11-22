import Link from "next/link";
import { listTasksWithRefs } from "@/lib/data";
import { requireManager } from "@/lib/auth";
import { checkMissedDeadlines } from "@/lib/deadlines";
import { PageHeader } from "@/components/ui";

const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

export default async function ManagerReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  await requireManager();
  await checkMissedDeadlines();

  const { month } = await searchParams;
  const selected = /^\d{4}-\d{2}$/.test(month ?? "") ? month! : monthKey(new Date());

  const tasks = await listTasksWithRefs();

  const [selY, selM] = selected.split("-").map(Number);
  const monthTasks = tasks
    .filter((t) => t.deadline.getFullYear() === selY && t.deadline.getMonth() === selM - 1)
    .sort((a, b) => a.deadline.getTime() - b.deadline.getTime());

  const monthLabel = new Date(selY, selM - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Team reports"
        subtitle={`Deliverables due in ${monthLabel} — client and assignee.`}
      />

      <div className="card p-4">
        <form className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-faint">Month</label>
            <input
              type="month"
              name="month"
              defaultValue={selected}
              className="input w-auto px-3 py-2 text-sm"
            />
          </div>
          <button className="btn-primary px-4 py-2">View</button>
          <Link
            href="/manager/reports"
            className="rounded-xl px-3 py-2.5 text-sm font-semibold text-muted transition hover:bg-hover hover:text-ink"
          >
            This month
          </Link>
        </form>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-line bg-panel/70">
              <tr>
                <th className="th">Deliverable</th>
                <th className="th">Client</th>
                <th className="th">Assigned to</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {monthTasks.length === 0 && (
                <tr>
                  <td className="td py-10 text-center text-faint" colSpan={3}>
                    No tasks due in {monthLabel}.
                  </td>
                </tr>
              )}
              {monthTasks.map((t) => (
                <tr key={t.id} className="transition hover:bg-panel/60">
                  <td className="td">
                    {t.type ? (
                      <span className="inline-block whitespace-nowrap rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand ring-1 ring-inset ring-brand-line">
                        {t.type}{t.slideCount ? ` · ${t.slideCount} slides` : ""}
                      </span>
                    ) : (
                      <span className="text-xs text-faint">—</span>
                    )}
                  </td>
                  <td className="td font-medium text-ink">{t.client.name}</td>
                  <td className="td text-muted">{t.assignedTo.name || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs font-medium text-faint">
        Tasks due in {monthLabel}, listed by deadline. Pay and finance numbers stay admin-only.
      </p>
    </div>
  );
}
