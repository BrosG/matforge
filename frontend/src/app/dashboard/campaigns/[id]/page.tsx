"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Play,
  Download,
  FileJson,
  Clock,
  Layers,
  Target,
  Beaker,
  Trophy,
  Activity,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BarChart3,
  TrendingUp,
  Zap,
  Search,
  Copy,
  Check,
} from "lucide-react";
import { api } from "@/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { formatDate, formatDuration } from "@/lib/utils";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { DOMAIN_LABELS, type Domain, type MaterialRecord } from "@/types/campaign";
import { ParetoChart } from "@/components/dashboard/ParetoChart";
import { RoundProgress } from "@/components/dashboard/RoundProgress";

const statusConfig = {
  pending: { color: "from-gray-400 to-gray-500", bg: "bg-gray-50", icon: Clock },
  running: { color: "from-blue-500 to-cyan-500", bg: "bg-blue-50", icon: Activity },
  completed: { color: "from-emerald-500 to-green-500", bg: "bg-emerald-50", icon: Trophy },
  failed: { color: "from-red-500 to-orange-500", bg: "bg-red-50", icon: Zap },
};

function StatCard({
  label,
  value,
  icon: Icon,
  gradient,
  subtitle,
  delay = 0,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  gradient: string;
  subtitle?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <Card className="overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {label}
              </p>
              <p className="text-2xl font-bold mt-1">{value}</p>
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
              )}
            </div>
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}
            >
              <Icon className="h-5 w-5 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function MaterialsTable({
  materials,
  allMaterials,
}: {
  materials: MaterialRecord[];
  allMaterials?: MaterialRecord[];
}) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string>("score");
  const [sortAsc, setSortAsc] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (materials.length === 0) return null;

  const propKeys = Object.keys(materials[0].properties);

  const displayMaterials = showAll && allMaterials ? allMaterials : materials;

  const filtered = displayMaterials.filter((m) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      m.source.toLowerCase().includes(s) ||
      m.score.toFixed(4).includes(s) ||
      Object.entries(m.properties).some(
        ([k, v]) => k.toLowerCase().includes(s) || v.toFixed(4).includes(s)
      )
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    let aVal: number, bVal: number;
    if (sortKey === "score") {
      aVal = a.score;
      bVal = b.score;
    } else if (sortKey === "round") {
      aVal = a.round_number;
      bVal = b.round_number;
    } else {
      aVal = a.properties[sortKey] ?? 0;
      bVal = b.properties[sortKey] ?? 0;
    }
    return sortAsc ? aVal - bVal : bVal - aVal;
  });

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const SortIcon = ({ col }: { col: string }) => {
    if (sortKey !== col) return null;
    return sortAsc ? (
      <ChevronUp className="h-3 w-3 inline ml-0.5" />
    ) : (
      <ChevronDown className="h-3 w-3 inline ml-0.5" />
    );
  };

  const copyComposition = (m: MaterialRecord) => {
    const text = JSON.stringify(m.properties, null, 2);
    navigator.clipboard.writeText(text);
    setCopiedId(m.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg">
              {showAll ? "All Materials" : "Pareto-Optimal Materials"}
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              {sorted.length} / {displayMaterials.length}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-blue-100 w-44"
              />
            </div>
            {allMaterials && allMaterials.length > materials.length && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAll(!showAll)}
                className="text-xs"
              >
                {showAll ? "Pareto Only" : "Show All"}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-y bg-gray-50/50">
              <th className="text-left p-3 font-medium text-muted-foreground text-xs w-12">
                #
              </th>
              <th
                className="text-left p-3 font-medium text-muted-foreground text-xs cursor-pointer hover:text-gray-900 transition-colors"
                onClick={() => handleSort("score")}
              >
                Score <SortIcon col="score" />
              </th>
              {propKeys.map((key) => (
                <th
                  key={key}
                  className="text-left p-3 font-medium text-muted-foreground text-xs cursor-pointer hover:text-gray-900 transition-colors"
                  onClick={() => handleSort(key)}
                >
                  {key.replace(/_/g, " ")} <SortIcon col={key} />
                </th>
              ))}
              <th
                className="text-left p-3 font-medium text-muted-foreground text-xs cursor-pointer hover:text-gray-900 transition-colors"
                onClick={() => handleSort("round")}
              >
                Round <SortIcon col="round" />
              </th>
              <th className="text-left p-3 font-medium text-muted-foreground text-xs">
                Source
              </th>
              <th className="p-3 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {sorted.slice(0, 100).map((m, i) => (
              <motion.tr
                key={m.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className={`hover:bg-blue-50/30 transition-colors ${
                  !m.dominated ? "" : "opacity-60"
                }`}
              >
                <td className="p-3 text-muted-foreground text-xs">{i + 1}</td>
                <td className="p-3">
                  <span
                    className={`font-mono font-semibold text-xs ${
                      !m.dominated ? "text-blue-600" : "text-gray-500"
                    }`}
                  >
                    {m.score.toFixed(4)}
                  </span>
                </td>
                {propKeys.map((key) => (
                  <td key={key} className="p-3 font-mono text-xs">
                    {m.properties[key]?.toFixed(4)}
                  </td>
                ))}
                <td className="p-3 text-xs text-muted-foreground">
                  {m.round_number}
                </td>
                <td className="p-3">
                  <Badge
                    variant={
                      m.source === "physics"
                        ? "default"
                        : m.source === "surrogate"
                        ? "secondary"
                        : "pending"
                    }
                    className="text-[10px] px-1.5 py-0"
                  >
                    {m.source}
                  </Badge>
                </td>
                <td className="p-3">
                  <button
                    onClick={() => copyComposition(m)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="Copy properties"
                  >
                    {copiedId === m.id ? (
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {sorted.length > 100 && (
          <div className="text-center py-3 text-xs text-muted-foreground border-t">
            Showing first 100 of {sorted.length} materials
          </div>
        )}
      </div>
    </Card>
  );
}

function ObjectiveRadar({ materials }: { materials: MaterialRecord[] }) {
  if (materials.length === 0) return null;
  const propKeys = Object.keys(materials[0].properties);
  if (propKeys.length < 3) return null;

  // Compute min/max for normalization
  const ranges = propKeys.map((key) => {
    const vals = materials.map((m) => m.properties[key]);
    return { min: Math.min(...vals), max: Math.max(...vals) };
  });

  // Take top 5 materials by score
  const top = [...materials].sort((a, b) => b.score - a.score).slice(0, 5);

  const size = 200;
  const center = size / 2;
  const radius = 75;
  const angleStep = (2 * Math.PI) / propKeys.length;

  const colors = [
    "rgba(59,130,246,0.7)",
    "rgba(147,51,234,0.7)",
    "rgba(16,185,129,0.7)",
    "rgba(245,158,11,0.7)",
    "rgba(239,68,68,0.7)",
  ];

  const getPoint = (value: number, rangeIdx: number, angleIdx: number) => {
    const range = ranges[rangeIdx];
    const norm =
      range.max === range.min
        ? 0.5
        : (value - range.min) / (range.max - range.min);
    const angle = angleIdx * angleStep - Math.PI / 2;
    return {
      x: center + radius * norm * Math.cos(angle),
      y: center + radius * norm * Math.sin(angle),
    };
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-purple-500" />
          Objective Radar
        </CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center">
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-xs">
          {/* Grid circles */}
          {[0.25, 0.5, 0.75, 1].map((r) => (
            <circle
              key={r}
              cx={center}
              cy={center}
              r={radius * r}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="0.5"
            />
          ))}
          {/* Axis lines and labels */}
          {propKeys.map((key, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const x2 = center + radius * Math.cos(angle);
            const y2 = center + radius * Math.sin(angle);
            const lx = center + (radius + 18) * Math.cos(angle);
            const ly = center + (radius + 18) * Math.sin(angle);
            return (
              <g key={key}>
                <line
                  x1={center}
                  y1={center}
                  x2={x2}
                  y2={y2}
                  stroke="#e2e8f0"
                  strokeWidth="0.5"
                />
                <text
                  x={lx}
                  y={ly}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-[6px] fill-gray-500"
                >
                  {key.replace(/_/g, " ").slice(0, 12)}
                </text>
              </g>
            );
          })}
          {/* Material polygons */}
          {top.map((m, mi) => {
            const points = propKeys
              .map((key, ki) => {
                const pt = getPoint(m.properties[key], ki, ki);
                return `${pt.x},${pt.y}`;
              })
              .join(" ");
            return (
              <polygon
                key={mi}
                points={points}
                fill={colors[mi]}
                fillOpacity={0.15}
                stroke={colors[mi]}
                strokeWidth="1.5"
              />
            );
          })}
        </svg>
      </CardContent>
      <div className="px-6 pb-4 flex flex-wrap gap-3 justify-center">
        {top.map((m, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: colors[i] }}
            />
            <span className="text-muted-foreground">
              #{i + 1} ({m.score.toFixed(3)})
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function CampaignTimeline({
  createdAt,
  startedAt,
  completedAt,
}: {
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}) {
  const events = [
    { label: "Created", time: createdAt, done: true },
    { label: "Started", time: startedAt, done: !!startedAt },
    { label: "Completed", time: completedAt, done: !!completedAt },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-500" />
          Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-0">
          {events.map((event, i) => (
            <div key={event.label} className="flex items-start gap-3 pb-4 last:pb-0">
              <div className="flex flex-col items-center">
                <div
                  className={`w-3 h-3 rounded-full border-2 ${
                    event.done
                      ? "bg-blue-500 border-blue-500"
                      : "bg-white border-gray-300"
                  }`}
                />
                {i < events.length - 1 && (
                  <div
                    className={`w-0.5 h-8 ${
                      events[i + 1].done ? "bg-blue-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
              <div className="-mt-0.5">
                <p
                  className={`text-sm font-medium ${
                    event.done ? "text-gray-900" : "text-gray-400"
                  }`}
                >
                  {event.label}
                </p>
                {event.time && (
                  <p className="text-xs text-muted-foreground">
                    {formatDate(event.time)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: campaign, isLoading } = useQuery({
    queryKey: ["campaign", id],
    queryFn: () => api.campaigns.get(id),
    refetchInterval: (query) => {
      const data = query.state.data;
      return data?.status === "running" ? 3000 : false;
    },
  });

  const { data: results } = useQuery({
    queryKey: ["campaign-results", id],
    queryFn: () => api.campaigns.results(id),
    enabled: campaign?.status === "completed",
  });

  // WebSocket for real-time updates
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (campaign?.status !== "running") return;

    const wsUrl = `${(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000")
      .replace("http", "ws")
      .replace("/api/v1", "")}/api/v1/ws/campaign/${id}`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (
          data.type === "CAMPAIGN_COMPLETE" ||
          data.type === "CAMPAIGN_FAILED"
        ) {
          queryClient.invalidateQueries({ queryKey: ["campaign", id] });
          queryClient.invalidateQueries({
            queryKey: ["campaign-results", id],
          });
        }
      };

      return () => {
        ws.close();
      };
    } catch {
      // WebSocket not available
    }
  }, [campaign?.status, id, queryClient]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div>
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-40 mt-2" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-20"
      >
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
          <Target className="h-8 w-8 text-red-400" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Campaign Not Found</h2>
        <p className="text-muted-foreground text-sm mb-4">
          This campaign may have been deleted or you don&apos;t have access.
        </p>
        <Button variant="outline" asChild>
          <Link href="/dashboard/campaigns">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Campaigns
          </Link>
        </Button>
      </motion.div>
    );
  }

  const config = statusConfig[campaign.status] || statusConfig.pending;
  const StatusIcon = config.icon;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Campaigns", href: "/dashboard/campaigns" },
          { label: campaign.name },
        ]}
      />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start gap-4"
      >
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold">{campaign.name}</h1>
            <Badge
              variant={campaign.status as "completed" | "running" | "failed" | "pending"}
              className="text-xs"
            >
              {campaign.status === "running" && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse mr-1.5 inline-block" />
              )}
              {campaign.status}
            </Badge>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-muted-foreground">
              {DOMAIN_LABELS[campaign.domain as Domain] || campaign.domain}
            </span>
            {campaign.description && (
              <>
                <span className="text-gray-300">|</span>
                <span className="text-sm text-muted-foreground">
                  {campaign.description}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {campaign.status === "pending" && (
            <Button
              variant="gradient"
              onClick={async () => {
                await api.campaigns.run(id, {
                  budget: campaign.config?.budget || 500,
                  rounds: campaign.config?.rounds || 15,
                });
                queryClient.invalidateQueries({ queryKey: ["campaign", id] });
              }}
            >
              <Play className="mr-2 h-4 w-4" />
              Run Campaign
            </Button>
          )}
          {campaign.status === "completed" && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={api.campaigns.export(id, "csv")}>
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  CSV
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href={api.campaigns.export(id, "json")}>
                  <FileJson className="mr-1.5 h-3.5 w-3.5" />
                  JSON
                </a>
              </Button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard
          label="Status"
          value={campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
          icon={StatusIcon}
          gradient={config.color}
          delay={0}
        />
        <StatCard
          label="Round"
          value={`${campaign.current_round}/${campaign.total_rounds}`}
          icon={Layers}
          gradient="from-violet-500 to-purple-500"
          subtitle={`${campaign.total_rounds - campaign.current_round} remaining`}
          delay={0.05}
        />
        <StatCard
          label="Evaluated"
          value={campaign.total_evaluated}
          icon={Beaker}
          gradient="from-amber-500 to-orange-500"
          subtitle="materials tested"
          delay={0.1}
        />
        <StatCard
          label="Pareto Size"
          value={campaign.pareto_size}
          icon={Target}
          gradient="from-emerald-500 to-teal-500"
          subtitle="optimal solutions"
          delay={0.15}
        />
        <StatCard
          label="Wall Time"
          value={formatDuration(campaign.wall_time_seconds)}
          icon={Clock}
          gradient="from-slate-500 to-gray-600"
          delay={0.2}
        />
      </div>

      {/* Progress for running campaigns */}
      <AnimatePresence>
        {campaign.status === "running" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <RoundProgress
              current={campaign.current_round}
              total={campaign.total_rounds}
              progress={campaign.progress}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Running animation */}
      {campaign.status === "running" && !results && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Card className="border-blue-100">
            <CardContent className="py-12 text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="mx-auto w-12 h-12 mb-4"
              >
                <Sparkles className="h-12 w-12 text-blue-500" />
              </motion.div>
              <h3 className="font-semibold text-lg mb-1">Optimizing Materials</h3>
              <p className="text-sm text-muted-foreground">
                Active learning round {campaign.current_round} of{" "}
                {campaign.total_rounds} in progress...
              </p>
              <Progress
                value={campaign.progress}
                className="h-2 mt-4 max-w-md mx-auto"
                indicatorClassName="bg-gradient-to-r from-blue-500 to-purple-500"
              />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Results section */}
      {results && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Summary banner */}
          <Card className="border-emerald-100 bg-gradient-to-r from-emerald-50/50 to-teal-50/50">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">Campaign Complete</h3>
                  <p className="text-sm text-muted-foreground">
                    Found {results.pareto_front.length} Pareto-optimal solutions
                    from {results.all_materials.length} evaluated materials
                    {campaign.wall_time_seconds
                      ? ` in ${formatDuration(campaign.wall_time_seconds)}`
                      : ""}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pareto chart */}
            {results.pareto_front.length > 0 && (
              <Card className="lg:col-span-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    Pareto Front
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ParetoChart
                    materials={results.pareto_front}
                    allMaterials={results.all_materials}
                  />
                </CardContent>
              </Card>
            )}

            {/* Objective radar */}
            <ObjectiveRadar materials={results.pareto_front} />
          </div>

          {/* Materials table */}
          <MaterialsTable
            materials={results.pareto_front}
            allMaterials={results.all_materials}
          />
        </motion.div>
      )}

      {/* Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <CampaignTimeline
            createdAt={campaign.created_at}
            startedAt={campaign.started_at}
            completedAt={campaign.completed_at}
          />
        </div>

        {/* Config summary */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Beaker className="h-4 w-4 text-amber-500" />
                Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  {
                    label: "Budget",
                    value: campaign.config?.budget || "Default",
                    desc: "Total evaluations",
                  },
                  {
                    label: "Rounds",
                    value: campaign.config?.rounds || "Default",
                    desc: "AL iterations",
                  },
                  {
                    label: "Surrogate Evals",
                    value: campaign.config?.surrogate_evals || "Auto",
                    desc: "Per round",
                  },
                  {
                    label: "Seed",
                    value: campaign.config?.seed ?? "Random",
                    desc: "Reproducibility",
                  },
                ].map((item) => (
                  <div key={item.label} className="text-center p-3 rounded-lg bg-gray-50/50">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="text-lg font-bold mt-0.5">{item.value}</p>
                    <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
