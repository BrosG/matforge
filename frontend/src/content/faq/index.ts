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
  | "technical"
  | "data-sources"
  | "properties"
  | "api"
  | "accounts"
  | "methodology";

export const FAQ_CATEGORIES: { slug: FaqCategory; title: string; description: string; icon: string }[] = [
  { slug: "general", title: "General", description: "Common questions about MatCraft", icon: "HelpCircle" },
  { slug: "getting-started", title: "Getting Started", description: "Setup and first steps", icon: "Rocket" },
  { slug: "optimization", title: "Optimization", description: "How the optimization engine works", icon: "Zap" },
  { slug: "domains", title: "Material Domains", description: "Supported materials and custom domains", icon: "Layers" },
  { slug: "pricing", title: "Pricing & Plans", description: "Billing, plans, and limits", icon: "CreditCard" },
  { slug: "technical", title: "Technical", description: "Architecture and advanced topics", icon: "Settings" },
  { slug: "data-sources", title: "Data Sources", description: "Questions about MP, AFLOW, JARVIS data", icon: "Database" },
  { slug: "properties", title: "Material Properties", description: "Understanding material properties", icon: "Atom" },
  { slug: "api", title: "API Usage", description: "REST API and SDK questions", icon: "Code" },
  { slug: "accounts", title: "Accounts & Access", description: "Account and authentication questions", icon: "User" },
  { slug: "methodology", title: "Scientific Methodology", description: "DFT methods and data quality", icon: "FlaskConical" },
];

import generalFaqs from "./general";
import gettingStartedFaqs from "./getting-started";
import optimizationFaqs from "./optimization";
import domainsFaqs from "./domains";
import pricingFaqs from "./pricing";
import technicalFaqs from "./technical";
import dataSourcesFaqs from "./data-sources";
import propertiesFaqs from "./properties";
import apiFaqs from "./api-faq";
import accountsFaqs from "./accounts";
import methodologyFaqs from "./methodology";

export const ALL_FAQ_ITEMS: FaqItem[] = [
  ...generalFaqs,
  ...gettingStartedFaqs,
  ...optimizationFaqs,
  ...domainsFaqs,
  ...pricingFaqs,
  ...technicalFaqs,
  ...dataSourcesFaqs,
  ...propertiesFaqs,
  ...apiFaqs,
  ...accountsFaqs,
  ...methodologyFaqs,
];

export function getFaqBySlug(slug: string): FaqItem | undefined {
  return ALL_FAQ_ITEMS.find((f) => f.slug === slug);
}

export function getFaqsByCategory(category: FaqCategory): FaqItem[] {
  return ALL_FAQ_ITEMS.filter((f) => f.category === category).sort((a, b) => a.order - b.order);
}
