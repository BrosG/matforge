"use client";

import { useState, useEffect, useCallback } from "react";
import { Coins } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useBuyModal } from "@/components/ui/BuyCreditsModal";
import { cn } from "@/lib/utils";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.matcraft.ai/api/v1";

export function CreditsIndicator() {
  const { isAuthenticated, accessToken } = useAuth();
  const { open } = useBuyModal();
  const [credits, setCredits] = useState<number | null>(null);

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
    } catch {
      // Silently ignore — non-critical indicator
    }
  }, [accessToken]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchBalance();
      // Refresh every 60 seconds
      const id = setInterval(fetchBalance, 60_000);
      return () => clearInterval(id);
    }
  }, [isAuthenticated, fetchBalance]);

  if (!isAuthenticated || credits === null) return null;

  const isEmpty = credits === 0;

  return (
    <button
      onClick={open}
      title="Buy more credits"
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 hover:scale-105",
        isEmpty
          ? "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-950/60"
          : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/60"
      )}
    >
      <Coins className="h-3.5 w-3.5" />
      {isEmpty ? "0 credits" : `🪙 ${credits}`}
    </button>
  );
}
