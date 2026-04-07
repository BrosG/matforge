"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Filter,
  ExternalLink,
  FlaskConical,
  TrendingUp,
  Clock,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/api";
import { DOMAIN_LABELS, type Domain } from "@/types/campaign";

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [domainFilter, setDomainFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["explore", page, domainFilter, searchQuery],
    queryFn: () =>
      api.explore.list(
        page,
        20,
        domainFilter || undefined,
        searchQuery || undefined
      ),
    placeholderData: (prev) => prev,
  });

  const campaigns = data?.campaigns || [];
  const totalPages = data ? Math.ceil(data.total / 20) : 0;

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero */}
      <section className="pt-28 pb-12 bg-gradient-to-b from-blue-50/50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl font-bold mb-3">
              Explore <span className="gradient-text">Campaigns</span>
            </h1>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              Browse completed materials discovery campaigns. No sign-up required.
            </p>
          </motion.div>

          {/* Search & filter */}
          <div className="flex flex-col sm:flex-row gap-3 mt-8 max-w-2xl mx-auto">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={domainFilter}
                onChange={(e) => {
                  setDomainFilter(e.target.value);
                  setPage(1);
                }}
                className="pl-10 pr-8 py-2.5 border rounded-xl bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
              >
                <option value="">All Domains</option>
                {Object.entries(DOMAIN_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Campaign cards */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-72 rounded-2xl" />
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-16">
              <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
              <p className="text-gray-500">
                Could not load campaigns. Make sure the backend is running.
              </p>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <FlaskConical className="h-10 w-10 mx-auto mb-3 text-gray-300" />
              <p>No completed campaigns found.</p>
              <p className="text-sm mt-1">
                Run a campaign from the dashboard to see it here.
              </p>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns.map((c, i) => (
                  <motion.div
                    key={c.id}
                    className="bg-white rounded-2xl border p-6 card-hover"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <Badge variant="completed">{c.status}</Badge>
                      <span className="text-xs text-gray-400">
                        {DOMAIN_LABELS[c.domain as Domain] || c.domain}
                      </span>
                    </div>

                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                      {c.name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                      {c.description || "No description"}
                    </p>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="text-center p-2 bg-gray-50 rounded-lg">
                        <TrendingUp className="h-4 w-4 mx-auto text-blue-500 mb-1" />
                        <div className="text-sm font-semibold">
                          {c.pareto_size}
                        </div>
                        <div className="text-[10px] text-gray-400">Pareto</div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded-lg">
                        <FlaskConical className="h-4 w-4 mx-auto text-purple-500 mb-1" />
                        <div className="text-sm font-semibold">
                          {c.total_evaluated}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          Evaluated
                        </div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded-lg">
                        <Clock className="h-4 w-4 mx-auto text-amber-500 mb-1" />
                        <div className="text-sm font-semibold">
                          {c.wall_time_seconds
                            ? `${c.wall_time_seconds.toFixed(1)}s`
                            : "-"}
                        </div>
                        <div className="text-[10px] text-gray-400">Time</div>
                      </div>
                    </div>

                    <Button
                      asChild
                      variant="outline"
                      className="w-full"
                      size="sm"
                    >
                      <Link href={`/explore/${c.id}`}>
                        View Details{" "}
                        <ExternalLink className="ml-2 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </motion.div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground px-3">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-3xl mx-auto px-4 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Want to Run Your Own Campaign?
          </h2>
          <p className="text-blue-100 mb-6">
            Create a free account and start discovering materials in minutes.
          </p>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-white text-white hover:bg-white hover:text-blue-600"
          >
            <Link href="/register">Get Started Free</Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
