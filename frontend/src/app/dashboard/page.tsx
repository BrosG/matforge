"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  FlaskConical,
  TrendingUp,
  Atom,
  Clock,
  PlusCircle,
  ChevronRight,
  Layers,
  Target,
  Zap,
  BarChart3,
} from "lucide-react";
import { api } from "@/api";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { DOMAIN_LABELS, type Domain } from "@/types/campaign";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4 },
  }),
};

export default function DashboardPage() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["campaigns", "recent"],
    queryFn: () => api.campaigns.list(1, 5),
  });

  const campaigns = data?.campaigns || [];
  const total = data?.total || 0;
  const running = campaigns.filter((c) => c.status === "running").length;
  const completed = campaigns.filter((c) => c.status === "completed").length;
  const totalPareto = campaigns.reduce((sum, c) => sum + c.pareto_size, 0);

  const stats = [
    {
      label: "Total Campaigns",
      value: total,
      icon: FlaskConical,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Running",
      value: running,
      icon: Zap,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Completed",
      value: completed,
      icon: TrendingUp,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Pareto Materials",
      value: totalPareto,
      icon: Target,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  const quickActions = [
    {
      label: "New Campaign",
      desc: "Start a new materials discovery campaign",
      href: "/dashboard/campaigns/new",
      icon: PlusCircle,
      gradient: "from-blue-500 to-purple-500",
    },
    {
      label: "Browse Domains",
      desc: "Explore 16 material domain plugins",
      href: "/explore",
      icon: Layers,
      gradient: "from-green-500 to-emerald-500",
    },
    {
      label: "View Analytics",
      desc: "Campaign performance and trends",
      href: "/dashboard/analytics",
      icon: BarChart3,
      gradient: "from-amber-500 to-orange-500",
    },
  ];

  return (
    <div>
      {/* Welcome */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold">
          Welcome back
          {user?.name ? (
            <>, <span className="gradient-text">{user.name}</span></>
          ) : (
            ""
          )}
        </h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s an overview of your materials discovery campaigns.
        </p>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial="hidden"
            animate="visible"
            custom={i}
            variants={fadeUp}
          >
            <Card className="card-hover">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                    {isLoading ? (
                      <Skeleton className="h-9 w-16 mt-1" />
                    ) : (
                      <p className="text-3xl font-bold mt-1">{s.value}</p>
                    )}
                  </div>
                  <div
                    className={`w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center`}
                  >
                    <s.icon className={`h-6 w-6 ${s.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Campaigns - 2/3 width */}
        <motion.div
          className="lg:col-span-2"
          initial="hidden"
          animate="visible"
          custom={4}
          variants={fadeUp}
        >
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg">Recent Campaigns</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard/campaigns">
                  View all <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-48 mb-2" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : campaigns.length === 0 ? (
                <div className="text-center py-12">
                  <Atom className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">
                    No campaigns yet. Start your first one!
                  </p>
                  <Button asChild variant="gradient" size="sm">
                    <Link href="/dashboard/campaigns/new">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Create Campaign
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {campaigns.map((c) => (
                    <Link
                      key={c.id}
                      href={`/dashboard/campaigns/${c.id}`}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                        <FlaskConical className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate group-hover:text-blue-600 transition-colors">
                          {c.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {DOMAIN_LABELS[c.domain as Domain] || c.domain} &middot;{" "}
                          {formatDate(c.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {c.status === "running" && (
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                            <span className="text-xs text-blue-600 font-medium">
                              {c.progress}%
                            </span>
                          </div>
                        )}
                        <Badge variant={c.status as "completed" | "running" | "failed" | "pending"}>
                          {c.status}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions - 1/3 width */}
        <motion.div
          className="space-y-4"
          initial="hidden"
          animate="visible"
          custom={5}
          variants={fadeUp}
        >
          <h3 className="text-lg font-semibold px-1">Quick Actions</h3>
          {quickActions.map((action) => (
            <Link key={action.label} href={action.href}>
              <Card className="card-hover group cursor-pointer">
                <CardContent className="p-4 flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform`}
                  >
                    <action.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{action.label}</p>
                    <p className="text-xs text-muted-foreground">{action.desc}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300 ml-auto flex-shrink-0 group-hover:text-gray-500 group-hover:translate-x-1 transition-all" />
                </CardContent>
              </Card>
            </Link>
          ))}

          {/* Engine info */}
          <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Atom className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-sm">MATERIA Engine</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Surrogate MLP + CMA-ES optimizer + Active Learning loop with
                MC Dropout uncertainty. Zero GPU required.
              </p>
              <div className="flex gap-2 mt-3">
                <span className="px-2 py-0.5 rounded-full bg-white/80 text-[10px] font-medium text-gray-600">
                  NumPy-only
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white/80 text-[10px] font-medium text-gray-600">
                  16 Domains
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white/80 text-[10px] font-medium text-gray-600">
                  NSGA-II
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
