"use client";

import { useEffect, useRef } from "react";

type WorkItem = {
  industry: string;
  thumb: string;
  href: string;
};

export function WorkCarousel({ items }: { items: WorkItem[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);

  const scrollBy = (dir: number) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: dir * track.clientWidth * 0.8, behavior: "smooth" });
  };

  // auto-slide every 3s — pauses on hover/touch, loops back at the end
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const step = () => {
      const card = track.firstElementChild as HTMLElement | null;
      if (!card) return;
      const distance = card.offsetWidth + 20; // card width + gap
      const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 24;
      track.scrollTo({ left: atEnd ? 0 : track.scrollLeft + distance, behavior: "smooth" });
    };

    const id = setInterval(() => {
      if (!pausedRef.current && !document.hidden) step();
    }, 3000);
    return () => clearInterval(id);
  }, [items]);

  return (
    <div
      className="relative"
      onPointerEnter={() => (pausedRef.current = true)}
      onPointerLeave={() => (pausedRef.current = false)}
      onTouchStart={() => (pausedRef.current = true)}
    >
      {/* scroll-snap strip */}
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((p) => (
          <a
            key={p.industry}
            href={p.href}
            target="_blank"
            rel="noreferrer"
            className="group relative block aspect-[9/16] w-44 shrink-0 snap-center overflow-hidden rounded-3xl border border-white/10 transition duration-300 hover:border-white/25 hover:shadow-[0_24px_60px_-24px_rgba(0,0,0,0.8)] sm:w-60"
          >
            <img
              src={p.thumb}
              alt={`${p.industry} work`}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.05]"
              draggable={false}
            />
            <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/50 to-transparent" />
            {/* reel badge */}
            <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#f4ebe0] backdrop-blur">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3 w-3" aria-hidden>
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <path d="M17.5 6.5h.01" />
              </svg>
              Reel
            </span>
            {/* play icon */}
            <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/35 text-[#f4ebe0] backdrop-blur transition duration-300 group-hover:scale-110 group-hover:border-transparent group-hover:bg-[#f4ebe0] group-hover:text-[#13203b]">
              <svg viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 h-5 w-5" aria-hidden>
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
            <div className="absolute inset-x-0 bottom-0 p-5">
              <p className="text-base font-bold tracking-tight text-[#f4ebe0]">{p.industry}</p>
              <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-[#f4ebe0]/50">
                Watch on Instagram ↗
              </p>
            </div>
          </a>
        ))}
      </div>

      {/* arrows — desktop only, mobile swipes */}
      <button
        type="button"
        onClick={() => scrollBy(-1)}
        aria-label="Previous"
        className="absolute -left-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/60 text-[#f4ebe0] backdrop-blur transition hover:bg-black/80 md:flex"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
          <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => scrollBy(1)}
        aria-label="Next"
        className="absolute -right-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/60 text-[#f4ebe0] backdrop-blur transition hover:bg-black/80 md:flex"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
          <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
