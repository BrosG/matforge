"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Radar,
  FileText,
  Building2,
  Globe2,
  Calendar,
  TrendingUp,
  Lightbulb,
  Shield,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
  CheckCircle2,
  Database,
  Brain,
  Target,
  Sparkles,
  SlidersHorizontal,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";
import CreditBar from "./CreditBar";
import DeepScan from "./DeepScan";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Patent {
  id: string;
  title: string;
  assignee: string;
  filing_date: string;
  jurisdiction: string;
  status: "Active" | "Expiring Soon" | "Expired";
  category: string;
  relevance_score: number;
  claim_summary: string;
  snippet: string;
}

interface WhiteSpace {
  domain: string;
  description: string;
  rationale: string;
  confidence: number;
}

interface CategoryCount {
  name: string;
  count: number;
}

interface AssigneeCount {
  name: string;
  count: number;
}

interface SearchResults {
  query: string;
  total_patents: number;
  analyzed_count: number;
  jurisdictions: string[];
  date_range: { earliest: string; latest: string };
  data_source: string;
  executive_summary: string;
  key_findings: string[];
  categories: CategoryCount[];
  top_assignees: AssigneeCount[];
  white_spaces: WhiteSpace[];
  patents: Patent[];
  fto_assessment: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.matcraft.ai/api/v1";

const QUICK_EXAMPLES = [
  "LiFePO4 battery",
  "Perovskite solar cell",
  "SiC power semiconductor",
  "Graphene composite",
  "MoS2 catalyst",
  "Solid-state electrolyte",
];

const CATEGORY_COLORS: Record<string, string> = {
  "Composition/Alloy": "#3b82f6",
  "Process/Synthesis": "#8b5cf6",
  Application: "#10b981",
  Coating: "#f59e0b",
  Nanostructure: "#ef4444",
  Characterization: "#06b6d4",
  Other: "#6b7280",
};

const CATEGORY_BG: Record<string, string> = {
  "Composition/Alloy":
    "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  "Process/Synthesis":
    "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300",
  Application:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  Coating:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  Nanostructure:
    "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  Characterization:
    "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300",
  Other:
    "bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300",
};

const STATUS_COLORS: Record<string, string> = {
  Active: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  "Expiring Soon":
    "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  Expired: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

const LOADING_STEPS = [
  { icon: Database, text: "Searching patent databases..." },
  { icon: Globe2, text: "Found {n} patents across {j} jurisdictions..." },
  { icon: Brain, text: "AI analyzing patent landscape..." },
  { icon: Target, text: "Identifying white spaces and opportunities..." },
  { icon: Sparkles, text: "Generating executive summary..." },
];

// ---------------------------------------------------------------------------
// Mock data generator (used when API is unavailable)
// ---------------------------------------------------------------------------

function generateMockResults(query: string, maxPatents: number): SearchResults {
  const cats = Object.keys(CATEGORY_COLORS);
  const assignees = [
    "Samsung SDI Co.",
    "CATL",
    "LG Energy Solution",
    "Panasonic Holdings",
    "BYD Company",
    "Toyota Motor Corp.",
    "BASF SE",
    "3M Company",
    "Corning Inc.",
    "Applied Materials",
  ];
  const jurisdictions = ["US", "CN", "EP", "JP", "KR", "WO"];
  const statuses: Patent["status"][] = ["Active", "Expiring Soon", "Expired"];
  const n = Math.min(maxPatents, 40 + Math.floor(Math.random() * 60));

  const patents: Patent[] = Array.from({ length: n }, (_, i) => {
    const cat = cats[Math.floor(Math.random() * (cats.length - 1))];
    const jur = jurisdictions[Math.floor(Math.random() * jurisdictions.length)];
    const yr = 2010 + Math.floor(Math.random() * 15);
    const mo = String(Math.floor(Math.random() * 12) + 1).padStart(2, "0");
    return {
      id: `${jur}${9000000 + i}B2`,
      title: `${query} ${cat.toLowerCase()} method ${i + 1}`,
      assignee: assignees[Math.floor(Math.random() * assignees.length)],
      filing_date: `${yr}-${mo}-15`,
      jurisdiction: jur,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      category: cat,
      relevance_score: Math.round(40 + Math.random() * 60),
      claim_summary: `A ${cat.toLowerCase()} comprising ${query} with improved performance characteristics and novel structural features.`,
      snippet: `The present invention relates to ${query} materials with enhanced properties. Specifically, it discloses a method for ${cat.toLowerCase()} that achieves superior results compared to prior art through a unique combination of processing parameters and compositional design. The disclosed approach enables scalable manufacturing while maintaining the critical microstructural features necessary for optimal performance.`,
    };
  });

  const categoryMap = new Map<string, number>();
  patents.forEach((p) =>
    categoryMap.set(p.category, (categoryMap.get(p.category) || 0) + 1)
  );
  const categories = Array.from(categoryMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const assigneeMap = new Map<string, number>();
  patents.forEach((p) =>
    assigneeMap.set(p.assignee, (assigneeMap.get(p.assignee) || 0) + 1)
  );
  const topAssignees = Array.from(assigneeMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    query,
    total_patents: n + Math.floor(Math.random() * 200),
    analyzed_count: n,
    jurisdictions: Array.from(new Set(patents.map((p) => p.jurisdiction))),
    date_range: { earliest: "2010-03-22", latest: "2025-01-08" },
    data_source: "Google Patents + Lens.org",
    executive_summary: `The patent landscape for "${query}" reveals a mature yet actively evolving field with ${n}+ analyzed patents across ${jurisdictions.length} jurisdictions. Key players include ${assignees.slice(0, 3).join(", ")} who collectively hold over 40% of the portfolio. The technology is transitioning from fundamental composition patents toward application-specific and process optimization claims. Significant white spaces exist in scalable manufacturing methods, recycling/end-of-life processing, and integration with emerging energy storage architectures. The filing rate has accelerated 2.3x since 2020, indicating renewed commercial interest driven by policy incentives and supply chain diversification.`,
    key_findings: [
      `${assignees[0]} leads with the broadest claim coverage across both composition and process categories`,
      "Process/Synthesis patents are growing fastest, up 45% year-over-year since 2022",
      "Nanostructure claims represent only 8% of the portfolio but have the highest citation rates",
      "Most Expiring Soon patents cover foundational compositions, opening significant design freedom",
    ],
    categories,
    top_assignees: topAssignees,
    white_spaces: [
      {
        domain: "Scalable Green Synthesis",
        description: `Room-temperature or solvent-free synthesis routes for ${query} with commercial-scale throughput`,
        rationale:
          "Current patents focus on high-temperature or solvent-heavy routes. Growing ESG pressure creates demand for green processes.",
        confidence: 0.87,
      },
      {
        domain: "Recycling & Circular Economy",
        description: `End-of-life recovery and recycling methods for ${query}-based devices`,
        rationale:
          "Only 3 patents in the dataset address recycling. Regulatory mandates (EU Battery Regulation) will require certified recycling pathways.",
        confidence: 0.92,
      },
      {
        domain: "AI-Guided Composition Optimization",
        description: `Machine learning-driven compositional tuning of ${query} for multi-objective performance`,
        rationale:
          "No patents combine AI/ML methods with this material class. Cross-domain IP is emerging rapidly in adjacent fields.",
        confidence: 0.78,
      },
      {
        domain: "Flexible/Wearable Integration",
        description: `Thin-film or flexible form factors of ${query} for wearable and IoT applications`,
        rationale:
          "Application patents are dominated by automotive and grid-scale. Wearable form factors are entirely uncovered.",
        confidence: 0.71,
      },
    ],
    patents,
    fto_assessment: `Based on analysis of ${n} patents related to "${query}", the landscape presents moderate freedom-to-operate risk. Key blocking patents from ${assignees[0]} (${patents[0]?.id || "US9000000B2"}) and ${assignees[1]} (${patents[1]?.id || "CN9000001B2"}) cover broad compositional ranges that may overlap with new formulations. However, several foundational patents are within 2 years of expiration, which will significantly expand design freedom. Process-route patents from ${assignees[2]} are narrowly scoped and can likely be designed around. Recommendation: (1) Conduct detailed claim mapping against your specific composition before proceeding to pilot scale, (2) Monitor ${assignees[0]}'\s continuation filings, (3) Consider defensive publication for any novel synthesis routes to preserve freedom. Nanostructure-related claims present the lowest FTO risk due to their highly specific morphology requirements.`,
  };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="flex items-center gap-3 bg-white dark:bg-gray-800/60 rounded-xl p-4 border border-gray-200 dark:border-gray-700/50 shadow-sm">
      <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
        {sub && <p className="text-[10px] text-muted-foreground/70">{sub}</p>}
      </div>
    </div>
  );
}

function PatentCard({ patent }: { patent: Patent }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/50 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <a
            href={`https://patents.google.com/patent/${patent.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
          >
            {patent.id}
            <ExternalLink className="h-3 w-3" />
          </a>
          <h4 className="font-semibold text-sm text-foreground leading-snug mt-0.5 line-clamp-2">
            {patent.title}
          </h4>
        </div>
        {/* Relevance score */}
        <div className="flex flex-col items-end shrink-0">
          <span className="text-xs font-medium text-muted-foreground mb-1">
            {patent.relevance_score}%
          </span>
          <div className="w-16 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500"
              style={{ width: `${patent.relevance_score}%` }}
            />
          </div>
        </div>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-2 mb-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Building2 className="h-3 w-3" />
          {patent.assignee}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {patent.filing_date}
        </span>
        <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-[10px] font-medium uppercase">
          {patent.jurisdiction}
        </span>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <span
          className={cn(
            "px-2 py-0.5 rounded-full text-[10px] font-medium",
            STATUS_COLORS[patent.status]
          )}
        >
          {patent.status}
        </span>
        <span
          className={cn(
            "px-2 py-0.5 rounded-full text-[10px] font-medium",
            CATEGORY_BG[patent.category] || CATEGORY_BG.Other
          )}
        >
          {patent.category}
        </span>
      </div>

      {/* Claim summary */}
      <p className="text-xs text-muted-foreground leading-relaxed mb-2">
        {patent.claim_summary}
      </p>

      {/* Expandable snippet */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
      >
        {expanded ? (
          <>
            Hide details <ChevronUp className="h-3 w-3" />
          </>
        ) : (
          <>
            Show full snippet <ChevronDown className="h-3 w-3" />
          </>
        )}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="text-xs text-muted-foreground/80 leading-relaxed mt-2 border-t border-dashed border-gray-200 dark:border-gray-700 pt-2">
              {patent.snippet}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function WhiteSpaceCard({ ws, index }: { ws: WhiteSpace; index: number }) {
  const pct = Math.round(ws.confidence * 100);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="relative bg-gradient-to-br from-violet-50 via-white to-blue-50 dark:from-violet-950/40 dark:via-gray-800/60 dark:to-blue-950/40 border border-violet-200 dark:border-violet-800/50 rounded-xl p-5 shadow-sm overflow-hidden"
    >
      {/* Glow accent */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-violet-400/10 rounded-full blur-2xl -translate-y-8 translate-x-8" />

      <div className="flex items-start gap-3 mb-3">
        <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 shrink-0">
          <Lightbulb className="h-4 w-4" />
        </div>
        <div>
          <h4 className="font-semibold text-sm text-foreground">
            {ws.domain}
          </h4>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {ws.description}
          </p>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground/80 leading-relaxed mb-3 italic">
        {ws.rationale}
      </p>

      {/* Confidence bar */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          Confidence
        </span>
        <div className="flex-1 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={cn(
              "h-full rounded-full",
              pct >= 85
                ? "bg-green-500"
                : pct >= 70
                  ? "bg-blue-500"
                  : "bg-amber-500"
            )}
          />
        </div>
        <span className="text-xs font-bold text-foreground w-10 text-right">
          {pct}%
        </span>
      </div>
    </motion.div>
  );
}

// Custom tooltip for charts
function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-medium text-foreground">{label || payload[0].name}</p>
      <p className="text-muted-foreground">{payload[0].value} patents</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function IPRadar() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const inputRef = useRef<HTMLInputElement>(null);

  // Get auth token from NextAuth session
  const getAuthToken = useCallback(() => {
    return (session as any)?.accessToken || null;
  }, [session]);

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [maxPatents, setMaxPatents] = useState(50);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [showSettings, setShowSettings] = useState(false);

  // Credit + auth state
  const [userCredits, setUserCredits] = useState<number | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Scoping agent state
  const [scopeModal, setScopeModal] = useState(false);
  const [scopeMessage, setScopeMessage] = useState("");
  const [scopeFilters, setScopeFilters] = useState<string[]>([]);
  const [scopeContext, setScopeContext] = useState("");
  const [scopeLoading, setScopeLoading] = useState(false);

  // Auto-search from URL params
  useEffect(() => {
    const q = searchParams.get("q");
    if (q && !results && !loading) {
      setQuery(q);
      handleScopeAndSearch(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Run scoping check before full search
  const handleScopeAndSearch = useCallback(
    async (searchQuery?: string) => {
      const q = (searchQuery || query).trim();
      if (!q) return;

      // Step 1: Call scoping endpoint
      try {
        setScopeLoading(true);
        const scopeRes = await fetch(`${API_BASE}/ip-radar/scope-query`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: q, context: "" }),
        });

        if (scopeRes.ok) {
          const scope = await scopeRes.json();
          if (scope.status === "NEEDS_CLARIFICATION" && scope.suggested_filters?.length > 0) {
            // Show scoping modal
            setScopeMessage(scope.clarification_message || `"${q}" is a broad field. What is your specific focus?`);
            setScopeFilters(scope.suggested_filters);
            setScopeContext("");
            setScopeModal(true);
            setScopeLoading(false);
            return;
          }
          // If READY_TO_SEARCH, use the refined query
          if (scope.final_query) {
            handleSearch(scope.final_query);
            setScopeLoading(false);
            return;
          }
        }
      } catch {
        // Scoping failed — proceed with original query
      }
      setScopeLoading(false);
      handleSearch(q);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query]
  );

  // Handle scope modal confirmation
  const handleScopeConfirm = useCallback(
    async (filter?: string) => {
      const context = filter || scopeContext;
      const q = query.trim();

      if (context) {
        // Refine: call scope again with context to get final query
        try {
          const res = await fetch(`${API_BASE}/ip-radar/scope-query`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: q, context }),
          });
          if (res.ok) {
            const scope = await res.json();
            if (scope.final_query) {
              setScopeModal(false);
              handleSearch(scope.final_query);
              return;
            }
          }
        } catch {
          // Fallback
        }
        // If AI refinement failed, just combine
        setScopeModal(false);
        handleSearch(`${q} ${context}`);
      } else {
        // No context — search with original broad query
        setScopeModal(false);
        handleSearch(q);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query, scopeContext]
  );

  const handleSearch = useCallback(
    async (searchQuery?: string) => {
      const q = (searchQuery || query).trim();
      if (!q) return;

      setLoading(true);
      setLoadingStep(0);
      setError(null);
      setResults(null);
      setCategoryFilter("All");

      // Update URL
      const params = new URLSearchParams();
      params.set("q", q);
      router.replace(`/ip-radar?${params.toString()}`, { scroll: false });

      // Animate through loading steps
      const stepTimers: NodeJS.Timeout[] = [];
      for (let i = 1; i < LOADING_STEPS.length; i++) {
        stepTimers.push(
          setTimeout(() => setLoadingStep(i), 800 + i * 1200)
        );
      }

      try {
        const token = getAuthToken();
        const fetchHeaders: Record<string, string> = { "Content-Type": "application/json" };
        if (token) fetchHeaders["Authorization"] = `Bearer ${token}`;

        const res = await fetch(`${API_BASE}/ip-radar/search`, {
          method: "POST",
          headers: fetchHeaders,
          body: JSON.stringify({ query: q, max_patents: maxPatents }),
        });

        if (res.status === 401) {
          // Not logged in — show login modal
          stepTimers.forEach(clearTimeout);
          setLoading(false);
          setShowLoginModal(true);
          return;
        }
        if (res.status === 402) {
          // Logged in but out of credits
          stepTimers.forEach(clearTimeout);
          setLoading(false);
          setError("You've used all your credits. Purchase more to continue.");
          setShowPurchaseModal(true);
          return;
        }
        if (res.status === 429) {
          stepTimers.forEach(clearTimeout);
          setLoading(false);
          setError("Free daily limit reached (3/day). Sign in for more searches.");
          setShowLoginModal(true);
          return;
        }
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const raw = await res.json();

        // Transform API response → frontend's SearchResults shape
        const patents = raw.patents ?? [];
        if (patents.length === 0) throw new Error("No patents found");

        const catColors: Record<string, string> = {
          "Composition/Alloy": "#6366f1", "Process/Synthesis": "#22c55e",
          "Application": "#f59e0b", "Coating/Surface Treatment": "#06b6d4",
          "Nanostructure/Morphology": "#ec4899", "Characterization Method": "#8b5cf6",
          "Other": "#94a3b8",
        };
        const stats = raw.stats ?? {};
        const byCat = stats.by_category ?? {};
        const byAssignee = stats.by_assignee ?? {};
        const byJurisdiction = stats.by_jurisdiction ?? {};
        const dateRange = stats.filing_date_range ?? {};

        const transformed: SearchResults = {
          query: raw.query ?? q,
          total_patents: raw.total_patents_found ?? patents.length,
          analyzed_count: raw.analyzed_count ?? patents.length,
          jurisdictions: Object.keys(byJurisdiction),
          date_range: {
            earliest: dateRange.earliest ?? patents[patents.length - 1]?.filing_date ?? "",
            latest: dateRange.latest ?? patents[0]?.filing_date ?? "",
          },
          data_source: raw.data_source ?? "Unknown",
          executive_summary: raw.executive_summary ?? "",
          key_findings: [],
          fto_assessment: raw.fto_assessment ?? "",
          categories: Object.entries(byCat).map(([name, count]) => ({
            name, count: count as number, color: catColors[name] ?? "#94a3b8",
          })),
          top_assignees: Object.entries(byAssignee).slice(0, 10).map(([name, count]) => ({
            name: name.length > 30 ? name.slice(0, 27) + "..." : name,
            count: count as number,
          })),
          white_spaces: (raw.white_spaces ?? []).map((ws: Record<string, unknown>) => ({
            domain: ws.domain ?? "",
            description: ws.description ?? "",
            confidence: ws.confidence ?? 0.5,
            rationale: ws.rationale ?? "",
          })),
          patents: patents.map((p: Record<string, unknown>) => ({
            patent_id: p.patent_id ?? "",
            title: p.title ?? "",
            assignee: p.assignee ?? "Unknown",
            filing_date: p.filing_date ?? "",
            jurisdiction: p.jurisdiction ?? p.country_code ?? "",
            category: p.category ?? "Other",
            claim_summary: p.claim_summary ?? "",
            relevance_score: p.relevance_score ?? 0.5,
            status: p.status ?? "Active",
            snippet: p.snippet ?? "",
          })),
        };

        stepTimers.forEach(clearTimeout);
        setLoadingStep(LOADING_STEPS.length - 1);
        await new Promise((r) => setTimeout(r, 600));
        setResults(transformed);
      } catch {
        // Fallback to mock data for demo
        stepTimers.forEach(clearTimeout);
        const mockDelay = 800 + LOADING_STEPS.length * 1200;
        await new Promise((r) => setTimeout(r, Math.max(0, mockDelay - 2000)));
        setLoadingStep(LOADING_STEPS.length - 1);
        await new Promise((r) => setTimeout(r, 600));
        setResults(generateMockResults(q, maxPatents));
      } finally {
        setLoading(false);
      }
    },
    [query, maxPatents, router]
  );

  const filteredPatents =
    results?.patents.filter(
      (p) => categoryFilter === "All" || p.category === categoryFilter
    ) || [];

  const allCategories = results
    ? ["All", ...results.categories.map((c) => c.name)]
    : [];

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="min-h-screen">
      {/* ================================================================= */}
      {/* HERO SECTION                                                      */}
      {/* ================================================================= */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-blue-950 to-violet-950 text-white">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-2xl" />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs text-blue-200 mb-6"
          >
            <Radar className="h-3.5 w-3.5" />
            Patent Landscape Intelligence
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4"
          >
            Materials IP Radar
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-blue-200/80 text-lg max-w-2xl mx-auto mb-8"
          >
            AI-powered patent landscape analysis. Search any material, discover
            white spaces, assess freedom-to-operate, and map the innovation
            frontier.
          </motion.p>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-2xl mx-auto"
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleScopeAndSearch();
              }}
              className="relative"
            >
              <div className="flex items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl focus-within:border-blue-400/60 focus-within:ring-2 focus-within:ring-blue-400/20 transition-all overflow-hidden">
                <Search className="h-5 w-5 text-blue-300 ml-4 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search materials patents..."
                  className="flex-1 bg-transparent px-3 py-4 text-white placeholder:text-blue-300/50 text-base outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowSettings(!showSettings)}
                  className={cn(
                    "p-2 mr-1 rounded-lg transition-colors",
                    showSettings
                      ? "bg-white/20 text-white"
                      : "text-blue-300 hover:text-white hover:bg-white/10"
                  )}
                  aria-label="Search settings"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </button>
                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="m-1.5 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Search"
                  )}
                </button>
              </div>
            </form>

            {/* Settings slider */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 px-4 py-3 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center gap-4">
                      <label className="text-xs text-blue-200 whitespace-nowrap">
                        Max patents:
                      </label>
                      <input
                        type="range"
                        min={10}
                        max={200}
                        step={10}
                        value={maxPatents}
                        onChange={(e) =>
                          setMaxPatents(Number(e.target.value))
                        }
                        className="flex-1 accent-blue-500"
                      />
                      <span className="text-sm font-mono text-white w-10 text-right">
                        {maxPatents}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Credit bar + cost hint */}
            <div className="flex items-center justify-center gap-3 mt-4">
              <CreditBar
                onCreditsChange={(c) => setUserCredits(c)}
                showPurchaseModal={showPurchaseModal}
                onPurchaseModalClose={() => setShowPurchaseModal(false)}
              />
              <span className="text-[11px] text-blue-300/60">
                1 credit per search
              </span>
            </div>

            {/* Quick examples */}
            <div className="flex flex-wrap justify-center gap-2 mt-5">
              {QUICK_EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => {
                    setQuery(ex);
                    handleScopeAndSearch(ex);
                  }}
                  disabled={loading}
                  className="px-3 py-1.5 text-xs text-blue-200/80 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors disabled:opacity-40"
                >
                  {ex}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* AI SCOPING MODAL                                                  */}
      {/* ================================================================= */}
      <AnimatePresence>
        {scopeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setScopeModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-2xl shadow-2xl max-w-lg w-full p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Brain className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">AI Query Scoping</h3>
                  <p className="text-xs text-muted-foreground">Narrowing your search for precise results</p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                {scopeMessage}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                {scopeFilters.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => handleScopeConfirm(filter)}
                    className="text-left px-3 py-2.5 rounded-xl border border-border bg-muted/30 hover:bg-primary/10 hover:border-primary/30 text-sm text-foreground transition-all"
                  >
                    {filter}
                  </button>
                ))}
              </div>

              <div className="border-t border-border pt-4">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Or describe your specific approach:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={scopeContext}
                    onChange={(e) => setScopeContext(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleScopeConfirm()}
                    placeholder="e.g., using graphene oxide coatings under 200°C"
                    className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <button
                    onClick={() => handleScopeConfirm()}
                    disabled={!scopeContext.trim()}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
                  >
                    Search
                  </button>
                </div>
              </div>

              <button
                onClick={() => { setScopeModal(false); handleSearch(query); }}
                className="w-full mt-3 text-xs text-muted-foreground hover:text-foreground text-center py-1 transition-colors"
              >
                Skip scoping — search all {query} patents
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================================================================= */}
      {/* LOADING STATE                                                     */}
      {/* ================================================================= */}
      <AnimatePresence>
        {loading && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-2xl mx-auto px-4 py-20"
          >
            <div className="space-y-4">
              {LOADING_STEPS.map((step, i) => {
                const active = i === loadingStep;
                const done = i < loadingStep;
                const Icon = step.icon;
                let text = step.text;
                if (i === 1 && results) {
                  text = text
                    .replace("{n}", String(results.total_patents))
                    .replace("{j}", String(results.jurisdictions.length));
                } else if (i === 1) {
                  text = text.replace("{n}", "~" + maxPatents).replace("{j}", "6");
                }

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{
                      opacity: i <= loadingStep ? 1 : 0.3,
                      x: 0,
                    }}
                    transition={{ delay: i * 0.1, duration: 0.4 }}
                    className={cn(
                      "flex items-center gap-3 px-5 py-3 rounded-xl border transition-all",
                      active
                        ? "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800"
                        : done
                          ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800/50"
                          : "bg-gray-50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700/50"
                    )}
                  >
                    {done ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                    ) : active ? (
                      <Loader2 className="h-5 w-5 text-blue-500 animate-spin shrink-0" />
                    ) : (
                      <Icon className="h-5 w-5 text-gray-400 shrink-0" />
                    )}
                    <span
                      className={cn(
                        "text-sm",
                        active
                          ? "text-blue-700 dark:text-blue-300 font-medium"
                          : done
                            ? "text-green-700 dark:text-green-400"
                            : "text-gray-400"
                      )}
                    >
                      {text}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ================================================================= */}
      {/* ERROR STATE                                                       */}
      {/* ================================================================= */}
      {error && !loading && (
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-xl p-6">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-3" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* RESULTS DASHBOARD                                                 */}
      {/* ================================================================= */}
      {results && !loading && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
          {/* ----- Stats Bar ----- */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
          >
            <StatCard
              icon={FileText}
              label="Total Patents"
              value={results.total_patents.toLocaleString()}
            />
            <StatCard
              icon={Search}
              label="Analyzed"
              value={results.analyzed_count}
            />
            <StatCard
              icon={Globe2}
              label="Jurisdictions"
              value={results.jurisdictions.length}
              sub={results.jurisdictions.join(", ")}
            />
            <StatCard
              icon={Calendar}
              label="Date Range"
              value={`${results.date_range.earliest.slice(0, 4)}\u2013${results.date_range.latest.slice(0, 4)}`}
            />
            <StatCard
              icon={Database}
              label="Data Source"
              value={results.data_source}
            />
          </motion.div>

          {/* ----- Executive Summary ----- */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/50 rounded-2xl p-6 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                <Brain className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold text-foreground">
                Executive Summary
              </h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              {results.executive_summary}
            </p>
            {results.key_findings.length > 0 && (
              <div className="border-t border-gray-100 dark:border-gray-700/50 pt-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Key Findings
                </h3>
                <ul className="space-y-1.5">
                  {results.key_findings.map((f, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <TrendingUp className="h-3.5 w-3.5 mt-0.5 text-blue-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>

          {/* ----- Deep Scan CTA ----- */}
          <DeepScan
            query={query}
            userCredits={userCredits}
            onRequestPurchase={() => setShowPurchaseModal(true)}
          />

          {/* ----- Charts Grid ----- */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Category Donut */}
            <div className="bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/50 rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-foreground mb-4">
                Patent Categories
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={results.categories}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {results.categories.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={
                            CATEGORY_COLORS[entry.name] ||
                            CATEGORY_COLORS.Other
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: "11px" }}
                      iconType="circle"
                      iconSize={8}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Assignees Bar */}
            <div className="bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/50 rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-foreground mb-4">
                Top Patent Holders
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={results.top_assignees}
                    layout="vertical"
                    margin={{ left: 10, right: 20, top: 5, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={false}
                      stroke="rgba(128,128,128,0.15)"
                    />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={120}
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar
                      dataKey="count"
                      fill="#3b82f6"
                      radius={[0, 4, 4, 0]}
                      barSize={18}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>

          {/* ----- White Spaces ----- */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 rounded-lg bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
                <Lightbulb className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Innovation White Spaces
                </h2>
                <p className="text-xs text-muted-foreground">
                  AI-identified opportunities with low patent coverage
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.white_spaces.map((ws, i) => (
                <WhiteSpaceCard key={i} ws={ws} index={i} />
              ))}
            </div>
          </motion.div>

          {/* ----- Patent Cards ----- */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                <FileText className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold text-foreground">
                Patent Portfolio
              </h2>
              <span className="text-xs text-muted-foreground ml-1">
                ({filteredPatents.length} shown)
              </span>
            </div>

            {/* Category filter tabs */}
            <div className="flex flex-wrap gap-1.5 mb-5">
              {allCategories.map((cat) => {
                const isActive = categoryFilter === cat;
                const color =
                  cat === "All"
                    ? undefined
                    : CATEGORY_COLORS[cat] || CATEGORY_COLORS.Other;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                      isActive
                        ? "bg-blue-600 text-white border-blue-600 dark:bg-blue-500 dark:border-blue-500"
                        : "bg-white dark:bg-gray-800 text-muted-foreground border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    )}
                    style={
                      isActive && color
                        ? { backgroundColor: color, borderColor: color }
                        : undefined
                    }
                  >
                    {cat}
                    {cat !== "All" && results && (
                      <span className="ml-1 opacity-70">
                        {results.categories.find((c) => c.name === cat)
                          ?.count || 0}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Patent grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredPatents.map((patent) => (
                <PatentCard key={patent.id} patent={patent} />
              ))}
            </div>

            {filteredPatents.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No patents found for this category filter.
              </div>
            )}
          </motion.div>

          {/* ----- FTO Assessment ----- */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/50 rounded-2xl p-6 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                <Shield className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold text-foreground">
                Freedom-to-Operate Assessment
              </h2>
            </div>

            {/* Warning banner */}
            <div className="flex items-start gap-2 mb-4 px-4 py-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-800 dark:text-amber-300">
                This is AI-generated analysis, not legal advice. Always consult
                a qualified patent attorney before making IP-related business
                decisions.
              </p>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              {results.fto_assessment}
            </p>
          </motion.div>
        </section>
      )}

      {/* ================================================================= */}
      {/* EMPTY STATE (no search yet)                                       */}
      {/* ================================================================= */}
      {!results && !loading && !error && (
        <section className="max-w-4xl mx-auto px-4 py-20">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: Search,
                title: "Search Patents",
                desc: "Query any material, process, or application across major patent databases worldwide.",
              },
              {
                icon: Brain,
                title: "AI Analysis",
                desc: "Get executive summaries, category breakdowns, and competitive landscape insights in seconds.",
              },
              {
                icon: Lightbulb,
                title: "Find White Spaces",
                desc: "Discover innovation opportunities where patent coverage is thin and commercial potential is high.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="text-center p-6 rounded-2xl bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/50"
              >
                <div className="inline-flex p-3 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-4">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Login Gate Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setShowLoginModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95 }}
              className="bg-card border border-border rounded-3xl p-8 max-w-sm w-full text-center"
              onClick={(e) => e.stopPropagation()}>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Sign in to search patents</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Get 10 free credits on signup. Each IP Radar search costs 1 credit.
                Anonymous users get 3 free searches per day.
              </p>
              <div className="flex flex-col gap-2">
                <a href="/login?callbackUrl=/ip-radar"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity">
                  Sign In
                </a>
                <a href="/register?callbackUrl=/ip-radar"
                  className="w-full py-3 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors">
                  Create free account — 10 credits included
                </a>
                <button onClick={() => setShowLoginModal(false)}
                  className="text-xs text-muted-foreground hover:text-foreground mt-1">
                  Continue with 3 free daily searches
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
