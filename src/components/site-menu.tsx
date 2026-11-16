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
            className="mt-3 flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold text-[#13203b] shadow-lg transition duration-200 hover:opacity-90 active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, #f4ebe0, #dfd2bf)",
              boxShadow: "0 12px 32px -12px rgba(244,235,224,0.35)",
            }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
              <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07a8.2 8.2 0 0 1-2.4-1.49 9 9 0 0 1-1.66-2.07c-.17-.3-.02-.46.13-.6.14-.15.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.67-1.61-.92-2.2-.24-.59-.49-.5-.67-.52h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.5 0 1.47 1.07 2.9 1.22 3.1.15.2 2.1 3.2 5.1 4.49.71.3 1.27.49 1.7.63.72.23 1.37.2 1.89.12.57-.09 1.76-.72 2-1.42.25-.7.25-1.3.18-1.42-.08-.13-.28-.2-.57-.35ZM12.05 21.79h-.01a9.77 9.77 0 0 1-5-1.37l-.35-.21-3.7.97.99-3.61-.23-.37a9.77 9.77 0 1 1 8.3 4.6Zm0-21.55a11.8 11.8 0 0 0-10.05 18.1L.24 24l5.79-1.52A11.77 11.77 0 0 0 12.05.24 11.8 11.8 0 0 0 12.05.24Z" />
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
