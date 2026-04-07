"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookOpen,
  Sparkles,
  Terminal,
  Code2,
  FlaskConical,
  Layers,
  Settings2,
  FileCode,
  ArrowRight,
  Cpu,
  Target,
  Zap,
} from "lucide-react";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const SECTIONS = [
  {
    title: "Getting Started",
    icon: Sparkles,
    gradient: "from-blue-500 to-cyan-500",
    items: [
      { title: "Quick Start Guide", desc: "Create your first campaign in 5 minutes", badge: "Essential" },
      { title: "Installation", desc: "Set up MatForge locally with Docker or pip" },
      { title: "Core Concepts", desc: "Materials, parameters, objectives, and Pareto fronts" },
    ],
  },
  {
    title: "Material Definition Language",
    icon: FileCode,
    gradient: "from-purple-500 to-violet-500",
    items: [
      { title: "MDL Specification", desc: "YAML format for defining material optimization problems" },
      { title: "Parameters", desc: "Defining input variables with ranges and units" },
      { title: "Objectives", desc: "Setting optimization targets and directions" },
      { title: "Constraints", desc: "Hard and soft constraints on solutions" },
    ],
  },
  {
    title: "Optimization Engine",
    icon: Zap,
    gradient: "from-amber-500 to-orange-500",
    items: [
      { title: "CMA-ES Optimizer", desc: "Covariance Matrix Adaptation Evolution Strategy" },
      { title: "MLP Surrogate", desc: "Neural network surrogate with MC Dropout uncertainty" },
      { title: "Active Learning", desc: "Acquisition functions and convergence criteria" },
      { title: "Pareto Analysis", desc: "NSGA-II non-dominated sorting and crowding distance" },
    ],
  },
  {
    title: "Domains & Plugins",
    icon: Layers,
    gradient: "from-emerald-500 to-teal-500",
    items: [
      { title: "Built-in Domains", desc: "11 materials science domains with physics models" },
      { title: "Custom Plugins", desc: "Creating your own evaluator plugins" },
      { title: "Physics Models", desc: "Domain-specific equations and parameters" },
    ],
  },
  {
    title: "API Reference",
    icon: Code2,
    gradient: "from-rose-500 to-pink-500",
    items: [
      { title: "REST API", desc: "Campaign management, results, and export endpoints" },
      { title: "WebSocket API", desc: "Real-time campaign progress updates" },
      { title: "Python SDK", desc: "Programmatic access via the materia package" },
    ],
  },
  {
    title: "CLI Reference",
    icon: Terminal,
    gradient: "from-slate-500 to-gray-600",
    items: [
      { title: "materia init", desc: "Scaffold a new material optimization project" },
      { title: "materia run", desc: "Execute an optimization campaign" },
      { title: "materia results", desc: "View and export campaign results" },
      { title: "materia dashboard", desc: "Generate an interactive HTML dashboard" },
    ],
  },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero */}
      <section className="pt-28 pb-16 bg-gradient-to-b from-blue-50/50 to-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium border border-blue-200 mb-4">
              <BookOpen className="h-3.5 w-3.5" />
              Documentation
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Learn <span className="gradient-text">MatForge</span>
            </h1>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Everything you need to know about materials optimization with
              surrogate models, active learning, and Pareto analysis.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Quick start code block */}
      <section className="pb-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="bg-gray-950 border-gray-800 overflow-hidden">
            <CardHeader className="pb-2 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-xs text-gray-500 ml-2">terminal</span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <pre className="p-6 text-sm font-mono text-gray-300 overflow-x-auto">
                <code>
                  <span className="text-gray-500"># Install MatForge</span>{"\n"}
                  <span className="text-green-400">$</span> pip install materia{"\n\n"}
                  <span className="text-gray-500"># Initialize a water filtration project</span>{"\n"}
                  <span className="text-green-400">$</span> materia init --domain water --name my-membrane{"\n\n"}
                  <span className="text-gray-500"># Run optimization (500 evals, 15 rounds)</span>{"\n"}
                  <span className="text-green-400">$</span> materia run material.yaml --budget 500 --rounds 15{"\n\n"}
                  <span className="text-gray-500"># View Pareto-optimal results</span>{"\n"}
                  <span className="text-green-400">$</span> materia results --top 10{"\n"}
                  <span className="text-cyan-400">Found 12 Pareto-optimal materials</span>{"\n"}
                  <span className="text-cyan-400">Best PFOS rejection: 99.2%</span>
                </code>
              </pre>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Documentation sections */}
      <section className="py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {SECTIONS.map((section, i) => {
              const Icon = section.icon;
              return (
                <motion.div
                  key={section.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${section.gradient} flex items-center justify-center shadow-sm`}
                        >
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        {section.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {section.items.map((item) => (
                          <div
                            key={item.title}
                            className="p-4 rounded-lg border hover:bg-gray-50 hover:border-blue-200 transition-colors cursor-pointer group"
                          >
                            <div className="flex items-start justify-between">
                              <h4 className="text-sm font-semibold group-hover:text-blue-600 transition-colors">
                                {item.title}
                              </h4>
                              {"badge" in item && item.badge && (
                                <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                                  {item.badge}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {item.desc}
                            </p>
                          </div>
                        ))}
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
          <h2 className="text-3xl font-bold mb-4">Ready to Start?</h2>
          <p className="text-blue-100 mb-6">
            Create your first materials optimization campaign today.
          </p>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-white text-white hover:bg-white hover:text-blue-600"
          >
            <Link href="/register">
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
