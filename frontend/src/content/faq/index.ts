export interface FaqItem {
  slug: string;
  question: string;
  answer: string;
  category: FaqCategory;
  order: number;
  relatedSlugs: string[];
  tags: string[];
}

export type FaqCategory =
  | "general"
  | "getting-started"
  | "optimization"
  | "domains"
  | "pricing"
  | "technical";

export const FAQ_CATEGORIES: { slug: FaqCategory; title: string; description: string; icon: string }[] = [
  { slug: "general", title: "General", description: "Common questions about MatCraft", icon: "HelpCircle" },
  { slug: "getting-started", title: "Getting Started", description: "Setup and first steps", icon: "Rocket" },
  { slug: "optimization", title: "Optimization", description: "How the optimization engine works", icon: "Zap" },
  { slug: "domains", title: "Material Domains", description: "Supported materials and custom domains", icon: "Layers" },
  { slug: "pricing", title: "Pricing & Plans", description: "Billing, plans, and limits", icon: "CreditCard" },
  { slug: "technical", title: "Technical", description: "Architecture and advanced topics", icon: "Settings" },
];

import generalFaqs from "./general";
import gettingStartedFaqs from "./getting-started";
import optimizationFaqs from "./optimization";
import domainsFaqs from "./domains";
import pricingFaqs from "./pricing";
import technicalFaqs from "./technical";

export const ALL_FAQ_ITEMS: FaqItem[] = [
  ...generalFaqs,
  ...gettingStartedFaqs,
  ...optimizationFaqs,
  ...domainsFaqs,
  ...pricingFaqs,
  ...technicalFaqs,
];

export function getFaqBySlug(slug: string): FaqItem | undefined {
  return ALL_FAQ_ITEMS.find((f) => f.slug === slug);
}

export function getFaqsByCategory(category: FaqCategory): FaqItem[] {
  return ALL_FAQ_ITEMS.filter((f) => f.category === category).sort((a, b) => a.order - b.order);
}
