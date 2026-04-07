"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  TrendingUp,
  FlaskConical,
  Clock,
  Layers,
  Trophy,
  Target,
  Sparkles,
  ArrowRight,
  Droplets,
  Battery,
  Sun,
  Wind,
  Atom,
  HardHat,
  Leaf,
  Sprout,
  Cpu,
  Shirt,
  Zap,
  Shield,
  Gem,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/api";
import { DOMAIN_LABELS, type Domain } from "@/types/campaign";

const DOMAIN_ICONS: Record<string, React.ElementType> = {
  water: Droplets,
  battery: Battery,
  solar: Sun,
  co2: Wind,
  catalyst: FlaskConical,
  hydrogen: Atom,
  construction: HardHat,
  bio: Leaf,
  agri: Sprout,
  electronics: Cpu,
  textile: Shirt,
  thermoelectric: Zap,
  superconductor: Atom,
  polymer: Layers,
  coating: Shield,
  ceramic: Gem,
};

const DOMAIN_GRADIENTS: Record<string, string> = {
  water: "from-blue-500 to-cyan-500",
  battery: "from-green-500 to-emerald-500",
  solar: "from-amber-500 to-yellow-500",
  co2: "from-teal-500 to-cyan-500",
  catalyst: "from-purple-500 to-violet-500",
  hydrogen: "from-indigo-500 to-blue-500",
  construction: "from-orange-500 to-red-500",
  bio: "from-lime-500 to-green-500",
  agri: "from-emerald-500 to-lime-500",
  electronics: "from-sky-500 to-blue-500",
  textile: "from-pink-500 to-rose-500",
  thermoelectric: "from-orange-500 to-red-500",
  superconductor: "from-sky-500 to-indigo-500",
  polymer: "from-violet-500 to-purple-500",
  coating: "from-slate-500 to-gray-600",
  ceramic: "from-rose-500 to-pink-500",
};

export default function ExploreDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["explore", id],
    queryFn: () => api.explore.get(id),
    enabled: !!id,
  });

  const campaign = data?.campaign;
  const paretoFront = data?.pareto_front || [];
  const allMaterials = data?.all_materials || [];

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <section className="pt-28 pb-12">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-6 w-96" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  if (isError || !campaign) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex flex-col items-center justify-center py-32">
          <AlertCircle className="h-12 w-12 text-red-300 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Campaign Not Found</h2>
          <p className="text-muted-foreground text-sm mb-6">
            This campaign doesn&apos;t exist or hasn&apos;t completed yet.
          </p>
          <Button asChild variant="outline">
            <Link href="/explore">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Explore
            </Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const DomainIcon = DOMAIN_ICONS[campaign.domain] || FlaskConical;
  const gradient =
    DOMAIN_GRADIENTS[campaign.domain] || "from-gray-500 to-gray-600";

  // Extract property keys from pareto materials for the table
  const propertyKeys =
    paretoFront.length > 0
      ? Object.keys(paretoFront[0].properties)
      : [];

  // Find best material (highest score in pareto)
  const bestMaterial = paretoFront.length > 0
    ? paretoFront.reduce((best, m) => (m.score > best.score ? m : best), paretoFront[0])
    : null;

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero */}
      <section className="pt-24 pb-12 bg-gradient-to-b from-blue-50/50 to-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Link
              href="/explore"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gray-900 mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Explore
            </Link>

            <div className="flex items-start gap-4">
              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg flex-shrink-0`}
              >
                <DomainIcon className="h-7 w-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl sm:text-3xl font-bold">
                    {campaign.name}
                  </h1>
                  <Badge variant="completed">Completed</Badge>
                </div>
                <p className="text-muted-foreground">
                  {DOMAIN_LABELS[campaign.domain as Domain] || campaign.domain}
                  {campaign.description && ` | ${campaign.description}`}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: "Pareto Solutions",
                value: campaign.pareto_size,
                icon: TrendingUp,
                color: "text-blue-600",
                bg: "bg-blue-50",
              },
              {
                label: "Materials Evaluated",
                value: campaign.total_evaluated,
                icon: FlaskConical,
                color: "text-purple-600",
                bg: "bg-purple-50",
              },
              {
                label: "Learning Rounds",
                value: campaign.total_rounds,
                icon: Layers,
                color: "text-amber-600",
                bg: "bg-amber-50",
              },
              {
                label: "Wall Time",
                value: campaign.wall_time_seconds
                  ? `${campaign.wall_time_seconds.toFixed(1)}s`
                  : "-",
                icon: Clock,
                color: "text-emerald-600",
                bg: "bg-emerald-50",
              },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardContent className="p-5 text-center">
                    <stat.icon
                      className={`h-6 w-6 mx-auto mb-2 ${stat.color}`}
                    />
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.label}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Best result banner */}
          {bestMaterial && (
            <Card className="border-emerald-100 bg-gradient-to-r from-emerald-50/50 to-teal-50/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                    <Trophy className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Best Result</h3>
                    <p className="text-xs text-muted-foreground">
                      Top-scoring material (score: {bestMaterial.score.toFixed(4)})
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {Object.entries(bestMaterial.properties).map(
                    ([key, value]) => (
                      <div key={key} className="bg-white rounded-lg p-3 border">
                        <p className="text-xs text-muted-foreground">
                          {key.replace(/_/g, " ")}
                        </p>
                        <p className="text-lg font-bold text-emerald-600 mt-0.5">
                          {typeof value === "number" ? value.toFixed(4) : String(value)}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Campaign config */}
          {campaign.config && Object.keys(campaign.config).length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Campaign Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(campaign.config).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                      >
                        <span className="text-sm font-medium">
                          {key.replace(/_/g, " ")}
                        </span>
                        <span className="text-sm text-muted-foreground font-mono">
                          {String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Optimization Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50">
                      <Target className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      <span className="text-sm font-medium">
                        {propertyKeys.length} objectives optimized
                      </span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50">
                      <Layers className="h-4 w-4 text-purple-500 flex-shrink-0" />
                      <span className="text-sm font-medium">
                        {allMaterials.length} total materials generated
                      </span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50">
                      <TrendingUp className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <span className="text-sm font-medium">
                        {paretoFront.length} non-dominated (Pareto-optimal)
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Pareto table */}
          {paretoFront.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  Pareto-Optimal Materials ({paretoFront.length})
                </CardTitle>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-y bg-gray-50/50">
                      <th className="text-left p-3 font-medium text-muted-foreground text-xs">
                        #
                      </th>
                      {propertyKeys.map((key) => (
                        <th
                          key={key}
                          className="text-left p-3 font-medium text-muted-foreground text-xs"
                        >
                          {key.replace(/_/g, " ")}
                        </th>
                      ))}
                      <th className="text-left p-3 font-medium text-muted-foreground text-xs">
                        Score
                      </th>
                      <th className="text-left p-3 font-medium text-muted-foreground text-xs">
                        Source
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {paretoFront
                      .sort((a, b) => b.score - a.score)
                      .map((m, idx) => (
                        <tr key={m.id} className="hover:bg-blue-50/30">
                          <td className="p-3">
                            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 inline-flex items-center justify-center text-xs font-bold">
                              {idx + 1}
                            </span>
                          </td>
                          {propertyKeys.map((key) => (
                            <td key={key} className="p-3 font-mono text-xs">
                              {m.properties[key] != null
                                ? typeof m.properties[key] === "number"
                                  ? m.properties[key].toFixed(4)
                                  : String(m.properties[key])
                                : "-"}
                            </td>
                          ))}
                          <td className="p-3 font-mono text-xs font-semibold text-blue-600">
                            {m.score.toFixed(4)}
                          </td>
                          <td className="p-3 text-xs text-muted-foreground">
                            {m.source}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* All materials summary by round */}
          {allMaterials.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Layers className="h-5 w-5 text-purple-500" />
                  Materials by Round
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Array.from(
                    new Set(allMaterials.map((m) => m.round_number))
                  )
                    .sort((a, b) => a - b)
                    .map((round) => {
                      const roundMats = allMaterials.filter(
                        (m) => m.round_number === round
                      );
                      const bestScore = Math.max(
                        ...roundMats.map((m) => m.score)
                      );
                      const paretoInRound = roundMats.filter(
                        (m) => !m.dominated
                      ).length;
                      return (
                        <div
                          key={round}
                          className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 inline-flex items-center justify-center text-xs font-bold">
                              R{round}
                            </span>
                            <span className="text-sm">
                              {roundMats.length} materials
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>
                              Best: <strong className="text-gray-900">{bestScore.toFixed(4)}</strong>
                            </span>
                            <span>
                              Pareto: <strong className="text-blue-600">{paretoInRound}</strong>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* CTA */}
          <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <CardContent className="p-8 text-center">
              <Sparkles className="h-8 w-8 text-blue-500 mx-auto mb-3" />
              <h3 className="text-xl font-bold mb-2">
                Run Your Own Campaign
              </h3>
              <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
                Create a free account and start optimizing materials with the
                same engine that produced these results.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Button asChild variant="gradient" size="lg">
                  <Link href="/register">
                    Get Started Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/explore">View More Campaigns</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
}
