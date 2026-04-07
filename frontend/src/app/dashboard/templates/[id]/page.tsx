"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Heart,
  GitFork,
  Loader2,
  Code2,
  Calendar,
  Rocket,
  Trash2,
  Copy,
  CheckCircle2,
  FileCode2,
  Shield,
  Users,
} from "lucide-react";
import { useState } from "react";
import { api } from "@/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { DOMAIN_LABELS, type Domain } from "@/types/campaign";

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

export default function TemplateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const templateId = params.id as string;
  const [copied, setCopied] = useState(false);

  const { data: template, isLoading } = useQuery({
    queryKey: ["template", templateId],
    queryFn: () => api.templates.get(templateId),
    enabled: !!templateId,
  });

  const likeMutation = useMutation({
    mutationFn: () => api.templates.like(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["template", templateId] });
    },
  });

  const forkMutation = useMutation({
    mutationFn: () => api.templates.fork(templateId),
    onSuccess: (data) => {
      router.push(`/dashboard/campaigns/${data.campaign_id}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.templates.delete(templateId),
    onSuccess: () => router.push("/dashboard/templates"),
  });

  const handleCopy = () => {
    if (template) {
      navigator.clipboard.writeText(template.definition_yaml);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl space-y-6">
        <Skeleton className="h-6 w-40" />
        <div className="space-y-3">
          <Skeleton className="h-10 w-96" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-2/3" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="text-center py-24">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-5">
          <FileCode2 className="h-8 w-8 text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Template not found</h2>
        <p className="text-muted-foreground mb-6">
          This template may have been removed or doesn&apos;t exist.
        </p>
        <Button variant="outline" asChild>
          <Link href="/dashboard/templates">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Marketplace
          </Link>
        </Button>
      </div>
    );
  }

  const isOwner = user?.email && template.author_id === user.email;
  const domainGradient = DOMAIN_COLORS[template.domain] || "from-gray-400 to-gray-500";
  const yamlLines = template.definition_yaml.split("\n").length;

  return (
    <div className="max-w-4xl">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Templates", href: "/dashboard/templates" },
          { label: template.name },
        ]}
      />

      {/* Header card */}
      <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp}>
        <Card className="mb-6 overflow-hidden">
          <div className={cn("h-2 bg-gradient-to-r", domainGradient)} />
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">{template.name}</h1>
                  {template.is_official && (
                    <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-sm">
                      <Shield className="h-3 w-3 mr-1" />
                      Official
                    </Badge>
                  )}
                </div>
                {template.description && (
                  <p className="text-muted-foreground leading-relaxed mb-4">{template.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-white">
                        {(template.author_name || "A")[0].toUpperCase()}
                      </span>
                    </div>
                    {template.author_name || "Anonymous"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(template.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </span>
                  <Badge variant="outline" className="font-medium">
                    {DOMAIN_LABELS[template.domain as Domain] || template.domain}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => likeMutation.mutate()}
                  className={cn("transition-colors", template.liked_by_me && "text-red-500 border-red-200 bg-red-50 hover:bg-red-100")}
                >
                  <Heart className={cn("h-4 w-4 mr-1.5", template.liked_by_me && "fill-current")} />
                  {template.likes_count}
                </Button>
                <Button variant="gradient" size="sm" onClick={() => forkMutation.mutate()} disabled={forkMutation.isPending}>
                  {forkMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  ) : (
                    <Rocket className="h-4 w-4 mr-1.5" />
                  )}
                  Use Template
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tags */}
      {template.tags && template.tags.length > 0 && (
        <motion.div className="flex flex-wrap gap-2 mb-6" initial="hidden" animate="visible" custom={1} variants={fadeUp}>
          {template.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="px-3 py-1">{tag}</Badge>
          ))}
        </motion.div>
      )}

      {/* Stats */}
      <motion.div className="grid grid-cols-3 gap-4 mb-6" initial="hidden" animate="visible" custom={2} variants={fadeUp}>
        <Card className="card-hover">
          <CardContent className="p-5 text-center">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center mx-auto mb-2">
              <Heart className="h-5 w-5 text-red-400" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{template.likes_count}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Community Likes</div>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-5 text-center">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-2">
              <GitFork className="h-5 w-5 text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{template.forks_count}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Campaign Forks</div>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-5 text-center">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center mx-auto mb-2">
              <Code2 className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{yamlLines}</div>
            <div className="text-xs text-muted-foreground mt-0.5">YAML Lines</div>
          </CardContent>
        </Card>
      </motion.div>

      {/* YAML Preview */}
      <motion.div initial="hidden" animate="visible" custom={3} variants={fadeUp}>
        <Card className="mb-6">
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                <Code2 className="h-4 w-4 text-gray-600" />
              </div>
              Campaign Definition
            </CardTitle>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? (
                <><CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-green-500" />Copied!</>
              ) : (
                <><Copy className="h-3.5 w-3.5 mr-1.5" />Copy YAML</>
              )}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="relative rounded-xl overflow-hidden">
              <div className="absolute top-3 right-3">
                <span className="px-2 py-0.5 rounded bg-gray-700 text-[10px] font-mono text-gray-300">YAML</span>
              </div>
              <pre className="bg-gray-900 text-gray-100 p-5 overflow-x-auto text-sm leading-relaxed font-mono">
                <code>{template.definition_yaml}</code>
              </pre>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* CTA */}
      <motion.div className="flex items-center gap-3" initial="hidden" animate="visible" custom={4} variants={fadeUp}>
        <Card className="flex-1 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-100">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Ready to run this template?</h3>
              <p className="text-sm text-muted-foreground">
                Fork it into a new campaign, tweak the parameters, and launch your optimization.
              </p>
            </div>
            <Button
              variant="gradient"
              onClick={() => forkMutation.mutate()}
              disabled={forkMutation.isPending}
              className="flex-shrink-0 ml-4"
            >
              {forkMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Rocket className="h-4 w-4 mr-2" />
              )}
              Use This Template
            </Button>
          </CardContent>
        </Card>
        {isOwner && (
          <Button
            variant="destructive"
            size="icon"
            className="h-[72px] w-12 flex-shrink-0"
            onClick={() => {
              if (confirm("Delete this template? This cannot be undone.")) {
                deleteMutation.mutate();
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </motion.div>
    </div>
  );
}
