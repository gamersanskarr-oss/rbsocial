import { requireAdmin } from "@/lib/auth";
import TasksView from "@/components/workspace/tasks-view";

export default async function AdminTasksPage() {
  await requireAdmin();
  return <TasksView basePath="/admin" />;
}
