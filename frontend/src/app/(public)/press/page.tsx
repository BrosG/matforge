"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Atom, Download, Mail, Quote, ExternalLink, Building2, Users, Database, Globe } from "lucide-react";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";

const FACTS = [
  { label: "Founded", value: "2024" },
  { label: "Headquarters", value: "Marseille, France" },
  { label: "Materials indexed", value: "205,000+" },
  { label: "Patents searchable", value: "125M+" },
  { label: "Data sources", value: "MP + AFLOW + JARVIS" },
  { label: "License", value: "Free tier + Credits" },
];

const RELEASES = [
  {
    date: "April 2026",
    title: "MatCraft launches AI Query Scoping Agent and Deep Scan — the first patent analysis tool built for materials scientists",
    excerpt: "The AI Query Scoping Agent intercepts broad searches and narrows them to precise inventor-grade Boolean queries. Deep Scan processes 15,000+ patents overnight with custom research directives.",
  },
  {
    date: "April 2026",
    title: "Materials IP Radar: AI-powered patent landscaping for materials science, free for researchers",
    excerpt: "IP Radar searches 125M+ patents across 100+ patent offices, categorizes them into 7 materials science domains using Gemini 2.0 Flash, and identifies unpatented white spaces.",
  },
  {
    date: "March 2026",
    title: "3D Material Builder — the first free browser-based structure editor for crystal, surface, and nanoparticle modeling",
    excerpt: "10 one-click prototypes, CIF/POSCAR import, right-click context menu, drag-and-drop, and share-by-URL. Browser-only, no install.",
  },
  {
    date: "March 2026",
    title: "205,000+ materials now searchable on MatCraft with AI-powered property prediction",
    excerpt: "Materials Project, AFLOW, and JARVIS-DFT unified in one search interface. Band structure, DOS, XRD, and phase diagrams available for MP materials.",
  },
];

const QUOTES = [
  {
    quote: "Materials science is the bottleneck of the energy transition. We're building the missing AI layer.",
    attribution: "MatCraft Founder",
  },
  {
    quote: "The $50k tools gave researchers these capabilities. We're giving them to every scientist on Earth, free.",
    attribution: "MatCraft",
  },
  {
    quote: "205,000 materials, in your browser, with AI. No install. No GPU. No waiting.",
    attribution: "MatCraft Product",
  },
];

const PUBLICATIONS = [
  "Nature Materials", "Materials Today", "Advanced Materials",
  "Nature Chemistry", "Materials Research Letters", "ACS Nano",
];

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function PressPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="relative pt-32 pb-20 bg-gradient-to-b from-gray-950 via-gray-900 to-background overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-1/4 w-64 h-64 bg-purple-500 rounded-full blur-3xl" />
          </div>
          <div className="relative max-w-4xl mx-auto px-4 text-center">
            <motion.div initial="hidden" animate="visible" variants={fadeUp}>
              <div className="flex items-center justify-center gap-2 mb-6">
                <Atom className="h-10 w-10 text-blue-400" />
                <span className="text-3xl font-black text-white">MatCraft</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-black text-white mb-4">Press &amp; Media</h1>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Resources for journalists, analysts, and partners covering MatCraft — the AI platform accelerating materials discovery worldwide.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Quick Facts */}
        <section className="py-16 border-b border-border">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-foreground mb-8">Quick Facts</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {FACTS.map((f) => (
                <div key={f.label} className="p-4 rounded-xl bg-card border border-border">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{f.label}</div>
                  <div className="text-lg font-bold text-foreground">{f.value}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Story */}
        <section className="py-20">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-foreground mb-6">The Story</h2>
            <div className="space-y-4 text-foreground/80 leading-relaxed">
              <p>
                <strong>Materials science is the bottleneck of the energy transition.</strong> Every solar cell, battery, catalyst, and semiconductor begins with finding the right material — a process that today costs millions of dollars and years of lab time.
              </p>
              <p>
                MatCraft was founded in Marseille, France in 2024 with a simple thesis: the same AI tools that transformed drug discovery can 10x the speed of materials discovery — if made accessible.
              </p>
              <p>
                We built the platform that was missing: <strong>205,000+ real DFT-computed materials</strong> from the world&apos;s leading databases, unified in one browser-based interface with AI-powered screening, 3D visualization, IP radar, and computational tools that previously cost $50,000/year per seat.
              </p>
              <p>
                MatCraft gives every researcher, engineer, and student the capabilities of a $50k enterprise platform — <strong>free</strong>, in their browser, with no install.
              </p>
            </div>
          </div>
        </section>

        {/* Press Releases */}
        <section className="py-16 bg-muted/30 border-y border-border">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-foreground mb-8">Press Releases</h2>
            <div className="space-y-4">
              {RELEASES.map((r) => (
                <motion.div key={r.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                  className="p-6 bg-card rounded-2xl border border-border hover:border-primary/30 transition-colors">
                  <div className="text-xs text-muted-foreground mb-2">{r.date}</div>
                  <h3 className="text-base font-semibold text-foreground mb-2">{r.title}</h3>
                  <p className="text-sm text-muted-foreground">{r.excerpt}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Quotes */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-foreground mb-8">Approved Soundbites</h2>
            <p className="text-sm text-muted-foreground mb-8">The following quotes may be used in press coverage without prior approval.</p>
            <div className="grid md:grid-cols-3 gap-4">
              {QUOTES.map((q) => (
                <div key={q.quote} className="p-6 bg-card border border-border rounded-2xl">
                  <Quote className="h-6 w-6 text-primary/40 mb-3" />
                  <p className="text-sm text-foreground leading-relaxed mb-3">&ldquo;{q.quote}&rdquo;</p>
                  <p className="text-xs text-muted-foreground">— {q.attribution}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Publications */}
        <section className="py-16 border-t border-border">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-xl font-semibold text-muted-foreground mb-8 uppercase tracking-wide">Relevant Publications</h2>
            <div className="flex flex-wrap justify-center gap-6">
              {PUBLICATIONS.map((p) => (
                <span key={p} className="text-muted-foreground/60 text-sm font-medium">{p}</span>
              ))}
            </div>
          </div>
        </section>

        {/* Press Kit + Contact */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="max-w-4xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="text-white">
                <h2 className="text-3xl font-bold mb-4">Press Kit</h2>
                <p className="text-blue-100 mb-6">Logo pack, brand guidelines, product screenshots, fact sheet — everything you need for coverage.</p>
                <Button variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600" onClick={() => alert("Press kit request submitted. We'll email it within 24h.")}>
                  <Download className="h-4 w-4 mr-2" />
                  Request Press Kit
                </Button>
              </div>
              <div className="space-y-4">
                {[
                  { icon: Mail, label: "Media inquiries", email: "press@matcraft.ai" },
                  { icon: Building2, label: "Partnerships", email: "partners@matcraft.ai" },
                  { icon: Users, label: "Investors", email: "invest@matcraft.ai", link: "/investors" },
                ].map((c) => (
                  <div key={c.label} className="flex items-center gap-3 text-white">
                    <c.icon className="h-5 w-5 text-blue-200" />
                    <div>
                      <div className="text-xs text-blue-200">{c.label}</div>
                      <a href={c.link || `mailto:${c.email}`} className="text-sm font-medium hover:underline">
                        {c.email}
                        {c.link && <ExternalLink className="h-3 w-3 inline ml-1" />}
                      </a>
                    </div>
                  </div>
                ))}
                <p className="text-xs text-blue-200 mt-4">Response time: within 24 hours</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
