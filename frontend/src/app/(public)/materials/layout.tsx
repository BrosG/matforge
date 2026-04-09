import type { Metadata } from "next";

const SITE_URL = "https://matcraft.ai";

export const metadata: Metadata = {
  title: {
    default: "Material Discovery",
    template: "%s | MatCraft Materials",
  },
  description:
    "Explore thousands of materials with advanced filtering by elements, crystal system, band gap, formation energy, and stability. Powered by MatCraft AI.",
  openGraph: {
    title: "Material Discovery | MatCraft",
    description:
      "Explore and discover materials with AI-powered search, periodic table filtering, and detailed property analysis.",
    url: `${SITE_URL}/materials`,
    siteName: "MatCraft",
    type: "website",
  },
  alternates: {
    canonical: `${SITE_URL}/materials`,
  },
};

export default function MaterialsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
