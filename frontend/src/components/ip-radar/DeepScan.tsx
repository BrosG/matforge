"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rocket,
  Shield,
  Brain,
  Download,
  Clock,
  CheckCircle,
  Loader2,
  X,
  Mail,
  Zap,
  FileText,
  Target,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DeepScanProps {
  query: string;
  className?: string;
  userCredits?: number | null;
  onRequestPurchase?: () => void;
}

interface ScanStatus {
  scan_id: string;
  status: "queued" | "searching" | "analyzing" | "generating" | "completed" | "failed";
  progress: number;
  patents_found: number;
  patents_analyzed: number;
  estimated_remaining_seconds: number | null;
  error?: string;
}

interface DirectiveFinding {
  patent_id: string;
  title: string;
  directive_relevance: number;
  explanation: string;
  assignee: string;
  filing_date: string;
}

interface ScanResults {
  scan_id: string;
  query: string;
  directive: string;
  executive_summary: string;
  directive_findings: DirectiveFinding[];
  fto_assessment: string;
  white_spaces: { domain: string; description: string; confidence: number }[];
  total_patents_analyzed: number;
  completed_at: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.matcraft.ai/api/v1";

const ESTIMATED_TIMES: Record<number, string> = {
  500: "~5 min",
  1000: "~12 min",
  2000: "~20 min",
  5000: "~45 min",
  10000: "~70 min",
  15000: "~90 min",
};

function estimateTime(n: number): string {
  const thresholds = [500, 1000, 2000, 5000, 10000, 15000];
  for (let i = 0; i < thresholds.length; i++) {
    if (n <= thresholds[i]) return ESTIMATED_TIMES[thresholds[i]];
  }
  return ESTIMATED_TIMES[15000];
}

const STATUS_LABELS: Record<string, string> = {
  queued: "Queued",
  searching: "Searching",
  analyzing: "Analyzing",
  generating: "Generating report",
  completed: "Completed",
  failed: "Failed",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token") || null;
}

export default function DeepScan({ query, className, userCredits, onRequestPurchase }: DeepScanProps) {
  // --- State ---
  const [showModal, setShowModal] = useState(false);
  const [directive, setDirective] = useState("");
  const [maxPatents, setMaxPatents] = useState(2000);
  const [email, setEmail] = useState("");
  const [launching, setLaunching] = useState(false);
  const [scanId, setScanId] = useState<string | null>(null);
  const [status, setStatus] = useState<ScanStatus | null>(null);
  const [polling, setPolling] = useState(false);
  const [results, setResults] = useState<ScanResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creditsCharged, setCreditsCharged] = useState<number | null>(null);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Compute credit cost for display
  const creditCost = Math.max(1, Math.floor(maxPatents / 100));
  const hasEnoughCredits = userCredits == null || userCredits >= creditCost;

  // --- Polling logic ---
  const stopPolling = useCallback(() => {
    setPolling(false);
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const fetchStatus = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`${API_BASE}/deep-scan/${id}/status`);
        if (!res.ok) throw new Error("Failed to fetch status");
        const data: ScanStatus = await res.json();
        setStatus(data);

        if (data.status === "completed") {
          stopPolling();
          // Fetch results
          const dlRes = await fetch(`${API_BASE}/deep-scan/${id}/download`);
          if (dlRes.ok) {
            const dlData: ScanResults = await dlRes.json();
            setResults(dlData);
          }
        } else if (data.status === "failed") {
          stopPolling();
          setError(data.error || "Scan failed unexpectedly.");
        }
      } catch {
        // Keep polling — transient error
      }
    },
    [stopPolling],
  );

  const startPolling = useCallback(
    (id: string) => {
      setPolling(true);
      fetchStatus(id);
      pollingRef.current = setInterval(() => fetchStatus(id), 5000);
    },
    [fetchStatus],
  );

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // --- Launch handler ---
  const handleLaunch = async () => {
    if (!query.trim() || !directive.trim()) return;
    setLaunching(true);
    setError(null);

    try {
      const token = getToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/deep-scan/launch`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          query: query.trim(),
          directive: directive.trim(),
          max_patents: maxPatents,
          email: email.trim() || undefined,
        }),
      });

      if (res.status === 402) {
        setError(`Insufficient credits. You need ${creditCost} credits for this scan.`);
        onRequestPurchase?.();
        setLaunching(false);
        return;
      }
      if (res.status === 401) {
        setError("Authentication required. Please sign in to launch a Deep Scan.");
        setLaunching(false);
        return;
      }
      if (!res.ok) throw new Error("Failed to launch deep scan");

      const data = await res.json();
      const id = data.scan_id;
      setCreditsCharged(data.credits_charged ?? null);
      setScanId(id);
      setStatus({
        scan_id: id,
        status: "queued",
        progress: 0,
        patents_found: 0,
        patents_analyzed: 0,
        estimated_remaining_seconds: null,
      });
      setShowModal(false);
      startPolling(id);
    } catch {
      setError("Failed to launch scan. Please try again.");
    } finally {
      setLaunching(false);
    }
  };

  // --- Download handler ---
  const handleDownload = () => {
    if (!results) return;
    const blob = new Blob([JSON.stringify(results, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `deep-scan-${results.scan_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- Helpers ---
  const formatRemaining = (seconds: number | null): string => {
    if (!seconds) return "Estimating...";
    if (seconds < 60) return `${seconds}s remaining`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s remaining`;
  };

  if (!query.trim()) return null;

  // =========================================================================
  // Render
  // =========================================================================
  return (
    <div className={cn("w-full", className)}>
      {/* ----------------------------------------------------------------- */}
      {/* 1. Launch Button (always visible when no active scan) */}
      {/* ----------------------------------------------------------------- */}
      {!scanId && !results && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-indigo-200 dark:border-indigo-800/50 bg-gradient-to-br from-indigo-50 via-purple-50 to-indigo-50 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-indigo-950/40 p-6 shadow-sm"
        >
          {/* Decorative glow */}
          <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-purple-300/20 dark:bg-purple-500/10 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 h-32 w-32 rounded-full bg-indigo-300/20 dark:bg-indigo-500/10 blur-3xl" />

          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25">
                <Rocket className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Deep Scan
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  Analyze <span className="font-semibold">ALL</span> patents
                  with your custom research directive
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5"
            >
              <Rocket className="h-4 w-4" />
              Launch Deep Scan
            </button>
          </div>
        </motion.div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* 2. Launch Modal */}
      {/* ----------------------------------------------------------------- */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => !launching && setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.4 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700/50"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                      Deep Scan
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Bespoke IP Intelligence
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  disabled={launching}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                {/* Query display */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50">
                  <Target className="h-4 w-4 text-indigo-500 shrink-0" />
                  <span className="text-sm text-gray-600 dark:text-gray-300 truncate">
                    Query: <strong>{query}</strong>
                  </span>
                </div>

                {/* Research Directive */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5">
                    Your Research Context (Custom Directive)
                  </label>
                  <textarea
                    value={directive}
                    onChange={(e) => setDirective(e.target.value)}
                    rows={5}
                    placeholder="e.g., We are developing graphene-coated LiFePO4 cathodes using low-temperature CVD. Flag any prior art related to carbon coatings deposited below 200°C on olivine structures."
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all resize-none"
                  />
                  <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                    The AI will evaluate every patent against your specific
                    research goal — like having a patent attorney who understands
                    your exact lab work.
                  </p>
                </div>

                {/* Max Patents slider */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-900 dark:text-white">
                      Maximum Patents to Analyze
                    </label>
                    <span className="text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {maxPatents.toLocaleString()}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={500}
                    max={15000}
                    step={500}
                    value={maxPatents}
                    onChange={(e) => setMaxPatents(Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none bg-gray-200 dark:bg-gray-700 accent-indigo-600 cursor-pointer"
                  />
                  <div className="flex justify-between mt-1 text-xs text-gray-400">
                    <span>500</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {estimateTime(maxPatents)}
                    </span>
                    <span>15,000</span>
                  </div>
                </div>

                {/* Email input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5">
                    Notification Email{" "}
                    <span className="font-normal text-gray-400">(optional)</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                {/* Credit cost indicator */}
                <div className={cn(
                  "flex items-center gap-2 px-4 py-3 rounded-xl border",
                  hasEnoughCredits
                    ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50"
                    : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50"
                )}>
                  <Zap className={cn(
                    "h-4 w-4 shrink-0",
                    hasEnoughCredits
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-red-600 dark:text-red-400"
                  )} />
                  <div className="text-sm">
                    <span className={cn(
                      "font-semibold",
                      hasEnoughCredits
                        ? "text-amber-700 dark:text-amber-400"
                        : "text-red-700 dark:text-red-400"
                    )}>
                      {creditCost} credit{creditCost !== 1 ? "s" : ""}
                    </span>
                    {userCredits != null && (
                      <span className="text-gray-500 dark:text-gray-400 ml-2">
                        (you have {userCredits})
                      </span>
                    )}
                    {!hasEnoughCredits && (
                      <button
                        onClick={() => onRequestPurchase?.()}
                        className="ml-2 text-blue-600 dark:text-blue-400 underline font-medium"
                      >
                        Buy more
                      </button>
                    )}
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-sm text-red-700 dark:text-red-400">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-100 dark:border-gray-800">
                <button
                  onClick={handleLaunch}
                  disabled={launching || !directive.trim() || !hasEnoughCredits}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white shadow-lg transition-all duration-200",
                    directive.trim() && !launching && hasEnoughCredits
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30"
                      : "bg-gray-300 dark:bg-gray-700 cursor-not-allowed shadow-none",
                  )}
                >
                  {launching ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Launching...
                    </>
                  ) : !hasEnoughCredits ? (
                    <>
                      Need {creditCost} credits, you have {userCredits ?? 0}
                    </>
                  ) : (
                    <>
                      <Rocket className="h-4 w-4" />
                      Launch Deep Scan — {creditCost} credit{creditCost !== 1 ? "s" : ""} — Analyze{" "}
                      {maxPatents.toLocaleString()} Patents
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ----------------------------------------------------------------- */}
      {/* 3. Active Scan Tracker */}
      {/* ----------------------------------------------------------------- */}
      {scanId && status && status.status !== "completed" && !results && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-indigo-200 dark:border-indigo-800/50 bg-white dark:bg-gray-800/60 p-6 shadow-sm"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                <Brain className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Deep Scan in Progress
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                    {scanId}
                  </span>
                  {creditsCharged != null && creditsCharged > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-medium">
                      Charged {creditsCharged} credit{creditsCharged !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {status.status !== "failed" && (
              <div className="flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 font-medium">
                <Loader2 className="h-4 w-4 animate-spin" />
                {STATUS_LABELS[status.status] || status.status}
                <span className="inline-flex">
                  <span className="animate-pulse">.</span>
                  <span className="animate-pulse" style={{ animationDelay: "0.2s" }}>.</span>
                  <span className="animate-pulse" style={{ animationDelay: "0.4s" }}>.</span>
                </span>
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="h-2.5 w-full rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                initial={{ width: 0 }}
                animate={{ width: `${status.progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              <span>{status.progress}% complete</span>
              <span>{formatRemaining(status.estimated_remaining_seconds)}</span>
            </div>
          </div>

          {/* Counters */}
          <div className="grid grid-cols-2 gap-3">
            <div className="px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/50">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Patents Found
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {status.patents_found.toLocaleString()}
              </p>
            </div>
            <div className="px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/50">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Patents Analyzed
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {status.patents_analyzed.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Error state */}
          {status.status === "failed" && (
            <div className="mt-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-sm text-red-700 dark:text-red-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {status.error || "Scan failed. Please try again."}
            </div>
          )}
        </motion.div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* 4. Results Panel */}
      {/* ----------------------------------------------------------------- */}
      {results && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Executive Summary */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/60 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                <Brain className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Deep Scan Executive Summary
              </h2>
              <span className="ml-auto text-xs font-mono px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                {results.total_patents_analyzed.toLocaleString()} patents
                analyzed
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              {results.executive_summary}
            </p>
          </div>

          {/* Directive-Specific Findings */}
          <div className="rounded-2xl border border-purple-200 dark:border-purple-800/50 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/20 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400">
                <Target className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Directive-Specific Findings
              </h2>
            </div>
            <p className="text-sm text-purple-700 dark:text-purple-300 mb-4 italic">
              Analysis aligned with your directive: &ldquo;{results.directive}
              &rdquo;
            </p>

            {results.directive_findings.length > 0 ? (
              <div className="space-y-3">
                {results.directive_findings
                  .sort((a, b) => b.directive_relevance - a.directive_relevance)
                  .map((finding, i) => (
                    <div
                      key={finding.patent_id || i}
                      className="px-4 py-3 rounded-xl bg-white/70 dark:bg-gray-800/60 border border-purple-100 dark:border-purple-800/30"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                              {finding.patent_id}
                            </span>
                            <span className="text-xs px-1.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-medium">
                              {Math.round(finding.directive_relevance * 100)}%
                              relevant
                            </span>
                          </div>
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {finding.title}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {finding.assignee} &middot; {finding.filing_date}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">
                        {finding.explanation}
                      </p>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No directive-specific findings identified.
              </p>
            )}
          </div>

          {/* FTO Assessment */}
          {results.fto_assessment && (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/60 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                  <Shield className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Freedom-to-Operate Assessment
                </h2>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {results.fto_assessment}
              </p>
            </div>
          )}

          {/* White Spaces */}
          {results.white_spaces.length > 0 && (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/60 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                  <FileText className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  White Spaces (Directive-Aware)
                </h2>
              </div>
              <div className="space-y-3">
                {results.white_spaces.map((ws, i) => (
                  <div
                    key={i}
                    className="px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/50"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {ws.domain}
                      </h4>
                      <span className="text-xs px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-medium">
                        {Math.round(ws.confidence * 100)}% confidence
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {ws.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Download Button */}
          <div className="flex justify-center">
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:shadow-xl"
            >
              <Download className="h-4 w-4" />
              Download Results (JSON)
            </button>
          </div>

          {/* Completed badge */}
          <div className="flex items-center justify-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="h-4 w-4" />
            Deep Scan completed &middot;{" "}
            {results.total_patents_analyzed.toLocaleString()} patents analyzed
          </div>
        </motion.div>
      )}
    </div>
  );
}
