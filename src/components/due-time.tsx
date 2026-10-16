"use client";

/** Renders a deadline in the viewer's own timezone — server HTML can't,
    because it always formats in the server's clock (UTC on Vercel). */
export function DueTime({
  iso,
  className,
  dateOnly = false,
}: {
  iso: string;
  className?: string;
  dateOnly?: boolean;
}) {
  const d = new Date(iso);
  const date = d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const time = d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <span className={className}>
      {dateOnly ? date : `${date} · ${time}`}
    </span>
  );
}
