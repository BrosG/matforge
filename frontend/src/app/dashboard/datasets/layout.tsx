import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dataset Browser",
  description:
    "Search and import materials from 8 public databases: Materials Project, AFLOW, OQMD, OPTIMADE, JARVIS, Perovskite DB, GNoME, and OpenDAC.",
};

export default function DatasetsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
