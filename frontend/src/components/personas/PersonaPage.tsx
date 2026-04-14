"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ChevronRight,
  XCircle,
  CheckCircle2,
  Search,
  Box,
  BarChart2,
  Download,
  SlidersHorizontal,
  ScatterChart,
  LayoutList,
  FileDown,
  Code2,
  Database,
  GitBranch,
  Shield,
  FileSearch,
  Map,
  FolderOpen,
  Zap,
  TrendingUp,
  Filter,
  Activity,
  Layers,
  LayoutDashboard,
  FileCode,
  BookMarked,
  Lock,
  GraduationCap,
  BookOpen,
  type LucideIcon,
} from "lucide-react";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import type { Persona } from "@/lib/personas";

// Map string icon names from persona data to lucide components
const ICON_MAP: Record<string, LucideIcon> = {
  Search,
  Box,
  BarChart2,
  Download,
  SlidersHorizontal,
  ScatterChart,
  LayoutList,
  FileDown,
  Code2,
  Database,
  GitBranch,
  Shield,
  FileSearch,
  Map,
  FolderOpen,
  Zap,
  TrendingUp,
  Filter,
  Activity,
  Layers,
  LayoutDashboard,
  FileCode,
  BookMarked,
  Lock,
  GraduationCap,
  BookOpen,
};

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" },
  }),
};

interface PersonaPageProps {
  persona: Persona;
}

export function PersonaPage({ persona }: PersonaPageProps) {
  const Icon = persona.icon;

  // Accent colour classes derived from accentColor string
  const accent = persona.accentColor;
  const accentBg = `bg-${accent}-50 dark:bg-${accent}-950/30`;
  const accentBorder = `border-${accent}-200 dark:border-${accent}-800`;
  const accentText = `text-${accent}-600 dark:text-${accent}-400`;
  const accentIcon = `bg-${accent}-100 dark:bg-${accent}-900/50 text-${accent}-600 dark:text-${accent}-400`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        {/* Gradient background */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${persona.gradientFrom} ${persona.gradientTo} opacity-[0.08] dark:opacity-[0.15]`}
        />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        {/* Blobs */}
        <div
          className={`absolute -top-20 -left-20 w-[500px] h-[500px] bg-gradient-to-br ${persona.gradientFrom} ${persona.gradientTo} rounded-full blur-[120px] opacity-10 animate-blob`}
        />
        <div
          className={`absolute bottom-0 right-0 w-[400px] h-[400px] bg-gradient-to-tl ${persona.gradientFrom} ${persona.gradientTo} rounded-full blur-[100px] opacity-10 animate-blob`}
          style={{ animationDelay: "3s" }}
        />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center gap-6"
          >
            {/* Tag */}
            <span
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold border ${accentBg} ${accentBorder} ${accentText}`}
            >
              <Icon className="h-4 w-4" />
              {persona.tagline}
            </span>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] max-w-4xl">
              {persona.headline}
            </h1>

            {/* Subheadline */}
            <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
              {persona.subheadline}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3 justify-center pt-2">
              <Button asChild variant="gradient" size="lg">
                <Link href="/register">
                  Get started free
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/pricing">View pricing</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── PAIN POINTS ──────────────────────────────────────────────────── */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <span className="text-sm font-semibold text-rose-500 uppercase tracking-wider">
              The Problem
            </span>
            <h2 className="text-3xl font-bold mt-3">
              Sound familiar?
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {persona.pains.map((pain, i) => (
              <motion.div
                key={pain.title}
                className="group relative bg-card border border-border rounded-2xl p-6 hover:border-rose-300 dark:hover:border-rose-700 transition-colors"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i + 1}
                variants={fadeUp}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <XCircle className="h-5 w-5 text-rose-500" />
                  </div>
                  <h3 className="font-semibold text-base">{pain.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed pl-8">
                  {pain.desc}
                </p>
                {/* Red accent bar */}
                <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded-b-2xl bg-gradient-to-r from-rose-400 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOLUTIONS ────────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <span className="text-sm font-semibold text-emerald-500 uppercase tracking-wider">
              The Solution
            </span>
            <h2 className="text-3xl font-bold mt-3">
              How MatCraft fixes it
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {persona.solutions.map((sol, i) => (
              <motion.div
                key={sol.title}
                className="group relative bg-card border border-border rounded-2xl p-6 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i + 1}
                variants={fadeUp}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  </div>
                  <h3 className="font-semibold text-base">{sol.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed pl-8">
                  {sol.desc}
                </p>
                <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded-b-2xl bg-gradient-to-r from-emerald-400 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURE HIGHLIGHTS ───────────────────────────────────────────── */}
      <section className={`py-20 ${accentBg}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <span className={`text-sm font-semibold uppercase tracking-wider ${accentText}`}>
              Key Features
            </span>
            <h2 className="text-3xl font-bold mt-3">
              Built for{" "}
              <span
                className={`bg-gradient-to-r ${persona.gradientFrom} ${persona.gradientTo} bg-clip-text text-transparent`}
              >
                {persona.label}
              </span>
            </h2>
          </motion.div>

          <div className="space-y-6">
            {persona.features.map((feat, i) => {
              const FeatIcon = ICON_MAP[feat.icon] ?? Search;
              return (
                <motion.div
                  key={feat.title}
                  className="flex items-start gap-5 bg-card border border-border rounded-2xl p-6 hover:shadow-md transition-shadow"
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={i + 1}
                  variants={fadeUp}
                >
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${accentIcon}`}
                  >
                    <FeatIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base mb-1">{feat.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feat.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIAL ──────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="relative"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            {/* Giant quote mark */}
            <div
              className={`absolute -top-6 -left-2 text-8xl font-black leading-none ${accentText} opacity-20 select-none`}
            >
              &ldquo;
            </div>

            <blockquote className="relative bg-card border border-border rounded-2xl p-8 md:p-10">
              <p className="text-lg md:text-xl font-medium leading-relaxed mb-6 text-foreground">
                {persona.testimonial.quote}
              </p>
              <footer className="flex items-center gap-4">
                {/* Avatar placeholder */}
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white bg-gradient-to-br ${persona.gradientFrom} ${persona.gradientTo}`}
                >
                  {persona.testimonial.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-sm">{persona.testimonial.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {persona.testimonial.role} · {persona.testimonial.org}
                  </p>
                </div>
              </footer>
            </blockquote>
          </motion.div>
        </div>
      </section>

      {/* ── PRICING CALLOUT ──────────────────────────────────────────────── */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <span className={`text-sm font-semibold uppercase tracking-wider ${accentText}`}>
              Pricing
            </span>
            <h2 className="text-3xl font-bold mt-3 mb-2">
              {persona.pricing.tier}
            </h2>
            <div className="flex items-end justify-center gap-1 mb-4">
              <span className="text-5xl font-black">{persona.pricing.price}</span>
              {persona.pricing.period && (
                <span className="text-muted-foreground text-lg mb-1">
                  {persona.pricing.period}
                </span>
              )}
            </div>
            <p className="text-muted-foreground mb-8">{persona.pricing.highlight}</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button asChild variant="gradient" size="lg">
                <Link href={persona.pricing.href}>
                  {persona.pricing.cta}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/pricing">See all plans</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to get started?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Join thousands of researchers and engineers already using MatCraft
              to accelerate materials discovery.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button asChild variant="gradient" size="xl">
                <Link href="/register">
                  Get started free
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="xl">
                <Link href="/materials">Browse materials</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
