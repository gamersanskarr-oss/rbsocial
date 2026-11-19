"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type SiteMenuProps = {
  links: { label: string; href: string }[];
  whatsapp: string;
};

export function SiteMenu({ links, whatsapp }: SiteMenuProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* hamburger trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="group relative flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 backdrop-blur transition hover:bg-white/10"
      >
        <span className="flex flex-col items-end gap-[5px]">
          <span className="h-[2px] w-5 rounded-full bg-[#f4ebe0] transition-all duration-300 group-hover:w-4" />
          <span className="h-[2px] w-3.5 rounded-full bg-[#ff6a5a] transition-all duration-300 group-hover:w-5" />
        </span>
      </button>

      {/* backdrop + drawer rendered on document.body via portal — the header's
          backdrop-blur creates a containing block that would otherwise clip
          fixed-position children inside the nav pill */}
      {mounted &&
        createPortal(
          <>
      <div
        onClick={() => setOpen(false)}
        aria-hidden
        className={`fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* right slide-in drawer */}
      <aside
        className={`fixed inset-y-0 right-0 z-[80] flex w-[min(24rem,88vw)] flex-col border-l border-white/10 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          background:
            "linear-gradient(165deg, #16254a 0%, #0d1526 55%, #070a14 100%)",
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
      >
        {/* top row */}
        <div className="flex items-center justify-between px-7 pt-7">
          <span className="text-xs font-bold uppercase tracking-[0.24em] text-[#f4ebe0]/50">
            Menu
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[#f4ebe0] transition hover:bg-white/10"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* nav links — numbered, big */}
        <nav className="mt-8 flex-1 overflow-y-auto px-7">
          <ul className="space-y-1.5">
            {links.map((l, i) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="group flex items-baseline gap-4 rounded-2xl px-4 py-3.5 transition-colors duration-200 hover:bg-white/5"
                >
                  <span className="text-[11px] font-bold tabular-nums text-[#ff6a5a]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-2xl font-extrabold tracking-tight text-[#f4ebe0] transition-transform duration-200 group-hover:translate-x-1.5">
                    {l.label}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* bottom CTA — Let's Talk lives here only */}
        <div className="border-t border-white/10 px-7 py-7">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#f4ebe0]/45">
            Start a project
          </p>
          <a
            href={whatsapp}
            target="_blank"
            rel="noreferrer"
            className="mt-3 flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold text-white shadow-lg transition duration-200 hover:opacity-90 active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, #25D366, #128C7E)",
              boxShadow: "0 12px 32px -12px rgba(37,211,102,0.45)",
            }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.617-2.39-1.47-.883-.784-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413ZM12.05 21.79h-.01a9.77 9.77 0 0 1-5-1.37l-.35-.21-3.7.97.99-3.61-.23-.37a9.77 9.77 0 1 1 8.3 4.6Zm0-21.55a11.8 11.8 0 0 0-10.05 18.1L.24 24l5.79-1.52A11.77 11.77 0 0 0 12.05.24 11.8 11.8 0 0 0 12.05.24Z" />
            </svg>
            Let&apos;s Talk — WhatsApp
          </a>
          <p className="mt-4 text-center text-[11px] font-semibold text-[#f4ebe0]/40">
            rbsocialbranding@gmail.com
          </p>
        </div>
      </aside>
          </>,
          document.body
        )}
    </>
  );
}
