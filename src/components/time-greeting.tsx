"use client";

import { useEffect, useState } from "react";

function parts() {
  const h = new Date().getHours(); // browser's local time
  if (h < 5) return { tod: "Still up? Go to bed", emoji: "🌙" };
  if (h < 12) return { tod: "Good morning", emoji: "☀️" };
  if (h < 17) return { tod: "Good afternoon", emoji: "🌤️" };
  if (h < 21) return { tod: "Good evening", emoji: "🌆" };
  return { tod: "Working late?", emoji: "🌙" };
}

export function TimeGreeting({ name, pending }: { name: string; pending: number }) {
  // Render an empty header on the server, fill it in on the client
  const [g, setG] = useState<{ tod: string; emoji: string } | null>(null);
  useEffect(() => setG(parts()), []);

  const vibe =
    pending === 0
      ? "No tasks on your plate — you're all caught up. Nice. 🌴"
      : pending <= 3
        ? `${pending} task${pending === 1 ? "" : "s"} to do. Easy day. ☕`
        : `${pending} tasks on your list — take it one at a time. 💪`;

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-ink">
        {g ? `${g.tod}, ${name} ${g.emoji}` : `Hi, ${name} 👋`}
      </h1>
      <p className="mt-1 text-sm font-medium text-muted">{vibe}</p>
    </div>
  );
}
