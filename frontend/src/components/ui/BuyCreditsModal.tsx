"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Coins,
  CreditCard,
  Zap,
  Star,
  Shield,
  Loader2,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Crown,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.matcraft.ai/api/v1";

// ─── Types ─────────────────────────────────────────────────────────────────

interface CreditPackage {
  key: string;
  label: string;
  credits: number;
  price: number;
  perCredit: string;
  badge?: string;
  badgeColor?: string;
  icon: React.ReactNode;
  highlight?: boolean;
  // Insider blurb — what this pack actually unlocks in real-world terms
  pitch: string;
  // What you'd pay for the equivalent elsewhere
  vs?: string;
  // Bullet list of what 1 credit gets you for this pack
  buys: string[];
}

interface SubscriptionPlan {
  key: string;
  label: string;
  creditsPerMonth: number;
  pricePerMonth: number;
  badge?: string;
  badgeColor?: string;
  features: string[];
  icon: React.ReactNode;
  highlight?: boolean;
  pitch: string;
  // Effective per-credit cost
  perCredit: string;
  // Real-world equivalent
  vs?: string;
}

// ─── Data ───────────────────────────────────────────────────────────────────
//
// Backend keys MUST match CREDIT_PACKAGES / SUBSCRIPTION_PLANS in
// backend/app/api/v1/endpoints/stripe_payments.py. Any drift returns
// 400 'Unknown package' / 'Unknown plan'.

const CREDIT_PACKAGES: CreditPackage[] = [
  {
    key: "starter_10",
    label: "Starter",
    credits: 10,
    price: 29,
    perCredit: "$2.90 / credit",
    badge: "Try it",
    badgeColor: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    icon: <Coins className="h-5 w-5 text-gray-500" />,
    pitch: "10 IP Radar searches or 60 days of light platform use. Validate the workflow on a real project before scaling up.",
    vs: "vs $400/yr CrystalMaker — never amortizes if you only run a handful of searches",
    buys: [
      "10 IP Radar searches (1 credit each)",
      "Or 1 mid-size 1,000-patent Deep Scan",
      "Materials search, 3D builder, exports — all free, never debited",
    ],
  },
  {
    key: "pro_50",
    label: "Pro Pack",
    credits: 50,
    price: 99,
    perCredit: "$1.98 / credit",
    badge: "Most picked",
    badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
    icon: <Zap className="h-5 w-5 text-blue-500" />,
    highlight: true,
    pitch: "Standard quarterly burst for an active researcher: ~50 patent landscape passes plus a few full FTO scans.",
    vs: "vs $5–10k for one external IP analyst report — you get 50 here",
    buys: [
      "50 IP Radar searches with full patent corpus",
      "Or 5 medium Deep Scans (1,000 patents each)",
      "Or 25 IP Radar + 2 large Deep Scans — mix freely",
      "Credits never expire mid-quarter; carry over for 12 months",
    ],
  },
  {
    key: "enterprise_200",
    label: "Enterprise Pack",
    credits: 200,
    price: 299,
    perCredit: "$1.50 / credit",
    badge: "Best $/credit",
    badgeColor:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
    icon: <Shield className="h-5 w-5 text-purple-500" />,
    pitch: "Built for an R&D team running parallel programs. 200 credits = a quarter of intensive landscape mapping for 3-5 scientists.",
    vs: "vs $50k+ for a single law-firm FTO opinion that takes 6 weeks",
    buys: [
      "200 IP Radar searches across multiple chemistries",
      "Or 20 Deep Scans for parallel programs",
      "Shared seat-pool model (admin distributes credits to team)",
      "Volume tier triggers a /credits/balance bulk-tx audit row",
    ],
  },
  {
    key: "deep_scan_pack_50",
    label: "Deep Scan Bundle",
    credits: 50,
    price: 199,
    perCredit: "$3.98 / Deep Scan",
    badge: "5× FTO reports",
    badgeColor:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
    icon: <Star className="h-5 w-5 text-amber-500" />,
    pitch: "Pre-bought slot for 5 large FTO scans (2,000 patents × Gemini analysis × directive-aware ranking). Drops the per-scan cost ~50%.",
    vs: "vs $30–100k each from Fish & Richardson / Baker Botts, 4–8 wk turnaround",
    buys: [
      "5 large Deep Scans (2,000 patents each, 20 min turnaround)",
      "Directive-aware: include your tech narrative for relevance scoring",
      "Exportable JSON + executive summary + per-patent claim analysis",
      "Stored 12 months for re-running with updated corpora",
    ],
  },
];

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    key: "researcher_monthly",
    label: "Researcher",
    creditsPerMonth: 50,
    pricePerMonth: 49,
    perCredit: "$0.98 / credit (–50% vs Pro pack)",
    icon: <Zap className="h-5 w-5 text-blue-500" />,
    pitch: "For PhDs, postdocs, and solo IP analysts who need predictable monthly throughput. Auto-renews, cancel anytime.",
    vs: "vs Schrödinger Maestro: $50–500k/yr · vs ICSD subscription: $30k/yr",
    features: [
      "50 credits / month, rolls 30 days",
      "Materials search · 3D builder · all exports",
      "IP Radar + standard Deep Scans",
      "Email support (24h SLA)",
      "Cancel any time — no annual lock-in",
    ],
  },
  {
    key: "professional_monthly",
    label: "Professional",
    creditsPerMonth: 200,
    pricePerMonth: 149,
    perCredit: "$0.75 / credit (–62% vs Pro pack)",
    badge: "Most R&D teams pick this",
    badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
    icon: <TrendingUp className="h-5 w-5 text-blue-500" />,
    highlight: true,
    pitch: "The default for in-house industrial R&D. Adds API access, active-learning campaigns, and 24h Deep Scan SLA.",
    vs: "Replaces $25k+/yr in scattered tooling (CrystalMaker + ICSD + ad-hoc patent reports)",
    features: [
      "200 credits / month, rolls 30 days",
      "Everything in Researcher",
      "Active-learning campaigns (NSGA-II Pareto)",
      "Deep Scan with 24h SLA",
      "REST API access (60 req/min)",
      "Priority support (4h SLA, business hours)",
    ],
  },
  {
    key: "enterprise_monthly",
    label: "Enterprise",
    creditsPerMonth: 1000,
    pricePerMonth: 499,
    perCredit: "$0.50 / credit (–75% vs Pro pack)",
    badge: "SLA + custom MSA",
    badgeColor:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
    icon: <Crown className="h-5 w-5 text-purple-500" />,
    pitch: "For multi-program R&D orgs. Unlimited team seats on a shared 1,000-credit pool, 99.9% uptime SLA, and a named CSM.",
    vs: "vs $100–300k/yr Citrine / Schrödinger seat licenses with 12-month minimums",
    features: [
      "1,000 credits / month, pooled across the team",
      "Everything in Professional",
      "Unlimited team seats (SSO via Google / Azure AD)",
      "99.9% uptime SLA + dedicated CSM",
      "Custom MSA, DPA, and SOC2 evidence pack",
      "On-prem / VPC deployment option (custom quote)",
    ],
  },
];

// ─── Context ─────────────────────────────────────────────────────────────────

interface BuyModalContextValue {
  open: () => void;
  close: () => void;
  isOpen: boolean;
}

const BuyModalContext = createContext<BuyModalContextValue>({
  open: () => {},
  close: () => {},
  isOpen: false,
});

export function BuyModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  return (
    <BuyModalContext.Provider value={{ open, close, isOpen }}>
      {children}
      <BuyCreditsModal open={isOpen} onClose={close} />
    </BuyModalContext.Provider>
  );
}

export function useBuyModal() {
  return useContext(BuyModalContext);
}

// ─── Modal Component ─────────────────────────────────────────────────────────

export function BuyCreditsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { data: session } = useSession();
  const accessToken = (session as any)?.accessToken;
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"packs" | "subscriptions">("packs");

  React.useEffect(() => {
    if (open && accessToken) {
      fetch(`${API_BASE}/credits/balance`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.credits !== undefined) setBalance(data.credits);
        })
        .catch(() => {});
    }
  }, [open, accessToken]);

  /** Surface backend.detail or a status-specific message instead of a redacted "try again". */
  const explainError = async (
    res: Response,
    fallback: string,
  ): Promise<string> => {
    const data = await res.json().catch(() => null);
    const detail =
      (data && (data.detail || data.message)) ||
      (res.status === 401
        ? "Your session expired. Please sign in again."
        : `${fallback} (HTTP ${res.status}).`);
    return typeof detail === "string" ? detail : fallback;
  };

  const handleBuyPack = async (pkg: CreditPackage) => {
    setError(null);
    if (!accessToken) {
      setError("Please sign in to purchase credits.");
      return;
    }
    setPurchasing(pkg.key);
    try {
      const res = await fetch(`${API_BASE}/stripe/create-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          package: pkg.key,
          success_url: `${window.location.origin}/dashboard/settings?payment=success`,
          cancel_url: `${window.location.origin}/pricing`,
        }),
      });
      if (!res.ok) {
        setError(await explainError(res, "Could not initiate checkout"));
        return;
      }
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setError("Checkout created but no redirect URL was returned.");
    } catch (err) {
      console.error("[stripe] checkout-session network error", err);
      setError("Network error. Check your connection and try again.");
    } finally {
      setPurchasing(null);
    }
  };

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    setError(null);
    if (!accessToken) {
      setError("Please sign in to subscribe.");
      return;
    }
    setSubscribing(plan.key);
    try {
      const res = await fetch(
        `${API_BASE}/stripe/create-subscription-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            plan: plan.key,
            success_url: `${window.location.origin}/dashboard/settings?subscription=active`,
            cancel_url: `${window.location.origin}/pricing`,
          }),
        },
      );
      if (!res.ok) {
        setError(await explainError(res, "Could not initiate subscription"));
        return;
      }
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setError("Subscription created but no redirect URL was returned.");
    } catch (err) {
      console.error("[stripe] subscription-session network error", err);
      setError("Network error. Check your connection and try again.");
    } finally {
      setSubscribing(null);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 24 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700/50"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                  <Coins className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    Get Credits
                  </h2>
                  {balance !== null ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Current balance:{" "}
                      <span className="font-semibold text-amber-600 dark:text-amber-400">
                        🪙 {balance} credits
                      </span>
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      One-time packs or monthly subscriptions
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Reference card — what 1 credit actually buys */}
            <div className="px-6 pt-5">
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 p-4 text-xs text-gray-600 dark:text-gray-400">
                <div className="font-semibold text-gray-900 dark:text-white text-[11px] uppercase tracking-wider mb-2">
                  What 1 credit buys
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <div className="font-semibold text-gray-700 dark:text-gray-300">1 IP Radar search</div>
                    <div>Full patent corpus, AI ranking, white-space map</div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-700 dark:text-gray-300">10 credits = 1 Deep Scan</div>
                    <div>2,000 patents · directive-aware FTO · 20 min</div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-700 dark:text-gray-300">Materials &amp; 3D — free</div>
                    <div>205k DB, builder, exports, no debit</div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-700 dark:text-gray-300">Credits never expire</div>
                    <div>Pack credits valid 12 months, sub credits roll 30 days</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab switcher */}
            <div className="flex gap-2 px-6 pt-5">
              <button
                onClick={() => setActiveTab("packs")}
                className={cn(
                  "flex-1 py-2 rounded-xl text-sm font-medium transition-all",
                  activeTab === "packs"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700",
                )}
              >
                <CreditCard className="h-4 w-4 inline mr-2" />
                One-time packs
              </button>
              <button
                onClick={() => setActiveTab("subscriptions")}
                className={cn(
                  "flex-1 py-2 rounded-xl text-sm font-medium transition-all",
                  activeTab === "subscriptions"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700",
                )}
              >
                <Zap className="h-4 w-4 inline mr-2" />
                Monthly subscription · save up to 75%
              </button>
            </div>

            {/* Credit Packs */}
            <AnimatePresence mode="wait">
              {activeTab === "packs" && (
                <motion.div
                  key="packs"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                  {CREDIT_PACKAGES.map((pkg) => (
                    <div
                      key={pkg.key}
                      className={cn(
                        "relative flex flex-col p-5 rounded-xl border transition-all",
                        pkg.highlight
                          ? "border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/20 shadow-md ring-1 ring-blue-200 dark:ring-blue-800"
                          : "border-gray-200 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-800/40 hover:border-blue-200 dark:hover:border-blue-800",
                      )}
                    >
                      {pkg.badge && (
                        <span
                          className={cn(
                            "absolute -top-2.5 right-3 px-2.5 py-0.5 rounded-full text-[11px] font-semibold",
                            pkg.badgeColor,
                          )}
                        >
                          {pkg.badge}
                        </span>
                      )}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-700 flex items-center justify-center shadow-sm border border-gray-100 dark:border-gray-600">
                          {pkg.icon}
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                          {pkg.label}
                        </h3>
                      </div>
                      <p className="text-3xl font-extrabold text-gray-900 dark:text-white mb-0.5">
                        ${pkg.price}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {pkg.credits} credits · {pkg.perCredit}
                      </p>
                      <p className="text-xs text-gray-700 dark:text-gray-300 mt-3 leading-relaxed">
                        {pkg.pitch}
                      </p>
                      {pkg.vs && (
                        <p className="text-[11px] text-gray-500 dark:text-gray-500 italic mt-2">
                          {pkg.vs}
                        </p>
                      )}
                      <ul className="space-y-1 mt-3 mb-1">
                        {pkg.buys.map((b) => (
                          <li
                            key={b}
                            className="flex items-start gap-2 text-[11px] text-gray-600 dark:text-gray-400 leading-snug"
                          >
                            <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0 mt-0.5" />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="flex-1" />
                      <Button
                        onClick={() => handleBuyPack(pkg)}
                        disabled={purchasing !== null || !accessToken}
                        variant={pkg.highlight ? "gradient" : "outline"}
                        size="sm"
                        className="mt-4 w-full"
                      >
                        {purchasing === pkg.key ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Redirecting…
                          </>
                        ) : (
                          <>
                            Buy {pkg.credits} credits — ${pkg.price}
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </motion.div>
              )}

              {/* Subscription Plans */}
              {activeTab === "subscriptions" && (
                <motion.div
                  key="subscriptions"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-4"
                >
                  {SUBSCRIPTION_PLANS.map((plan) => (
                    <div
                      key={plan.key}
                      className={cn(
                        "relative flex flex-col p-5 rounded-xl border transition-all",
                        plan.highlight
                          ? "border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/20 shadow-md ring-1 ring-blue-200 dark:ring-blue-800"
                          : "border-gray-200 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-800/40 hover:border-blue-200 dark:hover:border-blue-800",
                      )}
                    >
                      {plan.badge && (
                        <span
                          className={cn(
                            "absolute -top-2.5 right-3 px-2.5 py-0.5 rounded-full text-[11px] font-semibold",
                            plan.badgeColor ||
                              "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
                          )}
                        >
                          {plan.badge}
                        </span>
                      )}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-700 flex items-center justify-center shadow-sm border border-gray-100 dark:border-gray-600">
                          {plan.icon}
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                          {plan.label}
                        </h3>
                      </div>
                      <p className="text-3xl font-extrabold text-gray-900 dark:text-white">
                        ${plan.pricePerMonth}
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          /mo
                        </span>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {plan.creditsPerMonth} credits/mo · {plan.perCredit}
                      </p>
                      <p className="text-xs text-gray-700 dark:text-gray-300 mt-3 leading-relaxed">
                        {plan.pitch}
                      </p>
                      {plan.vs && (
                        <p className="text-[11px] text-gray-500 dark:text-gray-500 italic mt-2">
                          {plan.vs}
                        </p>
                      )}
                      <ul className="space-y-1.5 mt-3 mb-4 flex-1">
                        {plan.features.map((f) => (
                          <li
                            key={f}
                            className="flex items-start gap-2 text-[11px] text-gray-600 dark:text-gray-400 leading-snug"
                          >
                            <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0 mt-0.5" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        onClick={() => handleSubscribe(plan)}
                        disabled={subscribing !== null || !accessToken}
                        variant={plan.highlight ? "gradient" : "outline"}
                        size="sm"
                        className="w-full"
                      >
                        {subscribing === plan.key ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Redirecting…
                          </>
                        ) : (
                          <>
                            Subscribe — ${plan.pricePerMonth}/mo
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error / Footer */}
            <div className="px-6 pb-6">
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-sm text-red-700 dark:text-red-400 flex items-start justify-between gap-3">
                  <span>{error}</span>
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    className="text-red-400 hover:text-red-600 text-lg leading-none"
                    aria-label="Dismiss"
                  >
                    ×
                  </button>
                </div>
              )}
              {success && (
                <div className="mb-4 p-3 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/50 text-sm text-green-700 dark:text-green-400 text-center flex items-center justify-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  {success}
                </div>
              )}
              {!accessToken && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-sm text-amber-700 dark:text-amber-400 text-center">
                  <a href="/login" className="underline font-medium">
                    Sign in
                  </a>{" "}
                  to purchase credits or subscribe.
                </div>
              )}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] text-gray-500 dark:text-gray-500">
                <div className="flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>Stripe-hosted checkout (PCI SAQ-A) — no card data touches our servers</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>Credits added instantly via signed Stripe webhook (idempotent)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>Cancel subscriptions any time from /dashboard/settings</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
