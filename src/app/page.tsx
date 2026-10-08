import Link from "next/link";
import { Logo } from "@/components/logo";

const services = [
  {
    title: "Social Media Design",
    desc: "Eye-catching posts, stories and creatives tailored to your brand, delivered on schedule.",
    tint: "bg-amber-50 text-amber-800",
  },
  {
    title: "Brand Identity",
    desc: "Logos, color systems and guidelines that make your business instantly recognizable.",
    tint: "bg-sky-50 text-sky-800",
  },
  {
    title: "Campaign Creatives",
    desc: "Ad creatives and campaign assets engineered to convert across every platform.",
    tint: "bg-emerald-50 text-emerald-800",
  },
  {
    title: "IT & Web Support",
    desc: "Our IT team keeps your tools, pages and workflows running smoothly behind the scenes.",
    tint: "bg-orange-50 text-orange-800",
  },
];

const steps = [
  { n: "01", title: "Brief", desc: "Share your goals and brand — we assign a dedicated designer to your account." },
  { n: "02", title: "Design", desc: "Your designer crafts the posts and shares a Canva link for review." },
  { n: "03", title: "Deliver", desc: "Approve and receive final files, on time, every time." },
];

export default function Home() {
  return (
    <div className="min-h-screen text-ink">
      {/* Nav */}
      <header className="sticky top-0 z-10 border-b border-line/70 bg-background/80 backdrop-blur-md">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3.5">
          <span className="flex items-center gap-2.5">
            <Logo size={40} />
            <span className="text-sm font-bold tracking-tight">RB Social Branding</span>
          </span>
          <div className="hidden items-center gap-8 text-sm font-medium text-muted md:flex">
            <a href="#services" className="transition hover:text-ink">Services</a>
            <a href="#process" className="transition hover:text-ink">Process</a>
            <a href="#contact" className="transition hover:text-ink">Contact</a>
          </div>
          <Link
            href="/login"
            className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition duration-200 hover:bg-black active:scale-[0.98]"
          >
            Team Login
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-100/80 via-stone-100 to-sky-100/80 blur-3xl" />
        <div className="relative mx-auto max-w-5xl px-6 py-28 text-center md:py-36">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-white/80 px-4 py-1.5 text-xs font-semibold text-muted shadow-soft backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Design team for growing businesses
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-tight md:text-6xl">
            Your clients&apos; posts, designed and delivered{" "}
            <span className="text-faint">on time, every time.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg font-medium text-muted">
            RB Social Branding pairs your business with skilled graphic designers and a reliable
            IT team — managed through one clear task dashboard with real deadlines.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#contact"
              className="rounded-full bg-ink px-7 py-3 text-sm font-bold text-white shadow-lg shadow-black/10 transition duration-200 hover:bg-black hover:shadow-xl hover:shadow-black/15 active:scale-[0.98]"
            >
              Get Started
            </a>
            <a
              href="#services"
              className="rounded-full border border-line bg-white px-7 py-3 text-sm font-bold text-ink shadow-soft transition duration-200 hover:bg-panel active:scale-[0.98]"
            >
              See Services
            </a>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="border-y border-line/70 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-24">
          <h2 className="text-center text-3xl font-extrabold tracking-tight md:text-4xl">
            What we do
          </h2>
          <p className="mt-3 text-center font-medium text-muted">
            Four services, one accountable team.
          </p>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((s) => (
              <div
                key={s.title}
                className="rounded-3xl border border-line/70 bg-panel/60 p-6 transition duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-lift"
              >
                <span
                  className={`mb-5 flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-bold ${s.tint}`}
                >
                  {s.title.charAt(0)}
                </span>
                <h3 className="text-sm font-bold">{s.title}</h3>
                <p className="mt-2 text-sm font-medium leading-relaxed text-muted">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section id="process" className="mx-auto max-w-5xl px-6 py-24">
        <h2 className="text-center text-3xl font-extrabold tracking-tight md:text-4xl">
          How it works
        </h2>
        <p className="mt-3 text-center font-medium text-muted">Simple, transparent, on schedule.</p>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="card rounded-3xl p-7 hover:shadow-lift">
              <span className="inline-block rounded-full bg-panel px-3 py-1 text-xs font-bold text-muted ring-1 ring-inset ring-line">
                {s.n}
              </span>
              <h3 className="mt-5 text-lg font-bold">{s.title}</h3>
              <p className="mt-2 text-sm font-medium leading-relaxed text-muted">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="px-6 pb-24">
        <div className="mx-auto max-w-5xl rounded-[2rem] bg-ink px-6 py-20 text-center text-white">
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            Ready to hand off design work?
          </h2>
          <p className="mx-auto mt-3 max-w-xl font-medium text-white/60">
            Tell us about your business and we&apos;ll match you with a designer within 24 hours.
          </p>
          <form className="mx-auto mt-9 flex max-w-md flex-col gap-3 sm:flex-row">
            <input
              type="email"
              required
              placeholder="you@company.com"
              className="w-full rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-white/40 focus:ring-4 focus:ring-white/10 sm:flex-1"
            />
            <button
              type="button"
              className="shrink-0 rounded-full bg-white px-7 py-3 text-sm font-bold text-ink transition duration-200 hover:bg-stone-100 active:scale-[0.98]"
            >
              Contact Us
            </button>
          </form>
        </div>
      </section>

      <footer className="border-t border-line/70">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-6 py-8 text-sm font-medium text-faint sm:flex-row">
          <span>© {new Date().getFullYear()} RB Social Branding. All rights reserved.</span>
          <Link href="/login" className="transition hover:text-ink">Team Login</Link>
        </div>
      </footer>
    </div>
  );
}
