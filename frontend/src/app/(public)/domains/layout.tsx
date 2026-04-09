import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Material Domains",
  description:
    "Explore 16 material domains: water treatment, batteries, solar cells, CO2 capture, catalysts, hydrogen storage, construction, bio-materials, and more.",
  openGraph: {
    title: "Material Domains | MatCraft",
    description:
      "Explore 16 material domains supported by MatCraft for multi-objective optimization.",
  },
};

export default function DomainsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
