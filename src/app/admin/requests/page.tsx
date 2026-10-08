import { requireAdmin } from "@/lib/auth";
import RequestsView from "@/components/workspace/requests-view";

export default async function AdminRequestsPage() {
  await requireAdmin();
  return <RequestsView basePath="/admin" />;
}
