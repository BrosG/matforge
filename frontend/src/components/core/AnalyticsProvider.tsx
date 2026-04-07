"use client";

import { useEffect } from "react";
import { initAnalytics } from "@/lib/firebase";

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initAnalytics();
  }, []);

  return <>{children}</>;
}
