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

// ── Types (matching actual API response) ───────────────────────────────────

interface Branch {
  start_index: number;
  end_index: number;
  name: string;
}

interface BandStructureData {
  material_id: string;
  efermi: number;
  is_metal: boolean;
  band_gap: { energy: number; direct: boolean };
  bands: number[][];           // [band_index][kpoint_index]
  kpoint_distances: number[];  // distances along k-path
  branches: Branch[];
  note?: string;
}

interface BandStructureChartProps {
  mpId: string;
  className?: string;
}

async function fetchBandStructure(mpId: string): Promise<BandStructureData> {
  const res = await fetch(
    `${API_BASE}/electronic/bandstructure/${encodeURIComponent(mpId)}`
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function prettifyLabel(label: string): string {
  return label
    .replace(/\\Gamma|GAMMA|Gamma/g, "\u0393")
    .replace(/\\Sigma|SIGMA|Sigma/g, "\u03A3")
    .replace(/\\Delta|DELTA|Delta/g, "\u0394");
}

export function BandStructureChart({ mpId, className }: BandStructureChartProps) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["bandstructure", mpId],
    queryFn: () => fetchBandStructure(mpId),
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

  const { chartData, bandKeys, symmetryLines, hasData } = useMemo(() => {
    const empty = { chartData: [], bandKeys: [], symmetryLines: [] as { x: number; label: string }[], hasData: false };
    if (!data) return empty;

    const distances = data.kpoint_distances ?? [];
    const bands = data.bands ?? [];

    // No band structure data available (mp-api not installed)
    if (distances.length === 0 || bands.length === 0) return { ...empty, hasData: false };

    const nPoints = distances.length;
    const rows: Record<string, number>[] = [];
    for (let i = 0; i < nPoints; i++) {
      const row: Record<string, number> = { kDist: distances[i] };
      bands.forEach((band, bIdx) => {
        if (band && band[i] !== undefined) row[`b_${bIdx}`] = band[i];
      });
      rows.push(row);
    }

    const keys = bands.map((_, i) => `b_${i}`);

    // Branch labels from branches array
    const symLines: { x: number; label: string }[] = [];
    for (const branch of data.branches ?? []) {
      const x = distances[branch.start_index];
      if (x !== undefined) {
        symLines.push({ x, label: prettifyLabel(branch.name.split("-")[0] ?? "") });
      }
    }
    // Add end of last branch
    const last = data.branches?.[data.branches.length - 1];
    if (last) {
      const x = distances[last.end_index];
      if (x !== undefined) {
        const endLabel = last.name.split("-")[1] ?? "";
        symLines.push({ x, label: prettifyLabel(endLabel) });
      }
    }

    return { chartData: rows, bandKeys: keys, symmetryLines: symLines, hasData: true };
  }, [data]);

  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader><CardTitle className="text-lg">Band Structure</CardTitle></CardHeader>
        <CardContent><Skeleton className="h-[300px] w-full rounded-lg" /></CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader><CardTitle className="text-lg">Band Structure</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
            {(error as Error)?.message?.includes("404")
              ? "No band structure data for this material."
              : "Band structure unavailable."}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Metadata only (mp-api not installed) — show summary instead of chart
  if (!hasData && data) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="text-lg">Band Structure</CardTitle>
          <CardDescription>
            Band gap: {data.band_gap?.energy?.toFixed(3) ?? "N/A"} eV
            {(data.band_gap?.energy ?? 0) > 0
              ? ` (${data.band_gap?.direct ? "direct" : "indirect"})`
              : " — metal"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[160px] text-center text-muted-foreground text-sm">
            <div>
              <p className="font-medium mb-1">Full band structure plot unavailable</p>
              <p className="text-xs">The mp-api package is not installed on this server.</p>
              <p className="text-xs mt-1">
                View on{" "}
                <a
                  href={`https://materialsproject.org/materials/${mpId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Materials Project
                </a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="text-lg">Band Structure</CardTitle>
        <CardDescription>
          {data?.is_metal
            ? "Metallic — no band gap"
            : `Band gap: ${data?.band_gap?.energy?.toFixed(3)} eV (${data?.band_gap?.direct ? "direct" : "indirect"})`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={340}>
          <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 24, left: 12 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
            <XAxis dataKey="kDist" type="number" domain={["dataMin", "dataMax"]} tick={false}
              label={{ value: "Wave Vector", position: "insideBottom", offset: -12 }} />
            <YAxis domain={["auto", "auto"]}
              tick={{ fontSize: 10 }}
              label={{ value: "E − E_F (eV)", angle: -90, position: "insideLeft", offset: 4, fontSize: 10 }} />
            <Tooltip
              contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", fontSize: 11 }}
              formatter={(v: number) => [`${v.toFixed(3)} eV`, ""]}
              labelFormatter={(l: number) => `k = ${l.toFixed(4)}`}
            />
            <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="6 3"
              label={{ value: "E_F", position: "right", fontSize: 10 }} />
            {symmetryLines.map((sym, i) => (
              <ReferenceLine key={i} x={sym.x} stroke="hsl(var(--muted-foreground))"
                strokeDasharray="4 4" strokeOpacity={0.5}
                label={{ value: sym.label, position: "top", fontSize: 10 }} />
            ))}
            {bandKeys.map((key) => (
              <Line key={key} dataKey={key} type="monotone" dot={false}
                strokeWidth={1} stroke="#3b82f6" activeDot={false} isAnimationActive={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
