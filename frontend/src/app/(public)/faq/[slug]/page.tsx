import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { MarkdownRenderer } from "@/components/docs/MarkdownRenderer";
import JsonLd from "@/components/seo/JsonLd";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ALL_FAQ_ITEMS,
  FAQ_CATEGORIES,
  getFaqBySlug,
} from "@/content/faq";

const SITE_URL = "https://matcraft.ai";

export function generateStaticParams() {
  return ALL_FAQ_ITEMS.map((f) => ({ slug: f.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const faq = getFaqBySlug(params.slug);
  if (!faq) {
    return { title: "FAQ Not Found - MatCraft" };
  }

  const description = faq.answer.replace(/[#*`\n]/g, " ").trim().slice(0, 160);

  return {
    title: `${faq.question} - MatCraft FAQ`,
    description,
    openGraph: {
      title: faq.question,
      description,
      url: `${SITE_URL}/faq/${faq.slug}`,
    },
  };
}

export default function FaqDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const faq = getFaqBySlug(params.slug);
  if (!faq) {
    notFound();
  }

  const category = FAQ_CATEGORIES.find((c) => c.slug === faq.category);
  const relatedFaqs = faq.relatedSlugs
    .map((slug) => getFaqBySlug(slug))
    .filter(Boolean);

  const breadcrumbItems = [
    { name: "Home", url: SITE_URL },
    { name: "FAQ", url: `${SITE_URL}/faq` },
    ...(category
      ? [{ name: category.title, url: `${SITE_URL}/faq?category=${faq.category}` }]
      : []),
    { name: faq.question, url: `${SITE_URL}/faq/${faq.slug}` },
  ];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      },
    ],
  };

  return (
    <div className="min-h-screen">
      <Header />
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <JsonLd data={faqJsonLd} />

      <section className="pt-28 pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-8 flex-wrap">
            <Link
              href="/faq"
              className="hover:text-blue-600 transition-colors"
            >
              FAQ
            </Link>
            {category && (
              <>
                <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="text-gray-400">{category.title}</span>
              </>
            )}
            <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="text-gray-900 font-medium truncate max-w-[300px]">
              {faq.question}
            </span>
          </nav>

          {/* Back Link */}
          <Link
            href="/faq"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors mb-6"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to all questions
          </Link>

          {/* Question Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            {faq.question}
          </h1>

          {/* Category Badge + Tags */}
          <div className="flex flex-wrap items-center gap-2 mb-8">
            {category && (
              <Badge variant="info">{category.title}</Badge>
            )}
            {faq.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Answer Content */}
          <div className="mb-16">
            <MarkdownRenderer content={faq.answer} />
          </div>

          {/* Related Questions */}
          {relatedFaqs.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Related Questions
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {relatedFaqs.map((related) => {
                  if (!related) return null;
                  const relatedCategory = FAQ_CATEGORIES.find(
                    (c) => c.slug === related.category
                  );
                  return (
                    <Link key={related.slug} href={`/faq/${related.slug}`}>
                      <Card className="h-full hover:shadow-md hover:border-blue-200 transition-all duration-200">
                        <CardHeader className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-sm font-medium text-gray-900 leading-snug">
                              {related.question}
                            </CardTitle>
                            <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                          </div>
                          {relatedCategory && (
                            <span className="text-xs text-gray-400 mt-1">
                              {relatedCategory.title}
                            </span>
                          )}
                        </CardHeader>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
