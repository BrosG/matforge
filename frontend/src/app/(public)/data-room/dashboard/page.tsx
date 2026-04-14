"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Atom, Download, Lock, TrendingUp, Users, Database, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const COMPETITORS = [
  { name: "MatCraft", country: "🇫🇷", cat: "matcraft", price: "Free/Credits", val: "~€2-5M", ui: 5, quality: 4, aiPow: 4, overall: 5, free: true, db: true, ai: true, viewer: true, api: true, dark: true },
  { name: "CuspAI", country: "🇬🇧", cat: "ai", price: "Enterprise", val: "$520M", ui: 2, quality: 4, aiPow: 5, overall: 3, free: false, db: false, ai: true, viewer: false, api: true, dark: false },
  { name: "Citrine Informatics", country: "🇺🇸", cat: "ai", price: "$100k/yr", val: "$140M", ui: 3, quality: 4, aiPow: 4, overall: 3, free: false, db: false, ai: true, viewer: false, api: true, dark: false },
  { name: "Mat3ra", country: "🇺🇸", cat: "ai", price: "$50-500/mo", val: "~$30M", ui: 3, quality: 3, aiPow: 2, overall: 3, free: true, db: false, ai: true, viewer: true, api: true, dark: false },
  { name: "Schrödinger", country: "🇺🇸", cat: "dft", price: "$50-500k/yr", val: "$849M (SDGR)", ui: 3, quality: 5, aiPow: 4, overall: 3, free: false, db: false, ai: true, viewer: true, api: true, dark: false },
  { name: "Materials Project", country: "🇺🇸", cat: "db", price: "Free", val: "Non-profit", ui: 2, quality: 5, aiPow: 1, overall: 3, free: true, db: true, ai: false, viewer: true, api: true, dark: false },
  { name: "AFLOW", country: "🇺🇸", cat: "db", price: "Free", val: "Non-profit", ui: 1, quality: 4, aiPow: 1, overall: 2, free: true, db: true, ai: false, viewer: false, api: true, dark: false },
  { name: "VESTA", country: "🇯🇵", cat: "viz", price: "Free", val: "Academic", ui: 3, quality: 3, aiPow: 1, overall: 2, free: true, db: false, ai: false, viewer: true, api: false, dark: false },
  { name: "CrystalMaker", country: "🇬🇧", cat: "viz", price: "$399-799", val: "Private", ui: 4, quality: 3, aiPow: 1, overall: 2, free: false, db: false, ai: false, viewer: true, api: false, dark: false },
  { name: "DeepMind GNoME", country: "🇺🇸", cat: "giant", price: "Research", val: "Alphabet ~$2T", ui: 1, quality: 5, aiPow: 5, overall: 3, free: true, db: true, ai: true, viewer: false, api: false, dark: false },
  { name: "MaterialsZone", country: "🇮🇱", cat: "ai", price: "$500-2000/mo", val: "~$15M", ui: 3, quality: 3, aiPow: 3, overall: 3, free: false, db: false, ai: true, viewer: false, api: true, dark: false },
  { name: "ICSD (FIZ)", country: "🇩🇪", cat: "db", price: "$5-30k/yr", val: "Institutional", ui: 2, quality: 5, aiPow: 1, overall: 2, free: false, db: true, ai: false, viewer: true, api: false, dark: false },
];

const CATS = ["all", "matcraft", "ai", "db", "dft", "viz", "giant"];

const Check = ({ v }: { v: boolean | undefined }) => (
  <span className={v ? "text-green-500" : "text-red-400"}>{v ? "✓" : "✗"}</span>
);

const Stars = ({ n }: { n: number }) => (
  <span>{Array.from({ length: 5 }, (_, i) => <span key={i} className={i < n ? "text-amber-400" : "text-gray-700"}>★</span>)}</span>
);

export default function DataRoomDashboard() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [cat, setCat] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("investor_access_token");
    if (!token) { router.replace("/data-room"); return; }
    setName(localStorage.getItem("investor_access_name") || "");
  }, [router]);

  const filtered = COMPETITORS.filter((c) => {
    const matchCat = cat === "all" || c.cat === cat;
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const matcraft = COMPETITORS.find((c) => c.cat === "matcraft")!;

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
          <button onClick={() => { localStorage.removeItem("investor_access_token"); router.replace("/data-room"); }}
            className="text-xs text-gray-500 hover:text-red-400 transition-colors flex items-center gap-1">
            <Lock className="h-3 w-3" /> Exit
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-12 space-y-20">
        {/* Section 1: Executive Summary */}
        <section>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs mb-6">
              <Lock className="h-3 w-3" /> Confidential — Not for distribution
            </div>
            <h1 className="text-5xl font-black mb-4">MatCraft Investor Data Room</h1>
            <p className="text-xl text-gray-400 max-w-3xl">
              The operating system for materials discovery — the first platform to unify open-source scientific databases, AI screening, 3D structure editing, and IP intelligence in one browser-based tool.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
              {[
                { v: "Seed", l: "Stage" },
                { v: "€2-5M", l: "Valuation Range" },
                { v: "France", l: "HQ" },
                { v: "2024", l: "Founded" },
              ].map((m) => (
                <div key={m.l} className="p-4 bg-gray-900 border border-gray-800 rounded-2xl">
                  <div className="text-2xl font-black text-white">{m.v}</div>
                  <div className="text-xs text-gray-500">{m.l}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Section 2: Product */}
        <section>
          <h2 className="text-3xl font-bold mb-4">Product</h2>
          <p className="text-gray-400 mb-6">Six interconnected tools that no single competitor has combined:</p>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { title: "Materials Database", desc: "205k+ materials from MP, AFLOW, JARVIS. 30+ properties. 3D structures.", link: "/materials" },
              { title: "IP Radar", desc: "AI patent landscape for materials. 125M+ patents. Deep Scan FTO reports at $950.", link: "/ip-radar" },
              { title: "3D Material Builder", desc: "Browser-based crystal editor. First free alternative to CrystalMaker ($399).", link: "/material-builder" },
              { title: "AI Inverse Design", desc: "Specify target properties → ranked material candidates.", link: "/builder" },
              { title: "Campaign Engine", desc: "Active learning optimization. NSGA-II Pareto. CHGNet/MACE surrogates.", link: "/explore" },
              { title: "Credit Economy", desc: "1 credit/search. $950 Deep Scan. Enterprise: $499/mo = 1,000 credits.", link: "/ip-radar" },
            ].map((f) => (
              <Link key={f.title} href={f.link} target="_blank" className="p-5 bg-gray-900 border border-gray-800 rounded-2xl hover:border-blue-500/40 transition-colors group">
                <h3 className="font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">{f.title}</h3>
                <p className="text-xs text-gray-400">{f.desc}</p>
                <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-blue-400 mt-2 transition-colors" />
              </Link>
            ))}
          </div>
        </section>

        {/* Section 3: Competitive Landscape */}
        <section>
          <h2 className="text-3xl font-bold mb-2">Competitive Landscape</h2>
          <p className="text-gray-400 mb-6">MatCraft vs 42 competitors. Green row = MatCraft. Only player combining free + browser + 205k DB + AI + IP Radar.</p>

          <div className="flex flex-wrap gap-2 mb-4">
            <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder:text-gray-500 focus:outline-none" />
            {CATS.map((c) => (
              <button key={c} onClick={() => setCat(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${cat === c ? "bg-blue-600 text-white" : "bg-gray-900 border border-gray-700 text-gray-400 hover:text-white"}`}>
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
          <p className="text-xs text-gray-600 mt-2">★ poor | ★★★ average | ★★★★★ best-in-class &nbsp;|&nbsp; ✓ yes &nbsp;✗ no</p>
        </section>

        {/* Section 4: Business Model */}
        <section>
          <h2 className="text-3xl font-bold mb-6">Business Model</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { title: "Credit Packs (B2C)", items: ["Starter: 10 credits/$29", "Pro: 50 credits/$99", "Enterprise: 200 credits/$299"], margin: "~85% gross margin" },
              { title: "Deep Scan (Premium)", items: ["$950/scan FTO report", "~$25-50 actual cost", "Law firm replacement"], margin: "~95% gross margin" },
              { title: "Subscriptions (B2B)", items: ["Researcher: 50cr/mo $49", "Professional: 200cr/mo $149", "Enterprise: 1,000cr/mo $499"], margin: "~90% gross margin" },
            ].map((p) => (
              <div key={p.title} className="p-6 bg-gray-900 border border-gray-800 rounded-2xl">
                <h3 className="font-bold text-white mb-3">{p.title}</h3>
                <ul className="space-y-1 mb-4">
                  {p.items.map((i) => <li key={i} className="text-sm text-gray-400">• {i}</li>)}
                </ul>
                <div className="text-sm font-semibold text-green-400">{p.margin}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 5: Market */}
        <section>
          <h2 className="text-3xl font-bold mb-6">Market Opportunity</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { label: "TAM (2030)", value: "$15B+", desc: "Global materials informatics market, CAGR 30%" },
              { label: "SAM", value: "$2B", desc: "Browser-accessible, AI-ready research platforms" },
              { label: "SOM (Year 3)", value: "$50M", desc: "Reachable with current product scope" },
            ].map((m) => (
              <div key={m.label} className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl">
                <div className="text-4xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">{m.value}</div>
                <div className="font-semibold text-white mb-1">{m.label}</div>
                <div className="text-sm text-gray-400">{m.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 6: Ask */}
        <section className="pb-20">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-10 text-center text-white">
            <TrendingUp className="h-10 w-10 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">The Ask</h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-8">
              Raising a Seed round to scale user acquisition, integrate Stripe, launch Enterprise contracts, and deploy the GNoME/MACE foundation model layer.
            </p>
            <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mb-8">
              {[
                { v: "€500k-2M", l: "Target raise" },
                { v: "18 months", l: "Runway" },
                { v: "€2-5M", l: "Pre-money" },
              ].map((m) => (
                <div key={m.l} className="bg-white/10 rounded-xl p-4">
                  <div className="text-2xl font-black">{m.v}</div>
                  <div className="text-xs text-blue-200">{m.l}</div>
                </div>
              ))}
            </div>
            <Button size="lg" className="bg-white/10 border-2 border-white text-white hover:bg-white hover:text-blue-600 rounded-2xl" asChild>
              <a href="mailto:invest@matcraft.ai">Contact: invest@matcraft.ai</a>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
