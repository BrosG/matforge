import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Calendar } from "lucide-react";
import {
  DOC_CATEGORIES,
  ALL_DOC_PAGES,
  getDocPage,
  getAdjacentPages,
} from "@/content/docs";
import { DocSidebar } from "@/components/docs/DocSidebar";
import { TableOfContents } from "@/components/docs/TableOfContents";
import { DocPrevNext } from "@/components/docs/DocPrevNext";
import { DocBreadcrumb } from "@/components/docs/DocBreadcrumb";
import { MarkdownRenderer } from "@/components/docs/MarkdownRenderer";
import { Badge } from "@/components/ui/badge";
import JsonLd from "@/components/seo/JsonLd";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";

const SITE_URL = "https://matcraft.ai";

interface DocSlugPageProps {
  params: Promise<{ category: string; slug: string }>;
}

export async function generateStaticParams() {
  return ALL_DOC_PAGES.map((p) => ({
    category: p.category,
    slug: p.slug,
  }));
}

export async function generateMetadata({
  params,
}: DocSlugPageProps): Promise<Metadata> {
  const { category, slug } = await params;
  const page = getDocPage(category, slug);
  if (!page) return {};

  const categoryMeta = DOC_CATEGORIES.find((c) => c.slug === category);
  const title = `${page.title} | ${categoryMeta?.title ?? "Docs"} | MatCraft`;

  return {
    title,
    description: page.description,
    openGraph: {
      title,
      description: page.description,
      url: `${SITE_URL}/docs/${category}/${slug}`,
      type: "article",
    },
  };
}

export default async function DocSlugPage({ params }: DocSlugPageProps) {
  const { category, slug } = await params;
  const page = getDocPage(category, slug);
  if (!page) notFound();

  const categoryMeta = DOC_CATEGORIES.find((c) => c.slug === category);
  const { prev, next } = getAdjacentPages(category, slug);

  const breadcrumbItems = [
    { name: "Docs", url: `${SITE_URL}/docs` },
    {
      name: categoryMeta?.title ?? category,
      url: `${SITE_URL}/docs/${category}`,
    },
    { name: page.title, url: `${SITE_URL}/docs/${category}/${slug}` },
  ];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "TechArticle",
          headline: page.title,
          description: page.description,
          dateModified: page.lastUpdated,
          url: `${SITE_URL}/docs/${category}/${slug}`,
          publisher: {
            "@type": "Organization",
            name: "MatCraft",
            url: SITE_URL,
          },
          keywords: page.tags.join(", "),
        }}
      />
      <BreadcrumbJsonLd items={breadcrumbItems} />

      <div className="pt-20">
        {/* Back link */}
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <Link
            href="/docs"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Docs
          </Link>
        </div>

        {/* 3-column layout */}
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="flex gap-8">
            {/* Left sidebar */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-24">
                <DocSidebar
                  currentCategory={category}
                  currentSlug={slug}
                />
              </div>
            </aside>

            {/* Main content */}
            <article className="flex-1 min-w-0 max-w-3xl">
              <DocBreadcrumb
                items={[
                  { label: "Docs", href: "/docs" },
                  {
                    label: categoryMeta?.title ?? category,
                    href: `/docs/${category}`,
                  },
                  { label: page.title },
                ]}
              />

              <header className="mt-6 mb-8">
                <h1 className="text-3xl font-bold tracking-tight mb-2">
                  {page.title}
                </h1>
                <p className="text-lg text-muted-foreground mb-4">
                  {page.description}
                </p>
                <div className="flex items-center gap-4 flex-wrap text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(page.lastUpdated).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {page.readingTime} min read
                  </span>
                  {page.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-xs"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </header>

              <div className="prose prose-gray max-w-none">
                <MarkdownRenderer content={page.body} />
              </div>

              <div className="mt-12">
                <DocPrevNext prev={prev} next={next} />
              </div>
            </article>

            {/* Right TOC */}
            <aside className="hidden xl:block w-56 flex-shrink-0">
              <div className="sticky top-24">
                <TableOfContents body={page.body} />
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
