import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Sparkles,
  FileCode,
  Zap,
  Layers,
  Code2,
  Terminal,
  Star,
  Database,
  BookOpen,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { DOC_CATEGORIES, getDocsByCategory } from "@/content/docs";
import { DocBreadcrumb } from "@/components/docs/DocBreadcrumb";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const ICON_MAP: Record<string, LucideIcon> = {
  Sparkles,
  FileCode,
  Zap,
  Layers,
  Code2,
  Terminal,
  Star,
  Database,
  BookOpen,
};

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

export async function generateStaticParams() {
  return DOC_CATEGORIES.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const meta = DOC_CATEGORIES.find((c) => c.slug === category);
  if (!meta) return {};

  return {
    title: `${meta.title} | MatCraft Docs`,
    description: meta.description,
    openGraph: {
      title: `${meta.title} | MatCraft Documentation`,
      description: meta.description,
      url: `https://matcraft.ai/docs/${meta.slug}`,
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  const meta = DOC_CATEGORIES.find((c) => c.slug === category);
  if (!meta) notFound();

  const pages = getDocsByCategory(category);
  const Icon = ICON_MAP[meta.icon] ?? Sparkles;

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <DocBreadcrumb
          items={[
            { label: "Docs", href: "/docs" },
            { label: meta.title },
          ]}
        />

        {/* Category header */}
        <div className="mt-6 mb-10">
          <div className="flex items-center gap-4 mb-3">
            <div
              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center shadow-sm`}
            >
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {meta.title}
              </h1>
              <p className="text-muted-foreground mt-1">{meta.description}</p>
            </div>
          </div>
        </div>

        {/* Page listing */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {pages.map((page) => (
            <Link
              key={page.slug}
              href={`/docs/${page.category}/${page.slug}`}
              className="group"
            >
              <Card className="h-full transition-colors hover:border-primary/30 hover:bg-muted/30">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors">
                    {page.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
                    {page.description}
                  </p>
                  <div className="flex items-center gap-3 mt-3 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {page.readingTime} min read
                    </span>
                    {page.tags.slice(0, 3).map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
