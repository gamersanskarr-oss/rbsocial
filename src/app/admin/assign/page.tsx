import { requireAdmin } from "@/lib/auth";
import AssignView from "@/components/workspace/assign-view";

export default async function AssignTaskPage() {
  await requireAdmin();
  return <AssignView basePath="/admin" />;
}
