import type { Metadata } from "next";

const SITE_URL = "https://matcraft.ai";

export const metadata: Metadata = {
  title: "Compare Materials | MatCraft",
  description:
    "Compare up to 5 materials side by side — crystal structure, electronic, mechanical, and thermal properties with interactive radar charts. Powered by MatCraft AI.",
  openGraph: {
    title: "Compare Materials | MatCraft",
    description:
      "Side-by-side material property comparison with radar charts and color-coded rankings.",
    url: `${SITE_URL}/compare`,
    siteName: "MatCraft",
    type: "website",
  },
  alternates: {
    canonical: `${SITE_URL}/compare`,
  },
};

export default function CompareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
