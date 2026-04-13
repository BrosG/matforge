"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  X,
  Loader2,
  AlertCircle,
  ArrowUpDown,
  Radar as RadarIcon,
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { MaterialDetail } from "@/lib/materials-api";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.matcraft.ai/api/v1";

const MAX_MATERIALS = 5;

const COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#10b981", // emerald
  "#f59e0b", // amber
  "#8b5cf6", // violet
];

// ---------------------------------------------------------------------------
// Property definitions
// ---------------------------------------------------------------------------

interface PropertyDef {
  key: keyof MaterialDetail;
  label: string;
  unit: string;
  /** Higher is better (true) or lower is better (false). Used for color coding. */
  higherBetter: boolean;
  /** Format value for display */
  fmt: (v: unknown) => string;
}

function numFmt(v: unknown, digits = 3): string {
  if (v === null || v === undefined) return "\u2014";
  if (typeof v === "number") return Number.isFinite(v) ? v.toFixed(digits) : "\u2014";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return String(v);
}

const PROPERTIES: PropertyDef[] = [
  { key: "formula", label: "Formula", unit: "", higherBetter: true, fmt: (v) => String(v ?? "\u2014") },
  { key: "crystal_system", label: "Crystal System", unit: "", higherBetter: true, fmt: (v) => String(v ?? "\u2014") },
  { key: "space_group", label: "Space Group", unit: "", higherBetter: true, fmt: (v) => String(v ?? "\u2014") },
  { key: "is_stable", label: "Stability", unit: "", higherBetter: true, fmt: (v) => (v === true ? "Stable" : v === false ? "Unstable" : "\u2014") },
  { key: "band_gap", label: "Band Gap", unit: "eV", higherBetter: true, fmt: (v) => numFmt(v, 3) },
  { key: "formation_energy", label: "Formation Energy", unit: "eV/atom", higherBetter: false, fmt: (v) => numFmt(v, 4) },
  { key: "energy_above_hull", label: "Energy Above Hull", unit: "eV/atom", higherBetter: false, fmt: (v) => numFmt(v, 4) },
  { key: "density", label: "Density", unit: "g/cm\u00B3", higherBetter: false, fmt: (v) => numFmt(v, 2) },
  { key: "volume", label: "Volume", unit: "\u00C5\u00B3", higherBetter: false, fmt: (v) => numFmt(v, 2) },
  { key: "bulk_modulus", label: "Bulk Modulus", unit: "GPa", higherBetter: true, fmt: (v) => numFmt(v, 1) },
  { key: "shear_modulus", label: "Shear Modulus", unit: "GPa", higherBetter: true, fmt: (v) => numFmt(v, 1) },
  { key: "young_modulus", label: "Young's Modulus", unit: "GPa", higherBetter: true, fmt: (v) => numFmt(v, 1) },
  { key: "poisson_ratio", label: "Poisson Ratio", unit: "", higherBetter: false, fmt: (v) => numFmt(v, 3) },
  { key: "total_magnetization", label: "Magnetization", unit: "\u00B5B", higherBetter: true, fmt: (v) => numFmt(v, 3) },
  { key: "dielectric_constant", label: "Dielectric Constant", unit: "", higherBetter: true, fmt: (v) => numFmt(v, 2) },
  { key: "thermal_conductivity", label: "Thermal Conductivity", unit: "W/mK", higherBetter: true, fmt: (v) => numFmt(v, 2) },
  { key: "seebeck_coefficient", label: "Seebeck Coefficient", unit: "\u00B5V/K", higherBetter: true, fmt: (v) => numFmt(v, 2) },
];

/** Numeric properties suitable for radar chart normalisation */
const RADAR_PROPERTIES: { key: keyof MaterialDetail; label: string; invert: boolean }[] = [
  { key: "band_gap", label: "Band Gap", invert: false },
  { key: "formation_energy", label: "Form. Energy", invert: true },
  { key: "density", label: "Density", invert: false },
  { key: "bulk_modulus", label: "Bulk Mod.", invert: false },
  { key: "shear_modulus", label: "Shear Mod.", invert: false },
  { key: "total_magnetization", label: "Magnet.", invert: false },
  { key: "dielectric_constant", label: "Dielectric", invert: false },
  { key: "thermal_conductivity", label: "Thermal K", invert: false },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fetchMaterialClient(id: string): Promise<MaterialDetail> {
  const res = await fetch(`${API_BASE}/materials/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`Failed to fetch ${id}: ${res.status}`);
  return res.json();
}

function normalize(
  materials: MaterialDetail[],
  key: keyof MaterialDetail,
  invert: boolean
): number[] {
  const vals = materials.map((m) => {
    const v = m[key];
    return typeof v === "number" && Number.isFinite(v) ? v : null;
  });
  const nums = vals.filter((v): v is number => v !== null);
  if (nums.length === 0) return vals.map(() => 0);
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const range = max - min || 1;
  return vals.map((v) => {
    if (v === null) return 0;
    const norm = (v - min) / range;
    return invert ? 1 - norm : norm;
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MaterialComparator() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [inputId, setInputId] = useState("");
  const [materialIds, setMaterialIds] = useState<string[]>([]);
  const [materials, setMaterials] = useState<Map<string, MaterialDetail>>(new Map());
  const [loading, setLoading] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Map<string, string>>(new Map());

  // Initialise from URL
  useEffect(() => {
    const idsParam = searchParams.get("ids");
    if (idsParam) {
      const ids = idsParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, MAX_MATERIALS);
      if (ids.length > 0) setMaterialIds(ids);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync URL when IDs change
  useEffect(() => {
    const params = new URLSearchParams();
    if (materialIds.length > 0) params.set("ids", materialIds.join(","));
    const qs = params.toString();
    const path = qs ? `/compare?${qs}` : "/compare";
    router.replace(path, { scroll: false });
  }, [materialIds, router]);

  // Fetch materials when IDs change
  const fetchMissing = useCallback(
    async (ids: string[]) => {
      const toFetch = ids.filter((id) => !materials.has(id) && !loading.has(id));
      if (toFetch.length === 0) return;

      setLoading((prev) => {
        const next = new Set(prev);
        toFetch.forEach((id) => next.add(id));
        return next;
      });

      const results = await Promise.allSettled(
        toFetch.map((id) => fetchMaterialClient(id))
      );

      setMaterials((prev) => {
        const next = new Map(prev);
        results.forEach((r, i) => {
          if (r.status === "fulfilled") next.set(toFetch[i], r.value);
        });
        return next;
      });

      setErrors((prev) => {
        const next = new Map(prev);
        results.forEach((r, i) => {
          if (r.status === "rejected") {
            next.set(toFetch[i], r.reason?.message ?? "Failed to load");
          } else {
            next.delete(toFetch[i]);
          }
        });
        return next;
      });

      setLoading((prev) => {
        const next = new Set(prev);
        toFetch.forEach((id) => next.delete(id));
        return next;
      });
    },
    [materials, loading]
  );

  useEffect(() => {
    if (materialIds.length > 0) fetchMissing(materialIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materialIds]);

  // Handlers
  const addMaterial = () => {
    const id = inputId.trim();
    if (!id || materialIds.includes(id) || materialIds.length >= MAX_MATERIALS) return;
    setMaterialIds((prev) => [...prev, id]);
    setInputId("");
  };

  const removeMaterial = (id: string) => {
    setMaterialIds((prev) => prev.filter((x) => x !== id));
    setMaterials((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
    setErrors((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addMaterial();
    }
  };

  // Resolved materials in order
  const resolved = materialIds
    .map((id) => ({ id, mat: materials.get(id), err: errors.get(id) }))
    .filter((m) => m.mat || m.err || loading.has(m.id));

  // Color-coding: for each numeric property find best/worst
  const numericMats = materialIds.map((id) => materials.get(id)).filter(Boolean) as MaterialDetail[];

  function cellColor(prop: PropertyDef, value: unknown): string {
    if (typeof value !== "number" || !Number.isFinite(value)) return "";
    if (numericMats.length < 2) return "";
    const vals = numericMats
      .map((m) => m[prop.key])
      .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
    if (vals.length < 2) return "";
    const best = prop.higherBetter ? Math.max(...vals) : Math.min(...vals);
    const worst = prop.higherBetter ? Math.min(...vals) : Math.max(...vals);
    if (value === best) return "text-green-600 dark:text-green-400 font-semibold";
    if (value === worst) return "text-red-600 dark:text-red-400";
    return "";
  }

  // Radar chart data
  const radarData = RADAR_PROPERTIES.map((rp) => {
    const norms = normalize(numericMats, rp.key, rp.invert);
    const entry: Record<string, unknown> = { property: rp.label };
    numericMats.forEach((m, i) => {
      entry[m.external_id || m.id] = +(norms[i] ?? 0).toFixed(3);
    });
    return entry;
  });

  const radarKeys = numericMats.map((m) => m.external_id || m.id);

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">
          Compare <span className="gradient-text">Materials</span>
        </h1>
        <p className="mt-2 text-muted-foreground">
          Add up to {MAX_MATERIALS} materials by ID to compare their properties side by side.
        </p>
      </div>

      {/* Input row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={inputId}
            onChange={(e) => setInputId(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='Enter material ID (e.g. "mp-149")'
            className={cn(
              "w-full h-10 pl-4 pr-4 rounded-lg border bg-background text-foreground",
              "border-border focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
              "placeholder:text-muted-foreground text-sm transition-colors"
            )}
          />
        </div>
        <Button
          onClick={addMaterial}
          disabled={!inputId.trim() || materialIds.length >= MAX_MATERIALS || materialIds.includes(inputId.trim())}
          variant="gradient"
          size="default"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add
        </Button>
      </div>

      {/* Active IDs */}
      {materialIds.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {materialIds.map((id) => (
            <Badge
              key={id}
              variant={errors.has(id) ? "destructive" : "info"}
              className="gap-1 pr-1"
            >
              {loading.has(id) && <Loader2 className="h-3 w-3 animate-spin" />}
              {id}
              <button
                onClick={() => removeMaterial(id)}
                className="ml-1 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <span className="text-xs text-muted-foreground self-center">
            {materialIds.length}/{MAX_MATERIALS}
          </span>
        </div>
      )}

      {/* Errors */}
      {Array.from(errors.entries()).map(([id, msg]) => (
        <div
          key={id}
          className="flex items-center gap-2 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-4 py-2 text-sm text-red-700 dark:text-red-400"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>
            <strong>{id}</strong>: {msg}
          </span>
        </div>
      ))}

      {/* Empty state */}
      {materialIds.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <ArrowUpDown className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg font-medium">No materials selected</p>
          <p className="mt-1 text-sm">
            Enter material IDs above to start comparing properties.
          </p>
        </div>
      )}

      {/* Radar Chart */}
      {numericMats.length >= 2 && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <RadarIcon className="h-5 w-5 text-blue-500" />
            Property Radar
          </h2>
          <div className="w-full h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                <PolarGrid stroke="currentColor" className="text-border" />
                <PolarAngleAxis
                  dataKey="property"
                  tick={{ fill: "currentColor", fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 1]}
                  tick={{ fill: "currentColor", fontSize: 10 }}
                  className="text-muted-foreground"
                />
                {radarKeys.map((key, i) => (
                  <Radar
                    key={key}
                    name={key}
                    dataKey={key}
                    stroke={COLORS[i % COLORS.length]}
                    fill={COLORS[i % COLORS.length]}
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                ))}
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card, #fff)",
                    border: "1px solid var(--color-border, #e5e7eb)",
                    borderRadius: "0.5rem",
                    fontSize: "0.8rem",
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: "0.8rem" }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Comparison Table */}
      {numericMats.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-semibold text-foreground sticky left-0 bg-muted/50 z-10 min-w-[160px]">
                    Property
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground min-w-[70px]">
                    Unit
                  </th>
                  {materialIds.map((id, i) => {
                    const mat = materials.get(id);
                    return (
                      <th
                        key={id}
                        className="text-left px-4 py-3 font-semibold min-w-[140px]"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: COLORS[i % COLORS.length] }}
                          />
                          <span className="text-foreground truncate">
                            {mat?.formula ?? id}
                          </span>
                          <button
                            onClick={() => removeMaterial(id)}
                            className="ml-auto p-0.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                            title={`Remove ${id}`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="text-xs text-muted-foreground font-normal mt-0.5">
                          {id}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {PROPERTIES.map((prop, rowIdx) => (
                  <tr
                    key={prop.key}
                    className={cn(
                      "border-b border-border last:border-0 transition-colors hover:bg-muted/30",
                      rowIdx % 2 === 0 ? "bg-transparent" : "bg-muted/10"
                    )}
                  >
                    <td className="px-4 py-2.5 font-medium text-foreground sticky left-0 bg-inherit z-10">
                      {prop.label}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {prop.unit}
                    </td>
                    {materialIds.map((id) => {
                      const mat = materials.get(id);
                      if (!mat) {
                        return (
                          <td key={id} className="px-4 py-2.5 text-muted-foreground">
                            {loading.has(id) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "\u2014"
                            )}
                          </td>
                        );
                      }
                      const raw = mat[prop.key];
                      const display = prop.fmt(raw);
                      const color = cellColor(prop, raw);
                      return (
                        <td
                          key={id}
                          className={cn("px-4 py-2.5 tabular-nums", color || "text-foreground")}
                        >
                          {display}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
