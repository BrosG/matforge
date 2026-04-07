"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { MaterialRecord } from "@/types/campaign";

interface ParetoChartProps {
  materials: MaterialRecord[];
  allMaterials?: MaterialRecord[];
}

export function ParetoChart({ materials, allMaterials }: ParetoChartProps) {
  if (materials.length === 0) return null;

  const propKeys = Object.keys(materials[0].properties);
  if (propKeys.length < 2) {
    return (
      <p className="text-muted-foreground text-sm text-center py-8">
        Need at least 2 objectives for Pareto chart
      </p>
    );
  }

  const xKey = propKeys[0];
  const yKey = propKeys[1];

  const paretoData = materials.map((m, i) => ({
    x: m.properties[xKey],
    y: m.properties[yKey],
    score: m.score,
    index: i + 1,
    type: "pareto",
  }));

  const otherData = allMaterials
    ? allMaterials
        .filter((m) => m.dominated)
        .map((m) => ({
          x: m.properties[xKey],
          y: m.properties[yKey],
          score: m.score,
          type: "dominated",
        }))
    : [];

  return (
    <div>
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            type="number"
            dataKey="x"
            name={xKey}
            label={{
              value: xKey.replace(/_/g, " "),
              position: "bottom",
              offset: 20,
              style: { fill: "#64748b", fontSize: 12 },
            }}
            tick={{ fill: "#94a3b8", fontSize: 11 }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name={yKey}
            label={{
              value: yKey.replace(/_/g, " "),
              angle: -90,
              position: "left",
              offset: 20,
              style: { fill: "#64748b", fontSize: 12 },
            }}
            tick={{ fill: "#94a3b8", fontSize: 11 }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div className="bg-white rounded-lg border p-3 shadow-lg text-xs">
                  {d.type === "pareto" && (
                    <div className="font-semibold text-blue-600 mb-1">
                      Pareto #{d.index}
                    </div>
                  )}
                  <div className="space-y-0.5 text-gray-600">
                    <div>{xKey}: <span className="font-mono font-medium text-gray-900">{d.x?.toFixed(4)}</span></div>
                    <div>{yKey}: <span className="font-mono font-medium text-gray-900">{d.y?.toFixed(4)}</span></div>
                    <div>Score: <span className="font-mono font-medium text-gray-900">{d.score?.toFixed(4)}</span></div>
                  </div>
                </div>
              );
            }}
          />
          <Legend />
          {otherData.length > 0 && (
            <Scatter
              name="Dominated"
              data={otherData}
              fill="#cbd5e1"
              fillOpacity={0.4}
              r={3}
            />
          )}
          <Scatter
            name="Pareto Front"
            data={paretoData}
            fill="#3b82f6"
            stroke="#1d4ed8"
            strokeWidth={1}
            r={6}
            fillOpacity={0.8}
          />
        </ScatterChart>
      </ResponsiveContainer>
      {propKeys.length > 2 && (
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Showing {xKey.replace(/_/g, " ")} vs {yKey.replace(/_/g, " ")}. Additional
          objectives: {propKeys.slice(2).map((k) => k.replace(/_/g, " ")).join(", ")}
        </p>
      )}
    </div>
  );
}
