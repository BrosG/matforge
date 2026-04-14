"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useBuyModal } from "@/components/ui/BuyCreditsModal";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.matcraft.ai/api/v1";

const DISMISS_KEY = "matcraft_low_credits_dismissed";
const LOW_THRESHOLD = 3;

export function LowCreditsBanner() {
  const { isAuthenticated, accessToken } = useAuth();
  const { open } = useBuyModal();
  const [credits, setCredits] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const fetchBalance = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API_BASE}/credits/balance`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCredits(data.credits ?? 0);
      }
    } catch {}
  }, [accessToken]);

  useEffect(() => {
    // Reset dismissal each session
    const stored = sessionStorage.getItem(DISMISS_KEY);
    setDismissed(stored === "1");
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchBalance();
      const id = setInterval(fetchBalance, 60_000);
      return () => clearInterval(id);
    }
  }, [isAuthenticated, fetchBalance]);

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  const show =
    isAuthenticated &&
    credits !== null &&
    credits < LOW_THRESHOLD &&
    !dismissed;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -40, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -40, height: 0 }}
          transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
          className="overflow-hidden"
        >
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 dark:from-orange-600 dark:to-amber-600 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <p className="flex-1 text-sm font-medium">
                You have{" "}
                <span className="font-bold">
                  {credits} credit{credits !== 1 ? "s" : ""}
                </span>{" "}
                remaining — Buy more to continue using IP Radar and Deep Scan.
              </p>
              <button
                onClick={open}
                className="flex items-center gap-1 text-sm font-semibold bg-white/20 hover:bg-white/30 transition-colors rounded-lg px-3 py-1.5 flex-shrink-0"
              >
                Buy Credits
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={handleDismiss}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors flex-shrink-0"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
