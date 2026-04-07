import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation",
  description:
    "MatForge documentation — YAML campaign definitions, Python SDK, REST API reference, plugin development, and deployment guides.",
  openGraph: {
    title: "Documentation | MatForge",
    description:
      "Complete documentation for MatForge: campaign definitions, Python SDK, and API reference.",
  },
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
