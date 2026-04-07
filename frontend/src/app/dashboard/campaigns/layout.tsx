import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Campaigns",
  description:
    "Manage your materials discovery campaigns — create, monitor, and analyze optimization runs with surrogate models and active learning.",
};

export default function CampaignsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
