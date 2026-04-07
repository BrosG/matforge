"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Atom,
  Brain,
  Target,
  TrendingUp,
  Layers,
  Zap,
  BarChart3,
  FlaskConical,
  ChevronRight,
  ChevronDown,
  Shield,
  Clock,
  Sparkles,
  Droplets,
  Battery,
  Sun,
  Wind,
  Fuel,
  Building2,
  Leaf,
  Wheat,
  Cpu,
  Shirt,
  Play,
} from "lucide-react";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const CrystalViewer = dynamic(
  () =>
    import("@/components/viewers/CrystalViewer").then((m) => m.CrystalViewer),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl animate-pulse" />
    ),
  }
);

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

const FEATURES = [
  {
    icon: Brain,
    title: "Surrogate Models",
    desc: "NumPy-only MLP neural network with MC Dropout uncertainty. No GPU needed - runs anywhere.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Target,
    title: "Active Learning",
    desc: "Smart sampling with MaxUncertainty, Expected Improvement, and UCB acquisition functions.",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: TrendingUp,
    title: "Pareto Optimization",
    desc: "NSGA-II multi-objective optimization with CMA-ES on the surrogate surface.",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    icon: Layers,
    title: "11 Domain Plugins",
    desc: "Water, battery, solar, CO2, catalyst, hydrogen, construction, bio, agri, electronics, textile.",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    icon: Zap,
    title: "100x Faster",
    desc: "Replace expensive simulations with surrogate predictions. Evaluate thousands in seconds.",
    gradient: "from-yellow-500 to-amber-500",
  },
  {
    icon: BarChart3,
    title: "Real-time Dashboard",
    desc: "Live campaign progress with 3D visualizations, Pareto plots, and convergence tracking.",
    gradient: "from-indigo-500 to-blue-500",
  },
];

const DOMAINS = [
  { key: "water", label: "Water Filtration", icon: Droplets, color: "text-blue-500", bg: "bg-blue-50", desc: "PFOS rejection membranes" },
  { key: "battery", label: "Battery Materials", icon: Battery, color: "text-green-500", bg: "bg-green-50", desc: "Next-gen energy storage" },
  { key: "solar", label: "Solar Cells", icon: Sun, color: "text-amber-500", bg: "bg-amber-50", desc: "Perovskite photovoltaics" },
  { key: "co2", label: "CO2 Capture", icon: Wind, color: "text-teal-500", bg: "bg-teal-50", desc: "Carbon capture sorbents" },
  { key: "catalyst", label: "Catalysis", icon: FlaskConical, color: "text-purple-500", bg: "bg-purple-50", desc: "Reaction optimization" },
  { key: "hydrogen", label: "Hydrogen Storage", icon: Fuel, color: "text-cyan-500", bg: "bg-cyan-50", desc: "H2 storage materials" },
  { key: "construction", label: "Construction", icon: Building2, color: "text-stone-500", bg: "bg-stone-50", desc: "Low-carbon concrete" },
  { key: "bio", label: "Biomaterials", icon: Leaf, color: "text-emerald-500", bg: "bg-emerald-50", desc: "Biocompatible scaffolds" },
  { key: "agri", label: "Agriculture", icon: Wheat, color: "text-lime-600", bg: "bg-lime-50", desc: "Controlled-release fertilizers" },
  { key: "electronics", label: "Electronics", icon: Cpu, color: "text-indigo-500", bg: "bg-indigo-50", desc: "Semiconductor materials" },
  { key: "textile", label: "Smart Textiles", icon: Shirt, color: "text-pink-500", bg: "bg-pink-50", desc: "Responsive fabric composites" },
  { key: "thermoelectric", label: "Thermoelectrics", icon: Zap, color: "text-orange-500", bg: "bg-orange-50", desc: "Heat-to-electricity conversion" },
  { key: "superconductor", label: "Superconductors", icon: Atom, color: "text-sky-500", bg: "bg-sky-50", desc: "High-Tc superconducting materials" },
  { key: "polymer", label: "Polymers", icon: Layers, color: "text-violet-500", bg: "bg-violet-50", desc: "Sustainable polymer design" },
  { key: "coating", label: "Coatings", icon: Shield, color: "text-slate-500", bg: "bg-slate-50", desc: "Protective thin film coatings" },
  { key: "ceramic", label: "Ceramics", icon: Target, color: "text-rose-500", bg: "bg-rose-50", desc: "High-performance ceramics" },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Define", desc: "Write a YAML material definition: parameters, objectives, constraints, and physics equations." },
  { step: "02", title: "Launch", desc: "Start a campaign. The engine samples initial materials and trains a surrogate model." },
  { step: "03", title: "Optimize", desc: "CMA-ES finds optimal candidates on the surrogate. Active learning picks the most informative." },
  { step: "04", title: "Discover", desc: "Pareto-optimal materials emerge. Export recipes, visualize trade-offs, iterate." },
];

const STATS = [
  { value: "100x", label: "Faster Discovery" },
  { value: "16", label: "Material Domains" },
  { value: "<1s", label: "Per Evaluation" },
  { value: "0", label: "GPU Required" },
];

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen">
      <Header />

      {/* ===== HERO ===== */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 grid-pattern animate-grid-fade" />
        <div className="absolute top-20 -left-40 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-blob" />
        <div className="absolute top-40 -right-40 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-blob" style={{ animationDelay: "2s" }} />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-t from-blue-50 to-transparent rounded-full blur-3xl" />

        {/* Floating material icons */}
        <motion.div
          className="absolute top-32 left-[10%] text-blue-400/40"
          animate={{ y: [-10, 10, -10], rotate: [0, 10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        >
          <Atom className="h-10 w-10" />
        </motion.div>
        <motion.div
          className="absolute top-48 right-[15%] text-purple-400/40"
          animate={{ y: [10, -15, 10], rotate: [0, -15, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        >
          <FlaskConical className="h-8 w-8" />
        </motion.div>
        <motion.div
          className="absolute bottom-32 left-[20%] text-amber-400/40"
          animate={{ y: [-15, 5, -15], scale: [1, 1.1, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles className="h-9 w-9" />
        </motion.div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Text */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium border border-blue-200 mb-6">
                  <Sparkles className="h-3.5 w-3.5" />
                  AI-Powered Materials Discovery
                </span>
              </motion.div>

              <motion.h1
                className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                Discover{" "}
                <span className="gradient-text">Materials</span>
                <br />
                <span className="text-gray-400">Accelerated</span>
              </motion.h1>

              <motion.p
                className="text-lg text-gray-600 max-w-lg mb-8 leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                MatForge combines surrogate models, active learning, and Pareto
                optimization to find optimal materials 100x faster than brute-force
                search. No GPU required.
              </motion.p>

              <motion.div
                className="flex flex-wrap gap-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Button asChild variant="gradient" size="xl">
                  <Link href={isAuthenticated ? "/dashboard/campaigns/new" : "/register"}>
                    <Target className="mr-2 h-5 w-5" />
                    Start Discovering
                  </Link>
                </Button>
                <Button asChild variant="outline" size="xl">
                  <Link href="/explore">
                    <Play className="mr-2 h-5 w-5" />
                    Explore Campaigns
                  </Link>
                </Button>
              </motion.div>

              <motion.p
                className="text-xs text-gray-400 mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Free to explore &middot; No credit card required &middot; 11 material domains
              </motion.p>
            </div>

            {/* Right - 3D Viewer */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="aspect-square max-w-lg mx-auto relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-purple-100/50 rounded-3xl" />
                <div className="absolute inset-2 bg-white/60 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/50 overflow-hidden">
                  <CrystalViewer className="w-full h-full" showControls />
                </div>
                <div className="absolute -top-3 -right-3 glass rounded-lg px-3 py-1.5 shadow-lg">
                  <span className="text-xs font-semibold text-blue-700">3D Structure</span>
                </div>
                <div className="absolute -bottom-3 -left-3 glass rounded-lg px-3 py-1.5 shadow-lg">
                  <span className="text-xs font-semibold text-purple-700">Interactive</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Scroll indicator */}
          <motion.div
            className="flex justify-center mt-16"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <ChevronDown className="h-6 w-6 text-gray-400" />
          </motion.div>
        </div>
      </section>

      {/* ===== QUICK STATS ===== */}
      <section className="py-12 border-y bg-gray-50/50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                className="text-center"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                variants={fadeUp}
              >
                <div className="text-3xl md:text-4xl font-bold gradient-text">{s.value}</div>
                <div className="text-sm text-gray-500 mt-1">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider">
              Capabilities
            </span>
            <h2 className="text-4xl font-bold mt-3 mb-4">
              Everything You Need for{" "}
              <span className="gradient-text">Materials Discovery</span>
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              A complete platform combining physics-based evaluation, machine
              learning surrogates, and intelligent optimization.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                className="group relative bg-white rounded-2xl border p-6 card-hover"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                variants={fadeUp}
              >
                <div
                  className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} text-white mb-4 shadow-lg group-hover:scale-110 transition-transform`}
                >
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-24 bg-gray-50/50">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <span className="text-sm font-semibold text-purple-600 uppercase tracking-wider">
              Workflow
            </span>
            <h2 className="text-4xl font-bold mt-3">
              How It <span className="gradient-text">Works</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={step.step}
                className="relative text-center"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                variants={fadeUp}
              >
                <div className="text-5xl font-black text-blue-100 mb-3">
                  {step.step}
                </div>
                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                {i < HOW_IT_WORKS.length - 1 && (
                  <ChevronRight className="hidden md:block absolute top-8 -right-4 h-6 w-6 text-gray-300" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== DOMAINS ===== */}
      <section id="domains" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <span className="text-sm font-semibold text-green-600 uppercase tracking-wider">
              Material Domains
            </span>
            <h2 className="text-4xl font-bold mt-3 mb-4">
              <span className="gradient-text">16 Domains</span>, Infinite Possibilities
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Each domain includes physics equations, YAML templates, and
              pre-configured optimization parameters.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {DOMAINS.map((d, i) => (
              <motion.div
                key={d.key}
                className={`group ${d.bg} rounded-xl border border-transparent hover:border-gray-200 p-5 cursor-pointer card-hover`}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                variants={fadeUp}
              >
                <d.icon className={`h-8 w-8 ${d.color} mb-3 group-hover:scale-110 transition-transform`} />
                <h3 className="font-semibold text-sm mb-1">{d.label}</h3>
                <p className="text-xs text-gray-500">{d.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== BENEFITS ===== */}
      <section className="py-24 bg-gray-50/50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
            >
              <span className="text-sm font-semibold text-amber-600 uppercase tracking-wider">
                Why MatForge
              </span>
              <h2 className="text-4xl font-bold mt-3 mb-6">
                Built for{" "}
                <span className="gradient-text-warm">Scientists</span>
              </h2>
              <div className="space-y-5">
                {[
                  { icon: Clock, title: "Hours, Not Months", desc: "Evaluate 10,000 candidates where you could only test 50." },
                  { icon: Shield, title: "Physics-Grounded", desc: "Equations from domain experts. Not just statistics." },
                  { icon: Sparkles, title: "Zero Setup", desc: "No GPU, no cloud credentials, no Docker. pip install and go." },
                  { icon: Zap, title: "Open & Extensible", desc: "Write your own plugins. Bring your own evaluator." },
                ].map((b, i) => (
                  <motion.div
                    key={b.title}
                    className="flex gap-4"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    custom={i + 1}
                    variants={fadeUp}
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                      <b.icon className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-0.5">{b.title}</h3>
                      <p className="text-sm text-gray-500">{b.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="relative"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={2}
            >
              <div className="bg-gray-900 rounded-2xl p-6 shadow-2xl">
                <div className="flex gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <pre className="text-sm text-gray-300 font-mono overflow-x-auto">
                  <code>{`name: PFOS Rejection Membrane
domain: water

parameters:
  - name: pore_diameter
    range: [0.5, 5.0]
    unit: nm
  - name: active_layer_thickness
    range: [50.0, 500.0]
    unit: nm

objectives:
  - name: pfos_rejection
    direction: maximize
    equation: "water:pfos_rejection"
  - name: permeability
    direction: maximize
    equation: "water:permeability"

active_learning:
  initial_samples: 20
  samples_per_round: 10
  acquisition: max_uncertainty`}</code>
                </pre>
              </div>
              <div className="absolute -top-4 -right-4 glass rounded-lg px-3 py-1.5 shadow-lg">
                <span className="text-xs font-semibold text-green-700">material.yaml</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to <span className="gradient-text">Forge</span> Your Next Material?
            </h2>
            <p className="text-lg text-gray-500 mb-8 max-w-2xl mx-auto">
              Join researchers using MatForge to discover novel materials for
              water, energy, construction, and beyond.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button asChild variant="gradient" size="xl">
                <Link href={isAuthenticated ? "/dashboard/campaigns/new" : "/register"}>
                  Start Free Campaign
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="xl">
                <Link href="/explore">Browse Results</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
