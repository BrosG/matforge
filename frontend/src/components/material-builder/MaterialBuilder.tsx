"use client";

import {
  useReducer,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Canvas, useThree, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import * as THREE from "three";
import { attachContextLossHandlers } from "@/lib/webgl-recovery";
import {
  ArrowLeft,
  Undo2,
  Redo2,
  Trash2,
  Download,
  Upload,
  Eraser,
  Grid3x3,
  Atom,
  ChevronDown,
  ChevronRight,
  X,
  Plus,
  Copy,
  Ruler,
  Share2,
  Layers,
  Circle,
  FileUp,
  Keyboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ── CPK Colors (from MaterialStructureViewer) ─────────────────────────────
const CPK_COLORS: Record<string, string> = {
  H: "#FFFFFF", He: "#D9FFFF", Li: "#CC80FF", Be: "#C2FF00", B: "#FFB5B5",
  C: "#909090", N: "#3050F8", O: "#FF0D0D", F: "#90E050", Ne: "#B3E3F5",
  Na: "#AB5CF2", Mg: "#8AFF00", Al: "#BFA6A6", Si: "#F0C8A0", P: "#FF8000",
  S: "#FFFF30", Cl: "#1FF01F", Ar: "#80D1E3", K: "#8F40D4", Ca: "#3DFF00",
  Ti: "#BFC2C7", V: "#A6A6AB", Cr: "#8A99C7", Mn: "#9C7AC7", Fe: "#E06633",
  Co: "#F090A0", Ni: "#50D050", Cu: "#C88033", Zn: "#7D80B0", Ga: "#C28F8F",
  Ge: "#668F8F", As: "#BD80E3", Se: "#FFA100", Br: "#A62929", Kr: "#5CB8D1",
  Rb: "#702EB0", Sr: "#00FF00", Y: "#94FFFF", Zr: "#94E0E0", Nb: "#73C2C9",
  Mo: "#54B5B5", Ru: "#248F8F", Rh: "#0A7D8C", Pd: "#006985", Ag: "#C0C0C0",
  Cd: "#FFD98F", In: "#A67573", Sn: "#668080", Sb: "#9E63B5", Te: "#D47A00",
  I: "#940094", Xe: "#429EB0", Cs: "#57178F", Ba: "#00C900", La: "#70D4FF",
  Ce: "#FFFFC7", Nd: "#C7FFC7", Sm: "#00FF98", Gd: "#45FFC7", Yb: "#00BF38",
  Pt: "#D0D0E0", Au: "#FFD123", Hg: "#B8B8D0", Pb: "#575961", Bi: "#9E4FB5",
  U: "#008FFF",
};

const ELEMENT_RADII: Record<string, number> = {
  H: 0.25, He: 0.28, C: 0.35, N: 0.35, O: 0.33, F: 0.32, Si: 0.45,
  P: 0.4, S: 0.4, Cl: 0.38, Fe: 0.45, Cu: 0.42, Zn: 0.42, Br: 0.42,
  I: 0.48, Li: 0.38, Na: 0.42, Al: 0.43, Ti: 0.46, V: 0.44, Cr: 0.43,
  Mn: 0.44, Co: 0.43, Ni: 0.42, Ga: 0.43, As: 0.42, La: 0.52, Ce: 0.52,
  Nd: 0.50, Sm: 0.50, Gd: 0.49, Yb: 0.48,
};
const DEFAULT_RADIUS = 0.38;

// ── Element categories ────────────────────────────────────────────────────
const ELEMENT_CATEGORIES = {
  Common: ["Si", "C", "O", "N", "Fe", "Cu", "Ti", "Al", "Ga", "As", "Li", "Na"],
  "Transition Metals": ["Fe", "Co", "Ni", "Cu", "Zn", "Ti", "V", "Cr", "Mn"],
  "Rare Earth": ["La", "Ce", "Nd", "Sm", "Gd", "Yb"],
} as const;

// Flat list of all unique elements for dropdowns
const ALL_ELEMENTS = Array.from(
  new Set(Object.values(ELEMENT_CATEGORIES).flat())
).sort();

// ── Crystal system constraints ────────────────────────────────────────────
type CrystalSystem = "Cubic" | "Hexagonal" | "Tetragonal" | "Orthorhombic" | "Monoclinic" | "Triclinic";

function constrainLattice(
  system: CrystalSystem,
  a: number, b: number, c: number,
  alpha: number, beta: number, gamma: number
): { a: number; b: number; c: number; alpha: number; beta: number; gamma: number } {
  switch (system) {
    case "Cubic":
      return { a, b: a, c: a, alpha: 90, beta: 90, gamma: 90 };
    case "Hexagonal":
      return { a, b: a, c, alpha: 90, beta: 90, gamma: 120 };
    case "Tetragonal":
      return { a, b: a, c, alpha: 90, beta: 90, gamma: 90 };
    case "Orthorhombic":
      return { a, b, c, alpha: 90, beta: 90, gamma: 90 };
    case "Monoclinic":
      return { a, b, c, alpha: 90, beta, gamma: 90 };
    case "Triclinic":
      return { a, b, c, alpha, beta, gamma };
  }
}

// ── Lattice math ──────────────────────────────────────────────────────────
interface LatticeParams {
  a: number; b: number; c: number;
  alpha: number; beta: number; gamma: number;
}

function fracToCart(
  fx: number, fy: number, fz: number, lat: LatticeParams
): [number, number, number] {
  const { a, b, c, alpha, beta, gamma } = lat;
  const ar = (alpha * Math.PI) / 180;
  const br = (beta * Math.PI) / 180;
  const gr = (gamma * Math.PI) / 180;
  const cosA = Math.cos(ar), cosB = Math.cos(br), cosG = Math.cos(gr);
  const sinG = Math.sin(gr);
  const va: [number, number, number] = [a, 0, 0];
  const vb: [number, number, number] = [b * cosG, b * sinG, 0];
  const cx2 = c * cosB;
  const cy2 = c * (cosA - cosB * cosG) / sinG;
  const cz2 = Math.sqrt(Math.max(0, c * c - cx2 * cx2 - cy2 * cy2));
  const vc: [number, number, number] = [cx2, cy2, cz2];
  return [
    fx * va[0] + fy * vb[0] + fz * vc[0],
    fx * va[1] + fy * vb[1] + fz * vc[1],
    fx * va[2] + fy * vb[2] + fz * vc[2],
  ];
}

function unitCellEdges(lat: LatticeParams): [number, number, number, number, number, number][] {
  const o = fracToCart(0, 0, 0, lat);
  const a = fracToCart(1, 0, 0, lat);
  const b = fracToCart(0, 1, 0, lat);
  const c = fracToCart(0, 0, 1, lat);
  const ab = fracToCart(1, 1, 0, lat);
  const ac = fracToCart(1, 0, 1, lat);
  const bc = fracToCart(0, 1, 1, lat);
  const abc = fracToCart(1, 1, 1, lat);
  const edge = (p1: [number, number, number], p2: [number, number, number]) =>
    [...p1, ...p2] as [number, number, number, number, number, number];
  return [
    edge(o, a), edge(o, b), edge(o, c),
    edge(a, ab), edge(a, ac),
    edge(b, ab), edge(b, bc),
    edge(c, ac), edge(c, bc),
    edge(ab, abc), edge(ac, abc), edge(bc, abc),
  ];
}

function latticeVolume(lat: LatticeParams): number {
  const { a, b, c, alpha, beta, gamma } = lat;
  const ar = (alpha * Math.PI) / 180;
  const br = (beta * Math.PI) / 180;
  const gr = (gamma * Math.PI) / 180;
  const cosA = Math.cos(ar), cosB = Math.cos(br), cosG = Math.cos(gr);
  return a * b * c * Math.sqrt(
    1 - cosA * cosA - cosB * cosB - cosG * cosG + 2 * cosA * cosB * cosG
  );
}

// ── Structure Prototypes ─────────────────────────────────────────────────
interface PrototypeDef {
  name: string;
  system: CrystalSystem;
  lattice: LatticeParams;
  atoms: { element: string; fx: number; fy: number; fz: number }[];
}

const STRUCTURE_PROTOTYPES: PrototypeDef[] = [
  {
    name: "FCC (Cu)",
    system: "Cubic",
    lattice: { a: 3.61, b: 3.61, c: 3.61, alpha: 90, beta: 90, gamma: 90 },
    atoms: [
      { element: "Cu", fx: 0, fy: 0, fz: 0 },
      { element: "Cu", fx: 0.5, fy: 0.5, fz: 0 },
      { element: "Cu", fx: 0.5, fy: 0, fz: 0.5 },
      { element: "Cu", fx: 0, fy: 0.5, fz: 0.5 },
    ],
  },
  {
    name: "BCC (Fe)",
    system: "Cubic",
    lattice: { a: 2.87, b: 2.87, c: 2.87, alpha: 90, beta: 90, gamma: 90 },
    atoms: [
      { element: "Fe", fx: 0, fy: 0, fz: 0 },
      { element: "Fe", fx: 0.5, fy: 0.5, fz: 0.5 },
    ],
  },
  {
    name: "HCP (Ti)",
    system: "Hexagonal",
    lattice: { a: 2.95, b: 2.95, c: 4.68, alpha: 90, beta: 90, gamma: 120 },
    atoms: [
      { element: "Ti", fx: 0, fy: 0, fz: 0 },
      { element: "Ti", fx: 1 / 3, fy: 2 / 3, fz: 0.5 },
    ],
  },
  {
    name: "Diamond (Si)",
    system: "Cubic",
    lattice: { a: 5.43, b: 5.43, c: 5.43, alpha: 90, beta: 90, gamma: 90 },
    atoms: [
      { element: "Si", fx: 0, fy: 0, fz: 0 },
      { element: "Si", fx: 0.5, fy: 0.5, fz: 0 },
      { element: "Si", fx: 0.5, fy: 0, fz: 0.5 },
      { element: "Si", fx: 0, fy: 0.5, fz: 0.5 },
      { element: "Si", fx: 0.25, fy: 0.25, fz: 0.25 },
      { element: "Si", fx: 0.75, fy: 0.75, fz: 0.25 },
      { element: "Si", fx: 0.75, fy: 0.25, fz: 0.75 },
      { element: "Si", fx: 0.25, fy: 0.75, fz: 0.75 },
    ],
  },
  {
    name: "Rocksalt (NaCl)",
    system: "Cubic",
    lattice: { a: 5.64, b: 5.64, c: 5.64, alpha: 90, beta: 90, gamma: 90 },
    atoms: [
      { element: "Na", fx: 0, fy: 0, fz: 0 },
      { element: "Na", fx: 0.5, fy: 0.5, fz: 0 },
      { element: "Na", fx: 0.5, fy: 0, fz: 0.5 },
      { element: "Na", fx: 0, fy: 0.5, fz: 0.5 },
      { element: "Cl", fx: 0.5, fy: 0, fz: 0 },
      { element: "Cl", fx: 0, fy: 0.5, fz: 0 },
      { element: "Cl", fx: 0, fy: 0, fz: 0.5 },
      { element: "Cl", fx: 0.5, fy: 0.5, fz: 0.5 },
    ],
  },
  {
    name: "Perovskite (ABO3)",
    system: "Cubic",
    lattice: { a: 3.91, b: 3.91, c: 3.91, alpha: 90, beta: 90, gamma: 90 },
    atoms: [
      { element: "Sr", fx: 0, fy: 0, fz: 0 },
      { element: "Ti", fx: 0.5, fy: 0.5, fz: 0.5 },
      { element: "O", fx: 0.5, fy: 0.5, fz: 0 },
      { element: "O", fx: 0.5, fy: 0, fz: 0.5 },
      { element: "O", fx: 0, fy: 0.5, fz: 0.5 },
    ],
  },
  {
    name: "Fluorite (CaF2)",
    system: "Cubic",
    lattice: { a: 5.46, b: 5.46, c: 5.46, alpha: 90, beta: 90, gamma: 90 },
    atoms: [
      { element: "Ca", fx: 0, fy: 0, fz: 0 },
      { element: "Ca", fx: 0.5, fy: 0.5, fz: 0 },
      { element: "Ca", fx: 0.5, fy: 0, fz: 0.5 },
      { element: "Ca", fx: 0, fy: 0.5, fz: 0.5 },
      { element: "F", fx: 0.25, fy: 0.25, fz: 0.25 },
      { element: "F", fx: 0.75, fy: 0.75, fz: 0.25 },
      { element: "F", fx: 0.75, fy: 0.25, fz: 0.75 },
      { element: "F", fx: 0.25, fy: 0.75, fz: 0.75 },
      { element: "F", fx: 0.25, fy: 0.75, fz: 0.25 },
      { element: "F", fx: 0.75, fy: 0.25, fz: 0.25 },
      { element: "F", fx: 0.25, fy: 0.25, fz: 0.75 },
      { element: "F", fx: 0.75, fy: 0.75, fz: 0.75 },
    ],
  },
  {
    name: "Zincblende (GaAs)",
    system: "Cubic",
    lattice: { a: 5.65, b: 5.65, c: 5.65, alpha: 90, beta: 90, gamma: 90 },
    atoms: [
      { element: "Ga", fx: 0, fy: 0, fz: 0 },
      { element: "Ga", fx: 0.5, fy: 0.5, fz: 0 },
      { element: "Ga", fx: 0.5, fy: 0, fz: 0.5 },
      { element: "Ga", fx: 0, fy: 0.5, fz: 0.5 },
      { element: "As", fx: 0.25, fy: 0.25, fz: 0.25 },
      { element: "As", fx: 0.75, fy: 0.75, fz: 0.25 },
      { element: "As", fx: 0.75, fy: 0.25, fz: 0.75 },
      { element: "As", fx: 0.25, fy: 0.75, fz: 0.75 },
    ],
  },
  {
    name: "Wurtzite (ZnO)",
    system: "Hexagonal",
    lattice: { a: 3.25, b: 3.25, c: 5.21, alpha: 90, beta: 90, gamma: 120 },
    atoms: [
      { element: "Zn", fx: 1 / 3, fy: 2 / 3, fz: 0 },
      { element: "Zn", fx: 2 / 3, fy: 1 / 3, fz: 0.5 },
      { element: "O", fx: 1 / 3, fy: 2 / 3, fz: 0.382 },
      { element: "O", fx: 2 / 3, fy: 1 / 3, fz: 0.882 },
    ],
  },
  {
    name: "Spinel (MgAl2O4)",
    system: "Cubic",
    lattice: { a: 8.08, b: 8.08, c: 8.08, alpha: 90, beta: 90, gamma: 90 },
    atoms: [
      // Tetrahedral A sites (Mg)
      { element: "Mg", fx: 0.125, fy: 0.125, fz: 0.125 },
      { element: "Mg", fx: 0.875, fy: 0.875, fz: 0.125 },
      { element: "Mg", fx: 0.875, fy: 0.125, fz: 0.875 },
      { element: "Mg", fx: 0.125, fy: 0.875, fz: 0.875 },
      { element: "Mg", fx: 0.625, fy: 0.625, fz: 0.625 },
      { element: "Mg", fx: 0.375, fy: 0.375, fz: 0.625 },
      { element: "Mg", fx: 0.375, fy: 0.625, fz: 0.375 },
      { element: "Mg", fx: 0.625, fy: 0.375, fz: 0.375 },
      // Octahedral B sites (Al)
      { element: "Al", fx: 0.5, fy: 0.5, fz: 0.5 },
      { element: "Al", fx: 0.5, fy: 0.25, fz: 0.25 },
      { element: "Al", fx: 0.25, fy: 0.5, fz: 0.25 },
      { element: "Al", fx: 0.25, fy: 0.25, fz: 0.5 },
      { element: "Al", fx: 0, fy: 0, fz: 0.5 },
      { element: "Al", fx: 0, fy: 0.5, fz: 0 },
      { element: "Al", fx: 0.5, fy: 0, fz: 0 },
      { element: "Al", fx: 0.75, fy: 0.75, fz: 0.5 },
      { element: "Al", fx: 0.75, fy: 0.5, fz: 0.75 },
      { element: "Al", fx: 0.5, fy: 0.75, fz: 0.75 },
      { element: "Al", fx: 0, fy: 0.25, fz: 0.75 },
      { element: "Al", fx: 0.25, fy: 0, fz: 0.75 },
      { element: "Al", fx: 0, fy: 0.75, fz: 0.25 },
      { element: "Al", fx: 0.75, fy: 0, fz: 0.25 },
      { element: "Al", fx: 0.25, fy: 0.75, fz: 0 },
      { element: "Al", fx: 0.75, fy: 0.25, fz: 0 },
      // Oxygen sites
      { element: "O", fx: 0.264, fy: 0.264, fz: 0.264 },
      { element: "O", fx: 0.736, fy: 0.736, fz: 0.264 },
      { element: "O", fx: 0.736, fy: 0.264, fz: 0.736 },
      { element: "O", fx: 0.264, fy: 0.736, fz: 0.736 },
      { element: "O", fx: 0.236, fy: 0.236, fz: 0.736 },
      { element: "O", fx: 0.764, fy: 0.764, fz: 0.736 },
      { element: "O", fx: 0.764, fy: 0.236, fz: 0.236 },
      { element: "O", fx: 0.236, fy: 0.764, fz: 0.236 },
      { element: "O", fx: 0.014, fy: 0.014, fz: 0.014 },
      { element: "O", fx: 0.986, fy: 0.986, fz: 0.014 },
      { element: "O", fx: 0.986, fy: 0.014, fz: 0.986 },
      { element: "O", fx: 0.014, fy: 0.986, fz: 0.986 },
      { element: "O", fx: 0.486, fy: 0.486, fz: 0.986 },
      { element: "O", fx: 0.514, fy: 0.514, fz: 0.986 },
      { element: "O", fx: 0.514, fy: 0.486, fz: 0.014 },
      { element: "O", fx: 0.486, fy: 0.514, fz: 0.014 },
      { element: "O", fx: 0.486, fy: 0.014, fz: 0.486 },
      { element: "O", fx: 0.514, fy: 0.986, fz: 0.486 },
      { element: "O", fx: 0.514, fy: 0.014, fz: 0.514 },
      { element: "O", fx: 0.486, fy: 0.986, fz: 0.514 },
      { element: "O", fx: 0.014, fy: 0.486, fz: 0.486 },
      { element: "O", fx: 0.986, fy: 0.514, fz: 0.486 },
      { element: "O", fx: 0.014, fy: 0.514, fz: 0.514 },
      { element: "O", fx: 0.986, fy: 0.486, fz: 0.514 },
    ],
  },
];

// ── CIF / POSCAR parsers ─────────────────────────────────────────────────

function parseCIF(text: string): { lattice: LatticeParams; atoms: { element: string; fx: number; fy: number; fz: number }[] } | null {
  try {
    const getVal = (key: string): number => {
      const re = new RegExp(`${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+([\\d.]+(?:\\([\\d]+\\))?)`);
      const m = text.match(re);
      return m ? parseFloat(m[1]) : 0;
    };
    const a = getVal("_cell_length_a");
    const b = getVal("_cell_length_b");
    const c = getVal("_cell_length_c");
    const alpha = getVal("_cell_angle_alpha") || 90;
    const beta = getVal("_cell_angle_beta") || 90;
    const gamma = getVal("_cell_angle_gamma") || 90;
    if (a === 0) return null;
    const lattice: LatticeParams = { a, b, c, alpha, beta, gamma };

    // Determine which columns to use
    const atoms: { element: string; fx: number; fy: number; fz: number }[] = [];
    const lines = text.split("\n");
    let inLoop = false;
    const loopHeaders: string[] = [];
    let dataStarted = false;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (line === "loop_") {
        inLoop = true;
        loopHeaders.length = 0;
        dataStarted = false;
        continue;
      }
      if (inLoop && line.startsWith("_atom_site_")) {
        loopHeaders.push(line);
        continue;
      }
      if (inLoop && loopHeaders.length > 0 && !line.startsWith("_") && line !== "" && !line.startsWith("loop_") && !line.startsWith("#")) {
        dataStarted = true;
        const parts = line.split(/\s+/);
        if (parts.length < loopHeaders.length) {
          if (dataStarted) { inLoop = false; }
          continue;
        }

        const labelIdx = loopHeaders.indexOf("_atom_site_label");
        const typeIdx = loopHeaders.indexOf("_atom_site_type_symbol");
        const fxIdx = loopHeaders.indexOf("_atom_site_fract_x");
        const fyIdx = loopHeaders.indexOf("_atom_site_fract_y");
        const fzIdx = loopHeaders.indexOf("_atom_site_fract_z");
        const cxIdx = loopHeaders.indexOf("_atom_site_Cartn_x");
        const cyIdx = loopHeaders.indexOf("_atom_site_Cartn_y");
        const czIdx = loopHeaders.indexOf("_atom_site_Cartn_z");

        let element = "X";
        if (typeIdx >= 0 && parts[typeIdx]) {
          element = parts[typeIdx].replace(/[^A-Za-z]/g, "");
        } else if (labelIdx >= 0 && parts[labelIdx]) {
          element = parts[labelIdx].replace(/[^A-Za-z]/g, "").replace(/\d+/g, "");
        }
        // Capitalize first letter only
        if (element.length > 0) {
          element = element.charAt(0).toUpperCase() + element.slice(1).toLowerCase();
        }

        if (fxIdx >= 0 && fyIdx >= 0 && fzIdx >= 0) {
          atoms.push({
            element,
            fx: parseFloat(parts[fxIdx]) || 0,
            fy: parseFloat(parts[fyIdx]) || 0,
            fz: parseFloat(parts[fzIdx]) || 0,
          });
        } else if (cxIdx >= 0 && cyIdx >= 0 && czIdx >= 0) {
          // Cartesian -- store as-is, caller converts
          atoms.push({
            element,
            fx: parseFloat(parts[cxIdx]) || 0,
            fy: parseFloat(parts[cyIdx]) || 0,
            fz: parseFloat(parts[czIdx]) || 0,
          });
        }
      }
      if (inLoop && dataStarted && (line === "" || line.startsWith("loop_") || line.startsWith("_") || line.startsWith("#"))) {
        inLoop = false;
      }
    }
    return { lattice, atoms };
  } catch {
    return null;
  }
}

function parsePOSCAR(text: string): { lattice: LatticeParams; atoms: { element: string; fx: number; fy: number; fz: number }[] } | null {
  try {
    const lines = text.split("\n").map((l) => l.trim()).filter((l) => l !== "");
    if (lines.length < 8) return null;
    const scale = parseFloat(lines[1]) || 1;
    const v1 = lines[2].split(/\s+/).map(Number);
    const v2 = lines[3].split(/\s+/).map(Number);
    const v3 = lines[4].split(/\s+/).map(Number);

    // Scale vectors
    const sv1 = v1.map((x) => x * scale);
    const sv2 = v2.map((x) => x * scale);
    const sv3 = v3.map((x) => x * scale);

    // Calculate lattice params from vectors
    const aLen = Math.sqrt(sv1[0] ** 2 + sv1[1] ** 2 + sv1[2] ** 2);
    const bLen = Math.sqrt(sv2[0] ** 2 + sv2[1] ** 2 + sv2[2] ** 2);
    const cLen = Math.sqrt(sv3[0] ** 2 + sv3[1] ** 2 + sv3[2] ** 2);
    const dot = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const alphaAngle = Math.acos(dot(sv2, sv3) / (bLen * cLen)) * 180 / Math.PI;
    const betaAngle = Math.acos(dot(sv1, sv3) / (aLen * cLen)) * 180 / Math.PI;
    const gammaAngle = Math.acos(dot(sv1, sv2) / (aLen * bLen)) * 180 / Math.PI;
    const lattice: LatticeParams = { a: aLen, b: bLen, c: cLen, alpha: alphaAngle, beta: betaAngle, gamma: gammaAngle };

    // Element names line (VASP 5+)
    let elemLine = 5;
    const elements: string[] = [];
    const counts: number[] = [];
    // Check if line 5 has numbers or strings
    const possibleElements = lines[elemLine].split(/\s+/);
    if (possibleElements.every((x) => !isNaN(Number(x)))) {
      // VASP4 format: no element line, just counts
      counts.push(...possibleElements.map(Number));
      elemLine = 5;
    } else {
      elements.push(...possibleElements);
      elemLine = 6;
      counts.push(...lines[elemLine].split(/\s+/).map(Number));
    }

    let coordLine = elemLine + 1;
    // Check for Selective dynamics
    if (lines[coordLine] && lines[coordLine].toLowerCase().startsWith("s")) {
      coordLine++;
    }
    const isDirect = lines[coordLine] && (lines[coordLine].toLowerCase().startsWith("d") || lines[coordLine].toLowerCase().startsWith("f"));
    coordLine++;

    const atoms: { element: string; fx: number; fy: number; fz: number }[] = [];
    let atomIdx = 0;
    for (let eIdx = 0; eIdx < counts.length; eIdx++) {
      const el = elements[eIdx] || `X${eIdx + 1}`;
      for (let j = 0; j < counts[eIdx]; j++) {
        if (coordLine + atomIdx >= lines.length) break;
        const coords = lines[coordLine + atomIdx].split(/\s+/).map(Number);
        if (isDirect) {
          atoms.push({ element: el, fx: coords[0], fy: coords[1], fz: coords[2] });
        } else {
          // Cartesian -- convert back to fractional (approximate)
          atoms.push({ element: el, fx: coords[0] / aLen, fy: coords[1] / bLen, fz: coords[2] / cLen });
        }
        atomIdx++;
      }
    }
    return { lattice, atoms };
  } catch {
    return null;
  }
}

// ── Atom state ────────────────────────────────────────────────────────────
interface PlacedAtom {
  id: string;
  element: string;
  x: number; y: number; z: number; // Cartesian Angstrom
}

interface BuilderState {
  atoms: PlacedAtom[];
  selectedId: string | null;
  history: PlacedAtom[][];
  historyIndex: number;
}

type BuilderAction =
  | { type: "ADD_ATOM"; atom: PlacedAtom }
  | { type: "REMOVE_ATOM"; id: string }
  | { type: "MOVE_ATOM"; id: string; x: number; y: number; z: number }
  | { type: "CHANGE_ELEMENT"; id: string; element: string }
  | { type: "SELECT"; id: string | null }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "CLEAR" }
  | { type: "LOAD"; atoms: PlacedAtom[] };

function pushHistory(state: BuilderState, newAtoms: PlacedAtom[]): BuilderState {
  const newHistory = state.history.slice(0, state.historyIndex + 1);
  newHistory.push(newAtoms);
  return {
    ...state,
    atoms: newAtoms,
    history: newHistory,
    historyIndex: newHistory.length - 1,
  };
}

function builderReducer(state: BuilderState, action: BuilderAction): BuilderState {
  switch (action.type) {
    case "ADD_ATOM":
      return pushHistory(state, [...state.atoms, action.atom]);
    case "REMOVE_ATOM":
      return {
        ...pushHistory(state, state.atoms.filter((a) => a.id !== action.id)),
        selectedId: state.selectedId === action.id ? null : state.selectedId,
      };
    case "MOVE_ATOM":
      return pushHistory(
        state,
        state.atoms.map((a) =>
          a.id === action.id ? { ...a, x: action.x, y: action.y, z: action.z } : a
        )
      );
    case "CHANGE_ELEMENT":
      return pushHistory(
        state,
        state.atoms.map((a) =>
          a.id === action.id ? { ...a, element: action.element } : a
        )
      );
    case "SELECT":
      return { ...state, selectedId: action.id };
    case "UNDO": {
      if (state.historyIndex <= 0) return state;
      const idx = state.historyIndex - 1;
      return { ...state, atoms: state.history[idx], historyIndex: idx, selectedId: null };
    }
    case "REDO": {
      if (state.historyIndex >= state.history.length - 1) return state;
      const idx = state.historyIndex + 1;
      return { ...state, atoms: state.history[idx], historyIndex: idx, selectedId: null };
    }
    case "CLEAR":
      return pushHistory(state, []);
    case "LOAD":
      return pushHistory(state, action.atoms);
    default:
      return state;
  }
}

const initialState: BuilderState = {
  atoms: [],
  selectedId: null,
  history: [[]],
  historyIndex: 0,
};

// ── 3D sub-components ─────────────────────────────────────────────────────

function AtomSphere({
  atom,
  isSelected,
  onSelect,
  onDrag,
  onContextMenu,
}: {
  atom: PlacedAtom;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDrag: (id: string, pos: [number, number, number]) => void;
  onContextMenu: (id: string, screenX: number, screenY: number) => void;
}) {
  const color = CPK_COLORS[atom.element] ?? "#888888";
  const radius = ELEMENT_RADII[atom.element] ?? DEFAULT_RADIUS;
  const meshRef = useRef<THREE.Mesh>(null);
  const isDragging = useRef(false);
  const { camera, gl } = useThree();

  const handlePointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      if (e.nativeEvent.button === 2) {
        // Right-click
        onContextMenu(atom.id, e.nativeEvent.clientX, e.nativeEvent.clientY);
        return;
      }
      onSelect(atom.id);
      isDragging.current = true;
      (e.target as HTMLElement)?.setPointerCapture?.(e.pointerId);
    },
    [atom.id, onSelect, onContextMenu]
  );

  const handlePointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (!isDragging.current || !meshRef.current) return;
      e.stopPropagation();
      const atomPos = new THREE.Vector3(atom.x, atom.y, atom.z);
      atomPos.project(camera);
      const rect = gl.domElement.getBoundingClientRect();
      const mouseNDC = new THREE.Vector3(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
        atomPos.z
      );
      mouseNDC.unproject(camera);
      onDrag(atom.id, [mouseNDC.x, mouseNDC.y, mouseNDC.z]);
    },
    [atom, camera, gl, onDrag]
  );

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  return (
    <mesh
      ref={meshRef}
      position={[atom.x, atom.y, atom.z]}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <sphereGeometry args={[radius, 32, 32]} />
      <meshStandardMaterial
        color={color}
        metalness={0.3}
        roughness={0.4}
        emissive={isSelected ? "#4488ff" : "#000000"}
        emissiveIntensity={isSelected ? 0.5 : 0}
      />
      {isSelected && (
        <mesh>
          <sphereGeometry args={[radius + 0.08, 32, 32]} />
          <meshStandardMaterial
            color="#4488ff"
            transparent
            opacity={0.2}
            side={THREE.BackSide}
          />
        </mesh>
      )}
    </mesh>
  );
}

function CellEdge({
  start,
  end,
}: {
  start: [number, number, number];
  end: [number, number, number];
}) {
  const { position, rotation, length } = useMemo(() => {
    const s = new THREE.Vector3(...start);
    const e = new THREE.Vector3(...end);
    const mid = s.clone().add(e).multiplyScalar(0.5);
    const dir = e.clone().sub(s);
    const len = dir.length();
    const orientation = new THREE.Quaternion();
    orientation.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    const euler = new THREE.Euler().setFromQuaternion(orientation);
    return {
      position: [mid.x, mid.y, mid.z] as [number, number, number],
      rotation: [euler.x, euler.y, euler.z] as [number, number, number],
      length: len,
    };
  }, [start, end]);

  return (
    <mesh position={position} rotation={rotation}>
      <cylinderGeometry args={[0.02, 0.02, length, 4]} />
      <meshStandardMaterial
        color="#6366f1"
        metalness={0.1}
        roughness={0.8}
        transparent
        opacity={0.6}
      />
    </mesh>
  );
}

/**
 * 3D placement volume — three orthogonal invisible planes (XY, XZ, YZ)
 * so clicks register in all three dimensions, not just a flat grid.
 * Click positions are snapped to fractional coordinate increments (0.25).
 */
function ClickPlane({
  onPlace,
}: {
  onPlace: (pos: [number, number, number]) => void;
}) {
  const handleClick = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (e.object.userData.isPlacementPlane) {
        e.stopPropagation();
        const pt = e.point;
        // Snap to 0.25 Angstrom grid for reasonable placement precision
        const snap = (v: number) => Math.round(v * 4) / 4;
        onPlace([snap(pt.x), snap(pt.y), snap(pt.z)]);
      }
    },
    [onPlace]
  );

  const planeProps = {
    onPointerDown: handleClick,
    userData: { isPlacementPlane: true },
  };

  return (
    <group>
      {/* XY plane (horizontal floor) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} {...planeProps}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial visible={false} side={2} />
      </mesh>
      {/* XZ plane (vertical wall facing Y) */}
      <mesh rotation={[0, 0, 0]} position={[0, 0, 0]} {...planeProps}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial visible={false} side={2} />
      </mesh>
      {/* YZ plane (vertical wall facing X) */}
      <mesh rotation={[0, Math.PI / 2, 0]} position={[0, 0, 0]} {...planeProps}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial visible={false} side={2} />
      </mesh>
    </group>
  );
}

/** Camera controller exposed to parent via ref */
function CameraController({ controlsRef }: { controlsRef: React.MutableRefObject<{ fitToAtoms: (atoms: PlacedAtom[]) => void; setView: (axis: "x" | "y" | "z") => void; toggleAutoRotate: () => boolean } | null> }) {
  const { camera } = useThree();
  const orbitRef = useRef<any>(null);

  useEffect(() => {
    controlsRef.current = {
      fitToAtoms: (atoms: PlacedAtom[]) => {
        if (atoms.length === 0) return;
        const center = new THREE.Vector3();
        atoms.forEach((a) => center.add(new THREE.Vector3(a.x, a.y, a.z)));
        center.divideScalar(atoms.length);
        let maxR = 1;
        atoms.forEach((a) => {
          const d = new THREE.Vector3(a.x, a.y, a.z).distanceTo(center);
          if (d > maxR) maxR = d;
        });
        const dist = Math.max(maxR * 2.5, 6);
        const dir = camera.position.clone().sub(orbitRef.current?.target || new THREE.Vector3()).normalize();
        camera.position.copy(center.clone().add(dir.multiplyScalar(dist)));
        if (orbitRef.current) {
          orbitRef.current.target.copy(center);
          orbitRef.current.update();
        }
      },
      setView: (axis: "x" | "y" | "z") => {
        const target = orbitRef.current?.target || new THREE.Vector3();
        const dist = camera.position.distanceTo(target);
        const pos = target.clone();
        if (axis === "x") pos.x += dist;
        else if (axis === "y") pos.y += dist;
        else pos.z += dist;
        camera.position.copy(pos);
        camera.lookAt(target);
        if (orbitRef.current) orbitRef.current.update();
      },
      toggleAutoRotate: () => {
        if (orbitRef.current) {
          orbitRef.current.autoRotate = !orbitRef.current.autoRotate;
          return orbitRef.current.autoRotate;
        }
        return false;
      },
    };
  }, [camera, controlsRef]);

  return (
    <OrbitControls
      ref={orbitRef}
      makeDefault
      enablePan
      enableZoom
      enableRotate
      autoRotateSpeed={2}
      mouseButtons={{
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.PAN,
        RIGHT: THREE.MOUSE.PAN,
      }}
    />
  );
}

function BuilderScene({
  atoms,
  selectedId,
  cellEdges,
  onSelect,
  onPlace,
  onDrag,
  onContextMenu,
  cameraRef,
}: {
  atoms: PlacedAtom[];
  selectedId: string | null;
  cellEdges: [number, number, number, number, number, number][];
  onSelect: (id: string | null) => void;
  onPlace: (pos: [number, number, number]) => void;
  onDrag: (id: string, pos: [number, number, number]) => void;
  onContextMenu: (id: string, screenX: number, screenY: number) => void;
  cameraRef: React.MutableRefObject<{ fitToAtoms: (atoms: PlacedAtom[]) => void; setView: (axis: "x" | "y" | "z") => void; toggleAutoRotate: () => boolean } | null>;
}) {
  const camDist = useMemo(() => {
    if (atoms.length === 0) return 12;
    const maxR = atoms.reduce(
      (m, a) => Math.max(m, Math.sqrt(a.x ** 2 + a.y ** 2 + a.z ** 2)),
      1
    );
    return Math.max(maxR * 2.5, 8);
  }, [atoms]);

  return (
    <Canvas
      camera={{
        position: [camDist * 0.7, camDist * 0.5, camDist * 0.7],
        fov: 45,
      }}
      style={{ background: "#111827" }}
      dpr={[1, 2]}
      frameloop="demand"
      gl={{ powerPreference: "low-power" }}
      onPointerMissed={() => onSelect(null)}
      onCreated={attachContextLossHandlers}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <directionalLight position={[-5, -5, -8]} intensity={0.3} />

      <ClickPlane onPlace={onPlace} />
      <Grid
        args={[50, 50]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#334155"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#475569"
        fadeDistance={25}
        fadeStrength={1}
        position={[0, 0, 0]}
        rotation={[0, 0, 0]}
      />

      {cellEdges.map((e, i) => (
        <CellEdge
          key={`cell-${i}`}
          start={[e[0], e[1], e[2]]}
          end={[e[3], e[4], e[5]]}
        />
      ))}

      {atoms.map((atom) => (
        <AtomSphere
          key={atom.id}
          atom={atom}
          isSelected={atom.id === selectedId}
          onSelect={onSelect}
          onDrag={onDrag}
          onContextMenu={onContextMenu}
        />
      ))}

      <CameraController controlsRef={cameraRef} />
    </Canvas>
  );
}

// ── Export helpers ─────────────────────────────────────────────────────────

function generateCIF(atoms: PlacedAtom[], lattice: LatticeParams): string {
  const lines = [
    "data_material_builder",
    `_cell_length_a ${lattice.a.toFixed(4)}`,
    `_cell_length_b ${lattice.b.toFixed(4)}`,
    `_cell_length_c ${lattice.c.toFixed(4)}`,
    `_cell_angle_alpha ${lattice.alpha.toFixed(2)}`,
    `_cell_angle_beta ${lattice.beta.toFixed(2)}`,
    `_cell_angle_gamma ${lattice.gamma.toFixed(2)}`,
    "_symmetry_space_group_name_H-M 'P 1'",
    "_symmetry_Int_Tables_number 1",
    "",
    "loop_",
    "_atom_site_label",
    "_atom_site_type_symbol",
    "_atom_site_Cartn_x",
    "_atom_site_Cartn_y",
    "_atom_site_Cartn_z",
  ];
  atoms.forEach((a, i) => {
    lines.push(`${a.element}${i + 1} ${a.element} ${a.x.toFixed(6)} ${a.y.toFixed(6)} ${a.z.toFixed(6)}`);
  });
  return lines.join("\n");
}

function generatePOSCAR(atoms: PlacedAtom[], lattice: LatticeParams): string {
  const v1 = fracToCart(1, 0, 0, lattice);
  const v2 = fracToCart(0, 1, 0, lattice);
  const v3 = fracToCart(0, 0, 1, lattice);

  const elementOrder: string[] = [];
  const grouped: Record<string, PlacedAtom[]> = {};
  atoms.forEach((a) => {
    if (!grouped[a.element]) {
      grouped[a.element] = [];
      elementOrder.push(a.element);
    }
    grouped[a.element].push(a);
  });

  const lines = [
    "Material Builder Export",
    "1.0",
    `  ${v1[0].toFixed(8)}  ${v1[1].toFixed(8)}  ${v1[2].toFixed(8)}`,
    `  ${v2[0].toFixed(8)}  ${v2[1].toFixed(8)}  ${v2[2].toFixed(8)}`,
    `  ${v3[0].toFixed(8)}  ${v3[1].toFixed(8)}  ${v3[2].toFixed(8)}`,
    elementOrder.join(" "),
    elementOrder.map((el) => grouped[el].length).join(" "),
    "Cartesian",
  ];
  elementOrder.forEach((el) => {
    grouped[el].forEach((a) => {
      lines.push(`  ${a.x.toFixed(8)}  ${a.y.toFixed(8)}  ${a.z.toFixed(8)}`);
    });
  });
  return lines.join("\n");
}

function generateXYZ(atoms: PlacedAtom[]): string {
  const lines = [
    String(atoms.length),
    "Material Builder Export",
  ];
  atoms.forEach((a) => {
    lines.push(`${a.element}  ${a.x.toFixed(6)}  ${a.y.toFixed(6)}  ${a.z.toFixed(6)}`);
  });
  return lines.join("\n");
}

function downloadFile(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// ── Share URL helpers ────────────────────────────────────────────────────
function encodeStructure(atoms: PlacedAtom[], lattice: LatticeParams): string {
  const data = {
    l: [lattice.a, lattice.b, lattice.c, lattice.alpha, lattice.beta, lattice.gamma],
    a: atoms.map((a) => [a.element, +a.x.toFixed(4), +a.y.toFixed(4), +a.z.toFixed(4)]),
  };
  return btoa(JSON.stringify(data));
}

function decodeStructure(encoded: string): { lattice: LatticeParams; atoms: PlacedAtom[] } | null {
  try {
    const data = JSON.parse(atob(encoded));
    const [a, b, c, alpha, beta, gamma] = data.l;
    const lattice: LatticeParams = { a, b, c, alpha, beta, gamma };
    let idCounter = 1;
    const atoms: PlacedAtom[] = data.a.map((arr: [string, number, number, number]) => ({
      id: `shared-${idCounter++}`,
      element: arr[0],
      x: arr[1],
      y: arr[2],
      z: arr[3],
    }));
    return { lattice, atoms };
  } catch {
    return null;
  }
}

// ── Neighbor distance calculation ────────────────────────────────────────
function computeNeighborDistances(
  atom: PlacedAtom,
  allAtoms: PlacedAtom[],
  cutoff: number = 4.0
): { element: string; distance: number; id: string }[] {
  const result: { element: string; distance: number; id: string }[] = [];
  for (const other of allAtoms) {
    if (other.id === atom.id) continue;
    const dx = atom.x - other.x;
    const dy = atom.y - other.y;
    const dz = atom.z - other.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (dist <= cutoff) {
      result.push({ element: other.element, distance: dist, id: other.id });
    }
  }
  result.sort((a, b) => a.distance - b.distance);
  return result;
}

// ── API helper ────────────────────────────────────────────────────────────
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.matcraft.ai/api/v1";

// ── Toast notification ───────────────────────────────────────────────────
function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className="fixed bottom-4 right-4 z-[100] bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg text-sm flex items-center gap-2 animate-in slide-in-from-bottom-4">
      {message}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

// ── Context menu component ───────────────────────────────────────────────
function ContextMenu({
  x,
  y,
  atomId,
  atoms,
  onClose,
  onDelete,
  onChangeElement,
  onDuplicate,
  onShowDistances,
}: {
  x: number;
  y: number;
  atomId: string;
  atoms: PlacedAtom[];
  onClose: () => void;
  onDelete: (id: string) => void;
  onChangeElement: (id: string) => void;
  onDuplicate: (id: string) => void;
  onShowDistances: (id: string) => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [onClose]);

  const atom = atoms.find((a) => a.id === atomId);
  if (!atom) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-[90] bg-white dark:bg-gray-800 border border-border rounded-lg shadow-xl py-1 min-w-[180px]"
      style={{ left: x, top: y }}
    >
      <div className="px-3 py-1.5 text-[10px] text-muted-foreground border-b border-border">
        {atom.element} at ({atom.x.toFixed(2)}, {atom.y.toFixed(2)}, {atom.z.toFixed(2)})
      </div>
      <button
        onClick={() => { onDelete(atomId); onClose(); }}
        className="w-full text-left px-3 py-1.5 text-xs hover:bg-destructive/10 text-destructive flex items-center gap-2"
      >
        <Trash2 className="h-3 w-3" /> Delete atom
      </button>
      <button
        onClick={() => { onChangeElement(atomId); onClose(); }}
        className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted flex items-center gap-2 text-foreground"
      >
        <Atom className="h-3 w-3" /> Change element
      </button>
      <button
        onClick={() => { onShowDistances(atomId); onClose(); }}
        className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted flex items-center gap-2 text-foreground"
      >
        <Ruler className="h-3 w-3" /> Show distances
      </button>
      <button
        onClick={() => { onDuplicate(atomId); onClose(); }}
        className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted flex items-center gap-2 text-foreground"
      >
        <Copy className="h-3 w-3" /> Duplicate (+1A offset)
      </button>
    </div>
  );
}

// ── Element change modal ─────────────────────────────────────────────────
function ElementChangeModal({
  atomId,
  onClose,
  onSelect,
}: {
  atomId: string;
  onClose: () => void;
  onSelect: (id: string, element: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-border shadow-2xl w-full max-w-xs mx-4 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Change Element</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <div className="grid grid-cols-6 gap-1 max-h-[300px] overflow-y-auto">
          {ALL_ELEMENTS.map((el) => (
            <button
              key={el}
              onClick={() => { onSelect(atomId, el); onClose(); }}
              className="flex flex-col items-center justify-center p-1 rounded-md border border-border bg-card text-[10px] font-medium hover:bg-accent hover:text-foreground h-10 text-muted-foreground"
            >
              <div
                className="w-2.5 h-2.5 rounded-full mb-0.5"
                style={{ backgroundColor: CPK_COLORS[el] ?? "#888" }}
              />
              {el}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Surface / Nanoparticle modal ─────────────────────────────────────────
function SurfaceModal({
  atoms,
  lattice,
  onClose,
  onLoad,
}: {
  atoms: PlacedAtom[];
  lattice: LatticeParams;
  onClose: () => void;
  onLoad: (atoms: PlacedAtom[], lattice: LatticeParams) => void;
}) {
  const [h, setH] = useState(1);
  const [k, setK] = useState(0);
  const [l, setL] = useState(0);
  const [thickness, setThickness] = useState(3);
  const [vacuum, setVacuum] = useState(15);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const nextIdRef = useRef(Date.now());

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/builder/surface`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lattice,
          atoms: atoms.map((a) => ({ element: a.element, x: a.x, y: a.y, z: a.z, cartesian: true })),
          miller_index: [h, k, l],
          thickness,
          vacuum,
        }),
      });
      if (!res.ok) throw new Error(`Surface generation failed (${res.status})`);
      const data = await res.json();
      if (data.atoms && data.lattice) {
        const newAtoms: PlacedAtom[] = data.atoms.map(
          (a: { element: string; x: number; y: number; z: number }) => ({
            id: `surf-${nextIdRef.current++}`,
            element: a.element,
            x: a.x, y: a.y, z: a.z,
          })
        );
        onLoad(newAtoms, data.lattice);
        onClose();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-border shadow-2xl w-full max-w-sm mx-4 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Generate Surface Slab</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] text-muted-foreground mb-1">Miller Index (h k l)</label>
            <div className="grid grid-cols-3 gap-2">
              <input type="number" value={h} onChange={(e) => setH(parseInt(e.target.value) || 0)} className="w-full h-8 rounded-md border border-border bg-card px-2 text-xs text-foreground" />
              <input type="number" value={k} onChange={(e) => setK(parseInt(e.target.value) || 0)} className="w-full h-8 rounded-md border border-border bg-card px-2 text-xs text-foreground" />
              <input type="number" value={l} onChange={(e) => setL(parseInt(e.target.value) || 0)} className="w-full h-8 rounded-md border border-border bg-card px-2 text-xs text-foreground" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] text-muted-foreground mb-1">Thickness (layers)</label>
            <input type="number" min={1} max={20} value={thickness} onChange={(e) => setThickness(parseInt(e.target.value) || 1)} className="w-full h-8 rounded-md border border-border bg-card px-2 text-xs text-foreground" />
          </div>
          <div>
            <label className="block text-[11px] text-muted-foreground mb-1">Vacuum (A)</label>
            <input type="number" min={0} step={1} value={vacuum} onChange={(e) => setVacuum(parseFloat(e.target.value) || 0)} className="w-full h-8 rounded-md border border-border bg-card px-2 text-xs text-foreground" />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" loading={loading} onClick={handleGenerate} disabled={atoms.length === 0}>Generate</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NanoparticleModal({
  atoms,
  lattice,
  onClose,
  onLoad,
}: {
  atoms: PlacedAtom[];
  lattice: LatticeParams;
  onClose: () => void;
  onLoad: (atoms: PlacedAtom[], lattice: LatticeParams) => void;
}) {
  const [radius, setRadius] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const nextIdRef = useRef(Date.now());

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/builder/nanoparticle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lattice,
          atoms: atoms.map((a) => ({ element: a.element, x: a.x, y: a.y, z: a.z, cartesian: true })),
          radius,
        }),
      });
      if (!res.ok) throw new Error(`Nanoparticle generation failed (${res.status})`);
      const data = await res.json();
      if (data.atoms) {
        const newAtoms: PlacedAtom[] = data.atoms.map(
          (a: { element: string; x: number; y: number; z: number }) => ({
            id: `nano-${nextIdRef.current++}`,
            element: a.element,
            x: a.x, y: a.y, z: a.z,
          })
        );
        onLoad(newAtoms, data.lattice || lattice);
        onClose();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-border shadow-2xl w-full max-w-sm mx-4 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Carve Nanoparticle</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] text-muted-foreground mb-1">Radius (A)</label>
            <input type="number" min={1} step={1} value={radius} onChange={(e) => setRadius(parseFloat(e.target.value) || 1)} className="w-full h-8 rounded-md border border-border bg-card px-2 text-xs text-foreground" />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" loading={loading} onClick={handleGenerate} disabled={atoms.length === 0}>Carve</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────
export default function MaterialBuilder() {
  const searchParams = useSearchParams();
  const [state, dispatch] = useReducer(builderReducer, initialState);
  const [activeElement, setActiveElement] = useState("Si");
  const [crystalSystem, setCrystalSystem] = useState<CrystalSystem>("Cubic");
  const [latticeA, setLatticeA] = useState(5.43);
  const [latticeB, setLatticeB] = useState(5.43);
  const [latticeC, setLatticeC] = useState(5.43);
  const [latticeAlpha, setLatticeAlpha] = useState(90);
  const [latticeBeta, setLatticeBeta] = useState(90);
  const [latticeGamma, setLatticeGamma] = useState(90);
  const [appliedLattice, setAppliedLattice] = useState<LatticeParams>({
    a: 5.43, b: 5.43, c: 5.43, alpha: 90, beta: 90, gamma: 90,
  });
  const [loadModalOpen, setLoadModalOpen] = useState(false);
  const [loadMaterialId, setLoadMaterialId] = useState("");
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(false);
  const [elementCategory, setElementCategory] = useState<keyof typeof ELEMENT_CATEGORIES>("Common");
  const nextId = useRef(1);

  // New state for features
  const [prototypesOpen, setPrototypesOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; atomId: string } | null>(null);
  const [elementChangeAtomId, setElementChangeAtomId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [fracElement, setFracElement] = useState("Si");
  const [fracX, setFracX] = useState(0);
  const [fracY, setFracY] = useState(0);
  const [fracZ, setFracZ] = useState(0);
  const [surfaceModalOpen, setSurfaceModalOpen] = useState(false);
  const [nanoModalOpen, setNanoModalOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const cameraRef = useRef<{
    fitToAtoms: (atoms: PlacedAtom[]) => void;
    setView: (axis: "x" | "y" | "z") => void;
    toggleAutoRotate: () => boolean;
  } | null>(null);

  // Auto-load material from URL param
  useEffect(() => {
    const mid = searchParams.get("materialId");
    if (mid) {
      loadMaterial(mid);
      return;
    }
    // Load shared structure from URL
    const structParam = searchParams.get("structure");
    if (structParam) {
      const decoded = decodeStructure(structParam);
      if (decoded) {
        setLatticeA(decoded.lattice.a);
        setLatticeB(decoded.lattice.b);
        setLatticeC(decoded.lattice.c);
        setLatticeAlpha(decoded.lattice.alpha);
        setLatticeBeta(decoded.lattice.beta);
        setLatticeGamma(decoded.lattice.gamma);
        setAppliedLattice(decoded.lattice);
        dispatch({ type: "LOAD", atoms: decoded.atoms });
        setToastMsg(`Loaded ${decoded.atoms.length} atoms from shared URL`);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement || e.target instanceof HTMLTextAreaElement;

      if (e.key === "Delete" || e.key === "Backspace") {
        if (state.selectedId && !isInput) {
          dispatch({ type: "REMOVE_ATOM", id: state.selectedId });
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        dispatch({ type: "UNDO" });
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        dispatch({ type: "REDO" });
      }
      // New shortcuts
      if (!isInput) {
        if (e.key === "f" || e.key === "F") {
          cameraRef.current?.fitToAtoms(state.atoms);
        }
        if (e.key === "r" || e.key === "R") {
          const rotating = cameraRef.current?.toggleAutoRotate();
          setToastMsg(rotating ? "Auto-rotation ON" : "Auto-rotation OFF");
        }
        if (e.key === "1") {
          cameraRef.current?.setView("x");
        }
        if (e.key === "2") {
          cameraRef.current?.setView("y");
        }
        if (e.key === "3") {
          cameraRef.current?.setView("z");
        }
        if (e.key === "Escape") {
          dispatch({ type: "SELECT", id: null });
          setContextMenu(null);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [state.selectedId, state.atoms]);

  // Load material from API
  const loadMaterial = useCallback(
    async (materialId: string) => {
      setLoading(true);
      setLoadError("");
      try {
        const res = await fetch(`${API_BASE}/materials/${materialId}`);
        if (!res.ok) throw new Error(`Material not found (${res.status})`);
        const data = await res.json();

        if (data.lattice_params) {
          const lp = data.lattice_params;
          setLatticeA(lp.a);
          setLatticeB(lp.b);
          setLatticeC(lp.c);
          setLatticeAlpha(lp.alpha);
          setLatticeBeta(lp.beta);
          setLatticeGamma(lp.gamma);
          setAppliedLattice({
            a: lp.a, b: lp.b, c: lp.c,
            alpha: lp.alpha, beta: lp.beta, gamma: lp.gamma,
          });
          if (lp.a === lp.b && lp.b === lp.c && lp.alpha === 90 && lp.beta === 90 && lp.gamma === 90)
            setCrystalSystem("Cubic");
          else if (lp.a === lp.b && lp.alpha === 90 && lp.beta === 90 && Math.abs(lp.gamma - 120) < 1)
            setCrystalSystem("Hexagonal");
          else if (lp.a === lp.b && lp.alpha === 90 && lp.beta === 90 && lp.gamma === 90)
            setCrystalSystem("Tetragonal");
          else if (lp.alpha === 90 && lp.beta === 90 && lp.gamma === 90)
            setCrystalSystem("Orthorhombic");
          else
            setCrystalSystem("Triclinic");
        }

        if (data.structure_data?.atoms) {
          const lat = data.lattice_params || appliedLattice;
          const loadedAtoms: PlacedAtom[] = data.structure_data.atoms.map(
            (a: { element: string; x: number; y: number; z: number; cartesian?: boolean }, i: number) => {
              let cx = a.x, cy = a.y, cz = a.z;
              const maxCoord = Math.max(Math.abs(a.x), Math.abs(a.y), Math.abs(a.z));
              const isCartesian = a.cartesian === true || maxCoord > 1.1;
              if (!isCartesian && lat) {
                [cx, cy, cz] = fracToCart(a.x, a.y, a.z, lat);
              }
              return {
                id: `loaded-${nextId.current++}`,
                element: a.element,
                x: cx, y: cy, z: cz,
              };
            }
          );
          dispatch({ type: "LOAD", atoms: loadedAtoms });
        }
        setLoadModalOpen(false);
      } catch (err: unknown) {
        setLoadError(err instanceof Error ? err.message : "Failed to load material");
      } finally {
        setLoading(false);
      }
    },
    [appliedLattice]
  );

  // Handlers
  const handlePlace = useCallback(
    (pos: [number, number, number]) => {
      dispatch({
        type: "ADD_ATOM",
        atom: {
          id: `atom-${nextId.current++}`,
          element: activeElement,
          x: pos[0],
          y: pos[1],
          z: pos[2],
        },
      });
    },
    [activeElement]
  );

  const handleSelect = useCallback((id: string | null) => {
    dispatch({ type: "SELECT", id });
    setContextMenu(null);
  }, []);

  const handleDrag = useCallback((id: string, pos: [number, number, number]) => {
    dispatch({ type: "MOVE_ATOM", id, x: pos[0], y: pos[1], z: pos[2] });
  }, []);

  const handleContextMenu = useCallback((id: string, screenX: number, screenY: number) => {
    dispatch({ type: "SELECT", id });
    setContextMenu({ x: screenX, y: screenY, atomId: id });
  }, []);

  const applyLattice = useCallback(() => {
    const constrained = constrainLattice(
      crystalSystem, latticeA, latticeB, latticeC,
      latticeAlpha, latticeBeta, latticeGamma
    );
    setLatticeA(constrained.a);
    setLatticeB(constrained.b);
    setLatticeC(constrained.c);
    setLatticeAlpha(constrained.alpha);
    setLatticeBeta(constrained.beta);
    setLatticeGamma(constrained.gamma);
    setAppliedLattice(constrained);
  }, [crystalSystem, latticeA, latticeB, latticeC, latticeAlpha, latticeBeta, latticeGamma]);

  // Load a prototype
  const loadPrototype = useCallback((proto: PrototypeDef) => {
    const lat = proto.lattice;
    setCrystalSystem(proto.system);
    setLatticeA(lat.a);
    setLatticeB(lat.b);
    setLatticeC(lat.c);
    setLatticeAlpha(lat.alpha);
    setLatticeBeta(lat.beta);
    setLatticeGamma(lat.gamma);
    setAppliedLattice(lat);
    const newAtoms: PlacedAtom[] = proto.atoms.map((a) => {
      const [cx, cy, cz] = fracToCart(a.fx, a.fy, a.fz, lat);
      return {
        id: `proto-${nextId.current++}`,
        element: a.element,
        x: cx, y: cy, z: cz,
      };
    });
    dispatch({ type: "LOAD", atoms: newAtoms });
    setToastMsg(`Loaded ${proto.name} (${newAtoms.length} atoms)`);
  }, []);

  // Add atom from fractional coordinates
  const addFractionalAtom = useCallback(() => {
    const [cx, cy, cz] = fracToCart(fracX, fracY, fracZ, appliedLattice);
    dispatch({
      type: "ADD_ATOM",
      atom: {
        id: `frac-${nextId.current++}`,
        element: fracElement,
        x: cx, y: cy, z: cz,
      },
    });
    setToastMsg(`Added ${fracElement} at (${fracX}, ${fracY}, ${fracZ})`);
  }, [fracElement, fracX, fracY, fracZ, appliedLattice]);

  // Duplicate atom
  const duplicateAtom = useCallback((id: string) => {
    const atom = state.atoms.find((a) => a.id === id);
    if (!atom) return;
    dispatch({
      type: "ADD_ATOM",
      atom: {
        id: `dup-${nextId.current++}`,
        element: atom.element,
        x: atom.x + 1,
        y: atom.y,
        z: atom.z,
      },
    });
    setToastMsg(`Duplicated ${atom.element} with +1A x-offset`);
  }, [state.atoms]);

  // Show distances in toast
  const showDistancesToast = useCallback((id: string) => {
    const atom = state.atoms.find((a) => a.id === id);
    if (!atom) return;
    const neighbors = computeNeighborDistances(atom, state.atoms);
    if (neighbors.length === 0) {
      setToastMsg("No neighbors within 4A");
      return;
    }
    const msg = neighbors.slice(0, 5).map((n) => `${atom.element}-${n.element}: ${n.distance.toFixed(2)}A`).join(", ");
    setToastMsg(msg);
  }, [state.atoms]);

  // Share structure URL
  const shareStructure = useCallback(() => {
    if (state.atoms.length === 0) return;
    const encoded = encodeStructure(state.atoms, appliedLattice);
    const url = `${window.location.origin}${window.location.pathname}?structure=${encoded}`;
    navigator.clipboard.writeText(url).then(() => {
      setToastMsg("Share URL copied to clipboard");
    }).catch(() => {
      // Fallback: prompt
      window.prompt("Share this URL:", url);
    });
  }, [state.atoms, appliedLattice]);

  // File drop handler
  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const name = file.name.toLowerCase();
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      let parsed: { lattice: LatticeParams; atoms: { element: string; fx: number; fy: number; fz: number }[] } | null = null;

      if (name.endsWith(".cif")) {
        parsed = parseCIF(text);
      } else if (name.endsWith(".poscar") || name.endsWith(".vasp") || name === "poscar" || name === "contcar") {
        parsed = parsePOSCAR(text);
      } else {
        // Try to auto-detect
        if (text.includes("_cell_length_a")) {
          parsed = parseCIF(text);
        } else {
          parsed = parsePOSCAR(text);
        }
      }

      if (parsed && parsed.atoms.length > 0) {
        const lat = parsed.lattice;
        setLatticeA(lat.a);
        setLatticeB(lat.b);
        setLatticeC(lat.c);
        setLatticeAlpha(lat.alpha);
        setLatticeBeta(lat.beta);
        setLatticeGamma(lat.gamma);
        setAppliedLattice(lat);

        // Detect crystal system
        if (Math.abs(lat.a - lat.b) < 0.01 && Math.abs(lat.b - lat.c) < 0.01 && Math.abs(lat.alpha - 90) < 1 && Math.abs(lat.beta - 90) < 1 && Math.abs(lat.gamma - 90) < 1)
          setCrystalSystem("Cubic");
        else if (Math.abs(lat.a - lat.b) < 0.01 && Math.abs(lat.alpha - 90) < 1 && Math.abs(lat.beta - 90) < 1 && Math.abs(lat.gamma - 120) < 1)
          setCrystalSystem("Hexagonal");
        else if (Math.abs(lat.a - lat.b) < 0.01 && Math.abs(lat.alpha - 90) < 1 && Math.abs(lat.beta - 90) < 1 && Math.abs(lat.gamma - 90) < 1)
          setCrystalSystem("Tetragonal");
        else if (Math.abs(lat.alpha - 90) < 1 && Math.abs(lat.beta - 90) < 1 && Math.abs(lat.gamma - 90) < 1)
          setCrystalSystem("Orthorhombic");
        else
          setCrystalSystem("Triclinic");

        const loadedAtoms: PlacedAtom[] = parsed.atoms.map((a) => {
          const [cx, cy, cz] = fracToCart(a.fx, a.fy, a.fz, lat);
          return {
            id: `import-${nextId.current++}`,
            element: a.element,
            x: cx, y: cy, z: cz,
          };
        });
        dispatch({ type: "LOAD", atoms: loadedAtoms });
        setToastMsg(`Loaded ${loadedAtoms.length} atoms from uploaded ${name.endsWith(".cif") ? "CIF" : "POSCAR"}`);
      } else {
        setToastMsg("Could not parse file. Supported: .cif, .poscar, .vasp");
      }
    };
    reader.readAsText(file);
  }, []);

  // Load surface/nanoparticle result
  const handleSurfaceLoad = useCallback((atoms: PlacedAtom[], lattice: LatticeParams) => {
    setLatticeA(lattice.a);
    setLatticeB(lattice.b);
    setLatticeC(lattice.c);
    setLatticeAlpha(lattice.alpha);
    setLatticeBeta(lattice.beta);
    setLatticeGamma(lattice.gamma);
    setAppliedLattice(lattice);
    dispatch({ type: "LOAD", atoms });
    setToastMsg(`Loaded ${atoms.length} atoms`);
  }, []);

  // Computed cell edges
  const cellEdges = useMemo(() => unitCellEdges(appliedLattice), [appliedLattice]);

  // Computed properties
  const { formula, composition, volume } = useMemo(() => {
    const counts: Record<string, number> = {};
    state.atoms.forEach((a) => {
      counts[a.element] = (counts[a.element] || 0) + 1;
    });
    const total = state.atoms.length;
    const formulaParts = Object.entries(counts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([el, n]) => (n === 1 ? el : `${el}${n}`))
      .join("");
    const comp = Object.entries(counts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([el, n]) => ({ element: el, count: n, pct: total > 0 ? (n / total) * 100 : 0 }));
    return {
      formula: formulaParts || "-",
      composition: comp,
      volume: latticeVolume(appliedLattice),
    };
  }, [state.atoms, appliedLattice]);

  // Neighbor distances for selected atom
  const neighborDistances = useMemo(() => {
    if (!state.selectedId) return [];
    const sel = state.atoms.find((a) => a.id === state.selectedId);
    if (!sel) return [];
    return computeNeighborDistances(sel, state.atoms);
  }, [state.selectedId, state.atoms]);

  const canUndo = state.historyIndex > 0;
  const canRedo = state.historyIndex < state.history.length - 1;

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="h-screen w-full flex flex-col bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {/* Top bar */}
      <header className="flex-none h-12 flex items-center justify-between px-4 border-b border-border bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            MatCraft
          </Link>
          <div className="h-5 w-px bg-border" />
          <h1 className="text-sm font-semibold text-foreground">
            Material Builder
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Active element indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50 border border-border text-xs">
            <div
              className="w-3 h-3 rounded-full border border-white/30"
              style={{ backgroundColor: CPK_COLORS[activeElement] ?? "#888" }}
            />
            <span className="font-medium">{activeElement}</span>
            <span className="text-muted-foreground">active</span>
          </div>

          <div className="h-5 w-px bg-border" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => dispatch({ type: "UNDO" })}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="h-8 w-8 p-0"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => dispatch({ type: "REDO" })}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className="h-8 w-8 p-0"
          >
            <Redo2 className="h-4 w-4" />
          </Button>

          <div className="h-5 w-px bg-border" />

          {/* Keyboard shortcuts toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShortcutsOpen(!shortcutsOpen)}
            title="Keyboard shortcuts"
            className="h-8 w-8 p-0"
          >
            <Keyboard className="h-4 w-4" />
          </Button>

          {/* Share button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={shareStructure}
            disabled={state.atoms.length === 0}
            title="Share structure URL"
            className="h-8 w-8 p-0"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Keyboard shortcuts tooltip */}
      {shortcutsOpen && (
        <div className="absolute top-12 right-4 z-50 bg-white dark:bg-gray-800 border border-border rounded-lg shadow-xl p-3 w-56">
          <h4 className="text-xs font-semibold text-foreground mb-2">Keyboard Shortcuts</h4>
          <div className="space-y-1 text-[11px]">
            {[
              ["Delete/Backspace", "Delete atom"],
              ["Ctrl+Z", "Undo"],
              ["Ctrl+Y", "Redo"],
              ["F", "Fit camera to atoms"],
              ["R", "Toggle auto-rotation"],
              ["1", "View along X-axis"],
              ["2", "View along Y-axis"],
              ["3", "View along Z-axis"],
              ["Escape", "Deselect atom"],
            ].map(([key, desc]) => (
              <div key={key} className="flex justify-between">
                <kbd className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono text-[10px]">{key}</kbd>
                <span className="text-muted-foreground">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main layout */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Left Sidebar */}
        <aside className="flex-none w-full lg:w-[280px] border-b lg:border-b-0 lg:border-r border-border bg-white dark:bg-gray-900 overflow-y-auto">
          <div className="p-3 space-y-4">
            {/* Element Palette */}
            <div>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Element Palette
              </h2>
              {/* Category tabs */}
              <div className="flex flex-wrap gap-1 mb-2">
                {(Object.keys(ELEMENT_CATEGORIES) as (keyof typeof ELEMENT_CATEGORIES)[]).map(
                  (cat) => (
                    <button
                      key={cat}
                      onClick={() => setElementCategory(cat)}
                      className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-medium transition-colors",
                        elementCategory === cat
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {cat}
                    </button>
                  )
                )}
              </div>
              {/* Element grid */}
              <div className="grid grid-cols-6 gap-1">
                {ELEMENT_CATEGORIES[elementCategory].map((el) => (
                  <button
                    key={el}
                    onClick={() => { setActiveElement(el); setFracElement(el); }}
                    className={cn(
                      "relative flex flex-col items-center justify-center p-1 rounded-md border text-[10px] font-medium transition-all h-10",
                      activeElement === el
                        ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary"
                        : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full mb-0.5"
                      style={{ backgroundColor: CPK_COLORS[el] ?? "#888" }}
                    />
                    {el}
                  </button>
                ))}
              </div>
            </div>

            {/* Structure Prototypes */}
            <div>
              <button
                onClick={() => setPrototypesOpen(!prototypesOpen)}
                className="flex items-center gap-1.5 w-full text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 hover:text-foreground transition-colors"
              >
                {prototypesOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                Prototypes
              </button>
              {prototypesOpen && (
                <div className="grid grid-cols-2 gap-1">
                  {STRUCTURE_PROTOTYPES.map((proto) => (
                    <button
                      key={proto.name}
                      onClick={() => loadPrototype(proto)}
                      className="text-left px-2 py-1.5 rounded-md border border-border bg-card text-[10px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                    >
                      <div className="font-semibold text-foreground text-[11px]">{proto.name}</div>
                      <div className="text-muted-foreground">{proto.atoms.length} atoms &middot; {proto.system}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Lattice Parameters */}
            <div>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Lattice Parameters
              </h2>

              {/* Crystal system */}
              <label className="block text-[11px] text-muted-foreground mb-1">
                Crystal System
              </label>
              <select
                value={crystalSystem}
                onChange={(e) => setCrystalSystem(e.target.value as CrystalSystem)}
                className="w-full h-8 rounded-md border border-border bg-card px-2 text-xs text-foreground mb-2"
              >
                {(["Cubic", "Hexagonal", "Tetragonal", "Orthorhombic", "Monoclinic", "Triclinic"] as CrystalSystem[]).map(
                  (s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  )
                )}
              </select>

              {/* Lengths */}
              <div className="grid grid-cols-3 gap-1.5 mb-2">
                {[
                  { label: "a", value: latticeA, set: setLatticeA, disabled: false },
                  {
                    label: "b",
                    value: latticeB,
                    set: setLatticeB,
                    disabled: ["Cubic", "Hexagonal", "Tetragonal"].includes(crystalSystem),
                  },
                  {
                    label: "c",
                    value: latticeC,
                    set: setLatticeC,
                    disabled: crystalSystem === "Cubic",
                  },
                ].map(({ label, value, set, disabled }) => (
                  <div key={label}>
                    <label className="block text-[10px] text-muted-foreground mb-0.5">
                      {label} (A)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={value}
                      onChange={(e) => set(parseFloat(e.target.value) || 0)}
                      disabled={disabled}
                      className={cn(
                        "w-full h-7 rounded border border-border bg-card px-1.5 text-xs text-foreground",
                        disabled && "opacity-50 cursor-not-allowed"
                      )}
                    />
                  </div>
                ))}
              </div>

              {/* Angles */}
              <div className="grid grid-cols-3 gap-1.5 mb-2">
                {[
                  {
                    label: "\u03b1",
                    value: latticeAlpha,
                    set: setLatticeAlpha,
                    disabled: ["Cubic", "Hexagonal", "Tetragonal", "Orthorhombic", "Monoclinic"].includes(crystalSystem),
                  },
                  {
                    label: "\u03b2",
                    value: latticeBeta,
                    set: setLatticeBeta,
                    disabled: ["Cubic", "Hexagonal", "Tetragonal", "Orthorhombic"].includes(crystalSystem),
                  },
                  {
                    label: "\u03b3",
                    value: latticeGamma,
                    set: setLatticeGamma,
                    disabled: ["Cubic", "Tetragonal", "Orthorhombic", "Monoclinic"].includes(crystalSystem),
                  },
                ].map(({ label, value, set, disabled }) => (
                  <div key={label}>
                    <label className="block text-[10px] text-muted-foreground mb-0.5">
                      {label} (deg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={value}
                      onChange={(e) => set(parseFloat(e.target.value) || 0)}
                      disabled={disabled}
                      className={cn(
                        "w-full h-7 rounded border border-border bg-card px-1.5 text-xs text-foreground",
                        disabled && "opacity-50 cursor-not-allowed"
                      )}
                    />
                  </div>
                ))}
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={applyLattice}
                className="w-full h-7 text-xs"
              >
                <Grid3x3 className="h-3 w-3 mr-1" />
                Apply Lattice
              </Button>
            </div>
          </div>
        </aside>

        {/* Center -- 3D Viewport */}
        <main
          className="flex-1 min-h-[300px] lg:min-h-0 relative"
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleFileDrop}
          onContextMenu={(e) => e.preventDefault()}
        >
          <BuilderScene
            atoms={state.atoms}
            selectedId={state.selectedId}
            cellEdges={cellEdges}
            onSelect={handleSelect}
            onPlace={handlePlace}
            onDrag={handleDrag}
            onContextMenu={handleContextMenu}
            cameraRef={cameraRef}
          />

          {/* Drag-and-drop overlay */}
          {isDragOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-primary/20 border-2 border-dashed border-primary rounded-lg pointer-events-none z-20">
              <div className="text-center bg-black/60 backdrop-blur-sm rounded-xl px-6 py-4">
                <FileUp className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-sm text-white font-medium">Drop .cif or .poscar file to import</p>
              </div>
            </div>
          )}

          {/* Overlay hint */}
          {state.atoms.length === 0 && !isDragOver && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center bg-black/40 backdrop-blur-sm rounded-xl px-6 py-4">
                <Atom className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                <p className="text-sm text-gray-300">
                  Click in the viewport to place{" "}
                  <span className="font-semibold text-white">{activeElement}</span>{" "}
                  atoms, or use fractional coordinates in the right panel
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Right-click to pan, scroll to zoom. Use prototypes for quick start
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Drop a .cif or .poscar file to import a structure
                </p>
              </div>
            </div>
          )}
        </main>

        {/* Right Sidebar */}
        <aside className="flex-none w-full lg:w-[320px] border-t lg:border-t-0 lg:border-l border-border bg-white dark:bg-gray-900 overflow-y-auto">
          <div className="p-3 space-y-4">
            {/* Properties */}
            <div>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Properties
              </h2>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Formula</span>
                  <span className="font-mono font-medium text-foreground">
                    {formula}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Atom count</span>
                  <span className="font-mono text-foreground">{state.atoms.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Space group</span>
                  <span className="font-mono text-foreground">P1</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Volume</span>
                  <span className="font-mono text-foreground">
                    {volume.toFixed(2)} A^3
                  </span>
                </div>
              </div>
            </div>

            {/* Composition */}
            {composition.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Composition
                </h2>
                <div className="space-y-1">
                  {composition.map(({ element, count, pct }) => (
                    <div key={element} className="flex items-center gap-2 text-xs">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-none"
                        style={{ backgroundColor: CPK_COLORS[element] ?? "#888" }}
                      />
                      <span className="font-medium text-foreground w-6">
                        {element}
                      </span>
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: CPK_COLORS[element] ?? "#888",
                          }}
                        />
                      </div>
                      <span className="text-muted-foreground w-16 text-right">
                        {count} ({pct.toFixed(1)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selected atom info + bond lengths */}
            {state.selectedId && (() => {
              const selAtom = state.atoms.find((a) => a.id === state.selectedId);
              if (!selAtom) return null;
              return (
                <div className="p-2 rounded-lg border border-blue-500/30 bg-blue-500/5">
                  <h2 className="text-xs font-semibold text-blue-400 mb-1">
                    Selected Atom
                  </h2>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <span className="text-muted-foreground">Element</span>
                    <span className="font-mono text-foreground">{selAtom.element}</span>
                    <span className="text-muted-foreground">x</span>
                    <span className="font-mono text-foreground">{selAtom.x.toFixed(3)}</span>
                    <span className="text-muted-foreground">y</span>
                    <span className="font-mono text-foreground">{selAtom.y.toFixed(3)}</span>
                    <span className="text-muted-foreground">z</span>
                    <span className="font-mono text-foreground">{selAtom.z.toFixed(3)}</span>
                  </div>

                  {/* Bond lengths display */}
                  {neighborDistances.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-blue-500/20">
                      <h3 className="text-[10px] font-semibold text-blue-400/80 mb-1">
                        Neighbor Distances (within 4A)
                      </h3>
                      <div className="space-y-0.5 max-h-[100px] overflow-y-auto">
                        {neighborDistances.map((n, i) => (
                          <div key={i} className="flex justify-between text-[10px]">
                            <span className="text-muted-foreground font-mono">
                              {selAtom.element}-{n.element}
                            </span>
                            <span className="text-foreground font-mono">
                              {n.distance.toFixed(2)}A
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => dispatch({ type: "REMOVE_ATOM", id: state.selectedId! })}
                    className="w-full h-6 text-[10px] mt-2"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete (Del)
                  </Button>
                </div>
              );
            })()}

            {/* Add Atom (fractional coordinates) */}
            <div>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Add Atom (Fractional)
              </h2>
              <div className="space-y-2">
                <select
                  value={fracElement}
                  onChange={(e) => { setFracElement(e.target.value); setActiveElement(e.target.value); }}
                  className="w-full h-7 rounded border border-border bg-card px-1.5 text-xs text-foreground"
                >
                  {ALL_ELEMENTS.map((el) => (
                    <option key={el} value={el}>{el}</option>
                  ))}
                </select>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { label: "x", value: fracX, set: setFracX },
                    { label: "y", value: fracY, set: setFracY },
                    { label: "z", value: fracZ, set: setFracZ },
                  ].map(({ label, value, set }) => (
                    <div key={label}>
                      <label className="block text-[10px] text-muted-foreground mb-0.5">{label}</label>
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        max="1"
                        value={value}
                        onChange={(e) => set(parseFloat(e.target.value) || 0)}
                        className="w-full h-7 rounded border border-border bg-card px-1.5 text-xs text-foreground"
                      />
                    </div>
                  ))}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={addFractionalAtom}
                  className="w-full h-7 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add {fracElement} at ({fracX}, {fracY}, {fracZ})
                </Button>
              </div>
            </div>

            {/* Quick Actions - Surface / Nanoparticle */}
            <div>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Quick Actions
              </h2>
              <div className="grid grid-cols-2 gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSurfaceModalOpen(true)}
                  disabled={state.atoms.length === 0}
                  className="h-8 text-[10px] justify-start"
                >
                  <Layers className="h-3 w-3 mr-1 flex-none" />
                  Surface
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNanoModalOpen(true)}
                  disabled={state.atoms.length === 0}
                  className="h-8 text-[10px] justify-start"
                >
                  <Circle className="h-3 w-3 mr-1 flex-none" />
                  Nanoparticle
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Actions
              </h2>
              <div className="space-y-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLoadModalOpen(true)}
                  className="w-full h-8 text-xs justify-start"
                >
                  <Upload className="h-3.5 w-3.5 mr-2" />
                  Load from Material
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    downloadFile(
                      generateCIF(state.atoms, appliedLattice),
                      "structure.cif"
                    );
                  }}
                  disabled={state.atoms.length === 0}
                  className="w-full h-8 text-xs justify-start"
                >
                  <Download className="h-3.5 w-3.5 mr-2" />
                  Export CIF
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    downloadFile(
                      generatePOSCAR(state.atoms, appliedLattice),
                      "POSCAR"
                    );
                  }}
                  disabled={state.atoms.length === 0}
                  className="w-full h-8 text-xs justify-start"
                >
                  <Download className="h-3.5 w-3.5 mr-2" />
                  Export POSCAR
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    downloadFile(
                      generateXYZ(state.atoms),
                      "structure.xyz"
                    );
                  }}
                  disabled={state.atoms.length === 0}
                  className="w-full h-8 text-xs justify-start"
                >
                  <Download className="h-3.5 w-3.5 mr-2" />
                  Export XYZ
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    if (state.atoms.length === 0) return;
                    try {
                      const body = {
                        lattice: appliedLattice,
                        atoms: state.atoms.map((a) => ({
                          element: a.element,
                          x: a.x,
                          y: a.y,
                          z: a.z,
                          cartesian: true,
                        })),
                        scaling_matrix: [[2, 0, 0], [0, 2, 0], [0, 0, 2]],
                      };
                      const res = await fetch(`${API_BASE}/builder/supercell`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(body),
                      });
                      if (!res.ok) throw new Error("Supercell generation failed");
                      const data = await res.json();
                      if (data.atoms) {
                        const newAtoms: PlacedAtom[] = data.atoms.map(
                          (a: { element: string; x: number; y: number; z: number }, i: number) => ({
                            id: `super-${nextId.current++}`,
                            element: a.element,
                            x: a.x, y: a.y, z: a.z,
                          })
                        );
                        dispatch({ type: "LOAD", atoms: newAtoms });
                        if (data.lattice) {
                          const lp = data.lattice;
                          setLatticeA(lp.a);
                          setLatticeB(lp.b);
                          setLatticeC(lp.c);
                          setLatticeAlpha(lp.alpha);
                          setLatticeBeta(lp.beta);
                          setLatticeGamma(lp.gamma);
                          setAppliedLattice(lp);
                        }
                      }
                    } catch {
                      // silently fail for now
                    }
                  }}
                  disabled={state.atoms.length === 0}
                  className="w-full h-8 text-xs justify-start"
                >
                  <Grid3x3 className="h-3.5 w-3.5 mr-2" />
                  Generate 2x2x2 Supercell
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={shareStructure}
                  disabled={state.atoms.length === 0}
                  className="w-full h-8 text-xs justify-start"
                >
                  <Share2 className="h-3.5 w-3.5 mr-2" />
                  Share Structure URL
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dispatch({ type: "CLEAR" })}
                  disabled={state.atoms.length === 0}
                  className="w-full h-8 text-xs justify-start text-destructive hover:text-destructive"
                >
                  <Eraser className="h-3.5 w-3.5 mr-2" />
                  Clear All
                </Button>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          atomId={contextMenu.atomId}
          atoms={state.atoms}
          onClose={() => setContextMenu(null)}
          onDelete={(id) => dispatch({ type: "REMOVE_ATOM", id })}
          onChangeElement={(id) => setElementChangeAtomId(id)}
          onDuplicate={duplicateAtom}
          onShowDistances={showDistancesToast}
        />
      )}

      {/* Element Change Modal */}
      {elementChangeAtomId && (
        <ElementChangeModal
          atomId={elementChangeAtomId}
          onClose={() => setElementChangeAtomId(null)}
          onSelect={(id, el) => dispatch({ type: "CHANGE_ELEMENT", id, element: el })}
        />
      )}

      {/* Load Material Modal */}
      {loadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-border shadow-2xl w-full max-w-sm mx-4 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">
                Load Material
              </h3>
              <button
                onClick={() => {
                  setLoadModalOpen(false);
                  setLoadError("");
                }}
                className="p-1 rounded hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Enter a material ID (e.g., mp-149 for Silicon) to load its crystal
              structure into the builder.
            </p>
            <input
              type="text"
              value={loadMaterialId}
              onChange={(e) => setLoadMaterialId(e.target.value)}
              placeholder="mp-149"
              className="w-full h-9 rounded-md border border-border bg-card px-3 text-sm text-foreground mb-2"
              onKeyDown={(e) => {
                if (e.key === "Enter" && loadMaterialId.trim()) {
                  loadMaterial(loadMaterialId.trim());
                }
              }}
            />
            {loadError && (
              <p className="text-xs text-destructive mb-2">{loadError}</p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setLoadModalOpen(false);
                  setLoadError("");
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                loading={loading}
                onClick={() => {
                  if (loadMaterialId.trim()) {
                    loadMaterial(loadMaterialId.trim());
                  }
                }}
              >
                Load
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Surface Modal */}
      {surfaceModalOpen && (
        <SurfaceModal
          atoms={state.atoms}
          lattice={appliedLattice}
          onClose={() => setSurfaceModalOpen(false)}
          onLoad={handleSurfaceLoad}
        />
      )}

      {/* Nanoparticle Modal */}
      {nanoModalOpen && (
        <NanoparticleModal
          atoms={state.atoms}
          lattice={appliedLattice}
          onClose={() => setNanoModalOpen(false)}
          onLoad={handleSurfaceLoad}
        />
      )}

      {/* Toast */}
      {toastMsg && (
        <Toast message={toastMsg} onClose={() => setToastMsg(null)} />
      )}
    </div>
  );
}
