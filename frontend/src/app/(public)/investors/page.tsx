"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Atom, TrendingUp, Globe, Shield, Zap, Lock, Database, Brain, ChevronRight, X, KeyRound } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { PlacesAutocomplete, type PlaceValue } from "@/components/ui/PlacesAutocomplete";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.matcraft.ai/api/v1";

const FEATURES = [
  { icon: Database, label: "205k+ Materials", desc: "MP + AFLOW + JARVIS unified" },
  { icon: Brain, label: "AI Discovery", desc: "Inverse design + campaigns" },
  { icon: Globe, label: "IP Radar", desc: "125M+ patent landscape" },
  { icon: Shield, label: "Deep Scan", desc: "$950 FTO reports by AI" },
  { icon: Zap, label: "3D Builder", desc: "First free browser editor" },
  { icon: TrendingUp, label: "Credit Economy", desc: "Scalable monetization" },
];

const WHY_NOW = [
  { title: "Energy Transition Urgency", desc: "Net-zero by 2050 requires 10x faster materials discovery. Batteries, solar, hydrogen — all blocked by materials bottlenecks." },
  { title: "AI Breakthrough Moment", desc: "Foundation models (GNoME, MACE, CHGNet) have proven AI can predict material properties with DFT accuracy. The infrastructure layer is missing." },
  { title: "$50k Tools → Free Platform", desc: "Schrödinger charges $50-500k/year. CrystalMaker $400. ICSD $30k. We give the same capabilities away free — and monetize at scale." },
];

export default function InvestorsPage() {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", company: "", role: "Investor", message: "" });
  const [companyPlace, setCompanyPlace] = useState<PlaceValue>({ text: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Merge the Places-resolved value into the company field so the
      // backend row gets both the display string and the canonical
      // place_id (persisted on the InvestorAccessRequest for later
      // investor-map enrichment).
      const payload = {
        ...form,
        company: companyPlace.text || form.company,
        company_place_id: companyPlace.place_id || null,
        company_formatted_address: companyPlace.formatted_address || null,
        company_latitude: companyPlace.latitude ?? null,
        company_longitude: companyPlace.longitude ?? null,
      };
      const res = await fetch(`${API}/investor-access/request`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      if (res.ok) setSubmitted(true);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="relative min-h-[90vh] flex items-center bg-gradient-to-b from-gray-950 via-gray-900 to-background overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
          </div>
          <div className="relative max-w-5xl mx-auto px-4 py-32 text-center">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="flex items-center justify-center gap-3 mb-8">
                <Atom className="h-8 w-8 text-blue-400" />
                <span className="text-lg font-bold text-blue-400 uppercase tracking-widest">Investor Relations</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
                The Operating System<br />
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  for Materials Discovery
                </span>
              </h1>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-12">
                MatCraft is the free, AI-powered platform rapidly becoming the default tool for materials scientists worldwide — combining 205k+ materials, 125M+ patents, AI screening, and computational tools that previously cost $50,000/year.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg px-8 py-6 rounded-2xl hover:opacity-90" onClick={() => setShowModal(true)}>
                  Request Data Room Access
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" className="bg-transparent border-gray-600 text-gray-300 hover:border-blue-400 text-lg px-8 py-6 rounded-2xl" asChild>
                  <Link href="/data-room">
                    <KeyRound className="mr-2 h-4 w-4" />
                    I have an access code
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="bg-transparent border-gray-600 text-gray-300 hover:border-blue-400 text-lg px-8 py-6 rounded-2xl" asChild>
                  <a href="mailto:invest@matcraft.ai">Contact Directly</a>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Key Metrics */}
        <section className="py-20 border-b border-border">
          <div className="max-w-5xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { value: "205k+", label: "Materials Indexed", sub: "MP + AFLOW + JARVIS" },
                { value: "125M+", label: "Patents Searchable", sub: "100+ jurisdictions" },
                { value: "$15B+", label: "TAM (2030)", sub: "Materials informatics" },
                { value: "~95%", label: "Gross Margin", sub: "Deep Scan product" },
              ].map((m) => (
                <div key={m.label} className="text-center p-6 bg-card border border-border rounded-2xl">
                  <div className="text-4xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">{m.value}</div>
                  <div className="text-sm font-semibold text-foreground">{m.label}</div>
                  <div className="text-xs text-muted-foreground">{m.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What We Built */}
        <section className="py-20">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-foreground mb-4">What We Built</h2>
            <p className="text-muted-foreground mb-10">The only platform combining open-source data, AI, IP intelligence, and a 3D structure editor — all free, in the browser.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {FEATURES.map((f) => (
                <div key={f.label} className="p-5 bg-card border border-border rounded-2xl hover:border-primary/30 transition-colors">
                  <f.icon className="h-6 w-6 text-primary mb-3" />
                  <div className="font-semibold text-foreground text-sm">{f.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Now */}
        <section className="py-20 bg-muted/30 border-y border-border">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-foreground mb-10">Why Now</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {WHY_NOW.map((w) => (
                <div key={w.title} className="p-6 bg-card border border-border rounded-2xl">
                  <h3 className="font-bold text-foreground mb-3">{w.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{w.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Traction Teaser (blurred) */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">Traction</h2>
            <p className="text-muted-foreground mb-10">Full metrics available in the data room after verification.</p>
            <div className="grid grid-cols-3 gap-4 mb-8">
              {["User Growth", "Credit Revenue", "Feature Adoption"].map((label) => (
                <div key={label} className="relative overflow-hidden rounded-2xl border border-border bg-card p-6">
                  <div className="absolute inset-0 backdrop-blur-sm bg-background/60 flex items-center justify-center z-10">
                    <div className="text-center">
                      <Lock className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                      <span className="text-xs text-muted-foreground">Data Room</span>
                    </div>
                  </div>
                  <div className="h-24 bg-gradient-to-t from-blue-200 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-lg" />
                  <div className="text-sm font-medium text-muted-foreground mt-3">{label}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button size="lg" onClick={() => setShowModal(true)} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl px-8">
                Request Full Data Room Access
              </Button>
              <Link
                href="/data-room"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-2xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
              >
                <KeyRound className="h-4 w-4" />
                Enter with access code
              </Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="max-w-3xl mx-auto px-4 text-center text-white">
            <h2 className="text-4xl font-bold mb-4">Interested in MatCraft?</h2>
            <p className="text-blue-100 mb-8">Get access to our full investor data room including financials, competitive analysis, and roadmap.</p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button onClick={() => setShowModal(true)}
                className="inline-flex items-center justify-center px-8 py-4 rounded-2xl text-lg font-semibold border-2 border-white text-white bg-white/10 hover:bg-white hover:text-blue-600 transition-colors">
                Request Access
              </button>
              <Link
                href="/data-room"
                className="inline-flex items-center gap-2 text-sm text-blue-100 hover:text-white underline underline-offset-4"
              >
                <KeyRound className="h-4 w-4" />
                Already have a code? Enter the data room
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />

      {/* Request Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setShowModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95 }}
              className="bg-card border border-border rounded-3xl p-8 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}>
              {submitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                    <ChevronRight className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Request Submitted</h3>
                  <p className="text-muted-foreground text-sm">We&apos;ll review your request and send access credentials within 24 hours.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-foreground">Request Data Room Access</h3>
                    <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-muted"><X className="h-5 w-5" /></button>
                  </div>
                  <div className="space-y-3">
                    {[
                      { key: "full_name", label: "Full Name", type: "text", placeholder: "Jane Smith" },
                      { key: "email", label: "Work Email", type: "email", placeholder: "jane@fund.com" },
                    ].map((f) => (
                      <div key={f.key}>
                        <label className="text-xs font-medium text-muted-foreground">{f.label}</label>
                        <input type={f.type} placeholder={f.placeholder} value={(form as Record<string, string>)[f.key]}
                          onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                          className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      </div>
                    ))}
                    <PlacesAutocomplete
                      label="Organization"
                      placeholder="Acme Ventures — start typing…"
                      value={companyPlace}
                      onChange={setCompanyPlace}
                    />
                    {companyPlace.formatted_address && (
                      <p className="text-[11px] text-green-500 flex items-center gap-1">
                        ✓ Resolved to {companyPlace.formatted_address}
                      </p>
                    )}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Role</label>
                      <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                        className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                        {["Investor", "Analyst", "Partner", "Journalist", "Other"].map((r) => <option key={r}>{r}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Message (optional)</label>
                      <textarea rows={3} placeholder="What is your investment focus / why are you interested in MatCraft?"
                        value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                        className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                    </div>
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl" onClick={handleSubmit} disabled={loading || !form.full_name || !form.email}>
                      {loading ? "Submitting..." : "Submit Request"}
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
