import type { MetadataRoute } from "next";
import { ALL_DOC_PAGES } from "@/content/docs/index";
import { ALL_FAQ_ITEMS } from "@/content/faq/index";

const SITE_URL = "https://matcraft.ai";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/materials`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/docs`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/faq`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/pricing`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/domains`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/explore`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.5,
    },
  ];

  // Doc pages
  const docPages: MetadataRoute.Sitemap = ALL_DOC_PAGES.map((page) => ({
    url: `${SITE_URL}/docs/${page.category}/${page.slug}`,
    lastModified: page.lastUpdated ? new Date(page.lastUpdated) : now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // FAQ pages
  const faqPages: MetadataRoute.Sitemap = ALL_FAQ_ITEMS.map((item) => ({
    url: `${SITE_URL}/faq/${item.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...docPages, ...faqPages];
}
