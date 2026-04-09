import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explore Campaigns",
  description:
    "Discover public materials optimization campaigns — browse results, Pareto fronts, and winning material compositions.",
  openGraph: {
    title: "Explore Campaigns | MatCraft",
    description:
      "Discover public materials optimization campaigns and Pareto-optimal material compositions.",
  },
};

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
