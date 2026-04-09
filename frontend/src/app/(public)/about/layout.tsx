import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "About MatCraft — our mission to accelerate materials discovery through AI-powered surrogate models, active learning, and multi-objective optimization.",
  openGraph: {
    title: "About | MatCraft",
    description:
      "Our mission to accelerate materials discovery through AI and computational science.",
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
