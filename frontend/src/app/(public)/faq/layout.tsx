import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ - MatCraft",
  description:
    "Frequently asked questions about MatCraft — learn about our AI-powered materials discovery platform, optimization engine, pricing, and more.",
  openGraph: {
    title: "FAQ | MatCraft",
    description:
      "Find answers to common questions about MatCraft's materials optimization platform.",
  },
};

export default function FaqLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
