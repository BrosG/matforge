"use client";

import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  TrendingUp,
  FlaskConical,
  Target,
  Clock,
  Layers,
  Trophy,
} from "lucide-react";
import { api } from "@/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DOMAIN_LABELS, type Domain } from "@/types/campaign";

function MetricCard({
  label,
  value,
  icon: Icon,
  gradient,
  delay = 0,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  gradient: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {label}
              </p>
              <p className="text-2xl font-bold mt-1">{value}</p>
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

export default function AnalyticsPage() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: () => api.campaigns.analytics(),
  });

  const sortedDomains = analytics
    ? Object.entries(analytics.domain_counts).sort((a, b) => b[1] - a[1])
    : [];

  const totalCampaigns = analytics?.total_campaigns || 0;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of your materials discovery performance
        </p>
      </motion.div>

      {/* Metrics grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            label="Total Campaigns"
            value={totalCampaigns}
            icon={FlaskConical}
            gradient="from-blue-500 to-cyan-500"
            delay={0}
          />
          <MetricCard
            label="Materials Evaluated"
            value={(analytics?.total_evaluated || 0).toLocaleString()}
            icon={Layers}
            gradient="from-purple-500 to-violet-500"
            delay={0.05}
          />
          <MetricCard
            label="Pareto Solutions"
            value={analytics?.total_pareto || 0}
            icon={Target}
            gradient="from-emerald-500 to-teal-500"
            delay={0.1}
          />
          <MetricCard
            label="Avg. Campaign Time"
            value={
              analytics?.avg_wall_time
                ? `${analytics.avg_wall_time.toFixed(1)}s`
                : "-"
            }
            icon={Clock}
            gradient="from-amber-500 to-orange-500"
            delay={0.15}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Domain distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-500" />
              Campaigns by Domain
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-8" />
                ))}
              </div>
            ) : sortedDomains.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No campaigns yet. Create one to see analytics.
              </p>
            ) : (
              <div className="space-y-3">
                {sortedDomains.map(([domain, count]) => {
                  const pct =
                    totalCampaigns > 0
                      ? (count / totalCampaigns) * 100
                      : 0;
                  return (
                    <div key={domain}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-medium">
                          {DOMAIN_LABELS[domain as Domain] || domain}
                        </span>
                        <span className="text-muted-foreground">
                          {count} ({pct.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full">
                        <motion.div
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Campaign status breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              Campaign Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : totalCampaigns === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No campaigns yet.
              </p>
            ) : (
              <div className="space-y-3">
                {[
                  {
                    label: "Completed",
                    count: analytics?.completed_campaigns || 0,
                    variant: "completed" as const,
                    color: "text-emerald-600",
                  },
                  {
                    label: "Running",
                    count: analytics?.running_campaigns || 0,
                    variant: "running" as const,
                    color: "text-blue-600",
                  },
                  {
                    label: "Pending",
                    count:
                      totalCampaigns -
                      (analytics?.completed_campaigns || 0) -
                      (analytics?.running_campaigns || 0) -
                      (analytics?.failed_campaigns || 0),
                    variant: "pending" as const,
                    color: "text-gray-600",
                  },
                  {
                    label: "Failed",
                    count: analytics?.failed_campaigns || 0,
                    variant: "failed" as const,
                    color: "text-red-600",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant={item.variant}>{item.label}</Badge>
                    </div>
                    <span className={`text-lg font-bold ${item.color}`}>
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent campaigns */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            Recent Campaigns
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : !analytics?.recent_campaigns?.length ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Complete a campaign to see it here.
            </p>
          ) : (
            <div className="space-y-2">
              {analytics.recent_campaigns.map((c, i) => (
                <div
                  key={c.id}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      i === 0
                        ? "bg-amber-100 text-amber-700"
                        : i === 1
                        ? "bg-gray-100 text-gray-600"
                        : i === 2
                        ? "bg-orange-100 text-orange-700"
                        : "bg-gray-50 text-gray-400"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {DOMAIN_LABELS[c.domain as Domain] || c.domain}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={c.status as "completed" | "running" | "pending" | "failed"}>
                      {c.status}
                    </Badge>
                    {c.pareto_size > 0 && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {c.pareto_size} Pareto solutions
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
