"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Sparkles,
  Coins,
  Zap,
  Star,
  Shield,
  ChevronRight,
  CreditCard,
  Minus,
} from "lucide-react";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { useBuyModal } from "@/components/ui/BuyCreditsModal";
import { cn } from "@/lib/utils";

// ─── Data ────────────────────────────────────────────────────────────────────

const SUBSCRIPTION_TIERS = [
  {
    key: "free",
    name: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    credits: "10 starter credits",
    desc: "Explore the platform. No card required.",
    cta: "Start Free",
    href: "/register",
    highlight: false,
    features: {
      search: true,
      builder: true,
      ipRadar: "3 free/day",
      deepScan: false,
      campaigns: false,
      api: false,
      support: "Community",
      contract: false,
    },
  },
  {
    key: "researcher",
    name: "Researcher",
    monthlyPrice: 49,
    annualPrice: 39,
    credits: "50 credits/month",
    desc: "For researchers running regular IP and materials work.",
    cta: "Subscribe",
    href: "/register",
    highlight: false,
    planKey: "researcher",
    features: {
      search: true,
      builder: true,
      ipRadar: true,
      deepScan: false,
      campaigns: "5 active",
      api: false,
      support: "Email",
      contract: false,
    },
  },
  {
    key: "professional",
    name: "Professional",
    monthlyPrice: 149,
    annualPrice: 119,
    credits: "200 credits/month",
    desc: "Full access for professional materials scientists.",
    cta: "Subscribe",
    href: "/register",
    highlight: true,
    planKey: "professional",
    badge: "Most Popular",
    features: {
      search: true,
      builder: true,
      ipRadar: true,
      deepScan: true,
      campaigns: "Unlimited",
      api: true,
      support: "Priority",
      contract: false,
    },
  },
  {
    key: "enterprise_sub",
    name: "Enterprise",
    monthlyPrice: 499,
    annualPrice: 399,
    credits: "1,000 credits/month",
    desc: "For organisations with advanced needs and SLA requirements.",
    cta: "Contact Us",
    href: "mailto:enterprise@matcraft.ai",
    highlight: false,
    badge: "Best Value",
    features: {
      search: true,
      builder: true,
      ipRadar: true,
      deepScan: true,
      campaigns: "Unlimited",
      api: true,
      support: "Dedicated engineer",
      contract: true,
    },
  },
];

const CREDIT_PACKAGES = [
  {
    key: "starter_10",
    label: "Starter",
    credits: 10,
    price: 29,
    perCredit: "$2.90/credit",
    icon: <Coins className="h-6 w-6 text-gray-400" />,
    badge: null,
  },
  {
    key: "pro_50",
    label: "Pro Pack",
    credits: 50,
    price: 99,
    perCredit: "$1.98/credit",
    icon: <Zap className="h-6 w-6 text-blue-500" />,
    badge: "Most Popular",
    highlight: true,
  },
  {
    key: "enterprise_200",
    label: "Enterprise Pack",
    credits: 200,
    price: 299,
    perCredit: "$1.50/credit",
    icon: <Shield className="h-6 w-6 text-purple-500" />,
    badge: "Best Value",
  },
  {
    key: "deep_scan_5",
    label: "Deep Scan Pack",
    credits: 50,
    price: 199,
    perCredit: "for patent analysis",
    icon: <Star className="h-6 w-6 text-amber-500" />,
    badge: "5 Deep Scans",
  },
];

const FEATURE_ROWS = [
  { key: "search", label: "Materials Search (205k+)" },
  { key: "builder", label: "3D Crystal Builder" },
  { key: "ipRadar", label: "IP Radar" },
  { key: "deepScan", label: "Deep Scan (patent analysis)" },
  { key: "campaigns", label: "Campaigns" },
  { key: "api", label: "API Access" },
  { key: "support", label: "Support" },
  { key: "contract", label: "Custom Contract / SLA" },
];

const FAQ_ITEMS = [
  {
    q: "What is a credit?",
    a: "Each credit lets you run one AI-powered query — an IP Radar search, a Deep Scan patent analysis, or a campaign evaluation batch. Simple materials browsing and the 3D builder are always free.",
  },
  {
    q: "Do unused credits roll over?",
    a: "One-time credit packs never expire. Monthly subscription credits reset at the start of each billing cycle and do not roll over.",
  },
  {
    q: "Can I mix a subscription with one-time packs?",
    a: "Yes. Your subscription credits are used first; one-time credits act as a top-up that never expire.",
  },
  {
    q: "How does the annual discount work?",
    a: "Paying annually saves 20% compared to month-to-month billing. The discounted price is charged as a single payment at the start of each year.",
  },
  {
    q: "What happens when I run out of credits?",
    a: "You can still browse materials and use the 3D builder. IP Radar and Deep Scan are gated and will prompt you to top up before the search runs.",
  },
  {
    q: "Is there a free trial?",
    a: "Every new account starts with 10 complimentary credits — enough to try IP Radar searches and see the platform in action. No credit card required.",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function FeatureValue({ value }: { value: boolean | string }) {
  if (value === true)
    return <Check className="h-5 w-5 text-green-500 mx-auto" />;
  if (value === false)
    return <Minus className="h-4 w-4 text-gray-300 dark:text-gray-600 mx-auto" />;
  return (
    <span className="text-sm text-gray-700 dark:text-gray-300">{value}</span>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { open: openBuyModal } = useBuyModal();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Header />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="pt-28 pb-10 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-sm font-medium border border-blue-100 dark:border-blue-800 mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              Simple, Transparent Pricing
            </span>
            <h1 className="text-4xl md:text-6xl font-bold mb-5 leading-tight">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Simple, Transparent
              </span>
              <br />
              <span className="text-gray-900 dark:text-white">Pricing</span>
            </h1>
            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto mb-10">
              Start free with 10 credits. Scale as your research grows. No surprises.
            </p>

            {/* Billing toggle */}
            <div className="inline-flex items-center gap-3 p-1 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setAnnual(false)}
                className={cn(
                  "px-5 py-2 rounded-full text-sm font-medium transition-all",
                  !annual
                    ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white"
                    : "text-gray-500 dark:text-gray-400"
                )}
              >
                Monthly
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={cn(
                  "px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                  annual
                    ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white"
                    : "text-gray-500 dark:text-gray-400"
                )}
              >
                Annual
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400">
                  -20%
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Pricing Cards ───────────────────────────────────── */}
      <section className="pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {SUBSCRIPTION_TIERS.map((tier, i) => {
              const price = annual ? tier.annualPrice : tier.monthlyPrice;
              const originalPrice = tier.monthlyPrice;
              const showStrike = annual && tier.monthlyPrice > 0;

              return (
                <motion.div
                  key={tier.key}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={cn(
                    "relative flex flex-col rounded-2xl border p-7 transition-all",
                    tier.highlight
                      ? "border-blue-300 dark:border-blue-700 bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/30 dark:to-gray-900 shadow-xl ring-2 ring-blue-200 dark:ring-blue-800 scale-105"
                      : "border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md"
                  )}
                >
                  {tier.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-semibold whitespace-nowrap shadow-lg">
                      {tier.badge}
                    </div>
                  )}

                  <div className="mb-5">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                      {tier.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {tier.desc}
                    </p>
                  </div>

                  <div className="mb-2">
                    {price === 0 ? (
                      <span className="text-4xl font-extrabold text-gray-900 dark:text-white">
                        Free
                      </span>
                    ) : (
                      <div className="flex items-end gap-2">
                        <span className="text-4xl font-extrabold text-gray-900 dark:text-white">
                          ${price}
                        </span>
                        {showStrike && (
                          <span className="text-lg text-gray-400 line-through mb-1">
                            ${originalPrice}
                          </span>
                        )}
                      </div>
                    )}
                    {price > 0 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        /month {annual && "· billed annually"}
                      </p>
                    )}
                  </div>

                  <div className="mb-5 text-sm font-semibold text-amber-600 dark:text-amber-400">
                    🪙 {tier.credits}
                  </div>

                  <Button
                    asChild={tier.key !== "professional" && tier.key !== "researcher"}
                    onClick={
                      tier.key === "professional" || tier.key === "researcher"
                        ? openBuyModal
                        : undefined
                    }
                    variant={tier.highlight ? "gradient" : "outline"}
                    className="w-full mb-6"
                  >
                    {tier.key === "professional" || tier.key === "researcher" ? (
                      <span className="flex items-center justify-center gap-1">
                        {tier.cta} <ChevronRight className="h-4 w-4" />
                      </span>
                    ) : (
                      <Link href={tier.href} className="flex items-center justify-center gap-1">
                        {tier.cta} <ChevronRight className="h-4 w-4" />
                      </Link>
                    )}
                  </Button>

                  <ul className="space-y-2.5">
                    {FEATURE_ROWS.slice(0, 5).map((row) => {
                      const val = tier.features[row.key as keyof typeof tier.features];
                      if (!val) return null;
                      return (
                        <li key={row.key} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span className="text-gray-600 dark:text-gray-400">
                            {typeof val === "string" ? `${row.label}: ${val}` : row.label}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Feature Comparison Table ────────────────────────── */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Full Feature Comparison
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Everything you get at each tier, side by side.
            </p>
          </motion.div>

          <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="text-left p-5 font-semibold text-gray-900 dark:text-white w-1/3">
                    Feature
                  </th>
                  {SUBSCRIPTION_TIERS.map((tier) => (
                    <th
                      key={tier.key}
                      className={cn(
                        "p-5 text-center font-semibold",
                        tier.highlight
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-gray-700 dark:text-gray-300"
                      )}
                    >
                      {tier.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FEATURE_ROWS.map((row, i) => (
                  <tr
                    key={row.key}
                    className={cn(
                      "border-b border-gray-50 dark:border-gray-800/50",
                      i % 2 === 0 ? "" : "bg-gray-50/50 dark:bg-gray-800/20"
                    )}
                  >
                    <td className="p-5 font-medium text-gray-700 dark:text-gray-300">
                      {row.label}
                    </td>
                    {SUBSCRIPTION_TIERS.map((tier) => (
                      <td key={tier.key} className="p-5 text-center">
                        <FeatureValue
                          value={tier.features[row.key as keyof typeof tier.features]}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── One-time Credit Packs ───────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-sm font-medium border border-amber-100 dark:border-amber-800 mb-4">
              <Coins className="h-3.5 w-3.5" />
              One-time Packs
            </span>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Or buy credit packs — they never expire
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
              Perfect for project bursts, occasional use, or topping up your monthly subscription.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {CREDIT_PACKAGES.map((pkg, i) => (
              <motion.div
                key={pkg.key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className={cn(
                  "relative flex flex-col rounded-2xl border p-6 transition-all hover:shadow-md",
                  pkg.highlight
                    ? "border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/20 shadow-lg ring-1 ring-blue-200 dark:ring-blue-800"
                    : "border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900"
                )}
              >
                {pkg.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[11px] font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-white whitespace-nowrap shadow">
                    {pkg.badge}
                  </span>
                )}
                <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-4 shadow-sm border border-gray-100 dark:border-gray-700">
                  {pkg.icon}
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                  {pkg.label}
                </h3>
                <p className="text-3xl font-extrabold text-gray-900 dark:text-white mb-0.5">
                  ${pkg.price}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {pkg.credits} credits
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">
                  {pkg.perCredit}
                </p>
                <div className="flex-1" />
                <Button
                  onClick={openBuyModal}
                  variant={pkg.highlight ? "gradient" : "outline"}
                  size="sm"
                  className="w-full"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Buy Now
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────── */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900/50 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Everything you need to know about credits and billing.
            </p>
          </motion.div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <span className="font-semibold text-gray-900 dark:text-white text-sm">
                    {item.q}
                  </span>
                  <motion.div
                    animate={{ rotate: openFaq === i ? 45 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-shrink-0 ml-4"
                  >
                    <ChevronRight className="h-5 w-5 text-gray-400" style={{ transform: openFaq === i ? "rotate(90deg)" : "rotate(0deg)" }} />
                  </motion.div>
                </button>
                <AnimatePresence initial={false}>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <p className="px-5 pb-5 text-sm text-gray-600 dark:text-gray-400 leading-relaxed border-t border-gray-50 dark:border-gray-800 pt-4">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-xl mb-6">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Start free — 10 credits on signup
            </h2>
            <p className="text-lg text-gray-500 dark:text-gray-400 mb-8">
              No credit card required. Explore 205,000+ materials, run your first IP Radar
              search, and build 3D crystal structures — all for free.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild variant="gradient" size="lg">
                <Link href="/register">
                  Get Started Free <ChevronRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/materials">Browse Materials</Link>
              </Button>
            </div>
            <p className="mt-6 text-sm text-gray-400 dark:text-gray-500 flex items-center justify-center gap-2">
              <Shield className="h-4 w-4" />
              Secured by Stripe · Cancel anytime · No hidden fees
            </p>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
