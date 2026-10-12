import { listClientOptions, listEmployeeOptions, listTasksWithRefs } from "@/lib/data";
import { checkMissedDeadlines } from "@/lib/deadlines";
import { PageHeader } from "@/components/ui";
import { TaskCalendar } from "@/components/task-calendar";

export default async function CalendarView({ basePath }: { basePath: string }) {
  await checkMissedDeadlines();

  const [tasks, clients, employees] = await Promise.all([
    listTasksWithRefs(),
    listClientOptions(),
    listEmployeeOptions(),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Calendar"
        subtitle="All team tasks by deadline day. Click any day to assign a task."
      />
      <TaskCalendar
        canCreate
        basePath={`${basePath}/tasks`}
        clients={clients}
        employees={employees}
        tasks={tasks.map((t) => ({
          id: t.id,
          topic: `${t.topic} · ${t.assignedTo.name}`,
          status: t.status,
          deadline: t.deadline.toISOString(),
          clientName: t.client.name,
          assignee: t.assignedTo.name,
        }))}
      />
    </div>
  );
}
