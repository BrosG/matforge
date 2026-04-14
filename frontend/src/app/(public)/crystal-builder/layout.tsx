import type { Metadata } from "next";

const SITE_URL = "https://matcraft.ai";

export const metadata: Metadata = {
  title: "Crystal Structure Builder | MatCraft",
  description:
    "Interactive 3D crystal structure editor. Place atoms, define lattice parameters, and export to CIF, POSCAR, or XYZ. Visual builder for materials science.",
  openGraph: {
    title: "Crystal Structure Builder | MatCraft",
    description:
      "Interactive 3D crystal structure editor for materials science. Build, edit, and export crystal structures visually.",
    url: `${SITE_URL}/crystal-builder`,
    siteName: "MatCraft",
    type: "website",
  },
  alternates: {
    canonical: `${SITE_URL}/crystal-builder`,
  },
};

export default function CrystalBuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
