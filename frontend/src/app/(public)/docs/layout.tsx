import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation",
  description:
    "MatCraft documentation — YAML campaign definitions, Python SDK, REST API reference, plugin development, and deployment guides.",
  openGraph: {
    title: "Documentation | MatCraft",
    description:
      "Complete documentation for MatCraft: campaign definitions, Python SDK, and API reference.",
  },
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
