import type { Metadata } from "next";

const SITE_URL = "https://matcraft.ai";

export const metadata: Metadata = {
  title: "Materials IP Radar — Patent Landscape Intelligence | MatCraft",
  description:
    "AI-powered patent landscape analysis for materials science. Search, analyze, and map patent white spaces across compositions, processes, coatings, nanostructures, and more. Freedom-to-operate intelligence for researchers and engineers.",
  openGraph: {
    title: "Materials IP Radar | MatCraft",
    description:
      "Patent landscape intelligence for materials science. AI analysis of patent portfolios, white space identification, and FTO assessment.",
    url: `${SITE_URL}/ip-radar`,
    siteName: "MatCraft",
    type: "website",
  },
  alternates: {
    canonical: `${SITE_URL}/ip-radar`,
  },
};

export default function IPRadarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
