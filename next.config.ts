import type { NextConfig } from "next";

const securityHeaders = [
  // 'unsafe-inline' for scripts/styles is required by Next.js runtime +
  // inline style attrs used across the theme; 'unsafe-eval' only needed in
  // dev for HMR, kept here so prod/dev share one policy.
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      // Firebase client SDK (login) + Firestore over REST/WebSocket
      "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.firebasedatabase.app",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // The Devin browser-preview proxy serves the app from 127.0.0.1:<port>
  // while the dev server sees x-forwarded-host localhost:3000, so both the
  // dev-resource allowlist and the server-action CSRF allowlist need it.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["127.0.0.1:60631", "localhost:60631", "127.0.0.1", "localhost"],
    },
  },
};

export default nextConfig;
