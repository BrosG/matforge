"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw, X } from "lucide-react";
import { cn } from "@/lib/utils";

const CHECK_INTERVAL = 60_000; // Poll every 60 seconds
const VERSION_ENDPOINT = "/api/version";

/**
 * VersionGuard — detects new deployments and prompts users to refresh.
 *
 * How it works:
 * 1. On mount, fetches /api/version to get the current build ID
 * 2. Every 60 seconds, re-fetches /api/version
 * 3. If the build ID changes → a new deploy happened → show update banner
 * 4. User clicks "Update now" → hard reload with cache bust
 *
 * This is the same pattern used by GitHub, Vercel, and Google Workspace.
 */
export function VersionGuard() {
  const [initialVersion, setInitialVersion] = useState<string | null>(null);
  const [newVersionAvailable, setNewVersionAvailable] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const fetchVersion = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch(VERSION_ENDPOINT, { cache: "no-store" });
      if (!res.ok) return null;
      const data = await res.json();
      return data.version || null;
    } catch {
      return null;
    }
  }, []);

  // Get initial version on mount
  useEffect(() => {
    fetchVersion().then((v) => {
      if (v) setInitialVersion(v);
    });
  }, [fetchVersion]);

  // Poll for new versions
  useEffect(() => {
    if (!initialVersion) return;

    const interval = setInterval(async () => {
      const current = await fetchVersion();
      if (current && current !== initialVersion && current !== "unknown" && current !== "dev") {
        setNewVersionAvailable(true);
      }
    }, CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [initialVersion, fetchVersion]);

  const handleUpdate = () => {
    // Force hard reload, bypassing all caches
    if ("caches" in window) {
      caches.keys().then((names) => {
        names.forEach((name) => caches.delete(name));
      });
    }
    window.location.reload();
  };

  if (!newVersionAvailable || dismissed) return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 left-1/2 -translate-x-1/2 z-[100]",
        "flex items-center gap-3 px-4 py-3 rounded-xl",
        "bg-primary text-primary-foreground shadow-2xl shadow-primary/20",
        "animate-in fade-in slide-in-from-bottom-4 duration-300",
        "max-w-md w-[calc(100%-2rem)]"
      )}
    >
      <RefreshCw className="h-4 w-4 flex-shrink-0 animate-spin" style={{ animationDuration: "3s" }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">New version available</p>
        <p className="text-xs opacity-80">Click to load the latest updates.</p>
      </div>
      <button
        onClick={handleUpdate}
        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/20 hover:bg-white/30 transition-colors flex-shrink-0"
      >
        Update now
      </button>
      <button
        onClick={() => setDismissed(true)}
        className="p-1 rounded hover:bg-white/20 transition-colors flex-shrink-0"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/**
 * VersionBadge — small footer badge showing the current build version.
 * Clicking it forces a hard refresh.
 */
export function VersionBadge({ className }: { className?: string }) {
  const [version, setVersion] = useState<string>("...");

  useEffect(() => {
    fetch(VERSION_ENDPOINT, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setVersion(d.version?.slice(0, 8) || "dev"))
      .catch(() => setVersion("dev"));
  }, []);

  return (
    <button
      onClick={() => window.location.reload()}
      className={cn(
        "inline-flex items-center gap-1.5 text-[10px] font-mono",
        "text-muted-foreground/60 hover:text-muted-foreground transition-colors",
        "cursor-pointer",
        className
      )}
      title="Click to force refresh and load the latest version"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
      v{version}
    </button>
  );
}
