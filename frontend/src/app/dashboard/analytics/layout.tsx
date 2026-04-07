import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analytics",
  description:
    "Track your materials discovery progress — Pareto fronts, convergence metrics, and cross-campaign insights.",
};

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
