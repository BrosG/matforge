import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Template Marketplace",
  description:
    "Browse, share, and fork community-created campaign templates. One-click deploy YAML configurations for materials optimization.",
};

export default function TemplatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
