"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookOpen,
  Sparkles,
  Terminal,
  Code2,
  Layers,
  FileCode,
  ArrowRight,
  Zap,
  Star,
  Database,
  Clock,
} from "lucide-react";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DOC_CATEGORIES, getDocsByCategory, type DocCategoryMeta } from "@/content/docs";
import type { LucideIcon } from "lucide-react";

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

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <Header />

      {/* Hero */}
      <section className="pt-28 pb-16 bg-gradient-to-b from-blue-50/50 to-transparent dark:from-blue-950/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-medium border border-blue-200 dark:border-blue-800 mb-4">
              <BookOpen className="h-3.5 w-3.5" />
              Documentation
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Learn <span className="gradient-text">MatCraft</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive guides for materials search, 3D visualization,
              structure building, AI-powered discovery, and the full REST API.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Quick links */}
      <section className="pb-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-2">
            {DOC_CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/docs/${cat.slug}`}
                className="px-3 py-1.5 text-sm rounded-full border border-border bg-card hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                {cat.title}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Documentation sections */}
      <section className="py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {DOC_CATEGORIES.map((section, i) => {
              const Icon = ICON_MAP[section.icon] ?? Sparkles;
              const pages = getDocsByCategory(section.slug);
              if (pages.length === 0) return null;

              return (
                <motion.div
                  key={section.slug}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Card className="border-border">
                    <CardHeader className="pb-3">
                      <Link href={`/docs/${section.slug}`} className="group">
                        <CardTitle className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${section.gradient} flex items-center justify-center shadow-sm`}
                          >
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <span className="group-hover:text-primary transition-colors">
                              {section.title}
                            </span>
                            <p className="text-sm font-normal text-muted-foreground mt-0.5">
                              {section.description}
                            </p>
                          </div>
                          <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground group-hover:text-primary transition-colors" />
                        </CardTitle>
                      </Link>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {pages.slice(0, 6).map((page) => (
                          <Link
                            key={page.slug}
                            href={`/docs/${page.category}/${page.slug}`}
                            className="group/item"
                          >
                            <div className="p-4 rounded-lg border border-border hover:bg-muted/50 hover:border-primary/30 transition-colors">
                              <div className="flex items-start justify-between">
                                <h4 className="text-sm font-semibold text-foreground group-hover/item:text-primary transition-colors">
                                  {page.title}
                                </h4>
                                {page.order === 0 && (
                                  <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                                    Start here
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {page.description}
                              </p>
                              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground mt-2">
                                <Clock className="h-2.5 w-2.5" />
                                {page.readingTime} min
                              </span>
                            </div>
                          </Link>
                        ))}
                        {pages.length > 6 && (
                          <Link
                            href={`/docs/${section.slug}`}
                            className="p-4 rounded-lg border border-dashed border-border hover:border-primary/30 transition-colors flex items-center justify-center text-sm text-muted-foreground hover:text-primary"
                          >
                            +{pages.length - 6} more pages
                            <ArrowRight className="h-3.5 w-3.5 ml-1" />
                          </Link>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-3xl mx-auto px-4 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Explore?</h2>
          <p className="text-blue-100 mb-6">
            Search 205,000+ materials, visualize crystal structures, and discover new candidates.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              asChild
              variant="outline"
              size="lg"
              className="bg-transparent border-white text-white hover:bg-white hover:text-blue-600"
            >
              <Link href="/materials">
                Browse Materials
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="bg-transparent border-white/50 text-white hover:bg-white hover:text-blue-600"
            >
              <Link href="/docs/tutorials/getting-started">
                Getting Started Tutorial
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
