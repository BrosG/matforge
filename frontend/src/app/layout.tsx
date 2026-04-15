import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/core/Providers";
import { AnalyticsProvider } from "@/components/core/AnalyticsProvider";
import { VersionGuard } from "@/components/core/VersionGuard";
import { ExtensionErrorFilter } from "@/components/core/ExtensionErrorFilter";

// Force ALL pages to render dynamically on every request.
// Without this, Next.js sets s-maxage=31536000 on SSG pages, causing
// Google Frontend CDN to cache HTML for 1 year after each deploy.
export const dynamic = "force-dynamic";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const SITE_URL = "https://matcraft.ai";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "MatCraft — AI-Powered Materials Discovery Platform",
    template: "%s | MatCraft",
  },
  description:
    "Accelerate materials discovery with AI surrogate models, active learning, and multi-objective Pareto optimization. Search 205,000+ real materials from Materials Project, AFLOW, and JARVIS-DFT.",
  keywords: [
    "materials science",
    "materials discovery",
    "active learning",
    "Pareto optimization",
    "surrogate model",
    "CHGNet",
    "MACE",
    "DFT",
    "materials informatics",
    "computational materials science",
    "Materials Project",
    "AFLOW",
    "JARVIS",
    "band gap",
    "formation energy",
    "crystal structure",
  ],
  authors: [{ name: "MatCraft", url: SITE_URL }],
  creator: "MatCraft",
  openGraph: {
    title: "MatCraft — AI-Powered Materials Discovery Platform",
    description:
      "Search 205,000+ real materials. 3D crystal structures, band structures, AI-powered screening, and computational tools.",
    url: SITE_URL,
    siteName: "MatCraft",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "MatCraft — AI-Powered Materials Discovery Platform",
    description:
      "Search 205,000+ real materials with AI-powered discovery tools.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: SITE_URL,
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <Providers>
          <ExtensionErrorFilter />
          <AnalyticsProvider>
            {children}
            <VersionGuard />
          </AnalyticsProvider>
        </Providers>
      </body>
    </html>
  );
}
