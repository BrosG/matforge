"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Database,
  Search,
  Download,
  Loader2,
  Atom,
  Zap,
  Filter,
  ExternalLink,
  CheckCircle2,
  Globe,
  Layers,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { api } from "@/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  DATASET_SOURCE_LABELS,
  type DatasetSource,
  type DatasetEntry,
} from "@/types/dataset";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4 },
  }),
};

const SOURCES: {
  value: DatasetSource;
  label: string;
  description: string;
  count: string;
  gradient: string;
  icon: React.ElementType;
}[] = [
  {
    value: "materials_project",
    label: "Materials Project",
    description: "Largest computational materials database — DFT-computed properties for every known inorganic compound",
    count: "154,000+",
    gradient: "from-blue-500 to-cyan-500",
    icon: Atom,
  },
  {
    value: "aflow",
    label: "AFLOW",
    description: "Automatic FLOW framework — high-throughput ab-initio electronic structure calculations",
    count: "3.5M+",
    gradient: "from-violet-500 to-purple-500",
    icon: Layers,
  },
  {
    value: "oqmd",
    label: "OQMD",
    description: "Open Quantum Materials Database — thermodynamic and structural properties from DFT",
    count: "1M+",
    gradient: "from-emerald-500 to-green-500",
    icon: Globe,
  },
  {
    value: "optimade",
    label: "OPTIMADE",
    description: "Universal API — query 30+ materials databases through one standardized interface",
    count: "30+ providers",
    gradient: "from-emerald-500 to-teal-500",
    icon: Globe,
  },
  {
    value: "jarvis",
    label: "JARVIS-DFT",
    description: "NIST repository — DFT properties, elastic moduli, and band structures with multiple functionals",
    count: "80,000+",
    gradient: "from-orange-500 to-red-500",
    icon: Layers,
  },
  {
    value: "perovskite_db",
    label: "Perovskite DB",
    description: "Domain-specific — halide perovskite solar cells with PCE, band gap, and stability data",
    count: "42,000+",
    gradient: "from-amber-500 to-yellow-500",
    icon: Sparkles,
  },
  {
    value: "gnome",
    label: "GNoME",
    description: "Google DeepMind — 380K stable crystal structures predicted by Graph Networks for Materials",
    count: "380,000+",
    gradient: "from-violet-500 to-purple-600",
    icon: Atom,
  },
  {
    value: "opendac",
    label: "OpenDAC",
    description: "Meta FAIR — CO₂/H₂O adsorption energies on catalyst surfaces for direct air capture",
    count: "50,000+",
    gradient: "from-pink-500 to-rose-500",
    icon: Zap,
  },
];

const PROPERTY_COLUMNS: Record<string, string> = {
  formation_energy: "Formation Energy",
  band_gap: "Band Gap",
  energy_above_hull: "E Above Hull",
  density: "Density",
};

const PROPERTY_UNITS: Record<string, string> = {
  formation_energy: "eV/atom",
  band_gap: "eV",
  energy_above_hull: "eV",
  density: "g/cm\u00B3",
};

export default function DatasetsPage() {
  const [source, setSource] = useState<DatasetSource>("materials_project");
  const [elements, setElements] = useState("");
  const [formula, setFormula] = useState("");
  const [maxResults, setMaxResults] = useState(50);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [importCampaignId, setImportCampaignId] = useState("");
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  const searchMutation = useMutation({
    mutationFn: () =>
      api.datasets.search({
        source,
        elements: elements ? elements.split(",").map((e) => e.trim()) : undefined,
        formula: formula || undefined,
        max_results: maxResults,
      }),
    onSuccess: () => {
      setSelectedIds(new Set());
      setImportSuccess(null);
    },
  });

  const importMutation = useMutation({
    mutationFn: () =>
      api.datasets.import({
        source,
        external_ids: Array.from(selectedIds),
        campaign_id: importCampaignId,
      }),
    onSuccess: (data) => {
      setImportSuccess(`Successfully imported ${data.imported} materials into your campaign`);
      setSelectedIds(new Set());
    },
  });

  const campaignsQuery = useQuery({
    queryKey: ["campaigns-for-import"],
    queryFn: () => api.campaigns.list(1, 100),
  });

  const entries = searchMutation.data?.entries || [];
  const currentSource = SOURCES.find((s) => s.value === source)!;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === entries.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(entries.map((e) => e.external_id)));
    }
  };

  return (
    <div>
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold">
          Dataset <span className="gradient-text">Browser</span>
        </h1>
        <p className="text-muted-foreground mt-1">
          Search millions of materials from the world&apos;s largest public databases and import them directly into your campaigns.
        </p>
      </motion.div>

      {/* Source selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {SOURCES.map((s, i) => (
          <motion.div
            key={s.value}
            initial="hidden"
            animate="visible"
            custom={i}
            variants={fadeUp}
          >
            <button
              onClick={() => setSource(s.value)}
              className={cn(
                "w-full text-left p-5 rounded-2xl border-2 transition-all duration-300 group",
                source === s.value
                  ? "border-blue-400 bg-white shadow-lg shadow-blue-100"
                  : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-md"
              )}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-md transition-transform",
                    s.gradient,
                    source === s.value ? "scale-110" : "group-hover:scale-105"
                  )}
                >
                  <s.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <span className="font-semibold text-gray-900">{s.label}</span>
                  <div className="text-xs font-medium text-muted-foreground">
                    {s.count} compounds
                  </div>
                </div>
                {source === s.value && (
                  <div className="ml-auto">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {s.description}
              </p>
            </button>
          </motion.div>
        ))}
      </div>

      {/* Search form */}
      <motion.div initial="hidden" animate="visible" custom={3} variants={fadeUp}>
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Filter className="h-4 w-4 text-blue-600" />
              </div>
              Search Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Elements
                </label>
                <div className="relative">
                  <Atom className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="e.g. Fe, O, Si"
                    value={elements}
                    onChange={(e) => setElements(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 text-sm border rounded-lg bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-colors"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">Comma-separated element symbols</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Chemical Formula
                </label>
                <div className="relative">
                  <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="e.g. Fe2O3, TiO2"
                    value={formula}
                    onChange={(e) => setFormula(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 text-sm border rounded-lg bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-colors"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">Standard chemical formula notation</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Max Results
                </label>
                <div className="relative">
                  <Layers className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    value={maxResults}
                    onChange={(e) => setMaxResults(Number(e.target.value))}
                    min={1}
                    max={200}
                    className="w-full pl-10 pr-3 py-2.5 text-sm border rounded-lg bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-colors"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">1 — 200 results per query</p>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-3">
              <Button
                variant="gradient"
                onClick={() => searchMutation.mutate()}
                disabled={searchMutation.isPending}
              >
                {searchMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                Search {currentSource.label}
              </Button>
              {searchMutation.isError && (
                <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 px-3 py-1.5 rounded-lg">
                  <Zap className="h-4 w-4" />
                  Search failed — check your API key configuration.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Results loading state */}
      {searchMutation.isPending && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-16 flex-1" />
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results table */}
      {entries.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-3">
                <CardTitle className="text-lg">Results</CardTitle>
                <Badge variant="secondary" className="font-mono">
                  {searchMutation.data?.total || 0} materials
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                {selectedIds.size > 0 && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                    <Badge className="bg-blue-100 text-blue-700 px-3 py-1">
                      {selectedIds.size} selected
                    </Badge>
                  </motion.div>
                )}
                <Button variant="outline" size="sm" onClick={toggleAll}>
                  {selectedIds.size === entries.length ? "Deselect All" : "Select All"}
                </Button>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-t bg-gray-50/50">
                    <th className="p-3 pl-6 w-8"></th>
                    <th className="p-3 text-left font-medium text-muted-foreground">Material ID</th>
                    <th className="p-3 text-left font-medium text-muted-foreground">Formula</th>
                    {Object.entries(PROPERTY_COLUMNS).map(([key, label]) => (
                      <th key={key} className="p-3 text-left font-medium text-muted-foreground">
                        <div>{label}</div>
                        <div className="text-[10px] font-normal text-gray-400">{PROPERTY_UNITS[key]}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {entries.map((entry: DatasetEntry, idx: number) => (
                    <motion.tr
                      key={entry.external_id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className={cn(
                        "hover:bg-gray-50/80 cursor-pointer transition-colors",
                        selectedIds.has(entry.external_id) && "bg-blue-50/60"
                      )}
                      onClick={() => toggleSelect(entry.external_id)}
                    >
                      <td className="p-3 pl-6">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(entry.external_id)}
                          onChange={() => toggleSelect(entry.external_id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-200"
                        />
                      </td>
                      <td className="p-3">
                        <span className="font-mono text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                          {entry.external_id}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-gray-900">{entry.formula}</td>
                      {Object.keys(PROPERTY_COLUMNS).map((key) => (
                        <td key={key} className="p-3 text-muted-foreground font-mono text-xs">
                          {entry.properties[key] != null
                            ? entry.properties[key].toFixed(4)
                            : <span className="text-gray-300">&mdash;</span>}
                        </td>
                      ))}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Import section */}
            {selectedIds.size > 0 && (
              <motion.div
                className="m-4 p-5 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <Download className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">
                      Import {selectedIds.size} material{selectedIds.size > 1 ? "s" : ""}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Add these materials as seed data to an existing campaign
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={importCampaignId}
                    onChange={(e) => setImportCampaignId(e.target.value)}
                    className="flex-1 px-3 py-2.5 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="">Select a campaign...</option>
                    {(campaignsQuery.data?.campaigns || []).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.domain})
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="gradient"
                    onClick={() => importMutation.mutate()}
                    disabled={!importCampaignId || importMutation.isPending}
                  >
                    {importMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <ArrowRight className="h-4 w-4 mr-2" />
                    )}
                    Import
                  </Button>
                </div>
                {importSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg"
                  >
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    {importSuccess}
                  </motion.div>
                )}
                {importMutation.isError && (
                  <p className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                    Import failed. Please try again.
                  </p>
                )}
              </motion.div>
            )}
          </Card>
        </motion.div>
      )}

      {/* Empty state */}
      {!searchMutation.data && !searchMutation.isPending && (
        <motion.div initial="hidden" animate="visible" custom={4} variants={fadeUp}>
          <Card className="bg-gradient-to-br from-gray-50 to-blue-50/30 border-dashed">
            <CardContent className="text-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mx-auto mb-5 shadow-lg">
                <Database className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Explore the world&apos;s materials data
              </h3>
              <p className="text-muted-foreground max-w-lg mx-auto mb-6 leading-relaxed">
                Search across 8 databases — Materials Project, AFLOW, OQMD, OPTIMADE, JARVIS, Perovskite DB, GNoME, and OpenDAC.
                Find materials by elements or formula, then import them as seed data for your optimization campaigns.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {["Formation Energy", "Band Gap", "Density", "Crystal Structure", "Thermodynamic Stability"].map((prop) => (
                  <span key={prop} className="px-3 py-1.5 rounded-full bg-white border text-xs font-medium text-gray-600 shadow-sm">
                    {prop}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
