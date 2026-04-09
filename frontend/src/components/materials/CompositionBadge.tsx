import React from "react";
import { cn } from "@/lib/utils";

interface CompositionBadgeProps {
  formula: string;
  className?: string;
}

/**
 * Parses a chemical formula string and returns React nodes with proper
 * subscript numbers.
 *
 * Handles:
 *  - Simple formulas:  Al2O3  ->  Al<sub>2</sub>O<sub>3</sub>
 *  - Parenthesised groups:  Li(CoMnNi)O2  ->  Li(CoMnNi)O<sub>2</sub>
 *  - Nested numbers after parens: Ba(TiZr)O3
 */
function renderFormula(formula: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < formula.length) {
    const ch = formula[i];

    // Parentheses / brackets – pass through as-is
    if (ch === "(" || ch === ")" || ch === "[" || ch === "]") {
      nodes.push(<span key={i}>{ch}</span>);
      i++;
      continue;
    }

    // Digits following an element or closing paren → subscript
    if (/\d/.test(ch)) {
      let num = "";
      while (i < formula.length && /[\d.]/.test(formula[i])) {
        num += formula[i];
        i++;
      }
      nodes.push(
        <sub key={`sub-${i}`} className="text-[0.65em]">
          {num}
        </sub>
      );
      continue;
    }

    // Uppercase letter starts an element symbol (may be followed by lowercase)
    if (/[A-Z]/.test(ch)) {
      let symbol = ch;
      i++;
      while (i < formula.length && /[a-z]/.test(formula[i])) {
        symbol += formula[i];
        i++;
      }
      nodes.push(<span key={`el-${i}`}>{symbol}</span>);
      continue;
    }

    // Any other character (e.g. hyphens, dots)
    nodes.push(<span key={i}>{ch}</span>);
    i++;
  }

  return nodes;
}

export function CompositionBadge({ formula, className }: CompositionBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline px-3 py-1.5 rounded-lg font-bold text-lg",
        "bg-gradient-to-r from-blue-50 to-purple-50 text-gray-900",
        "border border-blue-200/60",
        className
      )}
    >
      {renderFormula(formula)}
    </span>
  );
}
