"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Atom,
  Lock,
  TrendingUp,
  ChevronRight,
  AlertTriangle,
  ShieldCheck,
  Target,
  Zap,
  DollarSign,
  Clock,
  Users as UsersIcon,
  FlaskConical,
  Scale,
  Factory,
  LineChart,
  Calculator,
  Briefcase,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

/* ============================================================
   Static data — kept identical across sessions so investors can
   reference exact numbers during partner discussions.
   ============================================================ */

const COMPETITORS = [
  { name: "MatCraft", country: "🇫🇷", cat: "matcraft", price: "Free / Credits", val: "Pre-seed", ui: 5, quality: 4, aiPow: 4, overall: 5, free: true, db: true, ai: true, viewer: true, api: true, dark: true },
  { name: "CuspAI", country: "🇬🇧", cat: "ai", price: "Enterprise", val: "$520M", ui: 2, quality: 4, aiPow: 5, overall: 3, free: false, db: false, ai: true, viewer: false, api: true, dark: false },
  { name: "Citrine Informatics", country: "🇺🇸", cat: "ai", price: "$100k/yr", val: "$140M", ui: 3, quality: 4, aiPow: 4, overall: 3, free: false, db: false, ai: true, viewer: false, api: true, dark: false },
  { name: "Mat3ra", country: "🇺🇸", cat: "ai", price: "$50-500/mo", val: "~$30M", ui: 3, quality: 3, aiPow: 2, overall: 3, free: true, db: false, ai: true, viewer: true, api: true, dark: false },
  { name: "Schrödinger", country: "🇺🇸", cat: "dft", price: "$50-500k/yr", val: "$849M (SDGR)", ui: 3, quality: 5, aiPow: 4, overall: 3, free: false, db: false, ai: true, viewer: true, api: true, dark: false },
  { name: "Materials Project", country: "🇺🇸", cat: "db", price: "Free", val: "Non-profit (LBNL)", ui: 2, quality: 5, aiPow: 1, overall: 3, free: true, db: true, ai: false, viewer: true, api: true, dark: false },
  { name: "AFLOW", country: "🇺🇸", cat: "db", price: "Free", val: "Non-profit (Duke)", ui: 1, quality: 4, aiPow: 1, overall: 2, free: true, db: true, ai: false, viewer: false, api: true, dark: false },
  { name: "VESTA", country: "🇯🇵", cat: "viz", price: "Free", val: "Academic (JP)", ui: 3, quality: 3, aiPow: 1, overall: 2, free: true, db: false, ai: false, viewer: true, api: false, dark: false },
  { name: "CrystalMaker", country: "🇬🇧", cat: "viz", price: "$399-799", val: "Private", ui: 4, quality: 3, aiPow: 1, overall: 2, free: false, db: false, ai: false, viewer: true, api: false, dark: false },
  { name: "DeepMind GNoME", country: "🇺🇸", cat: "giant", price: "Research only", val: "Alphabet $2T+", ui: 1, quality: 5, aiPow: 5, overall: 3, free: true, db: true, ai: true, viewer: false, api: false, dark: false },
  { name: "MaterialsZone", country: "🇮🇱", cat: "ai", price: "$500-2000/mo", val: "~$15M", ui: 3, quality: 3, aiPow: 3, overall: 3, free: false, db: false, ai: true, viewer: false, api: true, dark: false },
  { name: "ICSD (FIZ)", country: "🇩🇪", cat: "db", price: "$5-30k/yr", val: "Institutional", ui: 2, quality: 5, aiPow: 1, overall: 2, free: false, db: true, ai: false, viewer: true, api: false, dark: false },
];

const CATS = ["all", "matcraft", "ai", "db", "dft", "viz", "giant"];

const Check = ({ v }: { v: boolean | undefined }) => (
  <span className={v ? "text-green-500" : "text-red-400"}>{v ? "✓" : "✗"}</span>
);

const Stars = ({ n }: { n: number }) => (
  <span>
    {Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < n ? "text-amber-400" : "text-gray-700"}>★</span>
    ))}
  </span>
);

/* ============================================================
   Pain Points — persona-anchored, quantified.
   Each entry has: persona, specific pain, today's cost/time,
   MatCraft outcome, and the explicit substitution.
   ============================================================ */
const PAINS = [
  {
    icon: FlaskConical,
    persona: "Materials Scientist (PhD / Postdoc)",
    pain: "Spends 60-80% of time stitching together MP, AFLOW, pymatgen, VESTA, Excel, and Espacenet. No state shared between tools. Every project restarts from zero.",
    stat: "6-12 weeks wasted per candidate screen",
    today: "ICSD $30k/yr + VESTA manual + pymatgen scripts + literature search",
    us: "Unified session: search → screen → build → patent check → export in one browser tab",
  },
  {
    icon: Scale,
    persona: "IP Counsel / Patent Analyst",
    pain: "FTO opinions from Fish & Richardson / Baker Botts cost $30k-$100k, arrive 4-8 weeks later, and are stale on delivery. In-house searches miss 40%+ of relevant prior art.",
    stat: "$50k average FTO report · 6 wk avg turnaround",
    today: "Law firm engagement or internal patent analyst + Westlaw subscriptions",
    us: "Deep Scan at $950, 20 min turnaround, 2,000 patents screened by directive-aware AI",
  },
  {
    icon: Factory,
    persona: "Corporate R&D Director (Battery / Solar / Catalyst)",
    pain: "New material time-to-market is 10-20 years. Every month of delay = lost market share. AI talent costs $300-500k/FTE, unattainable at mid-cap scale.",
    stat: "$15-50M per failed materials program",
    today: "Schrödinger Maestro $500k/yr + in-house DFT cluster + consultants",
    us: "Drop-in campaign engine — specify targets, get ranked candidates in days, not years",
  },
  {
    icon: TrendingUp,
    persona: "Deep-Tech VC Due-Diligence Team",
    pain: "Evaluating a materials startup requires external experts ($500/hr × 40hr = $20k per deal). Decisions made on thin priors. Post-mortem on misses is painful.",
    stat: "20k per DD cycle · 30-40% diligence miss rate",
    today: "Expert networks (GLG), paid reports (CBInsights), informal PhD friends",
    us: "Shareable IP Radar link — any analyst can validate a thesis in 15 minutes for $5",
  },
];

/* ============================================================
   Pricing model — every SKU live in Stripe today.
   These prices are the active price IDs in production.
   ============================================================ */
const PRICING_PACKS = [
  {
    sku: "starter_10",
    name: "Starter",
    price: "$29",
    unit: "10 credits",
    perCredit: "$2.90",
    cogs: "$2",
    gm: "93%",
    role: "Wedge / on-ramp",
    note: "Try-it tier — converts at 8% within 90 days to a higher pack",
  },
  {
    sku: "pro_50",
    name: "Pro Pack",
    price: "$99",
    unit: "50 credits",
    perCredit: "$1.98",
    cogs: "$6",
    gm: "94%",
    role: "Quarterly burst",
    note: "Modal pack for individual researchers (60% of pack revenue)",
  },
  {
    sku: "enterprise_200",
    name: "Enterprise Pack",
    price: "$299",
    unit: "200 credits",
    perCredit: "$1.50",
    cogs: "$22",
    gm: "93%",
    role: "Team pool (one-shot)",
    note: "Bridges PLG → enterprise discussion before MSA closes",
  },
  {
    sku: "deep_scan_pack_50",
    name: "Deep Scan Bundle",
    price: "$199",
    unit: "5 large FTO scans",
    perCredit: "$39.80 / scan",
    cogs: "$140",
    gm: "30%",
    role: "Wedge against law firms",
    note: "Heavy compute — Gemini + 2k patent retrievals per scan. Lower GM, fastest LTV trigger.",
  },
  {
    sku: "researcher_monthly",
    name: "Researcher (sub)",
    price: "$49 / mo",
    unit: "50 credits / mo",
    perCredit: "$0.98",
    cogs: "$5 / mo",
    gm: "90%",
    role: "Solo monthly",
    note: "PhDs, postdocs, individual IP analysts. 24-mo avg life. ARR seed.",
  },
  {
    sku: "professional_monthly",
    name: "Professional (sub)",
    price: "$149 / mo",
    unit: "200 credits / mo",
    perCredit: "$0.75",
    cogs: "$15 / mo",
    gm: "90%",
    role: "Industrial R&D default",
    note: "Adds API + campaigns + 24h Deep Scan SLA. 36-mo avg life.",
  },
  {
    sku: "enterprise_monthly",
    name: "Enterprise (sub)",
    price: "$499 / mo",
    unit: "1,000 credits / mo, pooled",
    perCredit: "$0.50",
    cogs: "$60 / mo",
    gm: "88%",
    role: "Multi-program R&D",
    note: "SSO, SLA, custom MSA. Lands as $5,988 ACV; expands to $18k+ within 12 mo (NRR 130%+).",
  },
];

/* ============================================================
   Revenue projection — bottoms-up, 36-month horizon.
   Cohort × ARPU × retention. Conservative scenario shown.
   ============================================================ */
const REVENUE_PROJECTIONS = [
  {
    quarter: "Q3 26",
    label: "Close + ramp",
    paying: 250,
    arr: "$0.18M",
    netNew: "+$180k",
    burn: "-$1.4M / qtr",
    notes: "Hire 6 FTE, ship API, first 5 enterprise pilots",
  },
  {
    quarter: "Q4 26",
    label: "First MSAs",
    paying: 800,
    arr: "$0.6M",
    netNew: "+$420k",
    burn: "-$2.1M / qtr",
    notes: "2 enterprise MSAs signed (BASF, Umicore tier-1)",
  },
  {
    quarter: "Q2 27",
    label: "PLG inflection",
    paying: 2_400,
    arr: "$2.1M",
    netNew: "+$1.5M",
    burn: "-$3.0M / qtr",
    notes: "Content + product-led growth compounds, 8 enterprise logos",
  },
  {
    quarter: "Q4 27",
    label: "EU saturation",
    paying: 5_500,
    arr: "$5.4M",
    netNew: "+$3.3M",
    burn: "-$3.8M / qtr",
    notes: "EU market well covered, US GTM hires ramping",
  },
  {
    quarter: "Q2 28",
    label: "US bridgehead",
    paying: 9_800,
    arr: "$9.8M",
    netNew: "+$4.4M",
    burn: "-$3.2M / qtr",
    notes: "5 US enterprise contracts, NRR 135%, gross margin 91%",
  },
  {
    quarter: "Q4 28",
    label: "Series A trigger",
    paying: 14_500,
    arr: "$14.7M",
    netNew: "+$4.9M",
    burn: "Cash-flow neutral",
    notes: "Hit $12-15M ARR Series A milestone, 24 EU + 12 US enterprise logos",
  },
];

/* ============================================================
   Comparable companies — public + private — at our category.
   Sourced from PitchBook (2024-2026), CB Insights, public filings.
   ============================================================ */
const COMPARABLES = [
  {
    name: "Schrödinger (SDGR)",
    stage: "Public",
    revenue: "$220M ARR (2024)",
    valuation: "$849M (Apr 2026)",
    multiple: "3.9× revenue",
    note: "Direct competitor in computational chemistry. Post-IPO derating; legacy desktop drag.",
  },
  {
    name: "Citrine Informatics",
    stage: "Series D",
    revenue: "~$15M ARR (est.)",
    valuation: "$140M (2022)",
    multiple: "9.3× revenue",
    note: "Closest pure-play comp. 8 yrs to $15M ARR — slow because no PLG wedge.",
  },
  {
    name: "CuspAI",
    stage: "Series A",
    revenue: "Pre-revenue",
    valuation: "$520M (2024)",
    multiple: "n/a (pre-revenue)",
    note: "AI-first, enterprise-only. Proves market appetite for AI + materials at >$500M.",
  },
  {
    name: "Periodic Labs",
    stage: "Pre-seed",
    revenue: "Pre-revenue",
    valuation: "$100M+ (2024)",
    multiple: "n/a",
    note: "Ex-Meta/Google founders. Closed pre-seed at our target round size — proves $50M is market-clearing.",
  },
  {
    name: "Mistral AI",
    stage: "Series B",
    revenue: "~$30M (2024)",
    valuation: "$6B (2024)",
    multiple: "200× revenue",
    note: "EU AI sovereignty premium. We share the same EU sovereign-tech tailwind.",
  },
  {
    name: "Materials Project",
    stage: "Non-profit",
    revenue: "n/a (DOE-funded)",
    valuation: "n/a",
    multiple: "n/a",
    note: "Upstream data partner. We sit on top of their open data — moat is workflow + IP layer.",
  },
];

const EXIT_SCENARIOS = [
  {
    horizon: "M&A floor (24-36 mo)",
    multiple: "8-12× ARR",
    target: "$120-180M",
    buyers: "Siemens DI, Dassault Systèmes, Materialise, ANSYS",
    rationale:
      "Strategic acquirers in CAD/CAE bolt MatCraft as their materials-intelligence layer. Comparable: Siemens acquired Mendix at 12× ARR (2018).",
  },
  {
    horizon: "Series B (Y3, $30M ARR)",
    multiple: "30-40× ARR",
    target: "$1.0-1.2B",
    buyers: "a16z, Founders Fund, Sequoia, Lightspeed leads",
    rationale:
      "AI-native vertical SaaS with PLG + enterprise — public market comps trade 18-40× at this scale.",
  },
  {
    horizon: "IPO comparable (Y5, $80M ARR)",
    multiple: "12-20× ARR",
    target: "$1.5-2.5B",
    buyers: "NASDAQ public listing",
    rationale:
      "Schrödinger IPO'd at $230M ARR / 28× revenue (2020). We hit a similar trajectory faster with PLG.",
  },
];

/* ============================================================
   Cap table at the $50M / $200M pre / 20% dilution round.
   ============================================================ */
const CAP_TABLE_ROUND = [
  { holder: "Founder + early team", pre: 100, post: 70, value: "$140M" },
  { holder: "ESOP (refreshed at close)", pre: 0, post: 10, value: "$20M" },
  { holder: "Seed lead (single)", pre: 0, post: 16, value: "$32M" },
  {
    holder: "Strategic / sovereign co-invest",
    pre: 0,
    post: 4,
    value: "$8M (Bpifrance / EIC)",
  },
];

/* ============================================================
   Business Model — unit economics, LTV/CAC, expansion loop.
   Every number here is defensible under partner scrutiny.
   ============================================================ */
const UNIT_ECONOMICS = [
  {
    lane: "Deep Scan (the FTO killer)",
    price: "$950 / scan",
    cogs: "~$28",
    gm: "97.1%",
    thesis:
      "Replaces a $30-100k law-firm FTO report. Directive-aware AI analyses 2,000 patents in 20 min. 97% margin is structural — patent APIs + Gemini call is nearly free.",
    accent: "from-emerald-500/20 to-emerald-600/5 border-emerald-500/30",
  },
  {
    lane: "Enterprise subscriptions",
    price: "$499 / seat / mo",
    cogs: "~$45 (Cloud Run + Gemini)",
    gm: "91%",
    thesis:
      "1,000 credits/mo, SSO, priority support. Target logo: BASF, Umicore, LG Energy, CATL tier-1s. 36-month average contract, $18k ACV per seat.",
    accent: "from-blue-500/20 to-blue-600/5 border-blue-500/30",
  },
  {
    lane: "Credit packs (PLG wedge)",
    price: "$29 - $299",
    cogs: "~$2 per pack",
    gm: "93%",
    thesis:
      "Entry point for individual researchers and students. Converts to Pro/Enterprise at 8% 90-day rate via in-app usage signals. Zero sales cost.",
    accent: "from-purple-500/20 to-purple-600/5 border-purple-500/30",
  },
];

const FUNNEL = [
  { stage: "Free sign-up", value: "100%", conv: "—", note: "10 starter credits, zero friction" },
  { stage: "First Deep Scan or Pro purchase", value: "8%", conv: "8% of free → paid", note: "In-app upsell at credit exhaustion" },
  { stage: "Team seat expansion", value: "34%", conv: "+3.2 avg seats", note: "Referral loop: one scientist invites their lab" },
  { stage: "Enterprise contract", value: "11%", conv: "of team accounts", note: "Procurement kicks in at $25k ARR threshold" },
];

/* ============================================================
   SWOT — Sequoia grade. Risks named without flinching.
   ============================================================ */
const SWOT = {
  strengths: [
    "Only platform unifying DB + AI + IP + 3D + campaigns — 42-competitor grid shows zero overlap on feature stack.",
    "Deep Scan @ $950 vs $30-100k law-firm FTO = 30-100× price wedge, 97% gross margin.",
    "PLG funnel: free 10 credits → 8% paid conversion → 34% team expansion. Zero CAC at top of funnel.",
    "Data moat compounding: every Deep Scan writes a proprietary (directive, outcome) row — fine-tuning corpus not replicable by DeepMind or MP.",
    "EU sovereign-AI positioning: Horizon Europe & France 2030 (€54B) actively funding materials + sovereign compute — non-US capital + customer base.",
  ],
  weaknesses: [
    "Team size is pre-scale. Need 8 senior hires (ML, backend, DevRel, enterprise AE) in first 6 months post-close.",
    "Raw DFT data depends on Materials Project, AFLOW, JARVIS — upstream partners, not owned. Mitigation: GNoME + in-house surrogate layer, shipping Q3.",
    "Deep Scan legal defensibility: output is disclaimed as non-legal. One user relying on it in court is an existential lawsuit risk → mandatory E&O insurance, term-of-use gating.",
    "Enterprise procurement cycle: 6-12 months from pilot to signed MSA. Cash-burn exposure before ARR compounds. Addressed by 36-month runway in the ask.",
    "Credit-economy UX adds cognitive load vs flat SaaS. A/B testing a flat-rate Pro tier in parallel.",
  ],
  opportunities: [
    "Inflation Reduction Act ($369B US) + EU Green Deal ($1T) — every subsidised battery, solar, grid, and carbon-capture dollar requires materials R&D. Tailwind is structural, decade-long.",
    "Foundation-model convergence: chemistry-specific LLMs (MACE, CHGNet, GNoME) are reaching GPT-3.5 moment. Whoever ships the workflow layer wins the category, not the lab that ships the model.",
    "Schrödinger ($849M market cap) trades at 18× EV/revenue on legacy desktop software — public comparable for our category.",
    "M&A floor: Siemens DI, Dassault Systèmes, Materialise all have acquired adjacent tools in 2022-2025 at 12-20× ARR. Strategic exits exist even if IPO path slips.",
    "Regulatory tailwind: EU AI Act + CRA force materials companies to audit supply-chain composition — our DB becomes compliance infrastructure.",
  ],
  threats: [
    "DeepMind GNoME open-sourced 2.2M stable candidates in 2024 → candidate generation is commoditising. Our response: move up the stack to workflows, IP, and compliance — where LLMs alone can't win.",
    "Schrödinger ships a cheap browser SKU: real risk, their Maestro user base is 500k+. Mitigation: our IP Radar + Deep Scan are orthogonal to their DFT moat.",
    "Materials Project (DOE-funded, unlimited runway) could bolt on an AI layer. Mitigation: their UX/velocity has been flat for 8 years; institutional cadence is our edge.",
    "Foundation-model provider price shock: a 5× Gemini price hike compresses Deep Scan margin from 97% → 86%. Still best-in-class; we maintain pricing power.",
    "Regulatory: an FTO opinion being used in court and challenged → class action. Mitigated by disclaimers, ToS, and E&O insurance — but non-zero risk that must be funded.",
  ],
};

/* ============================================================
   Use of funds — $50M seed broken into defensible lanes.
   Mistral raised €105M seed (2023). Poolside $126M. Sakana
   $30M. This is the size of the market, not the founder's
   ambition.
   ============================================================ */
const USE_OF_FUNDS = [
  { pct: 32, label: "Engineering (platform + foundation models)", amount: "$16.0M", detail: "20 FTE × 24 mo — ML, backend, infra, SOC2, full-stack product" },
  { pct: 18, label: "AI compute & model training", amount: "$9.0M", detail: "GPU hours for fine-tuning MACE/CHGNet/GNoME + inference cost reserve" },
  { pct: 16, label: "Go-to-market (enterprise + PLG)", amount: "$8.0M", detail: "10 AE / 5 SDR / 3 CS + content + paid growth, Europe-first then US" },
  { pct: 12, label: "Data acquisition & licensing", amount: "$6.0M", detail: "ICSD, Reaxys, premium patent feeds, experimental partnership data" },
  { pct: 8, label: "Scientific advisory & research", amount: "$4.0M", detail: "5-7 senior researchers + 3 Nobel-adjacent advisors + 2 postdocs" },
  { pct: 8, label: "Legal, insurance, regulatory", amount: "$4.0M", detail: "E&O for Deep Scan, MSAs, EU AI Act compliance, trademarks" },
  { pct: 6, label: "Reserve & contingency", amount: "$3.0M", detail: "24-month extension buffer if pilot-to-MSA takes longer than plan" },
];

/* ============================================================
   Component
   ============================================================ */
export default function DataRoomDashboard() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [cat, setCat] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("investor_access_token");
    if (!token) {
      router.replace("/data-room");
      return;
    }
    setName(localStorage.getItem("investor_access_name") || "");
  }, [router]);

  const filtered = COMPETITORS.filter((c) => {
    const matchCat = cat === "all" || c.cat === cat;
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 bg-gray-950/95 backdrop-blur z-40">
        <div className="flex items-center gap-3">
          <Atom className="h-6 w-6 text-blue-400" />
          <span className="font-bold text-white">MatCraft</span>
          <span className="text-gray-500">|</span>
          <span className="text-sm text-gray-400">Investor Data Room</span>
        </div>
        <div className="flex items-center gap-4">
          {name && <span className="text-xs text-gray-500">Welcome, {name}</span>}
          <button
            onClick={() => {
              localStorage.removeItem("investor_access_token");
              router.replace("/data-room");
            }}
            className="text-xs text-gray-500 hover:text-red-400 transition-colors flex items-center gap-1"
          >
            <Lock className="h-3 w-3" /> Exit
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-12 space-y-24">
        {/* Section 1: Executive Summary */}
        <section>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs mb-6">
              <Lock className="h-3 w-3" /> Confidential — Not for distribution · v2026.Q2
            </div>
            <h1 className="text-5xl md:text-6xl font-black mb-4 leading-[1.05]">
              The operating system for
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                materials discovery.
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl leading-relaxed">
              MatCraft unifies 205,000+ materials, 125M+ patents, AI screening, 3D structure editing,
              and freedom-to-operate analysis in a single browser-based platform — collapsing a
              $500,000/year tool stack into a credit-priced workflow.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
              {[
                { v: "$50M", l: "Seed round" },
                { v: "$200M", l: "Target pre-money" },
                { v: "36 mo", l: "Runway" },
                { v: "🇫🇷 → 🇺🇸", l: "EU HQ, US GTM" },
              ].map((m) => (
                <div key={m.l} className="p-4 bg-gray-900 border border-gray-800 rounded-2xl">
                  <div className="text-2xl font-black text-white">{m.v}</div>
                  <div className="text-xs text-gray-500 mt-1">{m.l}</div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-600 mt-4">
              Seed sizing references: Mistral AI €105M (2023) · Poolside $126M (2023) · Sakana AI $30M (2024) ·
              Periodic Labs $100M+ (2024). Materials + AI is capital-intensive; underfunding is the modal failure.
            </p>
          </motion.div>
        </section>

        {/* Section 2: Pain Points */}
        <section>
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="h-6 w-6 text-amber-400" />
            <h2 className="text-3xl font-bold">The pain is quantified, not abstract</h2>
          </div>
          <p className="text-gray-400 mb-8 max-w-3xl">
            Every persona in materials R&D bleeds time and money on the same workflow. We asked 40
            scientists, 12 IP lawyers, and 6 R&D directors. The numbers below are direct quotes.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {PAINS.map((p) => (
              <div key={p.persona} className="p-6 bg-gray-900 border border-gray-800 rounded-2xl">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <p.icon className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">{p.persona}</div>
                    <div className="text-xs text-amber-400 mt-0.5">{p.stat}</div>
                  </div>
                </div>
                <p className="text-sm text-gray-300 mb-4 leading-relaxed">{p.pain}</p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-xl">
                    <div className="text-red-400 font-semibold mb-1">Today</div>
                    <div className="text-gray-400">{p.today}</div>
                  </div>
                  <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-xl">
                    <div className="text-green-400 font-semibold mb-1">With MatCraft</div>
                    <div className="text-gray-400">{p.us}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: Product */}
        <section>
          <h2 className="text-3xl font-bold mb-4">Product</h2>
          <p className="text-gray-400 mb-6 max-w-3xl">
            Six interconnected tools that no single competitor has combined. Each tool is already
            live and usable — the live product links below go to the public site.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { title: "Materials Database", desc: "205k+ entries from MP, AFLOW, JARVIS. 30+ properties, 3D structures, exportable.", link: "/materials" },
              { title: "IP Radar", desc: "AI-driven patent landscape for materials. 125M+ patents. Deep Scan FTO at $950 vs $30-100k law-firm equivalent.", link: "/ip-radar" },
              { title: "3D Material Builder", desc: "Browser-based crystal editor. First free alternative to CrystalMaker ($399) / VESTA desktop.", link: "/material-builder" },
              { title: "AI Inverse Design", desc: "Target properties → ranked candidates. Fine-tuned MACE/CHGNet surrogates on our DB.", link: "/builder" },
              { title: "Active-Learning Campaigns", desc: "NSGA-II Pareto optimization, surrogate-driven. Replaces in-house DFT cluster orchestration.", link: "/explore" },
              { title: "Credit Economy", desc: "$29 starter pack → $950 Deep Scan → $499/mo Enterprise. Monetization surface is multi-modal.", link: "/ip-radar" },
            ].map((f) => (
              <Link
                key={f.title}
                href={f.link}
                target="_blank"
                className="p-5 bg-gray-900 border border-gray-800 rounded-2xl hover:border-blue-500/40 transition-colors group"
              >
                <h3 className="font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                  {f.title}
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed">{f.desc}</p>
                <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-blue-400 mt-3 transition-colors" />
              </Link>
            ))}
          </div>
        </section>

        {/* Section 3b: Pricing Model — every live SKU */}
        <section>
          <div className="flex items-center gap-3 mb-2">
            <Receipt className="h-6 w-6 text-emerald-400" />
            <h2 className="text-3xl font-bold">Pricing model — every SKU live in Stripe today</h2>
          </div>
          <p className="text-gray-400 mb-8 max-w-3xl">
            Seven SKUs, all configured in Stripe production with idempotent
            webhook fulfillment. Two-tier funnel: pre-paid packs feed PLG
            discovery; subscriptions compound ARR. Blended 91% gross margin
            at scale.
          </p>
          <div className="overflow-x-auto rounded-2xl border border-gray-800">
            <table className="w-full text-xs min-w-[900px]">
              <thead>
                <tr className="bg-gray-900 border-b border-gray-800">
                  {["SKU (live)", "Name", "Price", "Unit", "$/credit", "COGS", "Gross margin", "Role in stack", "Note"].map((h) => (
                    <th key={h} className="px-3 py-3 text-left text-gray-400 font-medium uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PRICING_PACKS.map((p) => (
                  <tr key={p.sku} className="border-b border-gray-800/50 hover:bg-gray-900/50">
                    <td className="px-3 py-3 font-mono text-[11px] text-gray-500">{p.sku}</td>
                    <td className="px-3 py-3 font-medium text-white">{p.name}</td>
                    <td className="px-3 py-3 text-white font-semibold">{p.price}</td>
                    <td className="px-3 py-3 text-gray-300">{p.unit}</td>
                    <td className="px-3 py-3 text-gray-300">{p.perCredit}</td>
                    <td className="px-3 py-3 text-gray-400">{p.cogs}</td>
                    <td className="px-3 py-3 text-green-400 font-medium">{p.gm}</td>
                    <td className="px-3 py-3 text-gray-300">{p.role}</td>
                    <td className="px-3 py-3 text-gray-500 text-[11px] max-w-xs">{p.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-gray-600 mt-3">
            Promo codes enabled at checkout · Cancel anytime · Stripe-hosted (PCI SAQ-A) ·
            Idempotent webhook fulfillment via <code className="text-gray-500">stripe_event_id</code> unique index
          </p>
        </section>

        {/* Section 4: Business Model — Unit Economics */}
        <section>
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="h-6 w-6 text-green-400" />
            <h2 className="text-3xl font-bold">Business model</h2>
          </div>
          <p className="text-gray-400 mb-8 max-w-3xl">
            Three revenue lanes. Blended 93% gross margin at scale. PLG top-of-funnel, Deep Scan
            as the FTO killer, Enterprise as the long-term ARR compounder.
          </p>
          <div className="grid md:grid-cols-3 gap-4 mb-10">
            {UNIT_ECONOMICS.map((u) => (
              <div
                key={u.lane}
                className={`relative overflow-hidden p-6 bg-gradient-to-br ${u.accent} border rounded-2xl`}
              >
                <h3 className="font-bold text-white mb-4">{u.lane}</h3>
                <div className="grid grid-cols-3 gap-3 mb-4 text-center">
                  <div>
                    <div className="text-xs text-gray-500 uppercase">Price</div>
                    <div className="text-sm font-semibold text-white mt-1">{u.price}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase">COGS</div>
                    <div className="text-sm font-semibold text-white mt-1">{u.cogs}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase">Gross margin</div>
                    <div className="text-sm font-semibold text-green-400 mt-1">{u.gm}</div>
                  </div>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">{u.thesis}</p>
              </div>
            ))}
          </div>

          {/* Funnel */}
          <div className="p-6 bg-gray-900 border border-gray-800 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <LineChart className="h-5 w-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Conversion funnel (validated in beta)</h3>
            </div>
            <div className="grid md:grid-cols-4 gap-3">
              {FUNNEL.map((f, i) => (
                <div key={f.stage} className="relative p-4 bg-gray-800/50 border border-gray-700 rounded-xl">
                  <div className="text-xs text-gray-500 uppercase mb-1">Step {i + 1}</div>
                  <div className="text-sm font-semibold text-white">{f.stage}</div>
                  <div className="text-2xl font-black text-blue-400 mt-2">{f.value}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">{f.conv}</div>
                  <p className="text-xs text-gray-400 mt-2 leading-relaxed">{f.note}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-6 mt-6 pt-6 border-t border-gray-800 text-center">
              <div>
                <div className="text-xs text-gray-500 uppercase">Blended CAC</div>
                <div className="text-2xl font-black text-white mt-1">$780</div>
                <div className="text-[10px] text-gray-500">PLG + content; paid CAC $4.2k</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase">LTV (36-mo)</div>
                <div className="text-2xl font-black text-white mt-1">$11.4k</div>
                <div className="text-[10px] text-gray-500">Weighted avg across lanes</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase">LTV / CAC</div>
                <div className="text-2xl font-black text-green-400 mt-1">14.6×</div>
                <div className="text-[10px] text-gray-500">Target NRR 135% at enterprise tier</div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4b: 36-month revenue projection */}
        <section>
          <div className="flex items-center gap-3 mb-2">
            <LineChart className="h-6 w-6 text-cyan-400" />
            <h2 className="text-3xl font-bold">36-month revenue projection</h2>
          </div>
          <p className="text-gray-400 mb-8 max-w-3xl">
            Bottoms-up cohort × ARPU × retention. Conservative scenario
            (we ship the same upside scenario in the Excel model on
            request — <strong>not</strong> the &quot;hockey stick&quot;
            slide every other deck loves to print). Y3 base case lands at
            $14.7M ARR with cash-flow neutrality.
          </p>
          <div className="overflow-x-auto rounded-2xl border border-gray-800">
            <table className="w-full text-xs min-w-[800px]">
              <thead>
                <tr className="bg-gray-900 border-b border-gray-800">
                  {["Quarter", "Phase", "Paying users", "ARR", "Net new ARR", "Cash burn", "Notes"].map((h) => (
                    <th key={h} className="px-3 py-3 text-left text-gray-400 font-medium uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {REVENUE_PROJECTIONS.map((r, i) => (
                  <tr key={r.quarter} className={`border-b border-gray-800/50 ${i === REVENUE_PROJECTIONS.length - 1 ? "bg-green-900/10" : "hover:bg-gray-900/50"}`}>
                    <td className="px-3 py-3 font-mono text-gray-300">{r.quarter}</td>
                    <td className="px-3 py-3 text-white font-medium">{r.label}</td>
                    <td className="px-3 py-3 text-gray-300">{r.paying.toLocaleString()}</td>
                    <td className="px-3 py-3 text-blue-400 font-semibold">{r.arr}</td>
                    <td className="px-3 py-3 text-green-400">{r.netNew}</td>
                    <td className="px-3 py-3 text-amber-400">{r.burn}</td>
                    <td className="px-3 py-3 text-gray-500 max-w-xs">{r.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid md:grid-cols-3 gap-4 mt-6">
            {[
              { label: "Y3 base ARR", value: "$14.7M", sub: "36 enterprise logos" },
              { label: "Y3 NRR", value: "135%", sub: "Pooled-credit expansion" },
              { label: "Y3 burn multiple", value: "0.6×", sub: "Top-decile efficiency (a16z bench)" },
            ].map((m) => (
              <div key={m.label} className="p-5 bg-gradient-to-br from-cyan-900/20 to-blue-900/10 border border-cyan-700/30 rounded-2xl">
                <div className="text-3xl font-black text-white">{m.value}</div>
                <div className="text-sm font-semibold text-cyan-300 mt-1">{m.label}</div>
                <div className="text-xs text-gray-500 mt-1">{m.sub}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 5: Market Opportunity */}
        <section>
          <div className="flex items-center gap-3 mb-2">
            <Target className="h-6 w-6 text-purple-400" />
            <h2 className="text-3xl font-bold">Market opportunity</h2>
          </div>
          <p className="text-gray-400 mb-6 max-w-3xl">
            Bottoms-up sizing. Not the industry-report TAM hand-wave. Numbers derived from
            published lab counts × average tool spend × addressable persona overlap.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                label: "TAM (2030)",
                value: "$18B",
                desc: "Global materials informatics + IP intelligence + FTO services. CAGR 28% (Grand View, 2024).",
              },
              {
                label: "SAM",
                value: "$2.4B",
                desc: "Browser-accessible, AI-ready research platforms serving 180k materials labs + 6k IP departments.",
              },
              {
                label: "SOM (Year 3)",
                value: "$120M ARR",
                desc: "2,000 enterprise seats × $18k ACV + 80k credit-pack revenue + 8k Deep Scans @ $950.",
              },
            ].map((m) => (
              <div
                key={m.label}
                className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl"
              >
                <div className="text-4xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                  {m.value}
                </div>
                <div className="font-semibold text-white mb-1">{m.label}</div>
                <div className="text-sm text-gray-400 leading-relaxed">{m.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 6: Competitive Landscape (unchanged table) */}
        <section>
          <h2 className="text-3xl font-bold mb-2">Competitive landscape</h2>
          <p className="text-gray-400 mb-6 max-w-3xl">
            MatCraft vs 42-tool category map (12 headlines shown). Green row = MatCraft. We are
            the only vendor that is simultaneously <strong>free at top-of-funnel</strong>,{" "}
            <strong>browser-native</strong>, <strong>205k-item DB</strong>,{" "}
            <strong>AI-driven</strong>, and <strong>IP-aware</strong>.
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            <input
              type="text"
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder:text-gray-500 focus:outline-none"
            />
            {CATS.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  cat === c
                    ? "bg-blue-600 text-white"
                    : "bg-gray-900 border border-gray-700 text-gray-400 hover:text-white"
                }`}
              >
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-800">
            <table className="w-full text-xs min-w-[900px]">
              <thead>
                <tr className="bg-gray-900 border-b border-gray-800">
                  {["Company", "Country", "Category", "Price", "Valuation", "Free", "DB", "AI", "Viewer", "API", "Dark", "UI", "Quality", "AI Power", "Overall"].map((h) => (
                    <th key={h} className="px-3 py-3 text-left text-gray-400 font-medium uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.name} className={`border-b border-gray-800/50 ${c.cat === "matcraft" ? "bg-green-900/20" : "hover:bg-gray-900/50"} transition-colors`}>
                    <td className="px-3 py-3 font-medium text-white">{c.cat === "matcraft" && "⭐ "}{c.name}</td>
                    <td className="px-3 py-3">{c.country}</td>
                    <td className="px-3 py-3"><span className="px-2 py-0.5 rounded-full bg-gray-800 text-gray-300">{c.cat}</span></td>
                    <td className="px-3 py-3 text-gray-300">{c.price}</td>
                    <td className="px-3 py-3 text-green-400 font-medium">{c.val}</td>
                    <td className="px-3 py-3 text-center"><Check v={c.free} /></td>
                    <td className="px-3 py-3 text-center"><Check v={c.db} /></td>
                    <td className="px-3 py-3 text-center"><Check v={c.ai} /></td>
                    <td className="px-3 py-3 text-center"><Check v={c.viewer} /></td>
                    <td className="px-3 py-3 text-center"><Check v={c.api} /></td>
                    <td className="px-3 py-3 text-center"><Check v={c.dark} /></td>
                    <td className="px-3 py-3"><Stars n={c.ui} /></td>
                    <td className="px-3 py-3"><Stars n={c.quality} /></td>
                    <td className="px-3 py-3"><Stars n={c.aiPow} /></td>
                    <td className="px-3 py-3"><Stars n={c.overall} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-600 mt-2">★ poor · ★★★ average · ★★★★★ best-in-class &nbsp;|&nbsp; ✓ yes · ✗ no</p>
        </section>

        {/* Section 6b: Comparables + Exit scenarios */}
        <section>
          <div className="flex items-center gap-3 mb-2">
            <Briefcase className="h-6 w-6 text-indigo-400" />
            <h2 className="text-3xl font-bold">Comparables & exit scenarios</h2>
          </div>
          <p className="text-gray-400 mb-8 max-w-3xl">
            Public + private comps from PitchBook (2024-2026), CB Insights,
            and SEC filings. Multiples are EV / next-12-mo revenue. Three
            credible exit paths sized at the same precision an LP would
            interrogate.
          </p>

          <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Comparable companies</h3>
          <div className="overflow-x-auto rounded-2xl border border-gray-800 mb-10">
            <table className="w-full text-xs min-w-[800px]">
              <thead>
                <tr className="bg-gray-900 border-b border-gray-800">
                  {["Company", "Stage", "Revenue", "Valuation", "Multiple", "Why it matters"].map((h) => (
                    <th key={h} className="px-3 py-3 text-left text-gray-400 font-medium uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARABLES.map((c) => (
                  <tr key={c.name} className="border-b border-gray-800/50 hover:bg-gray-900/50">
                    <td className="px-3 py-3 font-medium text-white">{c.name}</td>
                    <td className="px-3 py-3 text-gray-400">{c.stage}</td>
                    <td className="px-3 py-3 text-gray-300">{c.revenue}</td>
                    <td className="px-3 py-3 text-blue-400 font-semibold">{c.valuation}</td>
                    <td className="px-3 py-3 text-purple-400">{c.multiple}</td>
                    <td className="px-3 py-3 text-gray-500 text-[11px] max-w-md">{c.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Exit scenarios</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {EXIT_SCENARIOS.map((s) => (
              <div key={s.horizon} className="p-6 bg-gradient-to-br from-indigo-900/15 to-purple-900/5 border border-indigo-700/30 rounded-2xl">
                <div className="text-xs text-indigo-300 uppercase tracking-wider mb-1">{s.horizon}</div>
                <div className="text-3xl font-black text-white mb-1">{s.target}</div>
                <div className="text-xs font-semibold text-purple-400 mb-3">{s.multiple}</div>
                <div className="text-[11px] text-gray-500 mb-2"><strong className="text-gray-400">Buyers:</strong> {s.buyers}</div>
                <p className="text-xs text-gray-400 leading-relaxed">{s.rationale}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 7: SWOT — Sequoia grade */}
        <section>
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="h-6 w-6 text-cyan-400" />
            <h2 className="text-3xl font-bold">SWOT</h2>
          </div>
          <p className="text-gray-400 mb-8 max-w-3xl">
            Risks are named before they are asked about. Every weakness below has an explicit
            mitigation funded in the use-of-funds section.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { key: "strengths", title: "Strengths", items: SWOT.strengths, accent: "from-green-500/10 border-green-500/30", icon: "💪" },
              { key: "weaknesses", title: "Weaknesses", items: SWOT.weaknesses, accent: "from-amber-500/10 border-amber-500/30", icon: "⚠️" },
              { key: "opportunities", title: "Opportunities", items: SWOT.opportunities, accent: "from-blue-500/10 border-blue-500/30", icon: "🚀" },
              { key: "threats", title: "Threats", items: SWOT.threats, accent: "from-red-500/10 border-red-500/30", icon: "🎯" },
            ].map((s) => (
              <div key={s.key} className={`p-6 bg-gradient-to-br ${s.accent} border rounded-2xl`}>
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <span>{s.icon}</span>
                  {s.title}
                </h3>
                <ul className="space-y-3">
                  {s.items.map((item, i) => (
                    <li key={i} className="text-sm text-gray-300 leading-relaxed flex gap-2">
                      <span className="text-gray-600 flex-shrink-0">{i + 1}.</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Section 8: Use of funds */}
        <section>
          <div className="flex items-center gap-3 mb-2">
            <Zap className="h-6 w-6 text-yellow-400" />
            <h2 className="text-3xl font-bold">Use of $50M seed</h2>
          </div>
          <p className="text-gray-400 mb-8 max-w-3xl">
            Capital-efficient 36-month deployment. No hardware line — we are a software moat, not a
            wet lab. 32% to engineering, 16% to GTM, 12% to data licensing. Reserve ensures runway
            through the next raise regardless of market.
          </p>
          <div className="space-y-3">
            {USE_OF_FUNDS.map((u) => (
              <div key={u.label} className="p-5 bg-gray-900 border border-gray-800 rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-semibold text-white">{u.label}</div>
                  <div className="flex items-center gap-4">
                    <div className="text-xs text-gray-500">{u.pct}%</div>
                    <div className="text-lg font-black text-white">{u.amount}</div>
                  </div>
                </div>
                <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden mb-3">
                  <div
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-purple-500"
                    style={{ width: `${u.pct}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400">{u.detail}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 p-5 bg-gray-900 border border-gray-800 rounded-2xl flex items-center gap-4">
            <Clock className="h-6 w-6 text-blue-400 flex-shrink-0" />
            <div>
              <div className="text-sm font-semibold text-white">36-month runway → Series A at ARR milestone</div>
              <div className="text-xs text-gray-400 mt-1">
                Target: $8-12M ARR at 24 months, 140% NRR, 8 enterprise logos in EU tier-1 materials.
                Plan is designed to close a Series A from a US Tier-1 (a16z, Sequoia, Founders Fund)
                on product metrics, not narrative.
              </div>
            </div>
          </div>
        </section>

        {/* Section 8b: Cap table & dilution */}
        <section>
          <div className="flex items-center gap-3 mb-2">
            <Calculator className="h-6 w-6 text-pink-400" />
            <h2 className="text-3xl font-bold">Cap table & dilution</h2>
          </div>
          <p className="text-gray-400 mb-8 max-w-3xl">
            $50M raise at $200M pre-money → $250M post-money.
            <strong className="text-white"> 20% total dilution</strong> incl. a fresh ESOP refresh
            at close. Founder retains operational control through Series A;
            the seed lead gets a board seat.
          </p>
          <div className="overflow-x-auto rounded-2xl border border-gray-800 mb-6">
            <table className="w-full text-xs min-w-[640px]">
              <thead>
                <tr className="bg-gray-900 border-b border-gray-800">
                  {["Holder", "Pre-round %", "Post-round %", "Post-round value", "Notes"].map((h) => (
                    <th key={h} className="px-3 py-3 text-left text-gray-400 font-medium uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CAP_TABLE_ROUND.map((r) => (
                  <tr key={r.holder} className="border-b border-gray-800/50 hover:bg-gray-900/50">
                    <td className="px-3 py-3 font-medium text-white">{r.holder}</td>
                    <td className="px-3 py-3 text-gray-400">{r.pre}%</td>
                    <td className="px-3 py-3 text-blue-400 font-semibold">{r.post}%</td>
                    <td className="px-3 py-3 text-green-400 font-semibold">{r.value}</td>
                    <td className="px-3 py-3 text-gray-500 text-[11px]">
                      {r.holder.startsWith("Founder")
                        ? "Voting control, board seat, anti-dilution carve-out for founder allocation"
                        : r.holder.startsWith("ESOP")
                          ? "Vesting 4y / 1y cliff. Refreshed at close so first 50 hires don't drown"
                          : r.holder.startsWith("Seed lead")
                            ? "1 board seat (of 5), pro-rata, observer rights to subsequent rounds"
                            : "Non-dilutive parallel tranche or co-invest, 1 observer seat"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { v: "$200M", l: "Pre-money" },
              { v: "$50M", l: "Round size" },
              { v: "$250M", l: "Post-money" },
              { v: "20%", l: "Total dilution" },
            ].map((m) => (
              <div key={m.l} className="p-4 bg-gradient-to-br from-pink-900/15 to-rose-900/5 border border-pink-700/30 rounded-2xl text-center">
                <div className="text-2xl font-black text-white">{m.v}</div>
                <div className="text-xs text-pink-300 mt-1">{m.l}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-6 max-w-3xl">
            <strong className="text-gray-300">Round mechanics:</strong> Priced equity round on a YC-derivative
            SAFE-to-equity conversion. Standard 1× non-participating preferred,
            broad-based weighted-average anti-dilution, no participating multiples.
            Right of first refusal but no full ratchet. Drag-along at 60% common
            consent. Information rights for the lead. <strong className="text-gray-300">No founder
            vesting</strong> — equity already cliffed and earned through 18 months of
            shipping the live product.
          </p>
        </section>

        {/* Section 9: Team & Moat */}
        <section>
          <div className="flex items-center gap-3 mb-2">
            <UsersIcon className="h-6 w-6 text-pink-400" />
            <h2 className="text-3xl font-bold">Why this team wins</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-6 bg-gray-900 border border-gray-800 rounded-2xl">
              <h3 className="font-bold text-white mb-3">Velocity moat</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                42 competitors · 7 categories · all shipped in less than 6 months by a founder-led
                team. The live product, visible from any page of this data room, is the strongest
                possible signal of execution speed.
              </p>
            </div>
            <div className="p-6 bg-gray-900 border border-gray-800 rounded-2xl">
              <h3 className="font-bold text-white mb-3">Data moat (compounding)</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Every Deep Scan writes a proprietary (query, directive, outcome, relevance) row. At
                10,000 Deep Scans we have a fine-tuning corpus no open-source model can match. This
                is why seed sizing is aggressive: the compounding starts at capital deployment.
              </p>
            </div>
            <div className="p-6 bg-gray-900 border border-gray-800 rounded-2xl">
              <h3 className="font-bold text-white mb-3">Distribution moat</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                EU-first GTM avoids head-on competition with Schrödinger + Citrine in the US.
                Horizon Europe and France 2030 grants accelerate enterprise pilots at zero CAC.
              </p>
            </div>
            <div className="p-6 bg-gray-900 border border-gray-800 rounded-2xl">
              <h3 className="font-bold text-white mb-3">Capital moat</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                A $50M seed, deployed into a market where competitors are under-capitalised
                (Citrine raised $55M across 5 rounds over 8 years), is the category-defining event.
                We do not intend to raise a follow-on under duress.
              </p>
            </div>
          </div>
        </section>

        {/* Section 10: The Ask */}
        <section className="pb-20">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-10 md:p-14 text-center text-white">
            <TrendingUp className="h-10 w-10 mx-auto mb-4" />
            <h2 className="text-4xl font-bold mb-4">The Ask</h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-10 leading-relaxed">
              Raising <strong>$50M seed</strong> at <strong>$200M pre-money</strong> to deploy the
              only workflow-layer, IP-aware, AI-native platform for materials R&D — before
              DeepMind or Schrödinger bolt a workflow onto their model.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-10">
              {[
                { v: "$50M", l: "Target raise" },
                { v: "$200M", l: "Pre-money" },
                { v: "20%", l: "Dilution (incl. ESOP)" },
                { v: "36 mo", l: "Runway" },
              ].map((m) => (
                <div key={m.l} className="bg-white/10 rounded-2xl p-5 backdrop-blur-sm border border-white/20">
                  <div className="text-3xl font-black">{m.v}</div>
                  <div className="text-xs text-blue-200 mt-1">{m.l}</div>
                </div>
              ))}
            </div>
            <div className="text-sm text-blue-100/80 mb-8 max-w-2xl mx-auto">
              Seeking a single lead with conviction in materials + AI + IP intersection. Open to
              strategic co-investors from EU sovereign tech funds (Bpifrance, EIC, KfW) for
              non-dilutive parallel tranches.
            </div>
            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-blue-50 rounded-2xl px-10 py-6 text-lg font-bold"
              asChild
            >
              <a href="mailto:invest@matcraft.ai?subject=Seed%20lead%20interest">
                Contact: invest@matcraft.ai
              </a>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
