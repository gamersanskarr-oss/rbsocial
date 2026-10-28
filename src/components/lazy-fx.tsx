"use client";

/* Lazy wrappers for the landing page's heavy visual effects (WebGL + GSAP).
   `ssr: false` isn't allowed inside Server Components, so this client file
   owns the dynamic imports — the page's HTML renders instantly and the
   effect bundles stream in afterwards instead of blocking first paint. */
import dynamic from "next/dynamic";

export const LightRays = dynamic(() => import("./light-rays"), { ssr: false });
export const TextLoop = dynamic(() => import("./text-loop"), { ssr: false });
export const SideRays = dynamic(() => import("./side-rays"), { ssr: false });
export const ContactArt = dynamic(() => import("./contact-art"), { ssr: false });
export const ScrollExpand = dynamic(() => import("./scroll-expand"), { ssr: false });
