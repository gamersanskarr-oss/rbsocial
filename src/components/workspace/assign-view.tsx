import { listClientOptions, listEmployeeOptions } from "@/lib/data";
import { PageHeader } from "@/components/ui";
import CreateTaskForm from "@/app/admin/assign/create-task-form";

export default async function AssignView({ basePath }: { basePath: string }) {
  const [clients, employees] = await Promise.all([
    listClientOptions(),
    listEmployeeOptions(),
  ]);

  return (
    <div className="max-w-3xl space-y-8">
      <PageHeader
        title="Assign Task"
        subtitle="Give a team member a new task with a clear brief and deadline."
      />
      <div className="card p-6">
        <CreateTaskForm clients={clients} employees={employees} basePath={basePath} />
      </div>
    </div>
  );
}
