"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * Animated brand artwork for the contact scroll-expand section.
 * Inline SVG so GSAP can drive it — transform/opacity only (GPU-cheap),
 * paused while offscreen, skipped entirely for prefers-reduced-motion.
 */
export default function ContactArt() {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ paused: true, defaults: { ease: "sine.inOut" } });

      // wave floor — slow drifting swells
      tl.to(".ca-wave-1", { y: -14, duration: 8, repeat: -1, yoyo: true }, 0)
        .to(".ca-wave-2", { y: 12, duration: 10, repeat: -1, yoyo: true }, 0)
        .to(".ca-wave-3", { y: -9, duration: 9, repeat: -1, yoyo: true }, 0)

        // targeting rings — slow outer rotation + soft inner pulse
        .to(".ca-ring-outer", { rotation: 360, transformOrigin: "50% 50%", duration: 90, repeat: -1, ease: "none" }, 0)
        .to(".ca-ring-mid", { scale: 1.05, transformOrigin: "50% 50%", duration: 5.5, repeat: -1, yoyo: true }, 0)
        .to(".ca-ring-core", { scale: 1.35, opacity: 0.55, transformOrigin: "50% 50%", duration: 1.6, repeat: -1, yoyo: true }, 0)

        // sparkles — staggered twinkle
        .to(".ca-spark", {
          opacity: 0.25,
          scale: 0.75,
          transformOrigin: "50% 50%",
          duration: () => gsap.utils.random(1.6, 2.8),
          repeat: -1,
          yoyo: true,
          stagger: { each: 0.5, from: "random" },
        }, 0)

        // glows breathe
        .to(".ca-glow", { opacity: 0.6, duration: 7, repeat: -1, yoyo: true, stagger: 2.5 }, 0);

      // growth line — draws itself once, nodes pop in after
      const line = svg.querySelector<SVGGeometryElement>(".ca-trend");
      if (line) {
        const len = line.getTotalLength();
        tl.fromTo(line, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 1.8, ease: "power2.out" }, 0.3)
          .from(".ca-node", { scale: 0, transformOrigin: "50% 50%", stagger: 0.14, duration: 0.45, ease: "back.out(2.5)" }, 1.4);
      }

      // pause/resume with visibility — zero cost while offscreen
      const io = new IntersectionObserver(
        ([entry]) => (entry.isIntersecting ? tl.play() : tl.pause()),
        { threshold: 0 }
      );
      io.observe(svg);
      return () => io.disconnect();
    }, svg);

    return () => ctx.revert();
  }, []);

  return (
    <svg
      ref={ref}
      aria-hidden="true"
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
      className="h-full w-full"
    >
      <defs>
        <linearGradient id="ca-flame" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#f0554c" />
          <stop offset="0.55" stopColor="#c51c1a" />
          <stop offset="1" stopColor="#8f1410" />
        </linearGradient>
        <linearGradient id="ca-navy" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#070545" />
          <stop offset="1" stopColor="#1410c8" />
        </linearGradient>
        <radialGradient id="ca-glowFlame" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#c51c1a" stopOpacity="0.4" />
          <stop offset="1" stopColor="#c51c1a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ca-glowNavy" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#060365" stopOpacity="0.65" />
          <stop offset="1" stopColor="#060365" stopOpacity="0" />
        </radialGradient>
        <pattern id="ca-dots" width="34" height="34" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.4" fill="#ffffff" opacity="0.12" />
        </pattern>
      </defs>

      <rect width="1600" height="900" fill="#07080d" />
      <ellipse className="ca-glow" cx="1280" cy="140" rx="600" ry="340" fill="url(#ca-glowNavy)" />
      <ellipse className="ca-glow" cx="240" cy="800" rx="560" ry="320" fill="url(#ca-glowFlame)" opacity="0.7" />

      <rect x="70" y="90" width="220" height="150" fill="url(#ca-dots)" />
      <rect x="1330" y="640" width="220" height="150" fill="url(#ca-dots)" />

      <g className="ca-waves">
        <path className="ca-wave-1" d="M 0 690 C 300 630, 520 740, 820 690 S 1300 610, 1600 680 L 1600 900 L 0 900 Z" fill="url(#ca-navy)" opacity="0.85" />
        <path className="ca-wave-2" d="M 0 730 C 320 680, 560 790, 860 735 S 1340 660, 1600 720 L 1600 900 L 0 900 Z" fill="url(#ca-flame)" opacity="0.9" />
        <path className="ca-wave-3" d="M 0 700 C 300 640, 520 750, 820 700 S 1300 620, 1600 690" fill="none" stroke="#f0554c" strokeWidth="2.5" strokeOpacity="0.9" />
      </g>

      <g className="ca-trend-group" transform="translate(150 420)">
        <polyline className="ca-trend" points="0,140 90,95 165,118 265,40 350,60" fill="none" stroke="url(#ca-flame)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 344 64 l -34 4 m 34 -4 l -8 32" stroke="#f0554c" strokeWidth="4" strokeLinecap="round" fill="none" transform="scale(0.9)" />
        <circle className="ca-node" cx="0" cy="140" r="6" fill="#0a0c14" stroke="#f0554c" strokeWidth="2.5" />
        <circle className="ca-node" cx="90" cy="95" r="6" fill="#0a0c14" stroke="#f0554c" strokeWidth="2.5" />
        <circle className="ca-node" cx="165" cy="118" r="6" fill="#0a0c14" stroke="#f0554c" strokeWidth="2.5" />
        <circle className="ca-node" cx="265" cy="40" r="6" fill="#0a0c14" stroke="#f0554c" strokeWidth="2.5" />
        <circle className="ca-node" cx="350" cy="60" r="8" fill="#c51c1a" />
      </g>

      <g className="ca-rings" transform="translate(1310 300)">
        <circle className="ca-ring-outer" r="170" fill="none" stroke="#ffffff" strokeOpacity="0.14" strokeWidth="1.5" strokeDasharray="2 9" />
        <circle className="ca-ring-mid" r="115" fill="none" stroke="#2a2fd6" strokeOpacity="0.55" strokeWidth="2" />
        <circle className="ca-ring-mid" r="60" fill="none" stroke="#f0554c" strokeOpacity="0.75" strokeWidth="2" />
        <circle className="ca-ring-core" r="9" fill="#c51c1a" />
        <circle cx="115" cy="0" r="5" fill="#ffffff" opacity="0.7" />
        <circle cx="-42" cy="-42" r="4" fill="#f0554c" opacity="0.8" />
      </g>

      <g fill="#ffffff">
        <path className="ca-spark" d="M 240 150 l6 17 17 6 -17 6 -6 17 -6 -17 -17 -6 17 -6 z" opacity="0.8" />
        <path className="ca-spark" d="M 1480 520 l5 13 13 5 -13 5 -5 13 -5 -13 -13 -5 13 -5 z" fill="#c9cfff" opacity="0.8" />
        <path className="ca-spark" d="M 1050 120 l4 11 11 4 -11 4 -4 11 -4 -11 -11 -4 11 -4 z" opacity="0.5" />
      </g>
    </svg>
  );
}
