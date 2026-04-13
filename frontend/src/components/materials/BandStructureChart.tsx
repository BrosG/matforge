"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.matcraft.ai/api/v1";

// ── Types ──────────────────────────────────────────────────────────────────

interface KPointLabel {
  index: number;
  label: string;
}

interface BandStructureData {
  bands: {
    spin_up: number[][];
    spin_down?: number[][];
  };
  kpoints: {
    distances: number[];
    labels: KPointLabel[];
  };
  band_gap: {
    energy: number;
    direct: boolean;
  };
}

interface BandStructureChartProps {
  mpId: string;
  className?: string;
}

// ── Fetch ──────────────────────────────────────────────────────────────────

async function fetchBandStructure(mpId: string): Promise<BandStructureData> {
  const res = await fetch(
    `${API_BASE}/electronic/bandstructure/${encodeURIComponent(mpId)}`
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch band structure (${res.status})`);
  }
  return res.json();
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** Convert Greek letter names to Unicode symbols for k-point labels */
function prettifyLabel(label: string): string {
  return label
    .replace(/\\Gamma|GAMMA|Gamma/g, "\u0393")
    .replace(/\\Sigma|SIGMA|Sigma/g, "\u03A3")
    .replace(/\\Delta|DELTA|Delta/g, "\u0394");
}

// ── Component ──────────────────────────────────────────────────────────────

export function BandStructureChart({ mpId, className }: BandStructureChartProps) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["bandstructure", mpId],
    queryFn: () => fetchBandStructure(mpId),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  // Transform API data into recharts-friendly rows
  const { chartData, spinUpKeys, spinDownKeys, symmetryLines } = useMemo(() => {
    if (!data) {
      return { chartData: [], spinUpKeys: [], spinDownKeys: [], symmetryLines: [] as { x: number; label: string }[] };
    }

    const { bands, kpoints } = data;
    const distances = kpoints.distances;
    const nPoints = distances.length;

    // Build one row per k-point
    const rows: Record<string, number>[] = [];
    for (let i = 0; i < nPoints; i++) {
      const row: Record<string, number> = { kDist: distances[i] };

      bands.spin_up.forEach((band, bIdx) => {
        row[`up_${bIdx}`] = band[i];
      });

      bands.spin_down?.forEach((band, bIdx) => {
        row[`dn_${bIdx}`] = band[i];
      });

      rows.push(row);
    }

    const upKeys = bands.spin_up.map((_, i) => `up_${i}`);
    const dnKeys = bands.spin_down?.map((_, i) => `dn_${i}`) ?? [];

    const symLines = kpoints.labels.map((lbl) => ({
      x: distances[lbl.index] ?? 0,
      label: prettifyLabel(lbl.label),
    }));

    return {
      chartData: rows,
      spinUpKeys: upKeys,
      spinDownKeys: dnKeys,
      symmetryLines: symLines,
    };
  }, [data]);

  // ── Loading state ──────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="text-lg">Band Structure</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[350px] w-full rounded-lg" />
          <div className="flex gap-4 mt-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────

  if (isError || !data) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="text-lg">Band Structure</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
            {(error as Error)?.message?.includes("404")
              ? "Band structure data is not available for this material."
              : `Unable to load band structure: ${(error as Error)?.message ?? "unknown error"}`}
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasSpin = spinDownKeys.length > 0;
  const { band_gap } = data;

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="text-lg">Band Structure</CardTitle>
        <CardDescription>
          Band gap: {band_gap.energy.toFixed(3)} eV
          {band_gap.energy > 0 ? ` (${band_gap.direct ? "direct" : "indirect"})` : ""}
          {hasSpin && " \u00b7 Spin-polarized"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={380}>
          <LineChart
            data={chartData}
            margin={{ top: 8, right: 16, bottom: 24, left: 12 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              className="stroke-border"
              vertical={false}
            />

            <XAxis
              dataKey="kDist"
              type="number"
              domain={["dataMin", "dataMax"]}
              tick={false}
              axisLine={{ className: "stroke-border" }}
              label={{
                value: "Wave Vector",
                position: "insideBottom",
                offset: -12,
                className: "fill-muted-foreground text-xs",
              }}
            />

            <YAxis
              domain={["auto", "auto"]}
              axisLine={{ className: "stroke-border" }}
              tick={{ className: "fill-muted-foreground text-xs" }}
              label={{
                value: "Energy (eV)",
                angle: -90,
                position: "insideLeft",
                offset: 4,
                className: "fill-muted-foreground text-xs",
              }}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                borderColor: "hsl(var(--border))",
                color: "hsl(var(--foreground))",
                borderRadius: "0.5rem",
                fontSize: "0.75rem",
              }}
              formatter={(value: number) => [`${value.toFixed(3)} eV`, ""]}
              labelFormatter={(label: number) => `k = ${label.toFixed(4)}`}
            />

            {/* Fermi level reference line */}
            <ReferenceLine
              y={0}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="6 3"
              label={{
                value: "E_F",
                position: "right",
                className: "fill-muted-foreground text-xs",
              }}
            />

            {/* High-symmetry k-point vertical lines */}
            {symmetryLines.map((sym, idx) => (
              <ReferenceLine
                key={`sym-${idx}`}
                x={sym.x}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="4 4"
                strokeOpacity={0.6}
                label={{
                  value: sym.label,
                  position: "top",
                  className: "fill-foreground text-xs font-medium",
                }}
              />
            ))}

            {/* Spin-up bands (blue) */}
            {spinUpKeys.map((key) => (
              <Line
                key={key}
                dataKey={key}
                type="monotone"
                dot={false}
                strokeWidth={1.2}
                stroke="#3b82f6"
                activeDot={false}
                isAnimationActive={false}
              />
            ))}

            {/* Spin-down bands (red) */}
            {spinDownKeys.map((key) => (
              <Line
                key={key}
                dataKey={key}
                type="monotone"
                dot={false}
                strokeWidth={1.2}
                stroke="#ef4444"
                activeDot={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>

        {/* Legend */}
        {hasSpin && (
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-4 rounded bg-blue-500" />
              Spin Up
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-4 rounded bg-red-500" />
              Spin Down
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
