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
  Sparkles,
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
}

interface SubscriptionPlan {
  key: string;
  label: string;
  creditsPerMonth: number;
  pricePerMonth: number;
  badge?: string;
  features: string[];
  highlight?: boolean;
}

// ─── Data ───────────────────────────────────────────────────────────────────

const CREDIT_PACKAGES: CreditPackage[] = [
  {
    key: "starter_10",
    label: "Starter",
    credits: 10,
    price: 29,
    perCredit: "$2.90",
    badge: "Try it",
    badgeColor: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    icon: <Coins className="h-5 w-5 text-gray-500" />,
  },
  {
    key: "pro_50",
    label: "Pro Pack",
    credits: 50,
    price: 99,
    perCredit: "$1.98",
    badge: "Most Popular",
    badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
    icon: <Zap className="h-5 w-5 text-blue-500" />,
    highlight: true,
  },
  {
    key: "enterprise_200",
    label: "Enterprise Pack",
    credits: 200,
    price: 299,
    perCredit: "$1.50",
    badge: "Best Value",
    badgeColor: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
    icon: <Shield className="h-5 w-5 text-purple-500" />,
  },
  {
    key: "deep_scan_5",
    label: "Deep Scan Pack",
    credits: 50,
    price: 199,
    perCredit: "for patent analysis",
    badge: "5 Deep Scans",
    badgeColor: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
    icon: <Star className="h-5 w-5 text-amber-500" />,
  },
];

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    key: "researcher",
    label: "Researcher",
    creditsPerMonth: 50,
    pricePerMonth: 49,
    features: ["50 credits/month", "Materials search", "3D Builder", "IP Radar", "Email support"],
  },
  {
    key: "professional",
    label: "Professional",
    creditsPerMonth: 200,
    pricePerMonth: 149,
    features: ["200 credits/month", "Everything in Researcher", "Deep Scan", "Campaigns", "API access", "Priority support"],
    highlight: true,
  },
  {
    key: "enterprise_sub",
    label: "Enterprise",
    creditsPerMonth: 1000,
    pricePerMonth: 499,
    badge: "Best Value",
    features: ["1,000 credits/month", "Everything in Pro", "Custom contract", "Dedicated support", "SLA guarantee"],
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
  const [success, setSuccess] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"packs" | "subscriptions">("packs");

  // Fetch balance when modal opens
  React.useEffect(() => {
    if (open && accessToken) {
      fetch(`${API_BASE}/credits/balance`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (data?.credits !== undefined) setBalance(data.credits);
        })
        .catch(() => {});
    }
  }, [open, accessToken]);

  const handleBuyPack = async (pkg: CreditPackage) => {
    if (!accessToken) return;
    setPurchasing(pkg.key);
    setError(null);
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
      if (!res.ok) throw new Error("Failed to create checkout session");
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      setError("Could not initiate checkout. Please try again.");
    } finally {
      setPurchasing(null);
    }
  };

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!accessToken) return;
    setSubscribing(plan.key);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/stripe/create-subscription-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          plan: plan.key,
          success_url: `${window.location.origin}/dashboard/settings?payment=success`,
          cancel_url: `${window.location.origin}/pricing`,
        }),
      });
      if (!res.ok) throw new Error("Failed to create subscription session");
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      setError("Could not initiate subscription. Please try again.");
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
            className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700/50"
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
                      Purchase credits or subscribe for more
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tab switcher */}
            <div className="flex gap-2 px-6 pt-5">
              <button
                onClick={() => setActiveTab("packs")}
                className={cn(
                  "flex-1 py-2 rounded-xl text-sm font-medium transition-all",
                  activeTab === "packs"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                )}
              >
                <CreditCard className="h-4 w-4 inline mr-2" />
                One-time Packs
              </button>
              <button
                onClick={() => setActiveTab("subscriptions")}
                className={cn(
                  "flex-1 py-2 rounded-xl text-sm font-medium transition-all",
                  activeTab === "subscriptions"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                )}
              >
                <Zap className="h-4 w-4 inline mr-2" />
                Subscriptions
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
                          : "border-gray-200 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-800/40 hover:border-blue-200 dark:hover:border-blue-800"
                      )}
                    >
                      {pkg.badge && (
                        <span
                          className={cn(
                            "absolute -top-2.5 right-3 px-2.5 py-0.5 rounded-full text-[11px] font-semibold",
                            pkg.badgeColor
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
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {pkg.credits} credits · {pkg.perCredit}
                      </p>
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
                            Buy {pkg.credits} credits
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
                  className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4"
                >
                  {SUBSCRIPTION_PLANS.map((plan) => (
                    <div
                      key={plan.key}
                      className={cn(
                        "relative flex flex-col p-5 rounded-xl border transition-all",
                        plan.highlight
                          ? "border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/20 shadow-md ring-1 ring-blue-200 dark:ring-blue-800"
                          : "border-gray-200 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-800/40 hover:border-blue-200 dark:hover:border-blue-800"
                      )}
                    >
                      {plan.badge && (
                        <span className="absolute -top-2.5 right-3 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                          {plan.badge}
                        </span>
                      )}
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                        {plan.label}
                      </h3>
                      <p className="text-3xl font-extrabold text-gray-900 dark:text-white">
                        ${plan.pricePerMonth}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                        /month · {plan.creditsPerMonth} credits/mo
                      </p>
                      <ul className="space-y-1.5 flex-1 mb-4">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                            {f}
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
                          <>Subscribe</>
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
                <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-sm text-red-700 dark:text-red-400 text-center">
                  {error}
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
                  <a href="/login" className="underline font-medium">Sign in</a> to purchase credits.
                </div>
              )}
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                <Shield className="h-3.5 w-3.5" />
                Secured by Stripe · Credits added instantly after payment
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
