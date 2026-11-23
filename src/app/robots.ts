import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/manager", "/dashboard", "/api", "/login"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
