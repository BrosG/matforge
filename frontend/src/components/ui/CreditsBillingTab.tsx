"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Coins,
  CreditCard,
  Zap,
  Star,
  Shield,
  Loader2,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  TrendingUp,
  Calendar,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useBuyModal } from "@/components/ui/BuyCreditsModal";
import { cn } from "@/lib/utils";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.matcraft.ai/api/v1";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Transaction {
  id: string;
  type: "purchase" | "debit" | "subscription" | "bonus";
  amount: number;
  description: string;
  created_at: string;
}

interface BalanceData {
  credits: number;
  subscription?: {
    plan: string;
    credits_per_month: number;
    next_reset: string;
    stripe_customer_id?: string;
  };
}

interface UsageDay {
  date: string;
  used: number;
}

const QUICK_PACKS = [
  {
    key: "starter_10",
    label: "Starter",
    credits: 10,
    price: 29,
    icon: <Coins className="h-4 w-4 text-gray-500" />,
  },
  {
    key: "pro_50",
    label: "Pro",
    credits: 50,
    price: 99,
    icon: <Zap className="h-4 w-4 text-blue-500" />,
    highlight: true,
  },
  {
    key: "enterprise_200",
    label: "Enterprise",
    credits: 200,
    price: 299,
    icon: <Shield className="h-4 w-4 text-purple-500" />,
  },
  {
    // Must match backend CREDIT_PACKAGES key in stripe_payments.py.
    // Older value 'deep_scan_5' returned 400 'Unknown package'.
    key: "deep_scan_pack_50",
    label: "Deep Scan",
    credits: 50,
    price: 199,
    icon: <Star className="h-4 w-4 text-amber-500" />,
  },
];

// Generate placeholder usage data for the last 30 days
function placeholderUsage(): UsageDay[] {
  const days: UsageDay[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      used: 0,
    });
  }
  return days;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CreditsBillingTab() {
  const { data: session } = useSession();
  const accessToken = (session as any)?.accessToken;
  const { open: openBuyModal } = useBuyModal();

  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [usage, setUsage] = useState<UsageDay[]>(placeholderUsage());
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [loadingTx, setLoadingTx] = useState(true);
  const [managingPortal, setManagingPortal] = useState(false);
  const [buyingPack, setBuyingPack] = useState<string | null>(null);
  const [buyError, setBuyError] = useState<string>("");

  // Detect ?payment=success in URL
  const [showSuccess, setShowSuccess] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("payment") === "success") {
        setShowSuccess(true);
        // Remove query param without page reload
        const url = new URL(window.location.href);
        url.searchParams.delete("payment");
        window.history.replaceState({}, "", url.toString());
      }
    }
  }, []);

  const fetchBalance = useCallback(async () => {
    if (!accessToken) return;
    setLoadingBalance(true);
    try {
      const res = await fetch(`${API_BASE}/credits/balance`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) setBalance(await res.json());
    } catch {}
    setLoadingBalance(false);
  }, [accessToken]);

  const fetchTransactions = useCallback(async () => {
    if (!accessToken) return;
    setLoadingTx(true);
    try {
      const res = await fetch(`${API_BASE}/credits/history`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions ?? data ?? []);
      }
    } catch {}
    setLoadingTx(false);
  }, [accessToken]);

  const fetchUsage = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API_BASE}/credits/usage?days=30`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.usage)) setUsage(data.usage);
      }
    } catch {}
  }, [accessToken]);

  useEffect(() => {
    fetchBalance();
    fetchTransactions();
    fetchUsage();
  }, [fetchBalance, fetchTransactions, fetchUsage]);

  const handleManagePortal = async () => {
    setBuyError("");
    if (!accessToken) {
      setBuyError("You're signed out. Please sign in again.");
      return;
    }
    setManagingPortal(true);
    try {
      const res = await fetch(`${API_BASE}/stripe/create-portal-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          return_url: `${window.location.origin}/dashboard/settings`,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const detail =
          (data && (data.detail || data.message)) ||
          (res.status === 404
            ? "No Stripe customer for your account yet — buy any pack first to create one."
            : `Portal session failed (HTTP ${res.status}).`);
        setBuyError(typeof detail === "string" ? detail : "Portal session failed.");
        console.error("[stripe] portal-session failed", res.status, data);
        return;
      }
      if (data?.url) window.location.href = data.url;
    } catch (err) {
      console.error("[stripe] portal-session network error", err);
      setBuyError("Network error. Check your connection and try again.");
    } finally {
      setManagingPortal(false);
    }
  };

  const handleQuickBuy = async (packKey: string) => {
    setBuyError("");
    if (!accessToken) {
      setBuyError("You're signed out. Please sign in again to buy credits.");
      return;
    }
    setBuyingPack(packKey);
    try {
      const res = await fetch(`${API_BASE}/stripe/create-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          package: packKey,
          success_url: `${window.location.origin}/dashboard/settings?payment=success`,
          cancel_url: `${window.location.origin}/dashboard/settings`,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        // Show the actual reason — silent failure was the bug.
        const detail =
          (data && (data.detail || data.message)) ||
          (res.status === 401
            ? "Your session expired. Please sign in again."
            : `Checkout failed (HTTP ${res.status}).`);
        setBuyError(typeof detail === "string" ? detail : "Checkout failed.");
        console.error("[stripe] checkout-session failed", res.status, data);
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
      } else {
        setBuyError("Checkout session created but no redirect URL was returned.");
      }
    } catch (err) {
      console.error("[stripe] checkout-session network error", err);
      setBuyError("Network error. Check your connection and try again.");
    } finally {
      setBuyingPack(null);
    }
  };

  const txTypeColors: Record<string, string> = {
    purchase: "completed",
    subscription: "info",
    bonus: "warning",
    debit: "failed",
  };

  return (
    <div className="space-y-6">
      {/* Success Toast */}
      {showSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 font-medium text-sm flex items-center gap-2"
        >
          ✅ Payment successful — your credits have been added!
        </motion.div>
      )}

      {/* Balance Hero */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                  <Coins className="h-4 w-4 text-amber-500" />
                  Current Balance
                </p>
                {loadingBalance ? (
                  <div className="h-12 w-32 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                ) : (
                  <div className="flex items-end gap-3">
                    <span className="text-5xl font-extrabold text-gray-900 dark:text-white">
                      {balance?.credits ?? 0}
                    </span>
                    <span className="text-lg text-muted-foreground mb-1">credits</span>
                  </div>
                )}
                {balance?.subscription && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Subscription:{" "}
                    <span className="font-semibold text-blue-600 dark:text-blue-400 capitalize">
                      {balance.subscription.plan}
                    </span>{" "}
                    · {balance.subscription.credits_per_month} credits/month
                    {balance.subscription.next_reset && (
                      <>
                        {" "}· Resets{" "}
                        {new Date(balance.subscription.next_reset).toLocaleDateString()}
                      </>
                    )}
                  </p>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchBalance}
                  disabled={loadingBalance}
                >
                  <RefreshCw className={cn("h-4 w-4 mr-2", loadingBalance && "animate-spin")} />
                  Refresh
                </Button>
                <Button variant="gradient" size="sm" onClick={openBuyModal}>
                  <Coins className="h-4 w-4 mr-2" />
                  Buy Credits
                </Button>
                {balance?.subscription && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleManagePortal}
                    disabled={managingPortal}
                  >
                    {managingPortal ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <ExternalLink className="h-4 w-4 mr-2" />
                    )}
                    Manage Subscription
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Usage Chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Credit Usage — Last 30 Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={usage} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-100 dark:stroke-gray-800" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  interval={4}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "0.75rem",
                    fontSize: "0.75rem",
                  }}
                  formatter={(v: number) => [`${v} credits`, "Used"]}
                />
                <Bar
                  dataKey="used"
                  fill="url(#creditGrad)"
                  radius={[4, 4, 0, 0]}
                />
                <defs>
                  <linearGradient id="creditGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Buy Packs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-purple-500" />
              Quick Buy Credit Packs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {buyError && (
              <div className="mb-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm flex items-start justify-between gap-3">
                <span>{buyError}</span>
                <button
                  type="button"
                  onClick={() => setBuyError("")}
                  className="text-red-400 hover:text-red-600 text-lg leading-none"
                  aria-label="Dismiss"
                >
                  ×
                </button>
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {QUICK_PACKS.map((pack) => (
                <button
                  key={pack.key}
                  onClick={() => handleQuickBuy(pack.key)}
                  disabled={buyingPack !== null}
                  className={cn(
                    "relative flex flex-col items-start p-4 rounded-xl border text-left transition-all hover:shadow-md disabled:opacity-60",
                    pack.highlight
                      ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/20 hover:border-blue-400"
                      : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 hover:border-blue-200 dark:hover:border-blue-800"
                  )}
                >
                  {pack.highlight && (
                    <span className="absolute -top-2 right-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                      Popular
                    </span>
                  )}
                  <div className="mb-2">{pack.icon}</div>
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">
                    {pack.label}
                  </p>
                  <p className="text-lg font-extrabold text-gray-900 dark:text-white">
                    ${pack.price}
                  </p>
                  <p className="text-xs text-muted-foreground">{pack.credits} credits</p>
                  {buyingPack === pack.key && (
                    <Loader2 className="absolute top-2 right-2 h-3.5 w-3.5 animate-spin text-blue-500" />
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Transaction History */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-4 w-4 text-emerald-500" />
              Transaction History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingTx ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Coins className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No transactions yet.</p>
                <p className="text-xs mt-1">Your credit history will appear here after your first purchase.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/40"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant={(txTypeColors[tx.type] as any) ?? "secondary"}>
                        {tx.type}
                      </Badge>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {tx.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "text-sm font-bold",
                        tx.amount > 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-500 dark:text-red-400"
                      )}
                    >
                      {tx.amount > 0 ? "+" : ""}{tx.amount}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
