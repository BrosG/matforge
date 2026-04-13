"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Database } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CompositionBadge } from "./CompositionBadge";
import { ElementBadge } from "./ElementBadge";

interface MaterialData {
  id: string;
  formula: string;
  crystal_system?: string | null;
  space_group?: string | null;
  band_gap?: number | null;
  formation_energy?: number | null;
  energy_above_hull?: number | null;
  source_db: string;
  is_stable?: boolean | null;
  elements: string[];
}

interface MaterialCardProps {
  material: MaterialData;
}

function formatProp(value: number | null | undefined, sourceDb?: string): string {
  if (value === undefined || value === null) {
    return sourceDb === "aflow" ? "N/A" : "--";
  }
  return Number(value.toPrecision(4)).toString();
}

function propTitle(value: number | null | undefined, sourceDb?: string): string | undefined {
  if ((value === undefined || value === null) && sourceDb === "aflow") {
    return "Not available \u2014 AFLOW does not compute this property for all entries";
  }
  return undefined;
}

export function MaterialCard({ material }: MaterialCardProps) {
  const {
    id, formula, crystal_system, space_group,
    band_gap, formation_energy, energy_above_hull,
    source_db, is_stable, elements,
  } = material;

  return (
    <Link href={`/materials/${id}`} className="block group">
      <motion.div
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={cn(
          "rounded-2xl border p-5",
          "bg-card backdrop-blur-md shadow-sm",
          "hover:shadow-lg hover:border-primary/30 transition-shadow",
          "cursor-pointer"
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <CompositionBadge formula={formula} />
          {is_stable !== undefined && (
            <span className={cn(
              "inline-flex items-center gap-1 text-xs font-medium",
              is_stable ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"
            )}>
              {is_stable ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
              {is_stable ? "Stable" : "Unstable"}
            </span>
          )}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {crystal_system && <Badge variant="info">{crystal_system}</Badge>}
          {space_group && <Badge variant="secondary">{space_group}</Badge>}
          <Badge variant="outline" className="gap-1">
            <Database className="h-3 w-3" />
            {source_db}
          </Badge>
        </div>

        {/* Properties grid */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {([
            ["Band Gap", band_gap, "eV"],
            ["E\u209Bform", formation_energy, "eV/atom"],
            ["E\u209Bhull", energy_above_hull, "eV/atom"],
          ] as const).map(([label, val, unit]) => {
            const isNull = val === undefined || val === null;
            const isAflowNull = isNull && source_db === "aflow";
            return (
              <div
                key={label}
                className={cn(
                  "text-center p-2 rounded-lg",
                  isAflowNull ? "bg-muted/30 border border-dashed border-border" : "bg-muted/40"
                )}
                title={propTitle(val, source_db)}
              >
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  {label}
                </div>
                <div className={cn(
                  "text-sm font-semibold",
                  isAflowNull ? "text-muted-foreground/50 italic text-xs" : "text-foreground"
                )}>
                  {formatProp(val, source_db)}{" "}
                  {!isNull && <span className="text-[10px] text-muted-foreground font-normal">{unit}</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Elements */}
        <div className="flex flex-wrap gap-1">
          {elements.map((el) => (
            <ElementBadge key={el} element={el} size="sm" />
          ))}
        </div>
      </motion.div>
    </Link>
  );
}
