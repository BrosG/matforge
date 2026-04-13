"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface LatticeParams {
  a: number;
  b: number;
  c: number;
  alpha: number;
  beta: number;
  gamma: number;
  cell_type?: string;
  converted?: boolean;
  primitive?: {
    a: number;
    b: number;
    c: number;
    alpha: number;
    beta: number;
    gamma: number;
  };
}

function formatProp(value: number | null | undefined, digits = 4): string {
  if (value === null || value === undefined) return "--";
  return Number(value.toPrecision(digits)).toString();
}

export function LatticeToggle({ lattice }: { lattice: LatticeParams }) {
  const hasPrimitive = lattice.converted && lattice.primitive;
  const [showPrimitive, setShowPrimitive] = useState(false);

  const params = showPrimitive && lattice.primitive ? lattice.primitive : lattice;
  const cellLabel = showPrimitive ? "primitive" : (lattice.cell_type || "conventional");

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-foreground/80">
          Lattice Parameters
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            ({cellLabel} cell)
          </span>
        </h2>
        {hasPrimitive && (
          <button
            onClick={() => setShowPrimitive(!showPrimitive)}
            className={cn(
              "text-xs px-3 py-1 rounded-full border transition-colors",
              showPrimitive
                ? "bg-primary/10 border-primary/30 text-primary"
                : "bg-muted border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {showPrimitive ? "Show Conventional" : "Show Primitive"}
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {([
          ["a", params.a, "\u00C5"],
          ["b", params.b, "\u00C5"],
          ["c", params.c, "\u00C5"],
          ["\u03B1", params.alpha, "\u00B0"],
          ["\u03B2", params.beta, "\u00B0"],
          ["\u03B3", params.gamma, "\u00B0"],
        ] as const).map(([label, value, unit]) => (
          <div
            key={label}
            className={cn(
              "text-center p-3 rounded-xl border transition-colors",
              showPrimitive ? "bg-muted/50 border-dashed" : "bg-muted/30 border-border"
            )}
          >
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
              {label}
            </div>
            <div className="text-sm font-semibold text-foreground font-mono">
              {formatProp(value)}
            </div>
            <div className="text-[10px] text-muted-foreground">{unit}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
