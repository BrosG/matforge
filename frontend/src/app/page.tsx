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
  GraduationCap,
  Rocket,
  Pill,
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

const PERSONAS_PREVIEW = [
  {
    slug: "materials-scientists",
    icon: FlaskConical,
    label: "For Materials Scientists",
    desc: "205k+ unified materials, AI inverse design, and band structures — all in one tab.",
    gradient: "from-blue-600 to-cyan-500",
    iconColor: "text-blue-500",
    accentBorder: "hover:border-blue-400/60 dark:hover:border-blue-500/60",
  },
  {
    slug: "engineers",
    icon: Cpu,
    label: "For Engineers & Product Teams",
    desc: "Filter by 16 properties, plot scatter charts, and compare candidates in seconds.",
    gradient: "from-orange-500 to-amber-400",
    iconColor: "text-orange-500",
    accentBorder: "hover:border-orange-400/60 dark:hover:border-orange-500/60",
  },
  {
    slug: "students",
    icon: GraduationCap,
    label: "For Students & Educators",
    desc: "Free forever — 3D crystal builder, prototype library, and real DFT property data.",
    gradient: "from-emerald-500 to-teal-400",
    iconColor: "text-emerald-500",
    accentBorder: "hover:border-emerald-400/60 dark:hover:border-emerald-500/60",
  },
  {
    slug: "startups",
    icon: Rocket,
    label: "For Deep Tech Startups",
    desc: "Free materials data + $950 AI FTO reports vs. $5–10k at a law firm.",
    gradient: "from-violet-600 to-purple-500",
    iconColor: "text-violet-500",
    accentBorder: "hover:border-violet-400/60 dark:hover:border-violet-500/60",
  },
  {
    slug: "ip-lawyers",
    icon: Shield,
    label: "For Patent Attorneys",
    desc: "Search 125M+ patents in seconds and deliver FTO assessments overnight.",
    gradient: "from-slate-700 to-slate-500",
    iconColor: "text-slate-500",
    accentBorder: "hover:border-slate-400/60 dark:hover:border-slate-500/60",
  },
  {
    slug: "ai-researchers",
    icon: Brain,
    label: "For AI & ML Researchers",
    desc: "205k+ clean materials with 30+ normalised properties via REST API and bulk export.",
    gradient: "from-indigo-600 to-blue-500",
    iconColor: "text-indigo-500",
    accentBorder: "hover:border-indigo-400/60 dark:hover:border-indigo-500/60",
  },
  {
    slug: "pharma-biotech",
    icon: Pill,
    label: "For Pharma & Biotech",
    desc: "Filter by biocompatible elements, screen implant alloys, and model nanoparticle carriers.",
    gradient: "from-rose-500 to-pink-400",
    iconColor: "text-rose-500",
    accentBorder: "hover:border-rose-400/60 dark:hover:border-rose-500/60",
  },
  {
    slug: "academia-labs",
    icon: Building2,
    label: "For Academic Labs",
    desc: "Everything in one browser tab — free for academics with proper DOI citations.",
    gradient: "from-teal-600 to-cyan-500",
    iconColor: "text-teal-500",
    accentBorder: "hover:border-teal-400/60 dark:hover:border-teal-500/60",
  },
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
                MatCraft combines surrogate models, active learning, and Pareto
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

      {/* ===== WHO IS IT FOR? ===== */}
      <section className="py-24 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <span className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">
              Solutions
            </span>
            <h2 className="text-4xl font-bold mt-3 mb-4">
              Built for{" "}
              <span className="bg-gradient-to-r from-indigo-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
                Every Researcher
              </span>
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Whether you&rsquo;re a student exploring structures for the first time
              or an IP team running FTO analysis at scale — MatCraft has you covered.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PERSONAS_PREVIEW.map((p, i) => (
              <motion.div
                key={p.slug}
                className={`group relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 transition-all duration-200 cursor-pointer card-hover ${p.accentBorder} hover:shadow-lg`}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                variants={fadeUp}
                whileHover={{ scale: 1.02 }}
              >
                {/* Top gradient accent line */}
                <div
                  className={`absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl bg-gradient-to-r ${p.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-200`}
                />

                {/* Icon */}
                <div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-br ${p.gradient} flex items-center justify-center mb-4 shadow-sm group-hover:shadow-md transition-shadow`}
                >
                  <p.icon className="h-5 w-5 text-white" />
                </div>

                {/* Title */}
                <h3 className="font-semibold text-sm mb-2 leading-tight">
                  {p.label}
                </h3>

                {/* Description */}
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
                  {p.desc}
                </p>

                {/* Link */}
                <Link
                  href={`/for/${p.slug}`}
                  className={`inline-flex items-center gap-1 text-xs font-semibold ${p.iconColor} hover:opacity-80 transition-opacity`}
                >
                  Learn more
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== MATERIAL BUILDER ===== */}
      <section className="py-24 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-gray-950 to-purple-950" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-semibold mb-4">
              <Atom className="h-4 w-4" />
              New: 3D Material Builder
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mt-3">
              Build Any Structure.{" "}
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Visually.
              </span>
            </h2>
            <p className="text-lg text-gray-400 mt-4 max-w-3xl mx-auto">
              The most powerful materials structure editor on the web. Load any material from 205,000+ entries,
              modify it in 3D, and export simulation-ready files — all in your browser.
            </p>
          </motion.div>

          {/* Feature grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {[
              {
                icon: Layers,
                title: "Transform",
                items: ["Supercell expansion (NxMxL)", "Primitive ↔ conventional cell", "Standard orientation"],
                iconBg: "bg-blue-500/10 border-blue-500/20",
                iconColor: "text-blue-400",
              },
              {
                icon: Target,
                title: "Carve & Shape",
                items: ["Nanoparticles (sphere, cube)", "Surface slabs (Miller index)", "Cluster extraction"],
                iconBg: "bg-purple-500/10 border-purple-500/20",
                iconColor: "text-purple-400",
              },
              {
                icon: FlaskConical,
                title: "Modify",
                items: ["Element substitution (full/partial)", "Vacancy creation", "Interstitial atoms"],
                iconBg: "bg-cyan-500/10 border-cyan-500/20",
                iconColor: "text-cyan-400",
              },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                className="group relative rounded-2xl border border-gray-700/50 bg-gray-900/50 backdrop-blur-sm p-6 hover:border-blue-500/40 transition-all hover:bg-gray-900/80"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i + 1}
                variants={fadeUp}
              >
                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-4 ${"iconBg" in card ? card.iconBg : "bg-blue-500/10 border-blue-500/20"}`}>
                  <card.icon className={`h-6 w-6 ${"iconColor" in card ? card.iconColor : "text-blue-400"}`} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{card.title}</h3>
                <ul className="space-y-2">
                  {card.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-gray-400">
                      <ChevronRight className="h-3 w-3 text-blue-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* Workflow strip */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={3}
          >
            {[
              { step: "1", label: "Load Material", desc: "From 205k+ database or upload CIF" },
              { step: "2", label: "Modify in 3D", desc: "Place, move, substitute atoms" },
              { step: "3", label: "Transform", desc: "Supercell, surface, nanoparticle" },
              { step: "4", label: "Analyze", desc: "Composition, bonds, coordination" },
              { step: "5", label: "Export", desc: "CIF, POSCAR, XYZ, LAMMPS" },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mx-auto mb-2 text-white font-bold text-sm shadow-lg shadow-blue-500/20">
                  {s.step}
                </div>
                <div className="text-sm font-semibold text-white">{s.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{s.desc}</div>
              </div>
            ))}
          </motion.div>

          {/* Export formats + CTA */}
          <motion.div
            className="rounded-2xl border border-gray-700/50 bg-gray-900/50 backdrop-blur-sm p-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={4}
          >
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  Export to Any Simulation Code
                </h3>
                <p className="text-gray-400 mb-6">
                  One click to generate input files ready for VASP, Quantum ESPRESSO,
                  LAMMPS, CP2K, and more. No format conversion headaches.
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {["CIF", "POSCAR", "XYZ", "LAMMPS", "PDB"].map((fmt) => (
                    <span key={fmt} className="px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-xs font-mono font-bold text-gray-300">
                      .{fmt.toLowerCase()}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button asChild variant="gradient" size="lg">
                    <Link href="/material-builder">
                      Open Material Builder
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" className="bg-gray-800 border border-gray-700 text-white hover:bg-gray-700">
                    <Link href="/materials">
                      Browse Materials First
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Materials", value: "205,000+", sub: "MP + AFLOW + JARVIS" },
                  { label: "Elements", value: "94", sub: "Full periodic table" },
                  { label: "Export Formats", value: "5+", sub: "CIF, POSCAR, XYZ..." },
                  { label: "Operations", value: "8", sub: "Transform, carve, modify" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl bg-gray-800/50 border border-gray-700/50 p-4 text-center">
                    <div className="text-2xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                      {stat.value}
                    </div>
                    <div className="text-xs font-semibold text-white mt-1">{stat.label}</div>
                    <div className="text-[10px] text-gray-500">{stat.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
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
                Why MatCraft
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
              Ready to <span className="gradient-text">Craft</span> Your Next Material?
            </h2>
            <p className="text-lg text-gray-500 mb-8 max-w-2xl mx-auto">
              Join researchers using MatCraft to discover novel materials for
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
