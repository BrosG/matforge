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
import { Loader2 } from "lucide-react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.matcraft.ai/api/v1";

const ELEMENT_COLORS = [
  "#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6",
  "#06b6d4", "#ec4899", "#14b8a6",
];

interface DosData {
  material_id: string;
  efermi: number;
  energies: number[];
  total: Record<string, number[]>;      // {"1": [densities]} keyed by spin
  elemental: Record<string, number[]>;  // {"Si": [densities]} keyed by element
}

interface DosChartProps {
  mpId: string;
  className?: string;
}

async function fetchDos(mpId: string): Promise<DosData> {
  const res = await fetch(`${API_BASE}/electronic/dos/${encodeURIComponent(mpId)}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function DosChart({ mpId, className }: DosChartProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dos", mpId],
    queryFn: () => fetchDos(mpId),
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

  const { chartData, elementKeys } = useMemo(() => {
    if (!data?.energies?.length) {
      return { chartData: [], elementKeys: [] as string[] };
    }

    const energies = data.energies;
    const efermi = data.efermi || 0;

    // Build rows: energy relative to Fermi level + total DOS + element DOS
    const totalDensities = data.total?.["1"] ?? Object.values(data.total ?? {})[0] ?? [];
    const elements = Object.keys(data.elemental ?? {});

    const rows: Record<string, number>[] = [];
    for (let i = 0; i < energies.length; i++) {
      const row: Record<string, number> = {
        energy: energies[i] - efermi,
        total: totalDensities[i] ?? 0,
      };
      for (const el of elements) {
        row[el] = data.elemental[el]?.[i] ?? 0;
      }
      rows.push(row);
    }

    return { chartData: rows, elementKeys: elements };
  }, [data]);

  if (isLoading) {
    return (
      <div className={cn("rounded-2xl border border-border bg-card p-6", className)}>
        <div className="flex items-center gap-2 mb-4">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm font-medium text-foreground">Loading Density of States...</span>
        </div>
        <div className="h-64 bg-muted/30 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (isError || !chartData.length) {
    return (
      <div className={cn("rounded-2xl border border-border bg-card p-6 text-center", className)}>
        <p className="text-sm text-muted-foreground">DOS data unavailable for this material.</p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-2xl border border-border bg-card overflow-hidden", className)}>
      <div className="px-5 pt-5 pb-2">
        <h3 className="text-base font-semibold text-foreground">Density of States</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {elementKeys.length > 0 ? `Element-projected: ${elementKeys.join(", ")}` : "Total DOS"}
        </p>
      </div>
      <div className="px-2 pb-3">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData} margin={{ top: 8, right: 16, bottom: 20, left: 8 }}>
            <defs>
              <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
            <XAxis dataKey="energy" type="number" domain={[-8, 8]}
              tick={{ fontSize: 10 }}
              label={{ value: "E - E_F (eV)", position: "insideBottom", offset: -10, fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }}
              label={{ value: "DOS", angle: -90, position: "insideLeft", offset: 4, fontSize: 10 }} />
            <Tooltip
              contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", fontSize: 11, borderRadius: 8 }}
              formatter={(v: number, name: string) => [`${v.toFixed(2)}`, name === "total" ? "Total DOS" : name]}
              labelFormatter={(e: number) => `E - E_F = ${e.toFixed(2)} eV`}
            />
            <ReferenceLine x={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="6 3"
              label={{ value: "E_F", position: "top", fontSize: 10 }} />

            {/* Total DOS */}
            <Area dataKey="total" type="monotone" stroke="#3b82f6" strokeWidth={1.5}
              fill="url(#totalGrad)" isAnimationActive={false} />

            {/* Element projections */}
            {elementKeys.map((el, i) => (
              <Area key={el} dataKey={el} type="monotone"
                stroke={ELEMENT_COLORS[i % ELEMENT_COLORS.length]}
                strokeWidth={1} fill="none" strokeDasharray="4 2" isAnimationActive={false} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {elementKeys.length > 0 && (
        <div className="px-5 pb-4 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded bg-blue-500 inline-block" /> Total
          </span>
          {elementKeys.map((el, i) => (
            <span key={el} className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded inline-block border-t-2 border-dashed"
                style={{ borderColor: ELEMENT_COLORS[i % ELEMENT_COLORS.length] }} /> {el}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
