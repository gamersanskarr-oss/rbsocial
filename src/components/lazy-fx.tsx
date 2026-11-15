"use client";

/* Lazy wrappers for the landing page's heavy visual effects (WebGL + GSAP).
   `ssr: false` isn't allowed inside Server Components, so this client file
   owns the dynamic imports — the page's HTML renders instantly and the
   effect bundles stream in afterwards instead of blocking first paint. */
import dynamic from "next/dynamic";
import type { ComponentType } from "react";

export const LightRays = dynamic(() => import("./light-rays"), { ssr: false });
export const TextLoop = dynamic(() => import("./text-loop"), { ssr: false });
export const SideRays = dynamic(() => import("./side-rays"), { ssr: false });
export const ContactArt = dynamic(() => import("./contact-art"), { ssr: false });
export const ScrollExpand = dynamic(() => import("./scroll-expand"), { ssr: false });
// Untyped .jsx WebGL component — TS infers its destructured props as required,
// so the export is widened to accept any props.
export const FlexCarousel = dynamic(() => import("./flex-carousel.jsx"), {
  ssr: false,
}) as unknown as ComponentType<Record<string, unknown>>;

export const ScrollReveal = dynamic(() => import("./scroll-reveal.jsx"), {
  ssr: false,
}) as unknown as ComponentType<Record<string, unknown>>;

export const LightTunnel = dynamic(() => import("./light-tunnel.jsx"), {
  ssr: false,
}) as unknown as ComponentType<Record<string, unknown>>;
