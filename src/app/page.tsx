import Link from "next/link";
import { Logo } from "@/components/logo";
import ScrollExpand from "@/components/scroll-expand";
import ScrollReveal from "@/components/scroll-reveal";
import FlexCarousel from "@/components/flex-carousel";
import AccordionGallery from "@/components/accordion-gallery";
import TextLoop from "@/components/text-loop";

/* Brand colors lifted from the logo: crimson red + deep navy */
const FLAME = "#e52b3f";
const NAVY = "#1e2f7d";

const services = [
  {
    n: "01",
    title: "Branding",
    desc: "Brand audits, identity systems and guidelines that make your business instantly recognizable — and impossible to ignore.",
    tags: ["Logo", "Identity system", "Guidelines", "Rebranding"],
  },
  {
    n: "02",
    title: "Design",
    desc: "Feed posts, carousels, stories and campaign creatives that don't just look good — they perform, convert and build equity.",
    tags: ["Posts", "Carousels", "Stories", "Ad creatives", "Print"],
  },
  {
    n: "03",
    title: "Social Media",
    desc: "Monthly content engines — calendars, captions and creatives on a schedule you can actually plan around.",
    tags: ["Content calendar", "Captions", "Scheduling"],
  },
  {
    n: "04",
    title: "Video & Reels",
    desc: "Scroll-stopping reel covers, thumbnails, edits and shoot-plus-edit packages for brands that need motion.",
    tags: ["Reel covers", "Video edits", "Videography", "Shoot + Edit"],
  },
  {
    n: "05",
    title: "Web & Landing Pages",
    desc: "Fast, modern landing pages and microsites that match your brand and turn visitors into enquiries.",
    tags: ["Landing pages", "Microsites", "SEO-ready"],
  },
  {
    n: "06",
    title: "IT & Support",
    desc: "Our IT team keeps your tools, pages and workflows running — fixes, integrations and quiet reliability behind the scenes.",
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

const works = [
  { img: "/work/acme.jpg", name: "Acme Cafe", tag: "Social media · retainer" },
  { img: "/work/glowup.jpg", name: "GlowUp Fitness", tag: "Branding + content" },
  { img: "/work/nova.jpg", name: "Nova Realty", tag: "Campaign creatives" },
  { img: "/work/pixel.jpg", name: "Pixel & Co.", tag: "Identity system" },
  { img: "/work/urban.jpg", name: "Urban Nest", tag: "Reels & covers" },
  { img: "/work/brightly.jpg", name: "Brightly", tag: "Web + social" },
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
    <div className="min-h-screen bg-[#f6f3ee] text-[#141417]">
      {/* ══ Nav — socials left · logo centered · menu right ════════════ */}
      <header className="absolute inset-x-0 top-0 z-40">
        <nav className="relative mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center px-6 py-5">
          {/* left — social links */}
          <div className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-[0.14em] text-[#141417]">
            {[
              { l: "WA", href: "https://wa.me/919999999999" },
              { l: "IG", href: "https://instagram.com/" },
              { l: "LI", href: "https://linkedin.com/" },
              { l: "Email", href: "mailto:hello@rbsocial.co" },
            ].map((s) => (
              <a key={s.l} href={s.href} className="hidden transition duration-200 hover:text-[#e52b3f] sm:inline">
                {s.l}
              </a>
            ))}
          </div>

          {/* center — logo */}
          <a href="#" className="flex items-center gap-2.5 justify-self-center">
            <Logo size={34} />
            <span className="text-[15px] font-extrabold tracking-tight">RB Social Branding</span>
          </a>

          {/* right — hamburger menu */}
          <div className="relative justify-self-end">
            <details className="group/menu relative">
              <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-full border border-black/10 bg-white/70 shadow-sm backdrop-blur transition duration-200 hover:bg-white [&::-webkit-details-marker]:hidden">
                <span className="relative flex w-5 flex-col items-end gap-[5px]">
                  <span className="h-[2px] w-5 rounded bg-[#141417] transition-all duration-300 group-open/menu:w-5 group-open/menu:rotate-45 group-open/menu:translate-y-[7px]" />
                  <span className="h-[2px] w-3.5 rounded bg-[#e52b3f] transition-all duration-300 group-open/menu:opacity-0" />
                  <span className="h-[2px] w-5 rounded bg-[#141417] transition-all duration-300 group-open/menu:-rotate-45 group-open/menu:-translate-y-[7px]" />
                </span>
              </summary>
              <div className="absolute right-0 top-14 w-64 overflow-hidden rounded-3xl border border-black/[0.08] bg-white/90 p-3 shadow-[0_30px_70px_-24px_rgba(0,0,0,0.4)] backdrop-blur-2xl">
                {[
                  ["Services", "#services"],
                  ["Work", "#work"],
                  ["Process", "#process"],
                  ["Pricing", "#pricing"],
                  ["FAQ", "#faq"],
                  ["Contact", "#contact"],
                ].map(([l, href]) => (
                  <a key={l} href={href} className="block rounded-xl px-4 py-2.5 text-sm font-bold text-[#141417] transition duration-200 hover:bg-black/[0.05]">
                    {l}
                  </a>
                ))}
                <Link
                  href="/login"
                  className="mt-2 block rounded-xl px-4 py-3 text-center text-sm font-bold text-white transition duration-200 hover:opacity-90"
                  style={{ background: `linear-gradient(135deg, ${FLAME}, #bd1f30)` }}
                >
                  Team Login
                </Link>
              </div>
            </details>
          </div>
        </nav>
      </header>

      {/* ══ Hero — editorial, oversized type ═══════════════════════════ */}
      <section className="relative overflow-hidden">
        {/* soft washes — light theme ambience */}
        <div
          className="pointer-events-none absolute -top-40 right-[-10%] h-[520px] w-[720px] rounded-full opacity-50 blur-3xl"
          style={{ background: `radial-gradient(closest-side, ${FLAME}30, transparent)` }}
        />
        <div
          className="pointer-events-none absolute -left-40 top-64 h-[420px] w-[520px] rounded-full opacity-40 blur-3xl"
          style={{ background: `radial-gradient(closest-side, ${NAVY}22, transparent)` }}
        />

        <div className="relative mx-auto w-full max-w-6xl px-6 pb-16 pt-36 md:pt-44">
          <p className="mb-8 text-xs font-bold uppercase tracking-[0.28em] text-[#8a8a94]">
            RB Social Branding — design &amp; content studio
          </p>

          <h1 className="text-[13.5vw] font-extrabold leading-[0.98] tracking-tight text-[#141417] sm:text-7xl md:text-[6.8rem]">
            Design that
            <br />
            ships{" "}
            <span
              className="animate-gradient-pan bg-clip-text text-transparent"
              style={{ backgroundImage: `linear-gradient(100deg, ${NAVY} 10%, #4a5db8 45%, #8fa0e0 55%, ${NAVY} 95%)` }}
            >
              on time,
            </span>
            <br />
            <span className="italic font-bold" style={{ color: FLAME }}>every</span> single month.
          </h1>

          <div className="mt-10 flex flex-wrap items-center gap-8">
            <p className="max-w-md text-[15px] font-medium leading-relaxed text-[#5b5b66]">
              A dedicated designer, a live delivery dashboard and one monthly invoice —
              the whole content engine for your brand, handled.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="#contact"
                className="rounded-full px-7 py-3 text-sm font-bold text-white shadow-lg transition duration-200 hover:opacity-90 hover:shadow-xl active:scale-[0.98]"
                style={{ background: `linear-gradient(135deg, ${FLAME}, #bd1f30)`, boxShadow: `0 12px 32px -12px ${FLAME}80` }}
              >
                Start a project
              </a>
              <a
                href="#services"
                className="rounded-full border border-black/10 bg-white/60 px-7 py-3 text-sm font-bold text-[#141417] backdrop-blur transition duration-200 hover:bg-white active:scale-[0.98]"
              >
                What we do ↓
              </a>
            </div>
          </div>
        </div>

        {/* showreel band — wide image card */}
        <div className="relative mx-auto max-w-6xl px-6 pb-20">
          <div className="group relative overflow-hidden rounded-[2rem] border border-black/[0.08] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.35)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/hero-marketing.jpg"
              alt="Marketing dashboard and campaign artwork"
              className="h-[52vw] max-h-[540px] min-h-[280px] w-full object-cover transition duration-700 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />
            <span className="absolute left-6 top-6 rounded-full border border-white/20 bg-black/30 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white/85 backdrop-blur">
              Showreel · 2026
            </span>
            <span className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-2xl transition duration-300 group-hover:scale-110">
              <svg viewBox="0 0 24 24" fill="#141417" className="ml-1 h-7 w-7" aria-hidden>
                <path d="M8 5.5v13l11-6.5z" />
              </svg>
            </span>
            <span className="absolute bottom-6 left-6 text-sm font-bold text-white">
              A year of launches, rebrands &amp; daily content — in one reel
            </span>
          </div>

          {/* client accordion gallery */}
          <div className="mt-14">
            <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.22em] text-[#8a8a94]">
              Brands we run content for — hover to peek inside
            </p>
            <AccordionGallery
              items={[
                { image: "/work/acme.jpg", label: "Acme Cafe" },
                { image: "/work/glowup.jpg", label: "GlowUp Fitness" },
                { image: "/work/nova.jpg", label: "Nova Realty" },
                { image: "/work/pixel.jpg", label: "Pixel & Co." },
                { image: "/work/urban.jpg", label: "Urban Nest" },
                { image: "/work/brightly.jpg", label: "Brightly" },
              ]}
              height={300}
              gap={12}
              radius={20}
              accentColor={FLAME}
              expandRatio={0.5}
              tilt={6}
              grayscale
              trigger="hover"
            />
          </div>
        </div>
      </section>

      {/* ══ Curved moving text loop ════════════════════════════════════ */}
      <div className="relative h-[max(9rem,18vw)] overflow-hidden md:h-[11vw]">
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
            ribbonGradient={[NAVY, FLAME, NAVY]}
            ribbonWidth={40}
            pauseOnHover={false}
          />
        </div>
      </div>

      {/* ══ Statement + performance snapshot ═══════════════════════════ */}
      <section className="relative mx-auto max-w-6xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: FLAME }}>
            Why us
          </p>
          <ScrollReveal
            containerClassName="mt-3"
            textClassName="text-4xl font-extrabold tracking-tight leading-[1.12] text-[#141417] md:text-5xl"
            baseOpacity={0.12}
            baseRotation={2}
          >
            Most agencies add noise. We ship on schedule.
          </ScrollReveal>
          <p className="mt-5 text-lg font-medium leading-relaxed text-[#5b5b66]">
            Built for brands that want more than just &ldquo;creative&rdquo; — a real
            delivery system with real deadlines, tracked in the open.
          </p>
        </div>
        <div className="mt-12">
          <div className="mx-auto grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-3xl border border-black/10 bg-black/10 md:grid-cols-4">
            {stats.map((s, i) => (
              <div key={s.l} className="bg-white px-6 py-6">
                <p className="text-3xl font-extrabold tracking-tight" style={{ color: i % 2 ? NAVY : FLAME }}>
                  {s.v}
                </p>
                <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#8a8a94]">
                  {s.l}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ Services — numbered editorial rows ═════════════════════════ */}
      <section id="services" className="relative mx-auto max-w-6xl px-6 pb-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: FLAME }}>
            Services
          </p>
          <h2 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">
            Creative and delivery expertise, perfectly aligned.
          </h2>
          <p className="mt-4 text-lg font-medium text-[#5b5b66]">
            Six capabilities, one accountable team — retainer pricing, no per-design surprises.
          </p>
        </div>

        <div className="mt-14 border-t border-black/10">
          {services.map((s) => (
            <div
              key={s.n}
              className="group relative border-b border-black/10 py-7 transition duration-300 md:py-9"
            >
              <div
                className="pointer-events-none absolute inset-y-0 left-0 w-0 transition-all duration-500 group-hover:w-1.5"
                style={{ background: `linear-gradient(180deg, ${FLAME}, ${NAVY})` }}
              />
              <div className="grid items-start gap-4 pl-5 md:grid-cols-[90px_1fr_1.4fr_auto] md:items-center md:gap-8">
                <span className="text-sm font-extrabold tracking-wider" style={{ color: Number(s.n) % 2 ? NAVY : FLAME }}>
                  {"{"}{s.n}{"}"}
                </span>
                <h3 className="text-2xl font-extrabold tracking-tight transition duration-300 group-hover:translate-x-1 md:text-3xl">
                  {s.title} <span className="text-[#141417]/30">—</span>
                </h3>
                <p className="max-w-xl text-sm font-medium leading-relaxed text-[#5b5b66]">
                  {s.desc}
                </p>
                <div className="flex max-w-xs flex-wrap gap-1.5 md:justify-end">
                  {s.tags.map((t) => (
                    <span key={t} className="whitespace-nowrap rounded-full border border-black/10 bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-[#5b5b66]">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ CTA pill banner ════════════════════════════════════════════ */}
      <div className="mx-auto max-w-6xl px-6 pb-10">
        <a
          href="#contact"
          className="group flex items-center justify-between gap-4 rounded-full border border-black/10 bg-white px-8 py-5 shadow-sm transition duration-300 hover:shadow-lg"
        >
          <span className="text-lg font-extrabold tracking-tight md:text-2xl">
            <span className="italic text-[#141417]/40">Ready to create?</span>{" "}
            <span style={{ color: NAVY }}>Let&apos;s talk.</span>
          </span>
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white transition duration-300 group-hover:scale-110"
            style={{ background: `linear-gradient(135deg, ${NAVY}, #141f5c)` }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
              <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
            </svg>
          </span>
        </a>
      </div>

      {/* ══ Work — project image grid ══════════════════════════════════ */}
      <section id="work" className="relative mx-auto max-w-6xl px-6 py-24">
        <div className="scroll-rise mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: FLAME }}>
            Selected work
          </p>
          <h2 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">
            Projects that started with a challenge.
          </h2>
          <p className="mt-4 text-lg font-medium text-[#5b5b66]">
            Every engagement below is a live content system we run month after month.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {works.map((w, i) => (
            <a
              key={w.name}
              href="#contact"
              className="scroll-rise group block"
              style={{ animationRange: `entry 0% entry ${42 + i * 7}%` }}
            >
              <div
                className="scroll-clip relative overflow-hidden rounded-[1.25rem] border border-black/[0.08] bg-white"
                style={{ animationRange: `entry 0% entry ${50 + i * 7}%` }}
              >
                {/* HUD corner ticks */}
                <span className="pointer-events-none absolute left-3 top-3 z-10 h-3.5 w-3.5 border-l-2 border-t-2 border-white/70 opacity-0 transition duration-300 group-hover:opacity-100" />
                <span className="pointer-events-none absolute right-3 top-3 z-10 h-3.5 w-3.5 border-r-2 border-t-2 border-white/70 opacity-0 transition duration-300 group-hover:opacity-100" />
                <span className="pointer-events-none absolute bottom-3 left-3 z-10 h-3.5 w-3.5 border-b-2 border-l-2 border-white/70 opacity-0 transition duration-300 group-hover:opacity-100" />
                <span className="pointer-events-none absolute bottom-3 right-3 z-10 h-3.5 w-3.5 border-b-2 border-r-2 border-white/70 opacity-0 transition duration-300 group-hover:opacity-100" />

                <div className="relative overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={w.img}
                    alt={`${w.name} — project`}
                    className="scroll-zoom aspect-[16/10] w-full object-cover transition duration-700 ease-out group-hover:scale-[1.08]"
                    style={{ animationRange: `entry 0% entry ${60 + i * 7}%` }}
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-60 transition duration-500 group-hover:opacity-90" />
                  {/* scanline sweep on hover */}
                  <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent opacity-0 transition duration-500 group-hover:animate-[wave-scroll_2.4s_linear_infinite] group-hover:opacity-100" />
                  <span
                    className="absolute bottom-3 left-3.5 rounded-md px-2 py-1 font-mono text-[10px] font-bold tracking-[0.2em] text-white backdrop-blur-sm"
                    style={{ fontFamily: "ui-monospace, monospace", background: `${NAVY}cc` }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="absolute right-3.5 top-3.5 flex h-8 w-8 translate-y-1 items-center justify-center rounded-full bg-white text-xs text-[#141417] opacity-0 shadow-lg transition duration-400 group-hover:translate-y-0 group-hover:opacity-100">
                    ↗
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <p className="truncate text-sm font-extrabold tracking-tight">{w.name}</p>
                  <p className="shrink-0 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8a8a94]">
                    {w.tag}
                  </p>
                </div>
                {/* bottom accent — alternates flame/navy */}
                <span
                  className="absolute inset-x-0 bottom-0 h-[2px] w-0 transition-all duration-500 group-hover:w-full"
                  style={{ background: i % 2 ? `linear-gradient(90deg, ${NAVY}, #4a5db8)` : `linear-gradient(90deg, ${FLAME}, #ff7a6d)` }}
                />
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ══ Portfolio — WebGL flex carousel ════════════════════════════ */}
      <section className="relative py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="scroll-rise mx-auto max-w-2xl text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: FLAME }}>
              Portfolio
            </p>
            <h2 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">
              Drag through the work.
            </h2>
            <p className="mt-4 text-lg font-medium text-[#5b5b66]">
              Pull, flick, click to focus — Esc to close.
            </p>
          </div>
        </div>
        <div className="mt-12 h-[420px] w-full md:h-[520px]">
          <FlexCarousel
            items={[
              { src: "/work/acme.jpg", title: "Acme Cafe", subtitle: "Social media retainer" },
              { src: "/work/glowup.jpg", title: "GlowUp Fitness", subtitle: "Branding + content" },
              { src: "/work/nova.jpg", title: "Nova Realty", subtitle: "Campaign creatives" },
              { src: "/work/pixel.jpg", title: "Pixel & Co.", subtitle: "Identity system" },
              { src: "/work/urban.jpg", title: "Urban Nest", subtitle: "Reels & covers" },
              { src: "/work/brightly.jpg", title: "Brightly", subtitle: "Web + social" },
              { src: "/hero-marketing.jpg", title: "Analytics", subtitle: "Growth dashboards" },
              { src: "/contact.jpg", title: "Studio", subtitle: "The team at work" },
            ]}
            preset="arch"
            intro="rise"
            cardHeight={0.72}
            gap={18}
            radius={24}
            captureWheel={false}
            captions
          />
        </div>
      </section>

      {/* ══ Why us — feature grid ══════════════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: FLAME }}>
            Partnership, not just projects
          </p>
          <ScrollReveal
            containerClassName="mt-3"
            textClassName="text-4xl font-extrabold tracking-tight leading-[1.15] text-[#141417] md:text-5xl"
            baseOpacity={0.12}
            baseRotation={2}
          >
            Clear scope, clear deadlines, clear invoices. No surprises.
          </ScrollReveal>
          <p className="mt-4 text-lg font-medium leading-relaxed text-[#5b5b66]">
            Your vision, our creativity — unlimited iterations within your plan, and a
            single point of contact for everything.
          </p>
        </div>
        <div className="mt-12">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { t: "Flat monthly pricing", d: "Predictable retainer — the same invoice every cycle, no per-design math." },
              { t: "Live dashboard", d: "Every task, deadline and revision tracked in one portal — nothing hides in chats." },
              { t: "95% on-time rate", d: "Deadlines are real here. The rare miss is visible to you, not buried." },
              { t: "Dedicated designer", d: "One designer learns your brand and owns your account end to end." },
            ].map((f) => (
              <div
                key={f.t}
                className="rounded-3xl border border-black/[0.08] bg-white p-6 shadow-sm transition duration-300 hover:shadow-md"
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: `${NAVY}14` }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </span>
                <h3 className="mt-4 text-base font-bold tracking-tight">{f.t}</h3>
                <p className="mt-1.5 text-sm font-medium leading-relaxed text-[#5b5b66]">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ Process ════════════════════════════════════════════════════ */}
      <section id="process" className="border-y border-black/[0.07] bg-white/60">
        <div className="mx-auto max-w-6xl px-6 py-28">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: FLAME }}>
              Process
            </p>
            <ScrollReveal
              containerClassName="mt-3"
              textClassName="text-4xl font-extrabold tracking-tight leading-[1.12] text-[#141417] md:text-5xl"
              baseOpacity={0.12}
              baseRotation={2}
            >
              Simple, transparent, on schedule — four steps, every brand.
            </ScrollReveal>
            <p className="mt-4 text-lg font-medium text-[#5b5b66]">
              The same four steps for every brand — no guesswork.
            </p>
          </div>

          <div className="relative mt-14">
            {/* scroll-driven progress line behind the cards */}
            <div className="absolute left-0 right-0 top-1/2 hidden h-px -translate-y-1/2 bg-black/[0.08] md:block">
              <div
                className="scroll-fill h-full"
                style={{ background: `linear-gradient(90deg, ${FLAME}, ${NAVY})` }}
              />
            </div>

            <div className="relative grid gap-5 md:grid-cols-4">
              {steps.map((s, i) => (
                <div
                  key={s.n}
                  className="scroll-rise group relative overflow-hidden rounded-3xl border border-black/[0.08] bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-[0_24px_50px_-24px_rgba(0,0,0,0.28)]"
                  style={{ animationRange: `entry 0% entry ${48 + i * 12}%` }}
                >
                  {/* ghost index */}
                  <span className="pointer-events-none absolute -right-1 -top-4 select-none text-[5.5rem] font-extrabold leading-none tracking-tighter text-black/[0.05] transition duration-500 group-hover:text-[#e52b3f12]">
                    {s.n}
                  </span>
                  {/* top accent line grows on hover */}
                  <span
                    className="absolute left-0 top-0 h-[3px] w-0 rounded-r transition-all duration-500 group-hover:w-full"
                    style={{ background: `linear-gradient(90deg, ${FLAME}, #ff7a6d)` }}
                  />
                  <span
                    className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl text-xs font-extrabold transition duration-300 group-hover:scale-110"
                    style={i % 2 ? { background: `${NAVY}14`, color: NAVY } : { background: `${FLAME}1a`, color: FLAME }}
                  >
                    {s.n}
                  </span>
                  <h3 className="mt-5 text-lg font-bold tracking-tight">{s.title}</h3>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-[#5b5b66]">{s.desc}</p>
                  <span
                    className="mt-4 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.14em] opacity-0 transition duration-300 group-hover:opacity-100"
                    style={{ color: FLAME }}
                  >
                    Step {s.n} →
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ Pricing ════════════════════════════════════════════════════ */}
      <section id="pricing" className="relative py-28">
        <div className="relative mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: FLAME }}>
              Pricing
            </p>
            <h2 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">
              Monthly retainers. Zero surprises.
            </h2>
            <p className="mt-4 text-lg font-medium text-[#5b5b66]">
              Pick a pace — scale up or pause at any month boundary.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl gap-6 md:grid-cols-3">
            {plans.map((p) => (
              <div
                key={p.name}
                className={`scroll-rise group relative flex flex-col rounded-[1.75rem] p-8 transition duration-300 hover:-translate-y-1.5 ${
                  p.featured
                    ? "text-white shadow-[0_30px_70px_-30px_rgba(30,47,125,0.55)]"
                    : "border border-black/[0.07] bg-white shadow-sm hover:shadow-[0_24px_50px_-28px_rgba(0,0,0,0.25)]"
                }`}
                style={p.featured ? { background: `linear-gradient(160deg, ${NAVY} 0%, #141f5c 70%, #101845 100%)` } : undefined}
              >
                {p.featured && (
                  <span
                    className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-white shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${FLAME}, #bd1f30)` }}
                  >
                    Most popular
                  </span>
                )}

                <div className="flex items-baseline justify-between">
                  <h3 className={`text-[11px] font-extrabold uppercase tracking-[0.22em] ${p.featured ? "text-white/60" : "text-[#8a8a94]"}`}>
                    {p.name}
                  </h3>
                  {p.featured && <span className="h-2 w-2 rounded-full" style={{ background: FLAME }} />}
                </div>

                <p className="mt-5 flex items-baseline gap-1.5">
                  <span className="text-[2.6rem] font-extrabold leading-none tracking-tight">{p.price}</span>
                  <span className={`text-sm font-semibold ${p.featured ? "text-white/50" : "text-[#8a8a94]"}`}>{p.period}</span>
                </p>
                <p className={`mt-2.5 text-[13px] font-medium leading-relaxed ${p.featured ? "text-white/65" : "text-[#5b5b66]"}`}>
                  {p.desc}
                </p>

                <span className={`my-6 h-px w-full ${p.featured ? "bg-white/15" : "bg-black/[0.07]"}`} />

                <ul className="flex-1 space-y-3.5">
                  {p.features.map((f) => (
                    <li key={f} className={`flex items-center gap-3 text-[13px] font-medium ${p.featured ? "text-white/80" : "text-[#5b5b66]"}`}>
                      <span
                        className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full"
                        style={{ background: p.featured ? `${FLAME}30` : `${NAVY}12` }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke={p.featured ? "#ff8a7a" : NAVY} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-2.5 w-2.5" aria-hidden>
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                <a
                  href="#contact"
                  className={`mt-8 block rounded-full px-5 py-3.5 text-center text-[13px] font-extrabold tracking-wide transition duration-200 active:scale-[0.98] ${
                    p.featured ? "text-white hover:opacity-90" : "btn-outline-navy"
                  }`}
                  style={p.featured ? { background: `linear-gradient(135deg, ${FLAME}, #bd1f30)` } : undefined}
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
        <div className="mx-auto max-w-3xl px-6 pb-28">
          <div className="text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: FLAME }}>
              FAQ
            </p>
            <h2 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">
              Questions, answered.
            </h2>
          </div>
          <div className="mt-12 space-y-3">
            {faqs.map((f) => (
              <details key={f.q} className="group rounded-2xl border border-black/[0.08] bg-white shadow-sm transition duration-200 open:shadow-md">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-sm font-bold text-[#141417] [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-lg font-bold leading-none transition duration-300 group-open:rotate-45"
                    style={{ background: `${NAVY}14`, color: NAVY }}
                  >
                    +
                  </span>
                </summary>
                <p className="px-6 pb-6 text-sm font-medium leading-relaxed text-[#5b5b66]">{f.a}</p>
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
          media={
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/contact.jpg"
                alt="A team collaborating on a project"
                className="absolute inset-0 h-full w-full object-cover"
                draggable={false}
              />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.75),rgba(0,0,0,0.45)_50%,rgba(0,0,0,0.55))]" />
            </>
          }
          title="Your brand, upgraded"
          scrollHint="Scroll to expand"
          startWidth={38}
          startHeight={54}
          startRadius={48}
          mediaZoom={1.28}
          scrollDistance={0.65}
          holdDistance={0.25}
          smoothing={0.1}
          overlayScrim={0.35}
        >
          <div className="relative max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-white/80 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: FLAME }} />
              Start a project
            </p>
            <h2 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight text-white md:text-6xl">
              Ready to hand off{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: `linear-gradient(100deg, #ff7a6d, ${FLAME} 60%, #ffc4bd)` }}
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
                style={{ background: `linear-gradient(135deg, ${FLAME}, #bd1f30)`, boxShadow: `0 10px 30px -10px ${FLAME}90` }}
              >
                Contact Us
              </button>
            </form>
          </div>
        </ScrollExpand>
      </section>

      {/* ══ Footer — deep flame red, merged into the expand section ════ */}
      <footer className="relative overflow-hidden" style={{ background: "linear-gradient(180deg, #932312 0%, #7a1c0f 55%, #571107 100%)" }}>
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
              <span className="font-bold" style={{ color: "#ffc4bd" }}>BHARAT</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
