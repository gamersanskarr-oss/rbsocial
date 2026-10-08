import { requireEmployee } from "@/lib/auth";
import { listTasksForUser } from "@/lib/data";
import { checkMissedDeadlines } from "@/lib/deadlines";
import { PageHeader } from "@/components/ui";
import { TaskCalendar } from "@/components/task-calendar";

export default async function EmployeeCalendarPage() {
  const user = await requireEmployee();
  await checkMissedDeadlines();

  const tasks = await listTasksForUser(user.id);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Calendar"
        subtitle="Your posts by deadline day."
      />
      <TaskCalendar
        basePath="/dashboard/tasks"
        tasks={tasks.map((t) => ({
          id: t.id,
          topic: t.topic,
          status: t.status,
          deadline: t.deadline.toISOString(),
          clientName: t.client.name,
        }))}
      />
    </div>
  );
}
