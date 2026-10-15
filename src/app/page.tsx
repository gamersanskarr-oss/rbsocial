import Link from "next/link";
import { Logo } from "@/components/logo";
import ScrollExpand from "@/components/scroll-expand";
import LightRays from "@/components/light-rays";
import TextLoop from "@/components/text-loop";
import SideRays from "@/components/side-rays";
import ContactArt from "@/components/contact-art";



/* Brand colors lifted from the logo: flame red-orange + deep navy */
const FLAME = "#ff4a36";
const NAVY = "#2b3a8f";

const services = [
  {
    n: "01",
    title: "Social Media Design",
    desc: "Feed posts, carousels and stories designed around your brand system — consistent grids, on a schedule you can plan around.",
    tags: ["Posts", "Carousels", "Stories"],
  },
  {
    n: "02",
    title: "Brand Identity",
    desc: "Logos, color systems, typography and guidelines that make your business instantly recognizable across every touchpoint.",
    tags: ["Logo", "Colors", "Guidelines"],
  },
  {
    n: "03",
    title: "Campaign Creatives",
    desc: "Ad creatives and campaign assets engineered to convert — festive sales, launches, offers and seasonal pushes.",
    tags: ["Ads", "Launches", "Offers"],
  },
  {
    n: "04",
    title: "Reels & Video Covers",
    desc: "Scroll-stopping reel covers, thumbnails and motion-ready frames that keep your video content looking premium.",
    tags: ["Reels", "Thumbnails", "Covers"],
  },
  {
    n: "05",
    title: "Web & Landing Pages",
    desc: "Fast, modern landing pages and microsites that match your brand and turn visitors into enquiries.",
    tags: ["Landing pages", "Microsites", "SEO-ready"],
  },
  {
    n: "06",
    title: "IT & Automation Support",
    desc: "Our IT team keeps your tools, pages and workflows running — form fixes, integrations and behind-the-scenes reliability.",
    tags: ["Fixes", "Integrations", "Support"],
  },
];

const steps = [
  { n: "01", title: "Brief", desc: "Share your goals and brand — we match a dedicated designer to your account within 24 hours." },
  { n: "02", title: "Design", desc: "Your designer crafts the creatives and shares a Canva link — review and comment in one place." },
  { n: "03", title: "Track", desc: "Every task lives in your dashboard with a real deadline — you always know what ships when." },
  { n: "04", title: "Deliver", desc: "Approve and receive final files, on time, every time. Monthly invoice, zero surprises." },
];

const stats = [
  { v: "1,200+", l: "posts delivered" },
  { v: "48h", l: "average turnaround" },
  { v: "95%", l: "on-time rate" },
  { v: "20+", l: "brands managed" },
];

const audiences = [
  "Cafés & Restaurants",
  "Fitness Studios",
  "Real Estate",
  "Retail & Fashion",
  "Clinics & Wellness",
  "Startups",
];

const plans = [
  {
    name: "Starter",
    price: "₹9,999",
    period: "/month",
    desc: "For businesses getting consistent on social.",
    features: ["8 posts / month", "1 platform", "2 revisions per post", "Monthly content calendar"],
    cta: "Start with Starter",
    featured: false,
  },
  {
    name: "Growth",
    price: "₹19,999",
    period: "/month",
    desc: "For brands that want to own their niche.",
    features: [
      "16 posts + stories / month",
      "2 platforms",
      "Unlimited revisions",
      "Reel covers & thumbnails",
      "Priority designer",
    ],
    cta: "Grow with Growth",
    featured: true,
  },
  {
    name: "Scale",
    price: "₹39,999",
    period: "/month",
    desc: "Full content ops with web and IT support.",
    features: [
      "30+ assets / month",
      "All platforms",
      "Landing pages & web fixes",
      "IT & automation support",
      "Dedicated account manager",
    ],
    cta: "Scale with Scale",
    featured: false,
  },
];

const faqs = [
  {
    q: "How fast will I get my designs?",
    a: "Standard turnaround is 48 hours per asset. Campaign batches are scheduled against a shared content calendar, and every task carries a real deadline in your dashboard.",
  },
  {
    q: "How do I review and approve designs?",
    a: "Your designer shares a Canva link for every task. Comment directly on the design — revisions happen in the same thread until you approve.",
  },
  {
    q: "Is there a lock-in contract?",
    a: "No. Plans are monthly retainers — pause, scale or cancel at any month boundary. Your brand assets stay yours.",
  },
  {
    q: "What if I need something urgent?",
    a: "Growth and Scale plans include priority queue. Tell us in the brief and urgent assets jump the line — usually delivered within 24 hours.",
  },
  {
    q: "How do payments work?",
    a: "Simple monthly retainers with a proper invoice for every cycle. Your billing month, due date and receipts are all tracked in the client portal.",
  },
];

const marqueeWords = [
  "Instagram posts",
  "Brand identities",
  "Ad creatives",
  "Reel covers",
  "Story designs",
  "Landing pages",
  "Campaign kits",
  "Web support",
];

export default function Home() {
  return (
    <div className="theme-dark min-h-screen bg-[#07080d] text-ink">
      {/* ══ Nav — floating glass capsule ═══════════════════════════════ */}
      <header className="absolute inset-x-0 top-4 z-40 px-4">
        <nav className="relative mx-auto flex max-w-4xl items-center justify-between overflow-hidden rounded-full border border-white/10 bg-white/[0.06] py-2 pl-4 pr-2 shadow-[0_20px_60px_-24px_rgba(0,0,0,0.8)] backdrop-blur-2xl backdrop-saturate-150">
          {/* glass sheen + top hairline */}
          <span aria-hidden className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white/[0.10] via-white/[0.03] to-transparent" />
          <span aria-hidden className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />

          <span className="relative flex items-center gap-2.5">
            <Logo size={32} />
            <span className="text-sm font-bold tracking-tight">RB Social Branding</span>
          </span>
          <div className="relative hidden items-center gap-0.5 text-[13px] font-medium text-muted md:flex">
            <a href="#services" className="rounded-full px-3.5 py-1.5 transition duration-200 hover:bg-white/10 hover:text-ink">Services</a>
            <a href="#work" className="rounded-full px-3.5 py-1.5 transition duration-200 hover:bg-white/10 hover:text-ink">Work</a>
            <a href="#process" className="rounded-full px-3.5 py-1.5 transition duration-200 hover:bg-white/10 hover:text-ink">Process</a>
            <a href="#pricing" className="rounded-full px-3.5 py-1.5 transition duration-200 hover:bg-white/10 hover:text-ink">Pricing</a>
            <a href="#faq" className="rounded-full px-3.5 py-1.5 transition duration-200 hover:bg-white/10 hover:text-ink">FAQ</a>
            <Link href="/careers" className="rounded-full px-3.5 py-1.5 transition duration-200 hover:bg-white/10 hover:text-ink">Careers</Link>
          </div>
          <Link
            href="/login"
            className="relative rounded-full px-5 py-2 text-[13px] font-bold text-white ring-1 ring-white/20 transition duration-200 hover:opacity-90 active:scale-[0.98]"
            style={{ background: `linear-gradient(135deg, ${FLAME}, #d92c1c)`, boxShadow: `0 8px 24px -10px ${FLAME}90` }}
          >
            Team Login
          </Link>
        </nav>
      </header>

      {/* ══ Hero ═══════════════════════════════════════════════════════ */}
      <section className="relative flex min-h-svh items-center overflow-hidden">
        {/* drifting gradient orbs — navy base, flame edge */}
        <div
          className="animate-drift pointer-events-none absolute -top-64 left-1/2 h-[640px] w-[1100px] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
          style={{ background: `radial-gradient(closest-side, ${NAVY}66, transparent)` }}
        />
        <div
          className="animate-drift-alt pointer-events-none absolute -right-40 top-24 h-[440px] w-[440px] rounded-full opacity-30 blur-3xl"
          style={{ background: `radial-gradient(closest-side, ${FLAME}55, transparent)` }}
        />
        <div
          className="animate-drift pointer-events-none absolute -left-52 top-72 h-[400px] w-[400px] rounded-full opacity-25 blur-3xl"
          style={{ background: `radial-gradient(closest-side, ${NAVY}88, transparent)`, animationDelay: "-8s" }}
        />
        <div
          className="animate-drift-alt pointer-events-none absolute bottom-0 left-1/3 h-[300px] w-[300px] rounded-full opacity-20 blur-3xl"
          style={{ background: `radial-gradient(closest-side, ${FLAME}44, transparent)`, animationDelay: "-5s" }}
        />

        {/* WebGL light rays — flame beams from the top, subtly mouse-reactive */}
        <div className="absolute inset-0">
          <LightRays
            raysOrigin="top-center"
            raysColor="#ff5a3c"
            raysSpeed={0.55}
            lightSpread={1.35}
            rayLength={1.7}
            fadeDistance={0.85}
            saturation={1.15}
            followMouse
            mouseInfluence={0.08}
            noiseAmount={0.06}
            distortion={0.15}
          />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-6xl px-6 py-24 text-center">
          <p className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold text-muted backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: FLAME }} />
              <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: FLAME }} />
            </span>
            Design team for growing businesses — onboarding this month
          </p>

          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-[1.04] tracking-tight md:text-6xl">
            Your brand,{" "}
            <span
              className="animate-gradient-pan bg-clip-text text-transparent"
              style={{ backgroundImage: `linear-gradient(100deg, ${FLAME} 10%, #ff8a5c 40%, #ffd7a8 50%, ${NAVY} 90%)` }}
            >
              designed daily
            </span>
            <br />
            and delivered on time.
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-sm font-medium leading-relaxed text-muted">
            RB Social Branding pairs your business with a dedicated graphic designer and a
            reliable IT team — every post tracked in one clear dashboard with real deadlines.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#contact"
              className="rounded-full px-7 py-3 text-sm font-bold text-white shadow-lg transition duration-200 hover:opacity-90 hover:shadow-xl active:scale-[0.98]"
              style={{ background: `linear-gradient(135deg, ${FLAME}, #d92c1c)`, boxShadow: `0 12px 32px -12px ${FLAME}80` }}
            >
              Get Started
            </a>
            <a
              href="#work"
              className="rounded-full border border-white/10 bg-white/5 px-7 py-3 text-sm font-bold text-ink backdrop-blur transition duration-200 hover:bg-white/10 active:scale-[0.98]"
            >
              See the work
            </a>
          </div>

          {/* stats strip */}
          <div className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 backdrop-blur md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.l} className="bg-[#0a0c12]/90 px-5 py-6">
                <p className="text-2xl font-extrabold tracking-tight" style={{ color: FLAME }}>
                  {s.v}
                </p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-faint">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ Curved moving text loop ════════════════════════════════════ */}
      <div className="relative h-[max(9rem,18vw)] overflow-hidden bg-transparent md:h-[11vw]">
        <div className="absolute left-1/2 top-1/2 w-[160%] -translate-x-1/2 -translate-y-1/2 md:w-full">
          <TextLoop
            text={marqueeWords.join("  ✦  ")}
            shape="wave"
            curviness={40}
            speed={42}
            fontSize={18}
            fontWeight={800}
            letterSpacing={2.5}
            separator=""
            color="#ffffff"
            ribbon
            ribbonGradient={["#ff8a5c", FLAME, "#d92c1c"]}
            ribbonWidth={40}
            pauseOnHover={false}
          />
        </div>
      </div>

      {/* ══ Services ═══════════════════════════════════════════════════ */}
      <section id="services" className="relative mx-auto max-w-6xl px-6 py-28">
        <div className="max-w-2xl">
          <p className="section-label" style={{ color: FLAME }}>Services</p>
          <h2 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">
            Everything your brand posts, ships and runs on.
          </h2>
          <p className="mt-4 text-lg font-medium text-muted">
            Six capabilities, one accountable team — retainer pricing, no per-design surprises.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <div
              key={s.n}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-7 transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.05]"
            >
              <div
                className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-0 blur-2xl transition duration-500 group-hover:opacity-30"
                style={{ background: `radial-gradient(closest-side, ${FLAME}, transparent)` }}
              />
              <div className="flex items-center justify-between">
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-extrabold"
                  style={{ background: `${NAVY}33`, color: "#9db1ff" }}
                >
                  {s.n}
                </span>
                <span className="h-px flex-1 mx-4 bg-gradient-to-r from-white/10 to-transparent" />
              </div>
              <h3 className="mt-6 text-lg font-bold tracking-tight">{s.title}</h3>
              <p className="mt-2.5 text-sm font-medium leading-relaxed text-muted">{s.desc}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {s.tags.map((t) => (
                  <span key={t} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-muted">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ Work showcase ══════════════════════════════════════════════ */}
      <section id="work" className="relative overflow-hidden border-y border-white/5">
        {/* ambient glow behind the grid */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 right-[10%] h-80 w-[520px] rounded-full opacity-25 blur-3xl"
          style={{ background: `radial-gradient(closest-side, ${NAVY}99, transparent)` }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 left-[6%] h-72 w-[420px] rounded-full opacity-20 blur-3xl"
          style={{ background: `radial-gradient(closest-side, ${FLAME}66, transparent)` }}
        />
        <div className="relative mx-auto max-w-6xl px-6 py-28">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="section-label" style={{ color: FLAME }}>Selected work</p>
              <h2 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">
                Industries we make look good.
              </h2>
            </div>
            <p className="max-w-sm text-sm font-medium text-muted">
              Every tile below is a live engagement — content systems we run month after month.
            </p>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {audiences.map((a, i) => (
              <div
                key={a}
                className="group relative h-56 overflow-hidden rounded-3xl border border-white/10 transition duration-300 hover:-translate-y-1.5 hover:border-white/25 hover:shadow-[0_24px_60px_-24px_rgba(0,0,0,0.8)]"
              >
                <div
                  className="absolute inset-0 transition duration-500 group-hover:scale-[1.04]"
                  style={{
                    background:
                      i % 3 === 0
                        ? `linear-gradient(135deg, ${NAVY}cc, #0a0c14 70%)`
                        : i % 3 === 1
                          ? `linear-gradient(135deg, ${FLAME}b3, #0a0c14 75%)`
                          : `linear-gradient(135deg, #101528, ${NAVY}55 60%, ${FLAME}44)`,
                  }}
                />
                {/* light sheen sweep on hover */}
                <div className="pointer-events-none absolute inset-0 -translate-x-[110%] bg-gradient-to-r from-transparent via-white/[0.12] to-transparent transition duration-700 ease-out group-hover:translate-x-[110%]" />
                <div
                  className={`animate-drift absolute -right-12 -top-12 h-36 w-36 rounded-full opacity-40 blur-2xl transition-opacity group-hover:opacity-70 ${i % 2 ? "" : "animate-drift-alt"}`}
                  style={{ background: "radial-gradient(closest-side, #ffffff66, transparent)" }}
                />
                {/* ghost index */}
                <span className="pointer-events-none absolute right-5 top-3 text-5xl font-extrabold tracking-tight text-white/[0.07] transition duration-300 group-hover:text-white/[0.14]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {/* live status pill */}
                <span className="absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/25 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white/60 backdrop-blur">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </span>
                  Live
                </span>
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-6">
                  <div>
                    <p className="text-lg font-bold tracking-tight text-white">{a}</p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-white/50">
                      Content system · active
                    </p>
                  </div>
                  <span className="flex h-9 w-9 translate-y-1 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white opacity-0 backdrop-blur transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    ↗
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ Process ════════════════════════════════════════════════════ */}
      <section id="process" className="mx-auto max-w-6xl px-6 py-28">
        <div className="max-w-2xl">
          <p className="section-label" style={{ color: FLAME }}>Process</p>
          <h2 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">
            How it works.
          </h2>
          <p className="mt-4 text-lg font-medium text-muted">
            Simple, transparent, on schedule — the same four steps for every brand.
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.n} className="relative rounded-3xl border border-white/10 bg-white/[0.03] p-7">
              {i < steps.length - 1 && (
                <span className="absolute right-[-13px] top-1/2 z-10 hidden h-6 w-6 -translate-y-1/2 items-center justify-center md:flex">
                  <span className="h-px w-6 bg-gradient-to-r from-white/20 to-transparent" />
                </span>
              )}
              <span
                className="inline-block rounded-full px-3 py-1 text-xs font-extrabold"
                style={{ background: `${FLAME}1f`, color: FLAME }}
              >
                {s.n}
              </span>
              <h3 className="mt-5 text-lg font-bold tracking-tight">{s.title}</h3>
              <p className="mt-2 text-sm font-medium leading-relaxed text-muted">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ Dashboard teaser ═══════════════════════════════════════════ */}
      <section className="border-y border-white/5">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 py-28 lg:grid-cols-2">
          <div>
            <p className="section-label" style={{ color: FLAME }}>The dashboard</p>
            <h2 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">
              Not just pretty posts — a real delivery system.
            </h2>
            <p className="mt-4 text-lg font-medium leading-relaxed text-muted">
              Every task, deadline, revision and invoice lives in your client portal. You see
              exactly what&apos;s in design, what&apos;s queued and what&apos;s delivered — no
              chasing anyone on WhatsApp.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                "Live task board with real deadlines per post",
                "Approve designs from a single Canva link",
                "Monthly invoices with downloadable receipts",
                "Content calendar for every scheduled post",
              ].map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm font-medium text-muted">
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: `${FLAME}1f` }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke={FLAME} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* stylized dashboard mock */}
          <div className="relative">
            <div
              className="pointer-events-none absolute -inset-8 rounded-[2.5rem] opacity-40 blur-3xl"
              style={{ background: `radial-gradient(closest-side, ${NAVY}55, transparent)` }}
            />
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0c0e15] shadow-2xl">
              <div className="flex items-center gap-2 border-b border-white/5 px-5 py-3.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                <span className="ml-3 text-xs font-semibold text-faint">rbsocial — client portal</span>
              </div>
              <div className="space-y-3 p-5">
                {[
                  { t: "Diwali sale carousel", c: "Acme Cafe", s: "In design", tone: FLAME },
                  { t: "Membership reel cover", c: "GlowUp Fitness", s: "In review", tone: "#fbbf24" },
                  { t: "Project listing flyer", c: "Nova Realty", s: "Delivered", tone: "#34d399" },
                  { t: "Weekend story set", c: "Acme Cafe", s: "Queued", tone: "#8b8f9c" },
                ].map((r) => (
                  <div key={r.t} className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3.5">
                    <div>
                      <p className="text-sm font-semibold text-ink">{r.t}</p>
                      <p className="text-xs font-medium text-faint">{r.c}</p>
                    </div>
                    <span
                      className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                      style={{ background: `${r.tone}1f`, color: r.tone }}
                    >
                      {r.s}
                    </span>
                  </div>
                ))}
                <div className="rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-faint">
                    <span>OCTOBER RETAINER</span>
                    <span style={{ color: FLAME }}>DUE IN 5 DAYS</span>
                  </div>
                  <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/5">
                    <div className="h-full w-2/3 rounded-full" style={{ background: `linear-gradient(90deg, ${NAVY}, ${FLAME})` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ Pricing ════════════════════════════════════════════════════ */}
      <section id="pricing" className="relative py-28">
        {/* animated light rays — full-width background, edge to edge */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <SideRays
            origin="top-right"
            rayColor1={FLAME}
            rayColor2={NAVY}
            speed={2}
            intensity={1.4}
            spread={2.4}
            saturation={1.2}
            blend={0.6}
            opacity={0.5}
          />
        </div>
        <div className="relative mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
          <p className="section-label" style={{ color: FLAME }}>Pricing</p>
          <h2 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">
            Monthly retainers. Zero surprises.
          </h2>
          <p className="mt-4 text-lg font-medium text-muted">
            Pick a pace — scale up or pause at any month boundary.
          </p>
        </div>

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-3xl border p-8 transition duration-300 hover:-translate-y-1 ${
                p.featured
                  ? "border-transparent bg-[#0d101c]"
                  : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"
              }`}
              style={p.featured ? { boxShadow: `0 0 0 1px ${FLAME}55, 0 24px 60px -24px ${FLAME}40` } : undefined}
            >
              {p.featured && (
                <span
                  className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white"
                  style={{ background: `linear-gradient(135deg, ${FLAME}, #d92c1c)` }}
                >
                  Most popular
                </span>
              )}
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted">{p.name}</h3>
              <p className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold tracking-tight">{p.price}</span>
                <span className="text-sm font-medium text-faint">{p.period}</span>
              </p>
              <p className="mt-2 text-sm font-medium text-muted">{p.desc}</p>
              <ul className="mt-7 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm font-medium text-muted">
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: p.featured ? FLAME : NAVY }} />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="#contact"
                className={`mt-8 block rounded-xl px-5 py-3 text-center text-sm font-bold transition duration-200 active:scale-[0.98] ${
                  p.featured
                    ? "text-white hover:opacity-90"
                    : "border border-white/10 bg-white/5 text-ink hover:bg-white/10"
                }`}
                style={p.featured ? { background: `linear-gradient(135deg, ${FLAME}, #d92c1c)` } : undefined}
              >
                {p.cta}
              </a>
            </div>
          ))}
          </div>
        </div>
      </section>

      {/* ══ FAQ ════════════════════════════════════════════════════════ */}
      <section id="faq" className="relative">
        <div className="mx-auto max-w-3xl px-6 pb-28 pt-32">
          <div className="text-center">
            <p className="section-label" style={{ color: FLAME }}>FAQ</p>
            <h2 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">
              Questions, answered.
            </h2>
          </div>
          <div className="mt-12 space-y-3">
            {faqs.map((f) => (
              <details key={f.q} className="group rounded-2xl border border-white/10 bg-white/[0.03] transition duration-200 hover:border-white/20 open:bg-white/[0.05]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-sm font-bold text-ink [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-lg font-bold leading-none transition duration-300 group-open:rotate-45"
                    style={{ background: `${FLAME}1f`, color: FLAME }}
                  >
                    +
                  </span>
                </summary>
                <p className="px-6 pb-6 text-sm font-medium leading-relaxed text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ══ Contact CTA ════════════════════════════════════════════════ */}
      <section
        id="contact"
        className="relative"
        style={{ background: "linear-gradient(180deg, transparent 0%, transparent 45%, #5c1408 78%, #932312 100%)" }}
      >
        <ScrollExpand
          useWindowScroll
          media={<ContactArt />}
          title="Your brand, upgraded"
          scrollHint="Scroll to expand"
          startWidth={38}
          startHeight={54}
          startRadius={48}
          mediaZoom={1.28}
          scrollDistance={0.65}
          holdDistance={0.25}
          smoothing={0.1}
          overlayScrim={0.7}
        >
          <div className="pointer-events-none absolute inset-0">
            <LightRays
              raysOrigin="top-center"
              raysColor="#ff5a3c"
              raysSpeed={0.45}
              lightSpread={1.0}
              rayLength={1.2}
              fadeDistance={0.9}
              saturation={1.1}
              followMouse
              mouseInfluence={0.1}
              noiseAmount={0.05}
              distortion={0.12}
            />
          </div>
          <div className="relative max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-white/80 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: FLAME }} />
              Start a project
            </p>
            <h2 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight text-white md:text-6xl">
              Ready to hand off{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: `linear-gradient(100deg, #ff8a5c, ${FLAME} 60%, #ffd7a8)` }}
              >
                design work?
              </span>
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-base font-medium leading-relaxed text-white/65">
              Tell us about your business — we&apos;ll match you with a dedicated
              designer within 24 hours.
            </p>
            <form className="mx-auto mt-9 flex max-w-md items-center gap-1.5 rounded-full border border-white/15 bg-black/30 p-1.5 backdrop-blur-xl">
              <input
                type="email"
                required
                placeholder="you@company.com"
                className="w-full min-w-0 flex-1 rounded-full bg-transparent px-5 py-3 text-sm text-white outline-none placeholder:text-white/40"
              />
              <button
                type="button"
                className="shrink-0 rounded-full px-7 py-3 text-sm font-bold text-white transition duration-200 hover:opacity-90 active:scale-[0.98]"
                style={{ background: `linear-gradient(135deg, ${FLAME}, #d92c1c)`, boxShadow: `0 10px 30px -10px ${FLAME}90` }}
              >
                Contact Us
              </button>
            </form>
          </div>
        </ScrollExpand>
      </section>

      {/* ══ Footer — deep flame red, merged into the expand section ════ */}
      <footer className="relative overflow-hidden" style={{ background: "linear-gradient(180deg, #932312 0%, #7a1c0f 55%, #571107 100%)" }}>
        {/* soft top glow so it blends out of the artwork above */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/20 to-transparent" />

        <div className="relative mx-auto max-w-6xl px-6 pb-10 pt-20">
          <div className="flex flex-col justify-between gap-12 md:flex-row md:items-start">
            <div className="max-w-sm">
              <span className="flex items-center gap-3">
                <Logo size={48} rounded="rounded-2xl" />
                <span className="text-base font-extrabold tracking-tight text-white">RB Social Branding</span>
              </span>
              <p className="mt-5 text-sm font-medium leading-relaxed text-white/60">
                A design agency and delivery system for growing businesses — powered by ROSHAN
                BHARAT.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-14">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">Services</p>
                <ul className="mt-5 space-y-3 text-sm font-semibold text-white/75">
                  {services.slice(0, 4).map((s) => (
                    <li key={s.title}>
                      <a href="#services" className="transition duration-200 hover:text-white">{s.title}</a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">Company</p>
                <ul className="mt-5 space-y-3 text-sm font-semibold text-white/75">
                  <li><a href="#process" className="transition duration-200 hover:text-white">Process</a></li>
                  <li><a href="#pricing" className="transition duration-200 hover:text-white">Pricing</a></li>
                  <li><a href="#faq" className="transition duration-200 hover:text-white">FAQ</a></li>
                  <li><Link href="/careers" className="transition duration-200 hover:text-white">Careers</Link></li>
                  <li><Link href="/login" className="transition duration-200 hover:text-white">Team Login</Link></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-16 flex flex-col items-center justify-between gap-3 border-t border-white/15 pt-7 text-[13px] font-medium text-white/50 sm:flex-row">
            <span>© {new Date().getFullYear()} RB Social Branding. All rights reserved.</span>
            <span className="flex items-center gap-1.5">
              Powered by
              <span className="font-bold text-white">ROSHAN</span>
              <span className="font-bold" style={{ color: "#ffd7a8" }}>BHARAT</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
