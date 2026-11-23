/** Canonical site URL — used by metadata, sitemap and robots.
    Set NEXT_PUBLIC_SITE_URL to the real domain (e.g. https://rbsocialbranding.com);
    on Vercel the deployment URL is picked up automatically via VERCEL_URL. */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
