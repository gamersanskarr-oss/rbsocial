import {
  clientAssignees,
  listClients,
  listEmployeeOptions,
  listTaskTypes,
  listTasksWithRefs,
  safeHref,
  type ClientRecord,
  type TaskWithRefs,
} from "@/lib/data";
import { requireManager } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import ClientsTable, { type ClientRow } from "@/components/workspace/clients-table";

export default async function ManagerClientsPage() {
  await requireManager();
  const [clients, employees, taskTypes, tasks] = await Promise.all([
    listClients(),
    listEmployeeOptions(),
    listTaskTypes(),
    listTasksWithRefs(),
  ]);

  // id -> display name: employees first (complete list), tasks fill legacy
  // assignees who have since left or changed role.
  const nameById = new Map(employees.map((e) => [e.id, e.name] as const));
  for (const t of tasks) {
    if (t.assignedTo.name && !nameById.has(t.assignedToId)) {
      nameById.set(t.assignedToId, t.assignedTo.name);
    }
  }

  const byClient = new Map<string, TaskWithRefs[]>();
  for (const t of tasks) {
    const list = byClient.get(t.clientId) ?? [];
    list.push(t);
    byClient.set(t.clientId, list);
  }

  const rows: ClientRow[] = clients.map((c: ClientRecord) => {
    const ct = byClient.get(c.id) ?? [];
    const assigneeIds = clientAssignees(c);
    const assigneeNames = [...new Set(assigneeIds.map((id) => nameById.get(id) ?? "").filter(Boolean))].sort((a, b) =>
      a.localeCompare(b),
    );
    const socials: { label: string; url: string }[] = [];
    if (c.instagram) socials.push({ label: "IG", url: safeHref(c.instagram) });
    if (c.facebook) socials.push({ label: "FB", url: safeHref(c.facebook) });
    if (c.website) socials.push({ label: "Web", url: safeHref(c.website) });
    return {
      id: c.id,
      name: c.name,
      archived: c.status === "ARCHIVED",
      contact: c.contact ?? c.phone,
      socials,
      assigneeIds,
      assigneeNames,
      taskTotal: ct.length,
      pending: ct.filter((t) => t.status === "PENDING").length,
      completed: ct.filter((t) => t.status === "COMPLETED").length,
      missed: ct.filter((t) => t.status === "MISSED").length,
      types: [...new Set(ct.map((t) => t.type).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b)),
    };
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Clients"
        subtitle="Every client's creative profile — who's working on what. Billing stays admin-only."
      />
      <ClientsTable basePath="/manager" rows={rows} employees={employees} taskTypes={taskTypes} />
    </div>
  );
}
