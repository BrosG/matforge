import type { Metadata } from "next";

const SITE_URL = "https://matcraft.ai";

export const metadata: Metadata = {
  title: "Structure Builder | MatCraft",
  description:
    "Build crystal structures with supercell expansion, surface slabs, nanoparticles, atomic substitution, and AI-powered inverse design. MatCraft Structure Builder.",
  openGraph: {
    title: "Structure Builder | MatCraft",
    description:
      "Build and modify crystal structures with powerful tools for supercells, surfaces, nanoparticles, substitutions, and AI inverse design.",
    url: `${SITE_URL}/builder`,
    siteName: "MatCraft",
    type: "website",
  },
  alternates: {
    canonical: `${SITE_URL}/builder`,
  },
};

export default function BuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
