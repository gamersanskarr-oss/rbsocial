import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Devin browser-preview proxy serves the app from 127.0.0.1:<port>
  // while the dev server sees x-forwarded-host localhost:3000, so both the
  // dev-resource allowlist and the server-action CSRF allowlist need it.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
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
