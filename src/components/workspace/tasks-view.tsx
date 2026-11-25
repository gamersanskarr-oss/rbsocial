import { listClientOptions, listEmployeeOptions, listTasksWithRefs, listTaskTypes, safeHref } from "@/lib/data";
import { checkMissedDeadlines } from "@/lib/deadlines";
import { PageHeader } from "@/components/ui";
import CreateTaskForm from "./create-task-form";
import TaskTypesPanel from "./task-types-panel";
import TasksTable, { type TaskRow } from "./tasks-table";

export default async function TasksView({ basePath }: { basePath: string }) {
  await checkMissedDeadlines();

  const canSeePay = basePath === "/admin"; // quotes & pay stay admin-only

  const [tasks, clients, employees, taskTypes] = await Promise.all([
    listTasksWithRefs(),
    listClientOptions(),
    listEmployeeOptions(),
    listTaskTypes(),
  ]);

  const rows: TaskRow[] = tasks.map((t) => ({
    id: t.id,
    topic: t.topic,
    description: t.description,
    type: t.type,
    slideCount: t.slideCount,
    clientName: t.client.name,
    assigneeName: t.assignedTo.name,
    deadlineISO: t.deadline.toISOString(),
    status: t.status,
    approval: t.approval,
    lateSubmission: !!t.lateSubmission,
    missReason: t.missReason,
    submissionLink: t.submissionLink ? safeHref(t.submissionLink) : null,
    requestsCount: t.requests.length,
    payStatus: t.payStatus,
    payAmount: t.payAmount,
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Tasks"
        subtitle="Assign new work and monitor progress across the whole team."
      />

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_300px]">
        <div className="card p-6">
          <h2 className="mb-4 text-sm font-bold text-ink">Assign a task</h2>
          <CreateTaskForm clients={clients} employees={employees} taskTypes={taskTypes} basePath={basePath} />
        </div>
        <TaskTypesPanel taskTypes={taskTypes} />
      </div>

      <TasksTable
        basePath={basePath}
        rows={rows}
        clients={clients}
        employees={employees}
        taskTypes={taskTypes}
        canSeePay={canSeePay}
      />
    </div>
  );
}
