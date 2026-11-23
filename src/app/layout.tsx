import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import { siteUrl } from "@/lib/site-url";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const title = "RB Social Branding — Social Media, Content & Marketing Agency";
const description =
  "RB Social Branding (a Roshan Bharat division) grows businesses through social media management, content creation, professional shoots, performance marketing, web development and design — everything under one roof in Kishangarh, Rajasthan.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: "%s — RB Social Branding",
  },
  description,
  applicationName: "RB Social Branding",
  keywords: [
    "social media agency Kishangarh",
    "digital marketing Rajasthan",
    "content creation",
    "graphic design agency",
    "video editing",
    "web development",
    "RB Social Branding",
    "Roshan Bharat",
  ],
  authors: [{ name: "RB Social Branding" }],
  openGraph: {
    type: "website",
    url: "/",
    siteName: "RB Social Branding",
    title,
    description,
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "RB Social Branding — digital marketing agency" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export const viewport: Viewport = {
  themeColor: "#070d1c",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${jakarta.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
