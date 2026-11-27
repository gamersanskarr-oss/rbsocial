import Link from "next/link";
import { listClientOptions, listEmployeeOptions, listTaskTypes, listTasksWithRefs } from "@/lib/data";
import { requireManager } from "@/lib/auth";
import { checkMissedDeadlines } from "@/lib/deadlines";
import { PageHeader } from "@/components/ui";
import ReportsTable, { type ReportRow } from "@/components/workspace/reports-table";

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

  const [tasks, clients, employees, taskTypes] = await Promise.all([
    listTasksWithRefs(),
    listClientOptions(),
    listEmployeeOptions(),
    listTaskTypes(),
  ]);

  const [selY, selM] = selected.split("-").map(Number);
  const monthTasks = tasks
    .filter((t) => t.deadline.getFullYear() === selY && t.deadline.getMonth() === selM - 1)
    .sort((a, b) => a.deadline.getTime() - b.deadline.getTime());

  const monthLabel = new Date(selY, selM - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const rows: ReportRow[] = monthTasks.map((t) => ({
    id: t.id,
    topic: t.topic,
    type: t.type,
    slideCount: t.slideCount,
    clientName: t.client.name,
    assigneeName: t.assignedTo.name,
    deadlineISO: t.deadline.toISOString(),
    status: t.status,
    approval: t.approval,
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Team reports"
        subtitle={`Deliverables due in ${monthLabel} — filter, sort and download.`}
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

      <ReportsTable rows={rows} monthLabel={monthLabel} clients={clients} employees={employees} taskTypes={taskTypes} />

      <p className="text-xs font-medium text-faint">
        Tasks due in {monthLabel}. Excel download follows the current filters — filter to one member
        for their individual report. Pay and finance numbers stay admin-only.
      </p>
    </div>
  );
}
