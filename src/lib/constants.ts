// Shared constants safe for both server and client components.
// (Do NOT import server-only modules here.)

export const EXPENSE_CATEGORIES = [
  "Staff Payment",
  "Software",
  "Subscription",
  "Office",
  "Marketing",
  "Equipment",
  "Travel",
  "Miscellaneous",
];

export const BILLING_MODELS = [
  { value: "PREPAID", label: "Prepaid (billed at month start)" },
  { value: "POST_WORK", label: "Post-work (after delivery)" },
  { value: "MID_MONTH", label: "Mid-month (due 15th)" },
  { value: "POSTPAID", label: "Postpaid (billed next month)" },
];
