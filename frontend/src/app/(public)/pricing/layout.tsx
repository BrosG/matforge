import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "MatForge pricing plans — free tier for researchers, Pro for teams, and Enterprise for organizations. Start discovering materials today.",
  openGraph: {
    title: "Pricing | MatForge",
    description:
      "Flexible pricing plans for materials discovery. Free for researchers, scalable for teams.",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
