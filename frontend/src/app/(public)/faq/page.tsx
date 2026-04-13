"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  HelpCircle,
  Rocket,
  Zap,
  Layers,
  CreditCard,
  Settings,
  Search,
  ChevronDown,
  ExternalLink,
  Database,
  Atom,
  Code,
  User,
  FlaskConical,
} from "lucide-react";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import JsonLd from "@/components/seo/JsonLd";
import { cn } from "@/lib/utils";
import {
  ALL_FAQ_ITEMS,
  FAQ_CATEGORIES,
  getFaqsByCategory,
  type FaqCategory,
} from "@/content/faq";

const ICON_MAP: Record<string, React.ElementType> = {
  HelpCircle,
  Rocket,
  Zap,
  Layers,
  CreditCard,
  Settings,
  Database,
  Atom,
  Code,
  User,
  FlaskConical,
};

const SITE_URL = "https://matcraft.ai";

export default function FaqPage() {
  const [activeCategory, setActiveCategory] = useState<FaqCategory | "all">(
    "all"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  const filteredFaqs = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    if (activeCategory === "all") {
      if (!query) return ALL_FAQ_ITEMS;
      return ALL_FAQ_ITEMS.filter((faq) =>
        faq.question.toLowerCase().includes(query)
      );
    }

    const categoryFaqs = getFaqsByCategory(activeCategory);
    if (!query) return categoryFaqs;
    return categoryFaqs.filter((faq) =>
      faq.question.toLowerCase().includes(query)
    );
  }, [activeCategory, searchQuery]);

  const groupedFaqs = useMemo(() => {
    if (activeCategory !== "all") return null;

    const groups: { category: (typeof FAQ_CATEGORIES)[number]; items: typeof filteredFaqs }[] = [];
    for (const cat of FAQ_CATEGORIES) {
      const items = filteredFaqs.filter((f) => f.category === cat.slug);
      if (items.length > 0) {
        groups.push({ category: cat, items });
      }
    }
    return groups;
  }, [activeCategory, filteredFaqs]);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: ALL_FAQ_ITEMS.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  function toggleAccordion(slug: string) {
    setOpenSlug((prev) => (prev === slug ? null : slug));
  }

  return (
    <div className="min-h-screen">
      <Header />
      <JsonLd data={faqJsonLd} />

      {/* Hero */}
      <section className="pt-28 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-sm font-medium border border-purple-200 mb-4">
              <HelpCircle className="h-3.5 w-3.5" />
              Help Center
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Frequently Asked{" "}
              <span className="gradient-text">Questions</span>
            </h1>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              Everything you need to know about MatCraft. Can&apos;t find an
              answer? Reach out to our team.
            </p>
          </motion.div>

          {/* Search */}
          <motion.div
            className="relative max-w-lg mx-auto mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            />
          </motion.div>

          {/* Category Filters */}
          <motion.div
            className="flex flex-wrap justify-center gap-2 mb-12"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Button
              variant={activeCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory("all")}
              className="rounded-full"
            >
              All
            </Button>
            {FAQ_CATEGORIES.map((cat) => {
              const Icon = ICON_MAP[cat.icon] || HelpCircle;
              return (
                <Button
                  key={cat.slug}
                  variant={activeCategory === cat.slug ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory(cat.slug)}
                  className="rounded-full"
                >
                  <Icon className="h-3.5 w-3.5 mr-1.5" />
                  {cat.title}
                </Button>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* FAQ List */}
      <section className="pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredFaqs.length === 0 && (
            <motion.div
              className="text-center py-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <HelpCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                No questions match your search.
              </p>
              <p className="text-gray-400 text-sm mt-1">
                Try a different query or browse all categories.
              </p>
            </motion.div>
          )}

          {activeCategory === "all" && groupedFaqs
            ? groupedFaqs.map((group, gi) => {
                const Icon =
                  ICON_MAP[group.category.icon] || HelpCircle;
                return (
                  <motion.div
                    key={group.category.slug}
                    className="mb-10"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: gi * 0.05 }}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <Icon className="h-5 w-5 text-blue-600" />
                      <h2 className="text-xl font-semibold text-gray-900">
                        {group.category.title}
                      </h2>
                    </div>
                    <div className="space-y-2">
                      {group.items.map((faq) => (
                        <AccordionItem
                          key={faq.slug}
                          faq={faq}
                          isOpen={openSlug === faq.slug}
                          onToggle={() => toggleAccordion(faq.slug)}
                        />
                      ))}
                    </div>
                  </motion.div>
                );
              })
            : filteredFaqs.length > 0 && (
                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {filteredFaqs.map((faq) => (
                    <AccordionItem
                      key={faq.slug}
                      faq={faq}
                      isOpen={openSlug === faq.slug}
                      onToggle={() => toggleAccordion(faq.slug)}
                    />
                  ))}
                </motion.div>
              )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

function AccordionItem({
  faq,
  isOpen,
  onToggle,
}: {
  faq: (typeof ALL_FAQ_ITEMS)[number];
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium text-gray-900 text-sm sm:text-base">
          {faq.question}
        </span>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            href={`/faq/${faq.slug}`}
            onClick={(e) => e.stopPropagation()}
            className="text-gray-400 hover:text-blue-600 transition-colors"
            title="Open full page"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-gray-400 transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed whitespace-pre-line border-t border-gray-100 pt-3">
              {faq.answer.length > 300
                ? faq.answer.slice(0, 300).trimEnd() + "..."
                : faq.answer}
              <div className="mt-3">
                <Link
                  href={`/faq/${faq.slug}`}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium hover:underline"
                >
                  Read full answer &rarr;
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
