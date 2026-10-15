import { redirect } from "next/navigation";

// Subscriptions are merged into the Expenses page.
export default function SubscriptionsPage() {
  redirect("/admin/expenses");
}
