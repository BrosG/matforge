import type { Metadata } from "next";

const SITE_URL = "https://matcraft.ai";

export const metadata: Metadata = {
  title: "Material Builder — 3D Structure Editor | MatCraft",
  description:
    "Interactive 3D material structure editor. Build supercells, carve nanoparticles, create surfaces, substitute elements, and export to CIF/POSCAR/XYZ. Works with any material from the 205k+ database.",
  openGraph: {
    title: "Material Builder | MatCraft",
    description:
      "3D material builder: supercells, surfaces, nanoparticles, substitutions. Load any material, modify, export.",
    url: `${SITE_URL}/material-builder`,
    siteName: "MatCraft",
    type: "website",
  },
  alternates: {
    canonical: `${SITE_URL}/material-builder`,
  },
};

export default function MaterialBuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
