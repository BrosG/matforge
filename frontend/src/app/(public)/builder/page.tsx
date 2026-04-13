"use client";

import { Suspense } from "react";
import { motion } from "framer-motion";
import { Hammer, Atom } from "lucide-react";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { BuilderForm } from "@/components/builder/BuilderForm";

export default function BuilderPage() {
  return (
    <>
      <Header />

      <main className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-blue-50 via-purple-50/30 to-white dark:from-blue-950/30 dark:via-purple-950/20 dark:to-gray-900">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/40 via-transparent to-transparent dark:from-blue-900/20" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-3xl mx-auto"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100/60 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-sm font-medium mb-4">
                <Hammer className="h-4 w-4" />
                Structure Builder
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
                Build Crystal Structures
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                Create supercells, surface slabs, nanoparticles, and substitutional alloys
                from any material in our database — or use AI inverse design to discover
                new structures matching your target properties.
              </p>

              {/* Feature pills */}
              <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
                {[
                  "Supercell Expansion",
                  "Surface Slabs",
                  "Nanoparticles",
                  "Atomic Substitution",
                  "AI Inverse Design",
                ].map((feature) => (
                  <span
                    key={feature}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 dark:bg-gray-800/70 border border-border text-muted-foreground text-xs font-medium"
                  >
                    <Atom className="h-3 w-3" />
                    {feature}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Builder Form */}
        <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <Suspense fallback={<div className="h-96 bg-muted/30 rounded-xl animate-pulse" />}>
            <BuilderForm />
          </Suspense>
        </section>
      </main>

      <Footer />
    </>
  );
}
