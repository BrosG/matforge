"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { PlusCircle, Search, Filter, FlaskConical } from "lucide-react";
import { api } from "@/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatDuration } from "@/lib/utils";
import { DOMAIN_LABELS, type Domain } from "@/types/campaign";

export default function CampaignsListPage() {
  const [page, setPage] = useState(1);
  const [domainFilter, setDomainFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["campaigns", page, domainFilter, statusFilter],
    queryFn: () =>
      api.campaigns.list(page, 20, domainFilter || undefined, statusFilter || undefined),
  });

  const campaigns = data?.campaigns || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold">Campaigns</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {total} total campaign{total !== 1 ? "s" : ""}
          </p>
        </motion.div>
        <Button asChild variant="gradient">
          <Link href="/dashboard/campaigns/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Campaign
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={domainFilter}
                onChange={(e) => { setDomainFilter(e.target.value); setPage(1); }}
                className="pl-10 pr-6 py-2 border rounded-lg bg-background text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All Domains</option>
                {Object.entries(DOMAIN_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 border rounded-lg bg-background text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="running">Running</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50/50">
                <th className="text-left p-4 font-medium text-muted-foreground">Campaign</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Domain</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Progress</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Pareto</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Time</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="p-4"><Skeleton className="h-5 w-48" /></td>
                    <td className="p-4"><Skeleton className="h-5 w-24" /></td>
                    <td className="p-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                    <td className="p-4"><Skeleton className="h-5 w-12" /></td>
                    <td className="p-4"><Skeleton className="h-5 w-8" /></td>
                    <td className="p-4"><Skeleton className="h-5 w-16" /></td>
                    <td className="p-4"><Skeleton className="h-5 w-24" /></td>
                  </tr>
                ))
              ) : campaigns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center">
                    <FlaskConical className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-muted-foreground">No campaigns found</p>
                  </td>
                </tr>
              ) : (
                campaigns
                  .filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase()))
                  .map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4">
                        <Link
                          href={`/dashboard/campaigns/${c.id}`}
                          className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          {c.name}
                        </Link>
                      </td>
                      <td className="p-4 text-muted-foreground text-xs">
                        {DOMAIN_LABELS[c.domain as Domain] || c.domain}
                      </td>
                      <td className="p-4">
                        <Badge variant={c.status as "completed" | "running" | "failed" | "pending"}>
                          {c.status === "running" && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse mr-1.5 inline-block" />
                          )}
                          {c.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        {c.status === "running" ? (
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-gray-100 rounded-full">
                              <div
                                className="h-full bg-blue-500 rounded-full transition-all"
                                style={{ width: `${c.progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">{c.progress}%</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">{c.progress}%</span>
                        )}
                      </td>
                      <td className="p-4 font-mono text-xs">{c.pareto_size}</td>
                      <td className="p-4 text-muted-foreground text-xs">
                        {formatDuration(c.wall_time_seconds)}
                      </td>
                      <td className="p-4 text-muted-foreground text-xs">
                        {formatDate(c.created_at)}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span className="px-3 py-1.5 text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
