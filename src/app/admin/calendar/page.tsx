import { requireAdmin } from "@/lib/auth";
import CalendarView from "@/components/workspace/calendar-view";

export default async function AdminCalendarPage() {
  await requireAdmin();
  return <CalendarView basePath="/admin" />;
}
