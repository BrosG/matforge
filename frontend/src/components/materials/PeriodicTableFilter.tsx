"use client";

import { useCallback } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ELEMENTS,
  CATEGORY_COLORS,
  type ElementInfo,
} from "./ElementBadge";

interface PeriodicTableFilterProps {
  selectedElements: string[];
  onChange: (elements: string[]) => void;
  className?: string;
}

function ElementButton({
  el,
  selected,
  onToggle,
}: {
  el: ElementInfo;
  selected: boolean;
  onToggle: (symbol: string) => void;
}) {
  const colors = CATEGORY_COLORS[el.category];

  return (
    <button
      type="button"
      onClick={() => onToggle(el.symbol)}
      title={`${el.name} (${el.number})`}
      style={{
        gridRow: el.row,
        gridColumn: el.col,
      }}
      className={cn(
        "relative flex flex-col items-center justify-center",
        "w-full aspect-square min-w-[2.5rem] rounded-md border text-center",
        "transition-all duration-150 cursor-pointer select-none",
        "hover:scale-110 hover:z-10 hover:shadow-md",
        selected
          ? [
              "ring-2 ring-offset-1 ring-blue-500",
              "bg-gradient-to-br from-blue-500 to-purple-500 text-white border-transparent",
              "shadow-lg",
            ]
          : [colors.bg, colors.text, colors.border, "hover:brightness-95"]
      )}
    >
      <span className="text-[8px] leading-none opacity-70">{el.number}</span>
      <span className="text-xs font-bold leading-tight">{el.symbol}</span>
      <span className="text-[6px] leading-none truncate w-full px-0.5 opacity-60">
        {el.name}
      </span>
    </button>
  );
}

export function PeriodicTableFilter({
  selectedElements,
  onChange,
  className,
}: PeriodicTableFilterProps) {
  const selectedSet = new Set(selectedElements);

  const handleToggle = useCallback(
    (symbol: string) => {
      const next = new Set(selectedElements);
      if (next.has(symbol)) {
        next.delete(symbol);
      } else {
        next.add(symbol);
      }
      onChange(Array.from(next));
    },
    [selectedElements, onChange]
  );

  const handleClearAll = () => onChange([]);

  return (
    <div className={cn("w-full", className)}>
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-700">
            Element Filter
          </h3>
          {selectedElements.length > 0 && (
            <span className="text-xs text-gray-500">
              {selectedElements.length} selected
            </span>
          )}
        </div>
        {selectedElements.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 transition-colors"
          >
            <X className="h-3 w-3" />
            Clear All
          </button>
        )}
      </div>

      {/* Periodic table grid */}
      <div className="overflow-x-auto pb-2">
        <div
          className="grid gap-[3px] min-w-[720px]"
          style={{
            gridTemplateColumns: "repeat(18, minmax(2.5rem, 1fr))",
            gridTemplateRows: "repeat(9, auto)",
          }}
        >
          {ELEMENTS.map((el) => (
            <ElementButton
              key={el.symbol}
              el={el}
              selected={selectedSet.has(el.symbol)}
              onToggle={handleToggle}
            />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3">
        {(
          [
            ["alkali-metal", "Alkali"],
            ["alkaline-earth", "Alkaline Earth"],
            ["transition-metal", "Transition"],
            ["post-transition-metal", "Post-transition"],
            ["metalloid", "Metalloid"],
            ["nonmetal", "Nonmetal"],
            ["halogen", "Halogen"],
            ["noble-gas", "Noble Gas"],
            ["lanthanide", "Lanthanide"],
            ["actinide", "Actinide"],
          ] as const
        ).map(([cat, label]) => {
          const c = CATEGORY_COLORS[cat];
          return (
            <div key={cat} className="flex items-center gap-1">
              <span
                className={cn("w-3 h-3 rounded-sm border", c.bg, c.border)}
              />
              <span className="text-[10px] text-gray-500">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
