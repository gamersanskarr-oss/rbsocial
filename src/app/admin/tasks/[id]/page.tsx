import TaskDetailView from "@/components/workspace/task-detail-view";

export default async function AdminTaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TaskDetailView id={id} basePath="/admin" />;
}
