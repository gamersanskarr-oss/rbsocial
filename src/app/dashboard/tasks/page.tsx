import { requireEmployee } from "@/lib/auth";
import { getUser, listClientsByAssignee, listTaskTypes, listTasksForUser, taskPay } from "@/lib/data";
import { PageHeader } from "@/components/ui";
import SelfTaskDialog from "../self-task-dialog";
import TasksTable, { type TaskRow } from "@/components/workspace/tasks-table";

export const dynamic = "force-dynamic";

export default async function EmployeeTasksPage() {
  const user = await requireEmployee();
  const [fresh, tasks, taskTypes, myClients] = await Promise.all([
    getUser(user.id),
    listTasksForUser(user.id),
    listTaskTypes(),
    listClientsByAssignee(user.id),
  ]);
  const rate = fresh?.perPostPay ?? null;

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
    submissionLink: t.submissionLink ?? null,
    requestsCount: t.requests.length,
    payStatus: t.payStatus,
    payAmount: t.payAmount,
    // The employee's own money: their QUOTE while in review (taskPay would
    // fall back to the base rate), the approved amount once decided.
    // Unsubmitted tasks have nothing fixed yet.
    pay:
      t.status === "COMPLETED"
        ? t.payStatus === "PENDING"
          ? (t.payAmount ?? 0)
          : taskPay(t, rate ?? 0)
        : null,
    quotedAmount: t.quotedAmount ?? null,
    selfAssigned: !!t.selfAssigned,
    selfAssignedBy: t.selfAssignedBy,
  }));

  // The employee only sees their own work — the client list comes from it.
  const clients = [...new Set(rows.map((r) => r.clientName).filter(Boolean))].map((name) => ({
    id: name,
    name,
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader
          title="My Tasks"
          subtitle="All your work — filter by client, status, deliverable or deadline."
        />
        <SelfTaskDialog clients={myClients.map((c) => ({ id: c.id, name: c.name }))} />
      </div>
      <TasksTable
        basePath="/dashboard"
        rows={rows}
        clients={clients}
        employees={[]}
        taskTypes={taskTypes}
        canManage={false}
        showPay
      />
    </div>
  );
}
