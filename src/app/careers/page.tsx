import Link from "next/link";
import type { Metadata } from "next";
import { listJobs } from "@/lib/data";
import { Logo } from "@/components/logo";

export const metadata: Metadata = {
  title: "Careers — RB Social Branding",
  description: "Open roles at RB Social Branding — design, video, IT and marketing.",
};

const FLAME = "#ff4a36";

const TYPE_LABEL: Record<string, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  INTERNSHIP: "Internship",
  CONTRACT: "Contract",
};

const TEAM_LABEL: Record<string, string> = {
  DESIGN: "Graphic Design",
  IT: "IT",
  MARKETING: "Marketing",
  OPS: "Operations",
};

export const dynamic = "force-dynamic";

export default async function CareersPage() {
  const jobs = await listJobs(true);

  return (
    <div className="theme-dark min-h-screen bg-[#07080d] text-ink">
      {/* glows */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[380px] w-[720px] -translate-x-1/2 rounded-full opacity-25 blur-3xl"
        style={{ background: `radial-gradient(closest-side, ${FLAME}66, transparent)` }}
      />

      {/* Header */}
      <header className="relative z-10 mx-auto flex max-w-5xl items-center justify-between px-6 pt-8">
        <Link href="/" className="flex items-center gap-3">
          <Logo size={40} className="shadow-soft" />
          <span className="text-sm font-bold tracking-tight">RB Social Branding</span>
        </Link>
        <Link
          href="/"
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-ink backdrop-blur transition hover:bg-white/10"
        >
          ← Back to site
        </Link>
      </header>

      <main className="relative z-10 mx-auto max-w-5xl px-6 pb-28 pt-20">
        <p className="section-label" style={{ color: FLAME }}>Careers</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight md:text-6xl">
          Work with us.
        </h1>
        <p className="mt-4 max-w-xl text-lg font-medium text-muted">
          Design, video and code for brands that actually ship. Small team, real deadlines,
          honest pay.
        </p>

        <div className="mt-14 space-y-4">
          {jobs.length === 0 && (
            <div className="rounded-3xl border border-line bg-panel/60 p-12 text-center">
              <p className="text-lg font-bold text-ink">No open roles right now.</p>
              <p className="mt-2 text-sm font-medium text-muted">
                We hire in bursts — check back soon, or send your portfolio anyway.
              </p>
            </div>
          )}
          {jobs.map((j) => {
            const applyHref = j.applyLink
              ? j.applyLink.includes("@") && !j.applyLink.startsWith("http")
                ? `mailto:${j.applyLink}?subject=${encodeURIComponent(`Application: ${j.title}`)}`
                : j.applyLink
              : `mailto:careers@rbsocialbranding.com?subject=${encodeURIComponent(`Application: ${j.title}`)}`;
            return (
              <article
                key={j.id}
                className="group rounded-3xl border border-line bg-panel/60 p-6 transition duration-300 hover:border-[#3a3e47] hover:bg-panel md:p-8"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold tracking-tight text-ink md:text-2xl">
                      {j.title}
                    </h2>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {[
                        TEAM_LABEL[j.team ?? ""] ?? j.team,
                        TYPE_LABEL[j.type] ?? j.type,
                        `📍 ${j.location}`,
                        j.salary ? `💰 ${j.salary}` : null,
                      ]
                        .filter(Boolean)
                        .map((chip) => (
                          <span
                            key={chip}
                            className="rounded-full border border-line bg-elevated px-3 py-1 text-xs font-semibold text-muted"
                          >
                            {chip}
                          </span>
                        ))}
                    </div>
                  </div>
                  <a
                    href={applyHref}
                    target={applyHref.startsWith("mailto") ? undefined : "_blank"}
                    rel="noreferrer"
                    className="shrink-0 rounded-full px-6 py-2.5 text-sm font-bold text-white transition duration-200 hover:opacity-90 active:scale-[0.98]"
                    style={{ background: `linear-gradient(135deg, ${FLAME}, #d92c1c)` }}
                  >
                    Apply →
                  </a>
                </div>
                <ul className="mt-5 space-y-1.5">
                  {j.description
                    .split("\n")
                    .map((line) => line.trim())
                    .filter(Boolean)
                    .map((line, i) => (
                      <li key={i} className="flex gap-2.5 text-sm font-medium leading-relaxed text-muted">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: FLAME }} />
                        {line.replace(/^[·•\-*]\s*/, "")}
                      </li>
                    ))}
                </ul>
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}
