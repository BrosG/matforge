"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
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
  CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.matcraft.ai/api/v1";

// ── Types ──────────────────────────────────────────────────────────────────

interface DosProjection {
  element: string;
  orbital: string;
  densities: number[];
}

interface DosData {
  total: {
    energies: number[];
    densities: number[];
    spin_down?: number[];
  };
  projections?: DosProjection[];
}

interface DosChartProps {
  mpId: string;
  className?: string;
}

// ── Fetch ──────────────────────────────────────────────────────────────────

async function fetchDos(mpId: string): Promise<DosData> {
  const res = await fetch(
    `${API_BASE}/electronic/dos/${encodeURIComponent(mpId)}`
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch DOS (${res.status})`);
  }
  return res.json();
}

// ── Distinct colors for projections ────────────────────────────────────────

const PROJECTION_COLORS = [
  "#f97316", // orange
  "#22c55e", // green
  "#a855f7", // purple
  "#ec4899", // pink
  "#14b8a6", // teal
  "#eab308", // yellow
  "#6366f1", // indigo
  "#f43f5e", // rose
];

// ── Component ──────────────────────────────────────────────────────────────

export function DosChart({ mpId, className }: DosChartProps) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["dos", mpId],
    queryFn: () => fetchDos(mpId),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  // Transform API data into recharts-friendly rows
  const { chartData, projectionKeys, hasSpin } = useMemo(() => {
    if (!data || !data.total?.energies?.length) {
      return { chartData: [], projectionKeys: [] as { key: string; label: string; color: string }[], hasSpin: false };
    }

    const { total, projections } = data;
    const energies = total.energies;
    const nPoints = energies.length;
    const spin = !!total.spin_down;

    // Build projection metadata
    const projKeys: { key: string; label: string; color: string }[] = [];
    projections?.forEach((proj, idx) => {
      const key = `proj_${idx}`;
      projKeys.push({
        key,
        label: `${proj.element} (${proj.orbital})`,
        color: PROJECTION_COLORS[idx % PROJECTION_COLORS.length],
      });
    });

    const rows: Record<string, number>[] = [];
    for (let i = 0; i < nPoints; i++) {
      const row: Record<string, number> = {
        energy: energies[i],
        totalUp: total.densities[i],
      };

      if (spin) {
        // Spin-down densities shown as negative values for mirror plot
        row.totalDown = -(total.spin_down![i]);
      }

      projections?.forEach((proj, idx) => {
        row[`proj_${idx}`] = proj.densities[i];
      });

      rows.push(row);
    }

    return { chartData: rows, projectionKeys: projKeys, hasSpin: spin };
  }, [data]);

  // ── Loading state ──────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="text-lg">Density of States</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[350px] w-full rounded-lg" />
          <div className="flex gap-4 mt-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-28" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────

  if (isError || !data || !data.total?.energies?.length) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="text-lg">Density of States</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
            {(error as Error)?.message?.includes("404")
              ? "DOS data is not available for this material."
              : `Unable to load DOS: ${(error as Error)?.message ?? "unknown error"}`}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="text-lg">Density of States</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={380}>
          <AreaChart
            data={chartData}
            margin={{ top: 8, right: 16, bottom: 24, left: 12 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              className="stroke-border"
            />

            <XAxis
              dataKey="energy"
              type="number"
              domain={["dataMin", "dataMax"]}
              axisLine={{ className: "stroke-border" }}
              tick={{ className: "fill-muted-foreground text-xs" }}
              label={{
                value: "Energy (eV)",
                position: "insideBottom",
                offset: -12,
                className: "fill-muted-foreground text-xs",
              }}
            />

            <YAxis
              domain={hasSpin ? ["auto", "auto"] : [0, "auto"]}
              axisLine={{ className: "stroke-border" }}
              tick={{ className: "fill-muted-foreground text-xs" }}
              label={{
                value: "DOS (states/eV)",
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
              formatter={(value: number, name: string) => {
                const absVal = Math.abs(value).toFixed(3);
                if (name === "totalUp") return [`${absVal}`, "Total (Up)"];
                if (name === "totalDown") return [`${absVal}`, "Total (Down)"];
                const proj = projectionKeys.find((p) => p.key === name);
                return [`${absVal}`, proj?.label ?? name];
              }}
              labelFormatter={(label: number) => `E = ${label.toFixed(3)} eV`}
            />

            {/* Fermi level vertical reference line */}
            <ReferenceLine
              x={0}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="6 3"
              label={{
                value: "E_F",
                position: "top",
                className: "fill-muted-foreground text-xs",
              }}
            />

            {/* Total DOS (spin up) - filled area */}
            <Area
              dataKey="totalUp"
              type="monotone"
              fill="#3b82f6"
              fillOpacity={0.2}
              stroke="#3b82f6"
              strokeWidth={1.5}
              isAnimationActive={false}
              name="totalUp"
            />

            {/* Total DOS (spin down) - mirrored */}
            {hasSpin && (
              <Area
                dataKey="totalDown"
                type="monotone"
                fill="#ef4444"
                fillOpacity={0.2}
                stroke="#ef4444"
                strokeWidth={1.5}
                isAnimationActive={false}
                name="totalDown"
              />
            )}

            {/* Projected DOS lines */}
            {projectionKeys.map((proj) => (
              <Area
                key={proj.key}
                dataKey={proj.key}
                type="monotone"
                fill={proj.color}
                fillOpacity={0.05}
                stroke={proj.color}
                strokeWidth={1.2}
                isAnimationActive={false}
                name={proj.key}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>

        {/* Custom legend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-blue-500 opacity-60" />
            Total{hasSpin ? " (Up)" : ""}
          </span>
          {hasSpin && (
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-red-500 opacity-60" />
              Total (Down)
            </span>
          )}
          {projectionKeys.map((proj) => (
            <span key={proj.key} className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: proj.color, opacity: 0.7 }}
              />
              {proj.label}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
