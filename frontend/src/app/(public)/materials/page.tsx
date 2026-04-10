"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Atom,
  Database,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  X,
  CheckCircle2,
  BarChart3,
  FlaskConical,
} from "lucide-react";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { PeriodicTableFilter } from "@/components/materials/PeriodicTableFilter";
import { MaterialCard } from "@/components/materials/MaterialCard";
import { MaterialSearch } from "@/components/materials/MaterialSearch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import JsonLd from "@/components/seo/JsonLd";
import { cn } from "@/lib/utils";
import type {
  MaterialSummary,
  MaterialStats,
  MaterialSearchParams,
} from "@/lib/materials-api";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.matcraft.ai/api/v1";

const CRYSTAL_SYSTEMS = [
  "cubic",
  "hexagonal",
  "tetragonal",
  "orthorhombic",
  "monoclinic",
  "triclinic",
  "trigonal",
];

const SORT_OPTIONS = [
  { value: "formula", label: "Formula" },
  { value: "band_gap", label: "Band Gap" },
  { value: "formation_energy", label: "Formation Energy" },
  { value: "energy_above_hull", label: "Energy Above Hull" },
  { value: "density", label: "Density" },
  { value: "n_elements", label: "# Elements" },
];

const PAGE_SIZE = 20;

interface Filters {
  q: string;
  elements: string[];
  crystal_system: string;
  band_gap_min: string;
  band_gap_max: string;
  formation_energy_min: string;
  formation_energy_max: string;
  is_stable: string;
  source_db: string;
  sort_by: string;
  sort_dir: string;
}

const defaultFilters: Filters = {
  q: "",
  elements: [],
  crystal_system: "",
  band_gap_min: "",
  band_gap_max: "",
  formation_energy_min: "",
  formation_energy_max: "",
  is_stable: "",
  source_db: "",
  sort_by: "formula",
  sort_dir: "asc",
};

export default function MaterialsPage() {
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [page, setPage] = useState(1);
  const [materials, setMaterials] = useState<MaterialSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<MaterialStats | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showPeriodicTable, setShowPeriodicTable] = useState(false);

  // Fetch stats on mount
  useEffect(() => {
    fetch(`${API_BASE}/materials/stats`)
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(() => {});
  }, []);

  // Fetch materials when filters or page change
  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const params: MaterialSearchParams = {
        page,
        limit: PAGE_SIZE,
        q: filters.q || undefined,
        elements: filters.elements.length
          ? filters.elements.join(",")
          : undefined,
        crystal_system: filters.crystal_system || undefined,
        band_gap_min: filters.band_gap_min || undefined,
        band_gap_max: filters.band_gap_max || undefined,
        formation_energy_min: filters.formation_energy_min || undefined,
        formation_energy_max: filters.formation_energy_max || undefined,
        is_stable: filters.is_stable || undefined,
        source_db: filters.source_db || undefined,
        sort_by: filters.sort_by,
        sort_dir: filters.sort_dir,
      };

      const sp = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== "") {
          sp.set(key, String(value));
        }
      }

      const res = await fetch(`${API_BASE}/materials?${sp.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch materials");
      const data = await res.json();
      setMaterials(data.materials);
      setTotal(data.total);
    } catch {
      setMaterials([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  // Reset page to 1 when filters change
  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
    setPage(1);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasActiveFilters =
    filters.q ||
    filters.elements.length > 0 ||
    filters.crystal_system ||
    filters.band_gap_min ||
    filters.band_gap_max ||
    filters.formation_energy_min ||
    filters.formation_energy_max ||
    filters.is_stable ||
    filters.source_db;

  // Build page numbers for pagination
  const pageNumbers: (number | "ellipsis")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
  } else {
    pageNumbers.push(1);
    if (page > 3) pageNumbers.push("ellipsis");
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPages - 1, page + 1);
      i++
    ) {
      pageNumbers.push(i);
    }
    if (page < totalPages - 2) pageNumbers.push("ellipsis");
    pageNumbers.push(totalPages);
  }

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "DataCatalog",
          name: "MatCraft Material Database",
          description:
            "Comprehensive database of materials with electronic, structural, and thermodynamic properties.",
          url: "https://matcraft.ai/materials",
          provider: {
            "@type": "Organization",
            name: "MatCraft",
            url: "https://matcraft.ai",
          },
        }}
      />

      <Header />

      <main className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b bg-gradient-to-br from-blue-50 via-purple-50/30 to-white">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/40 via-transparent to-transparent" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-3xl mx-auto"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100/60 text-blue-700 text-sm font-medium mb-4">
                <Atom className="h-4 w-4" />
                Material Discovery
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
                Explore Materials
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Search and filter through our comprehensive database of
                materials. Analyze electronic structure, thermodynamic stability,
                and crystal properties.
              </p>

              {/* Stats Row */}
              {stats && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="flex flex-wrap items-center justify-center gap-6 text-sm"
                >
                  <div className="flex items-center gap-2 text-gray-600">
                    <Database className="h-4 w-4 text-blue-500" />
                    <span className="font-semibold text-gray-900">
                      {stats.total_materials.toLocaleString()}
                    </span>{" "}
                    materials
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="font-semibold text-gray-900">
                      {stats.stable_materials.toLocaleString()}
                    </span>{" "}
                    stable
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <BarChart3 className="h-4 w-4 text-purple-500" />
                    <span className="font-semibold text-gray-900">
                      {stats.avg_band_gap.toFixed(2)}
                    </span>{" "}
                    avg band gap (eV)
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <FlaskConical className="h-4 w-4 text-amber-500" />
                    <span className="font-semibold text-gray-900">
                      {Object.keys(stats.sources).length}
                    </span>{" "}
                    sources
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        </section>

        {/* Search + Filters + Results */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Search Bar Row */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex-1">
              <MaterialSearch
                value={filters.q}
                onChange={(v) => updateFilter("q", v)}
                placeholder="Search by formula, elements, or ID..."
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowPeriodicTable(!showPeriodicTable)}
                className={cn(
                  "gap-2",
                  showPeriodicTable && "ring-2 ring-blue-200 border-blue-400"
                )}
              >
                <Atom className="h-4 w-4" />
                <span className="hidden sm:inline">Periodic Table</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "gap-2",
                  showFilters && "ring-2 ring-blue-200 border-blue-400"
                )}
              >
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Filters</span>
                {hasActiveFilters && (
                  <span className="ml-1 w-2 h-2 rounded-full bg-blue-500" />
                )}
              </Button>
            </div>
          </div>

          {/* Periodic Table */}
          <AnimatePresence>
            {showPeriodicTable && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden mb-6"
              >
                <div className="p-4 rounded-2xl border bg-white/80 backdrop-blur-sm shadow-sm">
                  <PeriodicTableFilter
                    selectedElements={filters.elements}
                    onChange={(els) => updateFilter("elements", els)}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden mb-6"
              >
                <div className="p-5 rounded-2xl border bg-white/80 backdrop-blur-sm shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-700">
                      Advanced Filters
                    </h3>
                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters}
                        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 transition-colors"
                      >
                        <X className="h-3 w-3" />
                        Clear All
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Crystal System */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">
                        Crystal System
                      </label>
                      <select
                        value={filters.crystal_system}
                        onChange={(e) =>
                          updateFilter("crystal_system", e.target.value)
                        }
                        className="w-full px-3 py-2 border rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                      >
                        <option value="">All Systems</option>
                        {CRYSTAL_SYSTEMS.map((cs) => (
                          <option key={cs} value={cs}>
                            {cs.charAt(0).toUpperCase() + cs.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Band Gap Range */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">
                        Band Gap (eV)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          placeholder="Min"
                          value={filters.band_gap_min}
                          onChange={(e) =>
                            updateFilter("band_gap_min", e.target.value)
                          }
                          className="w-full px-3 py-2 border rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                        />
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          placeholder="Max"
                          value={filters.band_gap_max}
                          onChange={(e) =>
                            updateFilter("band_gap_max", e.target.value)
                          }
                          className="w-full px-3 py-2 border rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                        />
                      </div>
                    </div>

                    {/* Formation Energy Range */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">
                        Formation Energy (eV/atom)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          step="0.1"
                          placeholder="Min"
                          value={filters.formation_energy_min}
                          onChange={(e) =>
                            updateFilter(
                              "formation_energy_min",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                        />
                        <input
                          type="number"
                          step="0.1"
                          placeholder="Max"
                          value={filters.formation_energy_max}
                          onChange={(e) =>
                            updateFilter(
                              "formation_energy_max",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                        />
                      </div>
                    </div>

                    {/* Stability + Source */}
                    <div className="flex flex-col gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                          Stability
                        </label>
                        <select
                          value={filters.is_stable}
                          onChange={(e) =>
                            updateFilter("is_stable", e.target.value)
                          }
                          className="w-full px-3 py-2 border rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                        >
                          <option value="">All</option>
                          <option value="true">Stable Only</option>
                          <option value="false">Unstable Only</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                          Source Database
                        </label>
                        <select
                          value={filters.source_db}
                          onChange={(e) =>
                            updateFilter("source_db", e.target.value)
                          }
                          className="w-full px-3 py-2 border rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                        >
                          <option value="">All Sources</option>
                          {stats &&
                            Object.keys(stats.sources).map((src) => (
                              <option key={src} value={src}>
                                {src} ({stats.sources[src]})
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active filter badges */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-xs text-gray-500 font-medium">
                Active filters:
              </span>
              {filters.elements.length > 0 && (
                <Badge variant="info" className="gap-1">
                  Elements: {filters.elements.join(", ")}
                  <button
                    onClick={() => updateFilter("elements", [])}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.crystal_system && (
                <Badge variant="info" className="gap-1">
                  {filters.crystal_system}
                  <button
                    onClick={() => updateFilter("crystal_system", "")}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {(filters.band_gap_min || filters.band_gap_max) && (
                <Badge variant="info" className="gap-1">
                  Band Gap: {filters.band_gap_min || "0"} -{" "}
                  {filters.band_gap_max || "inf"} eV
                  <button
                    onClick={() => {
                      updateFilter("band_gap_min", "");
                      updateFilter("band_gap_max", "");
                    }}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.is_stable && (
                <Badge variant="info" className="gap-1">
                  {filters.is_stable === "true" ? "Stable" : "Unstable"}
                  <button
                    onClick={() => updateFilter("is_stable", "")}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.source_db && (
                <Badge variant="info" className="gap-1">
                  Source: {filters.source_db}
                  <button
                    onClick={() => updateFilter("source_db", "")}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}

          {/* Sort controls + result count */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <p className="text-sm text-gray-600">
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Searching...
                </span>
              ) : (
                <>
                  <span className="font-semibold text-gray-900">
                    {total.toLocaleString()}
                  </span>{" "}
                  materials found
                </>
              )}
            </p>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">Sort by:</label>
              <select
                value={filters.sort_by}
                onChange={(e) => updateFilter("sort_by", e.target.value)}
                className="px-2 py-1.5 border rounded-lg bg-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() =>
                  updateFilter(
                    "sort_dir",
                    filters.sort_dir === "asc" ? "desc" : "asc"
                  )
                }
                className="px-2 py-1.5 border rounded-lg bg-white text-xs hover:bg-gray-50 transition-colors"
                title={`Sort ${filters.sort_dir === "asc" ? "descending" : "ascending"}`}
              >
                {filters.sort_dir === "asc" ? "A-Z" : "Z-A"}
              </button>
            </div>
          </div>

          {/* Results Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border p-5 bg-white/70 animate-pulse"
                >
                  <div className="h-8 bg-gray-200 rounded-lg w-2/3 mb-3" />
                  <div className="flex gap-2 mb-3">
                    <div className="h-5 bg-gray-200 rounded-full w-16" />
                    <div className="h-5 bg-gray-200 rounded-full w-12" />
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="h-12 bg-gray-100 rounded-lg" />
                    <div className="h-12 bg-gray-100 rounded-lg" />
                    <div className="h-12 bg-gray-100 rounded-lg" />
                  </div>
                  <div className="flex gap-1">
                    <div className="h-6 w-6 bg-gray-200 rounded-md" />
                    <div className="h-6 w-6 bg-gray-200 rounded-md" />
                    <div className="h-6 w-6 bg-gray-200 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : materials.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                No materials found
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Try adjusting your filters or search query.
              </p>
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear All Filters
                </Button>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              {materials.map((material, idx) => (
                <motion.div
                  key={material.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03, duration: 0.3 }}
                >
                  <MaterialCard material={material} />
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Pagination */}
          {totalPages > 1 && !loading && (
            <nav
              className="flex items-center justify-center gap-1 mt-10"
              aria-label="Pagination"
            >
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </Button>

              {pageNumbers.map((pn, idx) =>
                pn === "ellipsis" ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-2 text-gray-400 text-sm"
                  >
                    ...
                  </span>
                ) : (
                  <Button
                    key={pn}
                    variant={pn === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(pn)}
                    className={cn(
                      "min-w-[2.25rem]",
                      pn === page && "pointer-events-none"
                    )}
                  >
                    {pn}
                  </Button>
                )
              )}

              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="gap-1"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </nav>
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}
