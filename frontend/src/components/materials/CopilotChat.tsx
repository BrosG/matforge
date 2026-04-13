"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Send,
  X,
  Sparkles,
  Search,
  ArrowRightLeft,
  Download,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const API =
  process.env.NEXT_PUBLIC_API_URL || "https://api.matcraft.ai/api/v1";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CopilotChatProps {
  materialId?: string;
  materialFormula?: string;
  className?: string;
}

interface MaterialResult {
  id: string;
  formula: string;
  band_gap: number | null;
  formation_energy: number | null;
  energy_above_hull: number | null;
  crystal_system: string | null;
  is_stable: boolean;
  elements: string[];
  source_db: string;
}

interface NLResponse {
  interpretation: string;
  filters: Record<string, unknown>;
  results: MaterialResult[];
  total: number;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  response?: NLResponse;
  loading?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let _msgId = 0;
function nextId() {
  return `msg-${++_msgId}-${Date.now()}`;
}

function formatProp(v: number | null | undefined): string {
  if (v === undefined || v === null) return "--";
  return Number(v.toPrecision(4)).toString();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CopilotChat({
  materialId,
  materialFormula,
  className,
}: CopilotChatProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const sendQuery = useCallback(
    async (queryText: string) => {
      const trimmed = queryText.trim();
      if (!trimmed) return;

      const userMsg: ChatMessage = {
        id: nextId(),
        role: "user",
        text: trimmed,
      };
      const assistantMsg: ChatMessage = {
        id: nextId(),
        role: "assistant",
        text: "",
        loading: true,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setInput("");
      setSending(true);

      try {
        const res = await fetch(`${API}/nl/search`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: trimmed }),
        });

        if (!res.ok) {
          throw new Error(`Search failed (${res.status})`);
        }

        const data: NLResponse = await res.json();

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id
              ? {
                  ...m,
                  loading: false,
                  text: data.interpretation,
                  response: data,
                }
              : m,
          ),
        );
      } catch (err) {
        const errMsg =
          err instanceof Error ? err.message : "Something went wrong";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id
              ? { ...m, loading: false, text: `Error: ${errMsg}` }
              : m,
          ),
        );
      } finally {
        setSending(false);
      }
    },
    [],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendQuery(input);
  };

  const quickAction = (label: string) => {
    if (!materialFormula) return;
    const queries: Record<string, string> = {
      "Find similar": `materials similar to ${materialFormula}`,
      "Compare alternatives": `stable alternatives to ${materialFormula}`,
      "Export data": `properties of ${materialFormula}`,
    };
    sendQuery(queries[label] ?? label);
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className={cn("fixed bottom-6 right-6 z-50", className)}>
      {/* Floating trigger button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="fab"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setOpen(true)}
            className={cn(
              "flex items-center gap-2 rounded-full px-5 py-3 shadow-lg",
              "bg-blue-600 text-white hover:bg-blue-700 transition-colors",
              "dark:bg-blue-500 dark:hover:bg-blue-600",
            )}
          >
            <MessageCircle className="h-5 w-5" />
            <span className="text-sm font-medium">Co-pilot</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Slide-out chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={cn(
              "fixed bottom-0 right-0 top-0 w-full sm:w-[420px]",
              "flex flex-col",
              "bg-white border-l shadow-2xl",
              "dark:bg-gray-900 dark:border-gray-700",
            )}
          >
            {/* Header */}
            <div
              className={cn(
                "flex items-center justify-between px-5 py-4 border-b",
                "bg-gradient-to-r from-blue-600 to-indigo-600 text-white",
              )}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                <div>
                  <h2 className="text-sm font-semibold leading-tight">
                    Materials Co-pilot
                  </h2>
                  {materialFormula && (
                    <p className="text-xs text-blue-100 leading-tight mt-0.5">
                      Exploring {materialFormula}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 hover:bg-white/20 transition-colors"
                aria-label="Close co-pilot"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick actions */}
            {materialFormula && (
              <div className="flex gap-2 px-4 py-3 border-b dark:border-gray-700 overflow-x-auto">
                {["Find similar", "Compare alternatives", "Export data"].map(
                  (label) => (
                    <button
                      key={label}
                      onClick={() => quickAction(label)}
                      disabled={sending}
                      className={cn(
                        "flex items-center gap-1.5 whitespace-nowrap rounded-full",
                        "border px-3 py-1.5 text-xs font-medium",
                        "bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors",
                        "dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                      )}
                    >
                      {label === "Find similar" && (
                        <Search className="h-3 w-3" />
                      )}
                      {label === "Compare alternatives" && (
                        <ArrowRightLeft className="h-3 w-3" />
                      )}
                      {label === "Export data" && (
                        <Download className="h-3 w-3" />
                      )}
                      {label}
                    </button>
                  ),
                )}
              </div>
            )}

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
            >
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center px-6">
                  <Sparkles className="h-10 w-10 text-blue-400 mb-3" />
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Ask me about materials
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-[260px]">
                    Try &quot;stable semiconductor for solar cells with no
                    lead&quot; or &quot;hard cubic insulator&quot;
                  </p>
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex",
                    msg.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-br-md"
                        : "bg-gray-100 text-gray-800 rounded-bl-md dark:bg-gray-800 dark:text-gray-200",
                    )}
                  >
                    {/* Loading state */}
                    {msg.loading && (
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Searching...</span>
                      </div>
                    )}

                    {/* Interpretation text */}
                    {!msg.loading && msg.text && (
                      <p className="leading-relaxed">{msg.text}</p>
                    )}

                    {/* Results */}
                    {!msg.loading && msg.response && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          {msg.response.total} material
                          {msg.response.total !== 1 ? "s" : ""} found
                        </p>

                        {msg.response.results.slice(0, 5).map((mat) => (
                          <Link
                            key={mat.id}
                            href={`/materials/${mat.id}`}
                            className={cn(
                              "block rounded-xl border p-3 transition-colors",
                              "hover:border-blue-300 hover:bg-blue-50/50",
                              "dark:border-gray-600 dark:hover:border-blue-500 dark:hover:bg-gray-700/50",
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-sm">
                                {mat.formula}
                              </span>
                              <span
                                className={cn(
                                  "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                                  mat.is_stable
                                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                                )}
                              >
                                {mat.is_stable ? "Stable" : "Unstable"}
                              </span>
                            </div>
                            <div className="flex gap-3 mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                              {mat.band_gap !== null && (
                                <span>Eg: {formatProp(mat.band_gap)} eV</span>
                              )}
                              {mat.crystal_system && (
                                <span>{mat.crystal_system}</span>
                              )}
                              <span className="ml-auto text-gray-400">
                                {mat.source_db}
                              </span>
                            </div>
                          </Link>
                        ))}

                        {msg.response.total > 5 && (
                          <p className="text-xs text-center text-gray-400 dark:text-gray-500 pt-1">
                            +{msg.response.total - 5} more results
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Input area */}
            <form
              onSubmit={handleSubmit}
              className={cn(
                "flex items-center gap-2 border-t px-4 py-3",
                "dark:border-gray-700",
              )}
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={sending}
                placeholder="Ask about materials..."
                className={cn(
                  "flex-1 rounded-xl border px-4 py-2.5 text-sm",
                  "bg-white placeholder:text-gray-400",
                  "focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400",
                  "disabled:opacity-50",
                  "dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:placeholder:text-gray-500",
                  "dark:focus:ring-blue-800 dark:focus:border-blue-500",
                )}
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className={cn(
                  "flex items-center justify-center rounded-xl p-2.5",
                  "bg-blue-600 text-white hover:bg-blue-700 transition-colors",
                  "disabled:opacity-40 disabled:cursor-not-allowed",
                  "dark:bg-blue-500 dark:hover:bg-blue-600",
                )}
                aria-label="Send message"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
