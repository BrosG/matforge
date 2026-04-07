import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/core/Providers";
import { AnalyticsProvider } from "@/components/core/AnalyticsProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const SITE_URL = "https://matforge.ai";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "MatForge — AI-Powered Materials Discovery Platform",
    template: "%s | MatForge",
  },
  description:
    "Accelerate materials discovery with AI surrogate models, active learning, and multi-objective Pareto optimization. Search 8+ public databases, run GNN surrogates (CHGNet, MACE), and export CIF/POSCAR.",
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
    "OPTIMADE",
    "Materials Project",
    "band gap",
    "formation energy",
  ],
  authors: [{ name: "MatForge", url: SITE_URL }],
  creator: "MatForge",
  openGraph: {
    title: "MatForge — AI-Powered Materials Discovery Platform",
    description:
      "Accelerate materials discovery with AI surrogate models, active learning, and multi-objective Pareto optimization.",
    url: SITE_URL,
    siteName: "MatForge",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "MatForge — AI-Powered Materials Discovery Platform",
    description:
      "Accelerate materials discovery with AI surrogate models, active learning, and Pareto optimization.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: SITE_URL,
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
          <AnalyticsProvider>{children}</AnalyticsProvider>
        </Providers>
      </body>
    </html>
  );
}
