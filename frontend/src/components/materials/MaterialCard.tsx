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

function formatProp(value: number | null | undefined): string {
  if (value === undefined || value === null) return "--";
  return Number(value.toPrecision(4)).toString();
}

export function MaterialCard({ material }: MaterialCardProps) {
  const {
    id,
    formula,
    crystal_system,
    space_group,
    band_gap,
    formation_energy,
    energy_above_hull,
    source_db,
    is_stable,
    elements,
  } = material;

  return (
    <Link href={`/materials/${id}`} className="block group">
      <motion.div
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={cn(
          "rounded-2xl border p-5",
          "bg-white/70 backdrop-blur-md shadow-sm",
          "hover:shadow-lg hover:border-blue-200 transition-shadow",
          "cursor-pointer"
        )}
      >
        {/* Header: formula + stability */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <CompositionBadge formula={formula} />
          {is_stable !== undefined && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs font-medium",
                is_stable ? "text-green-600" : "text-amber-600"
              )}
            >
              {is_stable ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <XCircle className="h-3.5 w-3.5" />
              )}
              {is_stable ? "Stable" : "Unstable"}
            </span>
          )}
        </div>

        {/* Badges row: crystal system + source */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {crystal_system && (
            <Badge variant="info">{crystal_system}</Badge>
          )}
          {space_group && (
            <Badge variant="secondary">{space_group}</Badge>
          )}
          <Badge variant="outline" className="gap-1">
            <Database className="h-3 w-3" />
            {source_db}
          </Badge>
        </div>

        {/* Key properties */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-[10px] text-gray-400 uppercase tracking-wide">
              Band Gap
            </div>
            <div className="text-sm font-semibold text-gray-800">
              {formatProp(band_gap)}{" "}
              <span className="text-[10px] text-gray-400 font-normal">eV</span>
            </div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-[10px] text-gray-400 uppercase tracking-wide">
              E<sub>form</sub>
            </div>
            <div className="text-sm font-semibold text-gray-800">
              {formatProp(formation_energy)}{" "}
              <span className="text-[10px] text-gray-400 font-normal">
                eV/atom
              </span>
            </div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-[10px] text-gray-400 uppercase tracking-wide">
              E<sub>hull</sub>
            </div>
            <div className="text-sm font-semibold text-gray-800">
              {formatProp(energy_above_hull)}{" "}
              <span className="text-[10px] text-gray-400 font-normal">
                eV/atom
              </span>
            </div>
          </div>
        </div>

        {/* Elements row */}
        <div className="flex flex-wrap gap-1">
          {elements.map((el) => (
            <ElementBadge key={el} element={el} size="sm" />
          ))}
        </div>
      </motion.div>
    </Link>
  );
}
