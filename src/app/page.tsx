import Link from "next/link";
import { Logo } from "@/components/logo";
import { TextLoop, SideRays, FlexCarousel, ScrollReveal, LightTunnel } from "@/components/lazy-fx";
import { SiteMenu } from "@/components/site-menu";
import { WorkCarousel } from "@/components/work-carousel";

/* ── Brand tokens ─────────────────────────────────────────────────── */
const ACCENT = "#ff6a5a"; // coral accent
const ACCENT_DARK = "#d94836";
const CREAM = "#f4ebe0";
const NAVY = "#2a3a6e"; // glow/gradient tone on the #13203b canvas

/* ── Fill these in when assets arrive ─────────────────────────────── */

const SOCIAL = {
  instagram: "https://instagram.com/rbsocialbranding",
  facebook: "https://facebook.com/rbsocialbranding",
  linkedin: "https://linkedin.com/company/rbsocialbranding",
};

const UNSPLASH = (id: string) =>
  `https://images.unsplash.com/${id}?w=1200&q=80&auto=format&fit=max`;

const WHATSAPP = "https://wa.me/919216426456";
const EMAIL = "rbsocialbranding@gmail.com";
const MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=" +
  encodeURIComponent(
    "Roshan Bharat Office, Patrakar Colony, Near RK Girls College, Madanganj, Kishangarh, Rajasthan, India"
  );

/* Client logos — replace the names with <img> tiles when the real
   logos (15–20) arrive. */
const CLIENT_LOGOS = [
  "Client 01", "Client 02", "Client 03", "Client 04", "Client 05", "Client 06",
  "Client 07", "Client 08", "Client 09", "Client 10", "Client 11", "Client 12",
  "Client 13", "Client 14", "Client 15", "Client 16", "Client 17", "Client 18",
];

/* Portfolio — drop the real Instagram Reel URLs into `reels` for each
   industry and swap `thumb` for the real reel covers. */
const PORTFOLIO: { industry: string; thumb: string; reels: string[] }[] = [
  { industry: "Education", thumb: UNSPLASH("photo-1503676260728-1c00da094a0b"), reels: [SOCIAL.instagram] },
  { industry: "Healthcare", thumb: UNSPLASH("photo-1576091160399-112ba8d25d1d"), reels: [SOCIAL.instagram] },
  { industry: "Marble & Stone", thumb: UNSPLASH("photo-1615729947596-a598e5de0ab3"), reels: [SOCIAL.instagram] },
  { industry: "Construction", thumb: UNSPLASH("photo-1541888946425-d81bb19240f5"), reels: [SOCIAL.instagram] },
  { industry: "Solar & Energy", thumb: UNSPLASH("photo-1509391366360-2e959784a276"), reels: [SOCIAL.instagram] },
  { industry: "Manufacturing", thumb: UNSPLASH("photo-1581091226825-a6a2a5aee158"), reels: [SOCIAL.instagram] },
  { industry: "Automobiles", thumb: UNSPLASH("photo-1494976388531-d1058494cdd8"), reels: [SOCIAL.instagram] },
  { industry: "Retail & Lifestyle", thumb: UNSPLASH("photo-1441986300917-64674bd600d8"), reels: [SOCIAL.instagram] },
  { industry: "More Industries", thumb: UNSPLASH("photo-1557804506-669a67965ba0"), reels: [SOCIAL.instagram] },
];

/* Testimonials — one featured video + three supporting. Drop in the
   video URLs (Instagram/YouTube/drive) and client names/logos. */
const TESTIMONIALS = [
  { name: "Client name", business: "Business · featured", url: SOCIAL.instagram },
  { name: "Client name", business: "Business", url: SOCIAL.instagram },
  { name: "Client name", business: "Business", url: SOCIAL.instagram },
  { name: "Client name", business: "Business", url: SOCIAL.instagram },
];

/* Showcase carousel — dummy Unsplash frames for now; swap `src` for real
   campaign/work stills when assets arrive. */
const SHOWCASE_ITEMS = [
  { src: UNSPLASH("photo-1737071371043-761e02b1ef95"), title: "Campaign Studio", subtitle: "Creative direction", alt: "Studio campaign visual" },
  { src: UNSPLASH("photo-1693645325828-62cd35c8da8f"), title: "Brand Shoots", subtitle: "Professional production", alt: "Brand shoot on white backdrop" },
  { src: UNSPLASH("photo-1739056238917-d89cd05c48d5"), title: "Product Films", subtitle: "Reels & video edits", alt: "Product film still" },
  { src: UNSPLASH("photo-1747191092806-c7da11881986"), title: "Portraits", subtitle: "Photography", alt: "Profile portrait study" },
  { src: UNSPLASH("photo-1605034313761-73ea4a0cfbf3"), title: "Retail Campaigns", subtitle: "E-commerce content", alt: "Product campaign still" },
  { src: UNSPLASH("photo-1495462911434-be47104d70fa"), title: "Fashion Edits", subtitle: "Editorial styling", alt: "Editorial fashion still" },
  { src: UNSPLASH("photo-1786835568925-20cd20007ed0"), title: "Design Systems", subtitle: "Graphic design", alt: "Abstract design composition" },
  { src: UNSPLASH("photo-1770062422885-2dfcbe8fb65b"), title: "Behind the Scenes", subtitle: "On-ground coverage", alt: "On-set production still" },
];

/* ── Content ──────────────────────────────────────────────────────── */

const services = [
  {
    n: "01",
    title: "Social Media Management",
    desc: "Complete management of your brand's social media presence — from content planning and scheduling to publishing and account management.",
  },
  {
    n: "02",
    title: "Content Creation & Production",
    desc: "Content strategy, scripting, professional shoots, reels, video editing, photography and graphic designing.",
  },
  {
    n: "03",
    title: "Digital Marketing & Advertising",
    desc: "Performance marketing through Meta Ads & Google My Business — plus promotional opportunities through Roshan Bharat's media platforms.",
  },
  {
    n: "04",
    title: "Website Development",
    desc: "Professional, responsive websites designed around your business, brand identity and requirements.",
  },
  {
    n: "05",
    title: "Software & Digital Solutions",
    desc: "Custom software development and digital solutions designed to support business operations and requirements.",
  },
];

const whys = [
  {
    title: "Everything Under One Roof",
    desc: "Content creation, social media management, advertising, web development and software solutions — all your digital requirements, one team.",
  },
  {
    title: "Marketing Meets Media",
    desc: "Through Roshan Bharat, we offer sponsored posts, promotional reels, brand features and on-ground campaigns.",
  },
  {
    title: "Content Backed by Strategy",
    desc: "Content should have a purpose — every creative direction and activity is planned around the brand and its objectives.",
  },
  {
    title: "One Connected Team",
    desc: "Strategy, scripting, shooting, editing, designing, publishing and advertising work together under one coordinated approach.",
  },
  {
    title: "Built Around Your Business",
    desc: "Every business is different — we shape our marketing around your industry, audience, requirements and goals.",
  },
];

const steps = [
  {
    n: "01",
    title: "We Plan Ahead",
    desc: "Monthly content calendars, creative concepts and scripts prepared in advance — every shoot and campaign has a clear direction.",
  },
  {
    n: "02",
    title: "We Follow Trends With Purpose",
    desc: "We stay updated with changing trends and formats — but never follow them blindly. Every decision should make sense for the brand.",
  },
  {
    n: "03",
    title: "We Connect Every Activity",
    desc: "Content, production, social media and advertising work together under one clear strategy — not disconnected activities.",
  },
  {
    n: "04",
    title: "We Believe in Communication",
    desc: "Regular communication with clients — we value feedback and keep you involved throughout the process.",
  },
  {
    n: "05",
    title: "We Measure and Improve",
    desc: "Monthly performance reports help us review content, understand audiences and plan better marketing.",
  },
];

const industries = [
  "Education",
  "Healthcare",
  "Marble & Stone",
  "Construction",
  "Solar & Energy",
  "Manufacturing",
  "Automobiles",
  "Retail & Lifestyle",
  "And More",
];

const mediaPerks = [
  "Newspaper & digital brand features",
  "Sponsored social media posts",
  "Promotional reels",
  "Business stories & interviews",
  "Social media advertising campaigns",
  "On-ground brand coverage & promotions",
];

const marqueeWords = [
  "Content creation",
  "Social media management",
  "Performance marketing",
  "Reels & shoots",
  "Web development",
  "Brand advertising",
  "Software solutions",
];

const navLinks = [
  { label: "Home", href: "#top" },
  { label: "About", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "Our Work", href: "#work" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "Roshan Bharat", href: "#roshan-bharat" },
  { label: "Careers", href: "#careers" },
];

export default function Home() {
  return (
    <div id="top" className="theme-dark theme-site min-h-screen scroll-smooth bg-[#070d1c] text-ink">
      {/* Sticky backdrop — near-black canvas with faded blue circle glows.
          Fixed to the viewport; all sections scroll above it. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background: [
            `radial-gradient(640px 640px at 12% 12%, #2a4a9e5c, transparent 65%)`,
            `radial-gradient(560px 560px at 88% 8%, #1e3a8a52, transparent 65%)`,
            `radial-gradient(720px 720px at 92% 55%, #2a4a9e48, transparent 66%)`,
            `radial-gradient(600px 600px at 8% 70%, #1e3a8a4e, transparent 65%)`,
            `radial-gradient(680px 680px at 55% 100%, #2a4a9e44, transparent 66%)`,
            `linear-gradient(165deg, #1d2f58 0%, #12224a 40%, #0a1230 72%, #060a18 100%)`,
          ].join(", "),
        }}
      />

      {/* ══ Nav — floating glass capsule ═════════════════════════════ */}
      <header className="fixed inset-x-0 top-4 z-40 px-4">
        <nav className="relative mx-auto flex max-w-5xl items-center justify-between overflow-hidden rounded-full border border-white/10 bg-black/50 py-2 pl-4 pr-2 shadow-[0_20px_60px_-24px_rgba(0,0,0,0.8)] backdrop-blur-2xl backdrop-saturate-150">
          <span aria-hidden className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white/[0.08] via-white/[0.02] to-transparent" />
          <span aria-hidden className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />

          <a href="#top" className="relative flex items-center gap-2.5">
            <Logo size={32} />
            <span className="text-sm font-bold tracking-tight">RB Social Branding</span>
          </a>
          <div className="relative hidden items-center gap-0.5 text-[13px] font-medium text-muted lg:flex">
            {navLinks.slice(1).map((l) => (
              <a key={l.href} href={l.href} className="rounded-full px-3 py-1.5 transition duration-200 hover:bg-white/10 hover:text-ink">
                {l.label}
              </a>
            ))}
          </div>
          <a
            href={WHATSAPP}
            target="_blank"
            rel="noreferrer"
            className="relative hidden rounded-full px-5 py-2 text-[13px] font-bold text-[#13203b] ring-1 ring-white/20 transition duration-200 hover:opacity-90 active:scale-[0.98] lg:inline-flex"
            style={{ background: `linear-gradient(135deg, ${CREAM}, #dfd2bf)`, boxShadow: `0 8px 24px -10px ${CREAM}55` }}
          >
            Let&apos;s Talk
          </a>
          <span className="lg:hidden">
            <SiteMenu links={navLinks} whatsapp={WHATSAPP} />
          </span>
        </nav>
      </header>

      {/* ══ 01 · Hero ════════════════════════════════════════════════ */}
      <section className="relative flex min-h-[92svh] flex-col overflow-hidden">
        {/* backdrop — navy base + warm coral glow + vertical blinds */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background: [
              `radial-gradient(1000px 700px at 58% 50%, ${ACCENT}6e, ${ACCENT_DARK}2e 44%, transparent 70%)`,
              `radial-gradient(720px 540px at 26% 36%, #4a5f9e40, transparent 62%)`,
              `linear-gradient(178deg, #0d1330 0%, #0b1024 55%, #060912 100%)`,
            ].join(", "),
          }}
        />
        {/* WebGL light tunnel — radial cables with traveling coral pulses */}
        <div aria-hidden className="absolute inset-0 opacity-80">
          <LightTunnel
            cableColor="#4a5f9e"
            pulseColor="#ff6a5a"
            tunnelColor="#13203b"
            tunnelOpacity={0.18}
            speed={0.12}
            pulseSpeed={1.6}
            pulseDensity={0.4}
            cableCount={64}
            thickness={0.3}
            glow={1.2}
            brightness={0.9}
            size={1.15}
            centerY={-0.05}
            fadeFar={2.4}
            opacity={0.75}
            mouseStrength={0.06}
            grain
            grainIntensity={0.03}
          />
        </div>
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, transparent 0px, transparent 7px, rgb(255 255 255 / 0.045) 7px, rgb(255 255 255 / 0.045) 8px)",
            maskImage:
              "linear-gradient(to bottom, transparent 0%, black 18%, black 80%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0%, black 18%, black 80%, transparent 100%)",
          }}
        />

        {/* main row — headline left, glass panel right */}
        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 items-center gap-14 px-6 pb-8 pt-28">
          <div className="max-w-3xl">
          <p className="mb-7 inline-flex max-w-full items-center gap-3 rounded-full border border-white/15 bg-white/[0.07] px-5 py-2.5 text-sm font-bold tracking-wide text-ink backdrop-blur">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: ACCENT }} />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ background: ACCENT }} />
            </span>
            A Digital Marketing &amp; Creative Division of Roshan Bharat
          </p>

          <h1 className="text-5xl font-extrabold leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
            We help businesses grow through{" "}
            <span
              className="animate-gradient-pan bg-clip-text text-transparent"
              style={{ backgroundImage: `linear-gradient(100deg, ${ACCENT} 10%, #ffb1a4 40%, ${CREAM} 50%, #8fa3e8 90%)` }}
            >
              content, creativity
            </span>{" "}
            &amp; marketing.
          </h1>

          <p className="mt-6 max-w-md text-base font-medium leading-relaxed text-muted">
            From content planning and professional production to social media
            management, performance marketing and advertisement — everything
            under one roof.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-5">
            <a
              href={WHATSAPP}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-bold text-[#13203b] shadow-lg transition duration-200 hover:opacity-90 hover:shadow-xl active:scale-[0.98]"
              style={{ background: `linear-gradient(135deg, ${CREAM}, #dfd2bf)`, boxShadow: `0 12px 32px -12px ${CREAM}55` }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
                <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07a8.2 8.2 0 0 1-2.4-1.49 9 9 0 0 1-1.66-2.07c-.17-.3-.02-.46.13-.6.14-.15.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.67-1.61-.92-2.2-.24-.59-.49-.5-.67-.52h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.5 0 1.47 1.07 2.9 1.22 3.1.15.2 2.1 3.2 5.1 4.49.71.3 1.27.49 1.7.63.72.23 1.37.2 1.89.12.57-.09 1.76-.72 2-1.42.25-.7.25-1.3.18-1.42-.08-.13-.28-.2-.57-.35ZM12.05 21.79h-.01a9.77 9.77 0 0 1-5-1.37l-.35-.21-3.7.97.99-3.61-.23-.37a9.77 9.77 0 1 1 8.3 4.6Zm0-21.55a11.8 11.8 0 0 0-10.05 18.1L.24 24l5.79-1.52A11.77 11.77 0 0 0 12.05 24 11.8 11.8 0 0 0 12.05.24Z" />
              </svg>
              Let&apos;s Talk — WhatsApp
            </a>
            <a
              href="#work"
              className="group inline-flex items-center gap-1.5 text-sm font-bold text-ink transition duration-200 hover:opacity-80"
            >
              Our Work
              <span className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">↗</span>
            </a>
          </div>
          </div>

          {/* right glass panel — capabilities, hidden on small screens */}
          <div className="ml-auto hidden w-[21rem] shrink-0 flex-col gap-3 lg:flex">
            <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-6 shadow-lift backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-faint">
                  What we do
                </p>
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: ACCENT }} />
              </div>
              <div className="mt-4 space-y-3">
                {[
                  { k: "Social media management", v: "Fully managed" },
                  { k: "Content & production", v: "Shoots · Reels · Edits" },
                  { k: "Marketing & ads", v: "Meta · GMB · Roshan Bharat" },
                  { k: "Web & software", v: "Sites · Digital solutions" },
                ].map((r) => (
                  <div
                    key={r.k}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-bold text-ink">{r.k}</p>
                      <p className="text-[11px] font-semibold text-faint">{r.v}</p>
                    </div>
                    <span className="text-faint">↗</span>
                  </div>
                ))}
              </div>
              <div
                className="mt-4 rounded-full px-4 py-2 text-center text-[11px] font-bold text-[#13203b]"
                style={{ background: `linear-gradient(135deg, ${CREAM}, #dfd2bf)` }}
              >
                One team · One strategy
              </div>
            </div>
          </div>
        </div>

        {/* curved moving text loop — inside the hero */}
        <div className="relative z-10 h-[max(6.5rem,18vw)] overflow-hidden bg-transparent md:h-[6.5vw]">
            <div className="absolute left-1/2 top-1/2 w-[160%] -translate-x-1/2 -translate-y-1/2 scale-125 md:w-full md:scale-100">
              <TextLoop
                text={marqueeWords.join("  ✦  ")}
                shape="wave"
                curviness={18}
                speed={42}
                fontSize={14}
                fontWeight={800}
                letterSpacing={2.2}
                separator=""
                color={CREAM}
                ribbon
                ribbonGradient={["#ffb1a4", ACCENT, ACCENT_DARK]}
                ribbonWidth={28}
                pauseOnHover={false}
              />
            </div>
          </div>

        {/* bottom trust strip — icon feature row */}
        <div className="relative z-10 border-t border-white/10 bg-black/20 backdrop-blur-sm">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-y-4 px-6 py-5 sm:grid-cols-5 sm:gap-y-0 sm:divide-x sm:divide-white/10">
            {[
              { icon: "◈", title: "Everything under", sub: "one roof" },
              { icon: "◎", title: "700K+ audience", sub: "via Roshan Bharat" },
              { icon: "✦", title: "Strategy-first", sub: "content planning" },
              { icon: "▤", title: "Monthly reports", sub: "measure & improve" },
              { icon: "∞", title: "One team", sub: "fully connected" },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-2.5 sm:justify-center sm:px-4">
                <span className="mt-0.5 text-sm" style={{ color: ACCENT }}>{f.icon}</span>
                <div className="text-[11px] font-semibold leading-snug text-muted">
                  <p>{f.title}</p>
                  <p className="text-faint">{f.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 02 · About ═══════════════════════════════════════════════ */}
      <section id="about" className="relative scroll-mt-24 overflow-hidden">
        {/* soft blue spotlight behind the copy */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 top-1/2 h-[30rem] w-[46rem] -translate-y-1/2 rounded-full opacity-60 blur-3xl"
          style={{ background: `radial-gradient(closest-side, #2a4a9e5c, transparent)` }}
        />
        <div className="relative mx-auto max-w-6xl px-6 py-24">
        <div className="max-w-3xl">
          <p className="section-label" style={{ color: ACCENT }}>About us</p>
          <ScrollReveal containerClassName="mt-3" textClassName="text-4xl font-extrabold tracking-tight md:text-5xl" effect="rise" mode="enter" duration={0.9} baseRotation={2}>
            More than just social media.
          </ScrollReveal>
          <div className="mt-6 space-y-4 text-base font-medium leading-relaxed text-muted">
            <ScrollReveal containerClassName="-my-2" textClassName="text-base font-medium leading-relaxed text-muted" effect="fade" mode="enter" duration={0.7} stagger={0.02} baseOpacity={0.4}>
              RB Social Branding is a digital marketing and creative division of{" "}
              <span className="font-bold text-ink">Roshan Bharat</span>, helping businesses
              build and strengthen their digital presence.
            </ScrollReveal>
            <ScrollReveal containerClassName="-my-2" textClassName="text-base font-medium leading-relaxed text-muted" effect="fade" mode="enter" duration={0.7} stagger={0.02} baseOpacity={0.4}>
              We work as an extended in-house marketing team — bringing strategy, content
              creation, professional production, social media management, performance
              marketing and advertising together under one roof.
            </ScrollReveal>
            <ScrollReveal containerClassName="-my-2" textClassName="text-base font-medium leading-relaxed text-muted" effect="fade" mode="enter" duration={0.7} stagger={0.02} baseOpacity={0.4}>
              From understanding your business and planning content to executing campaigns
              and developing digital solutions, we bring every part of your marketing
              together under one coordinated approach.
            </ScrollReveal>
          </div>
        </div>
        </div>
      </section>

      {/* ══ Showcase — WebGL carousel ════════════════════════════════ */}
      <section id="showcase" className="relative overflow-hidden py-20">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <p className="section-label" style={{ color: ACCENT }}>Showcase</p>
          <ScrollReveal containerClassName="mt-3" textClassName="text-4xl font-extrabold tracking-tight md:text-5xl" effect="rise" mode="enter" duration={0.9} baseRotation={2}>
            Work in motion.
          </ScrollReveal>
          <p className="mx-auto mt-4 max-w-lg text-sm font-medium text-muted">
            A moving glimpse of the kind of content we plan, shoot and ship — drag,
            scroll or click a frame to zoom in.
          </p>
        </div>
        <div className="mt-12 h-[52vh] min-h-[340px] w-full sm:h-[68vh] sm:min-h-[420px]">
          <FlexCarousel
            items={SHOWCASE_ITEMS}
            preset="liquid"
            intro="rise"
            cardHeight={0.62}
            gap={16}
            fit="portrait"
            captions
            autoplay
            interval={4.5}
            captureWheel={false}
          />
        </div>
      </section>

      {/* ══ 03 · Brands we've worked with ════════════════════════════ */}
      <section id="brands" className="relative">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="max-w-2xl">
            <p className="section-label" style={{ color: ACCENT }}>Brands we&apos;ve worked with</p>
            <ScrollReveal containerClassName="mt-3" textClassName="text-4xl font-extrabold tracking-tight md:text-5xl" effect="rise" mode="enter" duration={0.9} baseRotation={2}>
              Trusted across industries.
            </ScrollReveal>
            <p className="mt-3 text-sm font-medium text-muted">
              A look at the businesses and brands we&apos;ve had the opportunity to work with.
            </p>
          </div>
          {/* Swap these tiles for real <img> logos when they arrive. */}
          <div className="mt-12 grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
            {CLIENT_LOGOS.map((name) => (
              <div
                key={name}
                className="flex h-20 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] transition duration-300 hover:border-white/25 hover:bg-white/[0.06]"
              >
                <span className="text-xs font-bold uppercase tracking-wider text-faint">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 04 · What we do ══════════════════════════════════════════ */}
      <section id="services" className="relative scroll-mt-24">
        <div className="mx-auto max-w-6xl px-6 py-28">
        <div className="mx-auto max-w-3xl text-center">
          <p className="section-label" style={{ color: ACCENT }}>What we do</p>
          <ScrollReveal containerClassName="mt-3" textClassName="text-4xl font-extrabold tracking-tight md:text-5xl" effect="rise" mode="enter" duration={0.9} baseRotation={2}>
            Everything your business needs to build, manage and grow its digital presence.
          </ScrollReveal>
        </div>

        <div className="mt-14 flex flex-wrap justify-center gap-5">
          {services.map((s) => (
            <div
              key={s.n}
              className="group relative w-full overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-7 text-center transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.05] sm:w-[calc(50%-0.625rem)] lg:w-[calc(33.333%-0.834rem)]"
            >
              <div
                className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-0 blur-2xl transition duration-500 group-hover:opacity-30"
                style={{ background: `radial-gradient(closest-side, ${ACCENT}, transparent)` }}
              />
              <div className="flex items-center justify-center">
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-extrabold"
                  style={{ background: `${NAVY}33`, color: "#ffb1a4" }}
                >
                  {s.n}
                </span>
              </div>
              <h3 className="mt-6 text-lg font-bold tracking-tight">{s.title}</h3>
              <p className="mt-2.5 text-sm font-medium leading-relaxed text-muted">{s.desc}</p>
            </div>
          ))}
        </div>
        </div>
      </section>

      {/* ══ 05 · Why RB Social Branding ══════════════════════════════ */}
      <section id="why" className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 hidden h-[36rem] w-[52rem] -translate-x-1/2 -translate-y-1/2 opacity-60 blur-2xl lg:block"
          style={{
            maskImage:
              "radial-gradient(closest-side, black 30%, transparent 95%)",
            WebkitMaskImage:
              "radial-gradient(closest-side, black 30%, transparent 95%)",
          }}
        >
          <SideRays rayColor1="#ff8a7a" rayColor2="#8fa3e8" origin="top-right" opacity={0.9} />
        </div>
        <div className="relative mx-auto max-w-6xl px-6 py-28">
          <div className="mx-auto max-w-3xl text-center">
            <p className="section-label" style={{ color: ACCENT }}>Why us</p>
            <ScrollReveal containerClassName="mt-3" textClassName="text-4xl font-extrabold tracking-tight md:text-5xl" effect="rise" mode="enter" duration={0.9} baseRotation={2}>
              Why RB Social Branding?
            </ScrollReveal>
          </div>
          <div className="mt-14 flex flex-wrap justify-center gap-5">
            {whys.map((w, i) => (
              <div
                key={w.title}
                className="w-full rounded-3xl border border-white/10 bg-white/[0.03] p-7 text-center transition duration-300 hover:-translate-y-1 hover:border-white/20 md:w-[calc(50%-0.625rem)] lg:w-[calc(33.333%-0.834rem)]"
              >
                <span
                  className="mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm font-extrabold text-[#13203b]"
                  style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})` }}
                >
                  {i + 1}
                </span>
                <h3 className="mt-5 text-lg font-bold tracking-tight">{w.title}</h3>
                <p className="mt-2 text-sm font-medium leading-relaxed text-muted">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 06 · How we work ═════════════════════════════════════════ */}
      <section id="process" className="relative scroll-mt-24">
        <div className="mx-auto max-w-6xl px-6 py-28">
        <div className="max-w-2xl">
          <p className="section-label" style={{ color: ACCENT }}>How we work</p>
          <ScrollReveal containerClassName="mt-3" textClassName="text-4xl font-extrabold tracking-tight md:text-5xl" effect="rise" mode="enter" duration={0.9} baseRotation={2}>
            Good marketing doesn&apos;t happen by accident. It&apos;s planned.
          </ScrollReveal>
          <p className="mt-4 text-base font-medium text-muted">
            Our approach combines thoughtful planning, creative execution and consistent
            communication to keep every marketing activity aligned with the brand.
          </p>
        </div>
        <div className="mt-14 space-y-4">
          {steps.map((s) => (
            <div
              key={s.n}
              className="flex gap-5 rounded-3xl border border-white/10 bg-white/[0.02] p-6 transition duration-300 hover:border-white/20 hover:bg-white/[0.04]"
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-extrabold text-[#13203b]"
                style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})` }}
              >
                {s.n}
              </span>
              <div>
                <h3 className="text-base font-bold tracking-tight">{s.title}</h3>
                <p className="mt-1 text-sm font-medium leading-relaxed text-muted">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
        </div>
      </section>

      {/* ══ 07 · Industries ══════════════════════════════════════════ */}
      <section id="industries">
        <div className="mx-auto max-w-6xl px-6 py-24 text-center">
          <p className="section-label" style={{ color: ACCENT }}>Industries</p>
          <ScrollReveal containerClassName="mt-3" textClassName="text-4xl font-extrabold tracking-tight md:text-5xl" effect="rise" mode="enter" duration={0.9} baseRotation={2}>
            Across industries. One creative approach.
          </ScrollReveal>
          <p className="mx-auto mt-4 max-w-xl text-sm font-medium text-muted">
            From education and healthcare to construction, manufacturing and retail — we
            work with businesses across diverse industries.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            {industries.map((i) => (
              <span
                key={i}
                className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-bold text-ink transition duration-200 hover:border-white/30 hover:bg-white/[0.08]"
              >
                {i}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 08 · Our work ════════════════════════════════════════════ */}
      <section id="work" className="relative scroll-mt-24 overflow-hidden">
        {/* blue backdrop — radial glows over a deep blue gradient */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: [
              `radial-gradient(900px 500px at 85% 8%, #2a4a9e52, transparent 62%)`,
              `radial-gradient(800px 520px at 8% 92%, #2a4a9e42, transparent 64%)`,
              `linear-gradient(168deg, #1b2c55 0%, #101c3d 48%, #0a1124 100%)`,
            ].join(", "),
            maskImage:
              "linear-gradient(to bottom, transparent 0%, black 16%, black 84%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0%, black 16%, black 84%, transparent 100%)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-6 py-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="section-label" style={{ color: ACCENT }}>Our work</p>
            <ScrollReveal containerClassName="mt-3" textClassName="text-4xl font-extrabold tracking-tight md:text-5xl" effect="rise" mode="enter" duration={0.9} baseRotation={2}>
              Different industries. Different stories.
            </ScrollReveal>
          </div>
          <p className="max-w-sm text-sm font-medium text-muted">
            A glimpse of the content and creative work we&apos;ve produced — tap a reel
            to watch it on Instagram.
          </p>
        </div>

        <div className="mt-14">
          <WorkCarousel
            items={PORTFOLIO.map((p) => ({
              industry: p.industry,
              thumb: p.thumb,
              href: p.reels[0],
            }))}
          />
        </div>
        </div>
      </section>

      {/* ══ 09 · Testimonials ════════════════════════════════════════ */}
      <section id="testimonials" className="relative">
        <div className="mx-auto max-w-6xl px-6 py-28">
          <div className="max-w-2xl">
            <p className="section-label" style={{ color: ACCENT }}>Testimonials</p>
            <ScrollReveal containerClassName="mt-3" textClassName="text-4xl font-extrabold tracking-tight md:text-5xl" effect="rise" mode="enter" duration={0.9} baseRotation={2}>
              What our clients say.
            </ScrollReveal>
            <p className="mt-4 text-sm font-medium text-muted">
              Real experiences. Genuine partnerships.
            </p>
          </div>

          {/* Featured + 3 supporting — replace the card bodies with the
              real video embeds/links when they arrive. */}
          <div className="mt-14 grid gap-5 lg:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <a
                key={i}
                href={t.url}
                target="_blank"
                rel="noreferrer"
                className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] transition duration-300 hover:-translate-y-1 hover:border-white/25 ${
                  i === 0 ? "aspect-video lg:col-span-2 lg:row-span-1" : "aspect-video"
                }`}
              >
                <div
                  className="absolute inset-0 transition duration-500 group-hover:scale-[1.03]"
                  style={{
                    background:
                      i === 0
                        ? `linear-gradient(140deg, ${ACCENT}66, #0d1526 65%)`
                        : `linear-gradient(140deg, ${NAVY}88, #0d1526 70%)`,
                  }}
                />
                <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/30 text-[#f4ebe0] backdrop-blur transition duration-300 group-hover:scale-110">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="ml-1 h-6 w-6" aria-hidden>
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
                <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 p-5">
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-extrabold text-[#13203b]"
                    style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})` }}
                  >
                    {t.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-[#13203b]">{t.name}</p>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#f4ebe0]/50">
                      {t.business}
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 10 · Roshan Bharat ═══════════════════════════════════════ */}
      <section id="roshan-bharat" className="relative overflow-hidden scroll-mt-24">
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(140deg, ${NAVY}30 0%, #070a14 55%, ${ACCENT}24 100%)`,
            maskImage:
              "linear-gradient(to bottom, transparent 0%, black 14%, black 86%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0%, black 14%, black 86%, transparent 100%)",
          }}
        />
        {/* newspaper texture lines */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 22px, #fff 22px, #fff 23px)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-6 py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="section-label" style={{ color: ACCENT }}>Roshan Bharat</p>
              <ScrollReveal containerClassName="mt-3" textClassName="text-4xl font-extrabold tracking-tight md:text-5xl" effect="rise" mode="enter" duration={0.9} baseRotation={2}>
                More than marketing. The power of media.
              </ScrollReveal>
              <p className="mt-5 text-base font-medium leading-relaxed text-muted">
                Roshan Bharat is a newspaper with a strong presence across social media,
                connecting with audiences through news, local stories and updates. Through
                RB Social Branding, businesses get the opportunity to leverage this media
                presence to build visibility and connect with a wider audience.
              </p>
              <ul className="mt-7 space-y-2.5">
                {mediaPerks.map((m) => (
                  <li key={m} className="flex items-start gap-2.5 text-sm font-semibold text-ink">
                    <span className="mt-0.5" style={{ color: ACCENT }}>✦</span>
                    {m}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div
                className="rounded-3xl border border-white/10 p-10 text-center shadow-lift"
                style={{ background: `linear-gradient(150deg, ${NAVY}55, #0d1526)` }}
              >
                <p
                  className="animate-gradient-pan bg-clip-text text-7xl font-extrabold tracking-tight text-transparent md:text-8xl"
                  style={{ backgroundImage: `linear-gradient(120deg, ${CREAM} 20%, ${ACCENT} 55%, #ffb1a4)` }}
                >
                  700K+
                </p>
                <p className="mt-3 text-sm font-bold uppercase tracking-[0.2em] text-muted">
                  Social media audience
                </p>
                {/* platform icons — Instagram · Facebook · WhatsApp */}
                <div className="mt-5 flex items-center justify-center gap-3">
                  {/* Instagram */}
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-[#f4ebe0]">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[18px] w-[18px]" aria-label="Instagram">
                      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" /><circle cx="12" cy="12" r="4.2" /><path d="M17.4 6.6h.01" strokeLinecap="round" strokeWidth="2.6" />
                    </svg>
                  </span>
                  {/* Facebook */}
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-[#f4ebe0]">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px]" aria-label="Facebook">
                      <path d="M13.5 21.9v-7.6h2.55l.38-2.96H13.5V9.45c0-.86.24-1.44 1.47-1.44h1.57V5.37a20.9 20.9 0 0 0-2.29-.12c-2.27 0-3.82 1.38-3.82 3.93v2.16H7.87v2.96h2.56v7.6a12 12 0 0 0 3.07 0Z" />
                    </svg>
                  </span>
                  {/* WhatsApp */}
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-[#f4ebe0]">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px]" aria-label="WhatsApp">
                      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07a8.2 8.2 0 0 1-2.4-1.49 9 9 0 0 1-1.66-2.07c-.17-.3-.02-.46.13-.6.14-.15.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.67-1.61-.92-2.2-.24-.59-.49-.5-.67-.52h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.5 0 1.47 1.07 2.9 1.22 3.1.15.2 2.1 3.2 5.1 4.49.71.3 1.27.49 1.7.63.72.23 1.37.2 1.89.12.57-.09 1.76-.72 2-1.42.25-.7.25-1.3.18-1.42-.08-.13-.28-.2-.57-.35ZM12.05 21.79h-.01a9.77 9.77 0 0 1-5-1.37l-.35-.21-3.7.97.99-3.61-.23-.37a9.77 9.77 0 1 1 8.3 4.6Zm0-21.55a11.8 11.8 0 0 0-10.05 18.1L.24 24l5.79-1.52A11.77 11.77 0 0 0 12.05.24 11.8 11.8 0 0 0 12.05.24Z" />
                    </svg>
                  </span>
                </div>
                <div className="mx-auto mt-7 h-px w-24 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                <p className="mt-6 text-sm font-medium leading-relaxed text-muted">
                  Reach your customers through Roshan Bharat&apos;s newspaper readership
                  and social media following — powered by RB Social Branding.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ 11 · Careers ═════════════════════════════════════════════ */}
      <section id="careers" className="relative scroll-mt-24">
        <div className="mx-auto max-w-6xl px-6 py-28">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 px-8 py-16 text-center md:py-20"
          style={{ background: `linear-gradient(135deg, ${ACCENT}30, #0d1526 60%, ${NAVY}40)` }}
        >
          <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
            style={{ background: `radial-gradient(closest-side, ${ACCENT}, transparent)` }}
          />
          <ScrollReveal containerClassName="relative" textClassName="text-4xl font-extrabold tracking-tight md:text-5xl" effect="rise" mode="enter" duration={0.9} baseRotation={2}>
            Create. Collaborate. Grow with us.
          </ScrollReveal>
          <p className="relative mx-auto mt-4 max-w-xl text-sm font-medium leading-relaxed text-muted">
            We&apos;re always looking for creative and passionate people who want to work
            on exciting projects and grow with a dynamic team.
          </p>
          <Link
            href="/careers"
            className="relative mt-8 inline-block rounded-full px-8 py-3.5 text-sm font-bold text-[#13203b] shadow-lg transition duration-200 hover:opacity-90 active:scale-[0.98]"
            style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})`, boxShadow: `0 12px 32px -12px ${ACCENT}80` }}
          >
            See open roles →
          </Link>
        </div>
        </div>
      </section>

      {/* ══ 12 · Contact & Footer ════════════════════════════════════ */}
      <footer id="contact" className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute -bottom-40 left-1/2 h-80 w-[60rem] -translate-x-1/2 rounded-full opacity-25 blur-3xl"
          style={{ background: `radial-gradient(closest-side, ${ACCENT}66, transparent)` }}
        />
        <div className="relative mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <div className="flex items-center gap-3">
                <Logo size={40} />
                <div>
                  <p className="text-base font-bold tracking-tight">RB Social Branding</p>
                  <p className="text-xs font-medium text-faint">
                    A division of Roshan Bharat
                  </p>
                </div>
              </div>
              <p className="mt-5 max-w-sm text-sm font-medium leading-relaxed text-muted">
                Content, creativity and marketing — everything your business needs to grow,
                under one roof.
              </p>
              <div className="mt-6 flex items-center gap-3">
                {[
                  { label: "Instagram", href: SOCIAL.instagram, path: <><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><path d="M17.5 6.5h.01" /></> },
                  { label: "Facebook", href: SOCIAL.facebook, path: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /> },
                  { label: "LinkedIn", href: SOCIAL.linkedin, path: <><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4V8h4v2a5.7 5.7 0 0 1 2-2z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></> },
                ].map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={s.label}
                    title={s.label}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-muted transition duration-200 hover:border-white/25 hover:bg-white/10 hover:text-ink"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5" aria-hidden>
                      {s.path}
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <a
                href={WHATSAPP}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition duration-200 hover:border-white/25 hover:bg-white/[0.07]"
              >
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-faint">WhatsApp</p>
                  <p className="mt-1 text-base font-bold text-ink">+91 92164 26456</p>
                </div>
                <span className="text-faint">↗</span>
              </a>
              <a
                href={`mailto:${EMAIL}`}
                className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition duration-200 hover:border-white/25 hover:bg-white/[0.07]"
              >
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-faint">Email</p>
                  <p className="mt-1 text-base font-bold text-ink">{EMAIL}</p>
                </div>
                <span className="text-faint">↗</span>
              </a>
              <a
                href={MAPS_URL}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition duration-200 hover:border-white/25 hover:bg-white/[0.07]"
              >
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-faint">Office</p>
                  <p className="mt-1 text-sm font-bold leading-relaxed text-ink">
                    Roshan Bharat Office, Patrakar Colony, Near RK Girls College,
                    Madanganj, Kishangarh, Rajasthan, India
                  </p>
                </div>
                <span className="text-faint">↗</span>
              </a>
            </div>
          </div>

          <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-white/5 pt-7">
            <p className="text-xs font-medium text-faint">
              © {new Date().getFullYear()} RB Social Branding · A division of Roshan Bharat
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-faint">
              {navLinks.map((l) => (
                <a key={l.href} href={l.href} className="transition hover:text-ink">
                  {l.label}
                </a>
              ))}
              <Link href="/login" className="transition hover:text-ink">Team Login</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
