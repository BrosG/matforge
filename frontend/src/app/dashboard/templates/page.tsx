"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileCode2,
  Search,
  Heart,
  GitFork,
  Loader2,
  Plus,
  TrendingUp,
  Clock,
  ChevronRight,
  Share2,
  Users,
} from "lucide-react";
import { api } from "@/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { DOMAIN_LABELS, type Domain } from "@/types/campaign";
import type { Template } from "@/types/template";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4 },
  }),
};

const DOMAIN_COLORS: Record<string, string> = {
  water: "from-blue-500 to-cyan-500",
  battery: "from-green-500 to-emerald-500",
  solar: "from-amber-500 to-orange-500",
  co2: "from-teal-500 to-green-500",
  catalyst: "from-purple-500 to-violet-500",
  hydrogen: "from-sky-500 to-blue-500",
  construction: "from-stone-500 to-amber-600",
  bio: "from-rose-500 to-pink-500",
  agri: "from-lime-500 to-green-500",
  electronics: "from-indigo-500 to-blue-500",
  textile: "from-fuchsia-500 to-pink-500",
  thermoelectric: "from-red-500 to-orange-500",
  superconductor: "from-cyan-500 to-blue-500",
  polymer: "from-violet-500 to-purple-500",
  coating: "from-slate-500 to-gray-500",
  ceramic: "from-yellow-600 to-amber-500",
};

export default function TemplatesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [domain, setDomain] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"recent" | "popular">("popular");

  const { data, isLoading } = useQuery({
    queryKey: ["templates", page, domain, search, sort],
    queryFn: () =>
      api.templates.list(page, 20, domain || undefined, search || undefined, sort),
  });

  const likeMutation = useMutation({
    mutationFn: (id: string) => api.templates.like(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["templates"] }),
  });

  const forkMutation = useMutation({
    mutationFn: (id: string) => api.templates.fork(id),
    onSuccess: (data) => {
      router.push(`/dashboard/campaigns/${data.campaign_id}`);
    },
  });

  const templates = data?.templates || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              Template <span className="gradient-text">Marketplace</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Community-shared campaign definitions — fork, customize, and launch in seconds.
            </p>
          </div>
          <Button asChild variant="gradient">
            <Link href="/dashboard/campaigns/new">
              <Plus className="h-4 w-4 mr-2" />
              Publish Template
            </Link>
          </Button>
        </div>
      </motion.div>

      {/* Feature highlights */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        initial="hidden"
        animate="visible"
      >
        {[
          { icon: Share2, label: "Share", desc: "Publish your campaign configs for the community", gradient: "from-blue-500 to-cyan-500" },
          { icon: Heart, label: "Like", desc: "Upvote the best templates to surface quality", gradient: "from-red-400 to-pink-500" },
          { icon: GitFork, label: "Fork", desc: "One-click fork into a new campaign and customize", gradient: "from-purple-500 to-violet-500" },
        ].map((item, i) => (
          <motion.div key={item.label} custom={i} variants={fadeUp}>
            <Card className="card-hover">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md", item.gradient)}>
                  <item.icon className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div initial="hidden" animate="visible" custom={3} variants={fadeUp}>
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 border rounded-lg bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-colors"
                />
              </div>
              <select
                value={domain}
                onChange={(e) => {
                  setDomain(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2.5 border rounded-lg bg-gray-50/50 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white"
              >
                <option value="">All Domains</option>
                {Object.entries(DOMAIN_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <div className="flex border rounded-lg overflow-hidden">
                <button
                  onClick={() => setSort("popular")}
                  className={cn(
                    "px-4 py-2.5 text-sm flex items-center gap-1.5 transition-colors",
                    sort === "popular"
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "bg-white text-muted-foreground hover:bg-gray-50"
                  )}
                >
                  <TrendingUp className="h-3.5 w-3.5" />
                  Popular
                </button>
                <button
                  onClick={() => setSort("recent")}
                  className={cn(
                    "px-4 py-2.5 text-sm flex items-center gap-1.5 border-l transition-colors",
                    sort === "recent"
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "bg-white text-muted-foreground hover:bg-gray-50"
                  )}
                >
                  <Clock className="h-3.5 w-3.5" />
                  Recent
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Template grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-xl" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-40 mb-1.5" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <Card className="bg-gradient-to-br from-gray-50 to-purple-50/30 border-dashed">
          <CardContent className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-5 shadow-lg">
              <FileCode2 className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No templates yet
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Be the first to publish a campaign template! Share your YAML configurations so others can build on your work.
            </p>
            <Button asChild variant="gradient">
              <Link href="/dashboard/campaigns/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Template
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template: Template, idx: number) => (
            <motion.div
              key={template.id}
              initial="hidden"
              animate="visible"
              custom={idx % 6}
              variants={fadeUp}
            >
              <Link href={`/dashboard/templates/${template.id}`} className="block h-full">
                <Card className="h-full card-hover group">
                  <CardContent className="p-5">
                    {/* Domain color bar */}
                    <div className={cn(
                      "h-1 rounded-full bg-gradient-to-r mb-4 -mt-1",
                      DOMAIN_COLORS[template.domain] || "from-gray-400 to-gray-500"
                    )} />

                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                          {template.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {template.author_name || "Anonymous"}
                        </p>
                      </div>
                      {template.is_official && (
                        <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-[10px] ml-2 shadow-sm">
                          Official
                        </Badge>
                      )}
                    </div>

                    {template.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
                        {template.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-1.5 mb-4">
                      <Badge variant="outline" className="text-xs font-medium">
                        {DOMAIN_LABELS[template.domain as Domain] || template.domain}
                      </Badge>
                      {(template.tags || []).slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>

                    <div className="flex items-center gap-4 pt-3 border-t">
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); likeMutation.mutate(template.id); }}
                        className={cn(
                          "flex items-center gap-1.5 text-xs transition-colors",
                          template.liked_by_me ? "text-red-500" : "text-gray-400 hover:text-red-400"
                        )}
                      >
                        <Heart className={cn("h-3.5 w-3.5", template.liked_by_me && "fill-current")} />
                        {template.likes_count}
                      </button>
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); forkMutation.mutate(template.id); }}
                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-500 transition-colors"
                      >
                        <GitFork className="h-3.5 w-3.5" />
                        {template.forks_count}
                      </button>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(template.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
            Previous
          </Button>
          <span className="flex items-center px-3 text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
