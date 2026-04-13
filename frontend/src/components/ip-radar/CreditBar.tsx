"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.matcraft.ai/api/v1";

interface CreditBarProps {
  className?: string;
  onCreditsChange?: (credits: number) => void;
  showPurchaseModal?: boolean;
  onPurchaseModalClose?: () => void;
}

interface Package {
  key: string;
  label: string;
  credits: number;
  price: number;
  badge?: string;
}

const PACKAGES: Package[] = [
  { key: "starter_10", label: "Starter", credits: 10, price: 29, badge: "Try it" },
  { key: "pro_50", label: "Pro", credits: 50, price: 99, badge: "Most popular" },
  { key: "enterprise_200", label: "Enterprise", credits: 200, price: 299, badge: "Best value" },
  { key: "deep_scan_5", label: "Deep Scan Pack", credits: 50, price: 199, badge: "5 deep scans" },
];

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token") || null;
}

export default function CreditBar({
  className,
  onCreditsChange,
  showPurchaseModal: externalShowModal,
  onPurchaseModalClose,
}: CreditBarProps) {
  const [credits, setCredits] = useState<number | null>(null);
  const [isAuthed, setIsAuthed] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sync external modal control
  useEffect(() => {
    if (externalShowModal) setShowModal(true);
  }, [externalShowModal]);

  const closeModal = () => {
    setShowModal(false);
    onPurchaseModalClose?.();
  };

  const fetchBalance = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setIsAuthed(false);
      setCredits(null);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/credits/balance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCredits(data.credits);
        setIsAuthed(true);
        onCreditsChange?.(data.credits);
      } else {
        setIsAuthed(false);
        setCredits(null);
      }
    } catch {
      // Network error -- leave state as-is
    }
  }, [onCreditsChange]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const handlePurchase = async (pkgKey: string) => {
    const token = getToken();
    if (!token) return;
    setPurchasing(pkgKey);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/credits/purchase`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ package: pkgKey }),
      });
      if (!res.ok) throw new Error("Purchase failed");
      const data = await res.json();
      setCredits(data.credits);
      onCreditsChange?.(data.credits);
      closeModal();
    } catch {
      setError("Purchase failed. Please try again.");
    } finally {
      setPurchasing(null);
    }
  };

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------

  return (
    <>
      {/* Credit pill */}
      <div className={cn("inline-flex items-center gap-2", className)}>
        {isAuthed && credits !== null ? (
          <button
            onClick={() => setShowModal(true)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors",
              credits > 0
                ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/50"
                : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-950/50"
            )}
          >
            <span className="text-sm">&#x1FA99;</span>
            {credits > 0 ? (
              <>{credits} credit{credits !== 1 ? "s" : ""}</>
            ) : (
              <>No credits</>
            )}
            <span className="text-[10px] opacity-70 ml-0.5">Buy more</span>
          </button>
        ) : (
          <a
            href="/login"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/10 border border-white/20 text-blue-200 hover:bg-white/20 transition-colors"
          >
            <LogIn className="h-3 w-3" />
            Sign in for more searches
          </a>
        )}
      </div>

      {/* Purchase modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.4 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700/50 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    Buy Credits
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    Current balance:{" "}
                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                      {credits ?? 0} credits
                    </span>
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Packages */}
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {PACKAGES.map((pkg) => (
                  <div
                    key={pkg.key}
                    className="relative flex flex-col p-5 rounded-xl border border-gray-200 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-800/40 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                  >
                    {pkg.badge && (
                      <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-semibold">
                        {pkg.badge}
                      </span>
                    )}
                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                      {pkg.label}
                    </h3>
                    <p className="text-2xl font-extrabold text-gray-900 dark:text-white mb-0.5">
                      ${pkg.price}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {pkg.credits} credits &middot; $
                      {(pkg.price / pkg.credits).toFixed(2)}/credit
                    </p>
                    <div className="flex-1" />
                    <button
                      onClick={() => handlePurchase(pkg.key)}
                      disabled={purchasing !== null}
                      className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
                    >
                      {purchasing === pkg.key ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>Buy {pkg.credits} credits</>
                      )}
                    </button>
                  </div>
                ))}
              </div>

              {/* Error */}
              {error && (
                <div className="px-6 pb-4">
                  <p className="text-sm text-red-600 dark:text-red-400 text-center">
                    {error}
                  </p>
                </div>
              )}

              <div className="px-6 pb-6 text-center text-xs text-gray-400 dark:text-gray-500">
                Credits are added to your balance instantly. No payment processing in beta.
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
