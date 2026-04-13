"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  ZAxis,
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

interface PhaseEntry {
  composition: Record<string, number>;
  energy_per_atom: number;
  energy?: number;          // alias
  energy_above_hull?: number;
  formula: string;
  stable: boolean;
}

interface PhaseDiagramData {
  // Actual API fields
  stable_phases?: PhaseEntry[];
  unstable_phases?: PhaseEntry[];
  elements?: string[];
  n_entries?: number;
  // Legacy/fallback
  entries?: PhaseEntry[];
}

interface PhaseDiagramChartProps {
  elements: string[];
  className?: string;
}

// ── Fetch ──────────────────────────────────────────────────────────────────

async function fetchPhaseDiagram(
  elements: string[]
): Promise<PhaseDiagramData> {
  const query = elements.map((e) => e.trim()).join(",");
  const res = await fetch(
    `${API_BASE}/electronic/phase_diagram?elements=${encodeURIComponent(query)}`
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch phase diagram (${res.status})`);
  }
  return res.json();
}

// ── Custom dot for scatter ─────────────────────────────────────────────────

interface CustomDotProps {
  cx?: number;
  cy?: number;
  payload?: { stable: boolean; formula: string };
}

function StableDot({ cx, cy }: CustomDotProps) {
  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill="#22c55e"
      stroke="#16a34a"
      strokeWidth={1.5}
    />
  );
}

function UnstableDot({ cx, cy }: CustomDotProps) {
  // Render an "X" mark for unstable points
  const size = 4;
  return (
    <g>
      <line
        x1={(cx ?? 0) - size}
        y1={(cy ?? 0) - size}
        x2={(cx ?? 0) + size}
        y2={(cy ?? 0) + size}
        stroke="#ef4444"
        strokeWidth={2}
      />
      <line
        x1={(cx ?? 0) + size}
        y1={(cy ?? 0) - size}
        x2={(cx ?? 0) - size}
        y2={(cy ?? 0) + size}
        stroke="#ef4444"
        strokeWidth={2}
      />
    </g>
  );
}

// ── Custom tooltip ─────────────────────────────────────────────────────────

interface PayloadEntry {
  payload?: {
    formula?: string;
    x?: number;
    energy?: number;
    stable?: boolean;
  };
}

function PhaseTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: PayloadEntry[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  if (!d) return null;

  return (
    <div className="rounded-lg border bg-card p-2.5 text-xs shadow-md text-card-foreground">
      <p className="font-semibold">{d.formula}</p>
      <p className="text-muted-foreground">
        E<sub>form</sub> = {d.energy?.toFixed(4)} eV/atom
      </p>
      <p className={d.stable ? "text-green-600" : "text-red-500"}>
        {d.stable ? "Stable (on hull)" : "Unstable (above hull)"}
      </p>
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

export function PhaseDiagramChart({
  elements,
  className,
}: PhaseDiagramChartProps) {
  const sortedElements = useMemo(
    () => [...elements].map((e) => e.trim()).sort(),
    [elements]
  );

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["phaseDiagram", sortedElements.join(",")],
    queryFn: () => fetchPhaseDiagram(sortedElements),
    staleTime: 10 * 60 * 1000,
    retry: 1,
    enabled: sortedElements.length >= 2,
  });

  const isBinary = sortedElements.length === 2;

  // Normalise API response: supports both {stable_phases, unstable_phases} and {entries}
  const allEntries = useMemo((): PhaseEntry[] => {
    if (!data) return [];
    if (data.stable_phases || data.unstable_phases) {
      const s = (data.stable_phases ?? []).map((e) => ({ ...e, stable: true, energy: e.energy_per_atom }));
      const u = (data.unstable_phases ?? []).map((e) => ({ ...e, stable: false, energy: e.energy_per_atom }));
      return [...s, ...u];
    }
    return (data.entries ?? []);
  }, [data]);

  // Transform data for binary scatter plot
  const { stablePoints, unstablePoints, hullLine } = useMemo(() => {
    if (!allEntries.length || !isBinary) {
      return { stablePoints: [], unstablePoints: [], hullLine: [] };
    }

    const el0 = sortedElements[0];
    const el1 = sortedElements[1];

    const stable: { x: number; energy: number; formula: string; stable: boolean }[] = [];
    const unstable: { x: number; energy: number; formula: string; stable: boolean }[] = [];

    allEntries.forEach((entry) => {
      const comp = entry.composition ?? {};
      const total = (comp[el0] ?? 0) + (comp[el1] ?? 0);
      const fraction = total > 0 ? (comp[el1] ?? 0) / total : 0;
      const point = {
        x: fraction,
        energy: entry.energy_per_atom ?? entry.energy ?? 0,
        formula: entry.formula,
        stable: entry.stable,
      };
      if (entry.stable) stable.push(point);
      else unstable.push(point);
    });

    const hull = [...stable].sort((a, b) => a.x - b.x);
    return { stablePoints: stable, unstablePoints: unstable, hullLine: hull };
  }, [allEntries, isBinary, sortedElements]);

  // For ternary/multi-element: simplified view
  const multiPoints = useMemo(() => {
    if (!allEntries.length || isBinary) return { stable: [] as PhaseEntry[], unstable: [] as PhaseEntry[] };
    return {
      stable: allEntries.filter((e) => e.stable),
      unstable: allEntries.filter((e) => !e.stable),
    };
  }, [allEntries, isBinary]);

  // ── Loading state ──────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="text-lg">Phase Diagram</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[350px] w-full rounded-lg" />
          <div className="flex gap-4 mt-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Error / insufficient elements ──────────────────────────────────────

  if (sortedElements.length < 2) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="text-lg">Phase Diagram</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
            At least two elements are required to generate a phase diagram.
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="text-lg">Phase Diagram</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
            {(error as Error)?.message?.includes("404")
              ? "Phase diagram data is not available for this system."
              : `Unable to load phase diagram: ${(error as Error)?.message ?? "unknown error"}`}
          </div>
        </CardContent>
      </Card>
    );
  }

  const stableCount = data.entries.filter((e) => e.stable).length;
  const totalCount = data.entries.length;

  // ── Binary phase diagram ───────────────────────────────────────────────

  if (isBinary) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="text-lg">Phase Diagram</CardTitle>
          <CardDescription>
            {sortedElements[0]}-{sortedElements[1]} system: {stableCount} stable
            / {totalCount} total phases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={380}>
            <ScatterChart margin={{ top: 8, right: 16, bottom: 24, left: 12 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-border"
              />

              <XAxis
                dataKey="x"
                type="number"
                domain={[0, 1]}
                axisLine={{ className: "stroke-border" }}
                tick={{ className: "fill-muted-foreground text-xs" }}
                tickFormatter={(v: number) => v.toFixed(1)}
                label={{
                  value: `x in ${sortedElements[0]}₁₋ₓ${sortedElements[1]}ₓ`,
                  position: "insideBottom",
                  offset: -12,
                  className: "fill-muted-foreground text-xs",
                }}
              />

              <YAxis
                dataKey="energy"
                type="number"
                axisLine={{ className: "stroke-border" }}
                tick={{ className: "fill-muted-foreground text-xs" }}
                label={{
                  value: "Formation Energy (eV/atom)",
                  angle: -90,
                  position: "insideLeft",
                  offset: 4,
                  className: "fill-muted-foreground text-xs",
                }}
              />

              <ZAxis range={[40, 40]} />

              <Tooltip
                content={<PhaseTooltip />}
                cursor={{ strokeDasharray: "3 3" }}
              />

              {/* Zero reference line */}
              <ReferenceLine
                y={0}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="6 3"
                strokeOpacity={0.5}
              />

              {/* Convex hull line connecting stable points */}
              {hullLine.length >= 2 && (
                <Scatter
                  data={hullLine}
                  line={{ stroke: "#22c55e", strokeWidth: 2 }}
                  shape={<StableDot />}
                  isAnimationActive={false}
                  name="Hull"
                  legendType="none"
                />
              )}

              {/* Stable points (green circles) */}
              <Scatter
                data={stablePoints}
                shape={<StableDot />}
                isAnimationActive={false}
                name="Stable"
              />

              {/* Unstable points (red x marks) */}
              <Scatter
                data={unstablePoints}
                shape={<UnstableDot />}
                isAnimationActive={false}
                name="Unstable"
              />
            </ScatterChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
              Stable ({stableCount})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 text-red-500 font-bold leading-none">
                x
              </span>
              Unstable ({totalCount - stableCount})
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Multi-element (ternary+) simplified view ───────────────────────────

  // Show as a list-based scatter of stable vs unstable phases by energy
  const allPoints = data.entries
    .map((entry, idx) => ({
      idx,
      energy: entry.energy,
      formula: entry.formula,
      stable: entry.stable,
    }))
    .sort((a, b) => a.energy - b.energy);

  const stableScatter = allPoints.filter((p) => p.stable);
  const unstableScatter = allPoints.filter((p) => !p.stable);

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="text-lg">Phase Diagram</CardTitle>
        <CardDescription>
          {sortedElements.join("-")} system: {stableCount} stable / {totalCount}{" "}
          total phases
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={380}>
          <ScatterChart margin={{ top: 8, right: 16, bottom: 24, left: 12 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              className="stroke-border"
            />

            <XAxis
              dataKey="idx"
              type="number"
              axisLine={{ className: "stroke-border" }}
              tick={{ className: "fill-muted-foreground text-xs" }}
              label={{
                value: "Phase Index",
                position: "insideBottom",
                offset: -12,
                className: "fill-muted-foreground text-xs",
              }}
            />

            <YAxis
              dataKey="energy"
              type="number"
              axisLine={{ className: "stroke-border" }}
              tick={{ className: "fill-muted-foreground text-xs" }}
              label={{
                value: "Formation Energy (eV/atom)",
                angle: -90,
                position: "insideLeft",
                offset: 4,
                className: "fill-muted-foreground text-xs",
              }}
            />

            <ZAxis range={[50, 50]} />

            <Tooltip
              content={<PhaseTooltip />}
              cursor={{ strokeDasharray: "3 3" }}
            />

            <ReferenceLine
              y={0}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="6 3"
              strokeOpacity={0.5}
            />

            <Scatter
              data={stableScatter}
              shape={<StableDot />}
              isAnimationActive={false}
              name="Stable"
            />

            <Scatter
              data={unstableScatter}
              shape={<UnstableDot />}
              isAnimationActive={false}
              name="Unstable"
            />
          </ScatterChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
            Stable ({stableCount})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 text-red-500 font-bold leading-none">
              x
            </span>
            Unstable ({totalCount - stableCount})
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
