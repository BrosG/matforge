"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

// ── CPK coloring map (hex) ──────────────────────────────────────────────────
export const CPK_COLORS: Record<string, string> = {
  H: "#FFFFFF",
  He: "#D9FFFF",
  Li: "#CC80FF",
  Be: "#C2FF00",
  B: "#FFB5B5",
  C: "#909090",
  N: "#3050F8",
  O: "#FF0D0D",
  F: "#90E050",
  Ne: "#B3E3F5",
  Na: "#AB5CF2",
  Mg: "#8AFF00",
  Al: "#BFA6A6",
  Si: "#F0C8A0",
  P: "#FF8000",
  S: "#FFFF30",
  Cl: "#1FF01F",
  Ar: "#80D1E3",
  K: "#8F40D4",
  Ca: "#3DFF00",
  Ti: "#BFC2C7",
  V: "#A6A6AB",
  Cr: "#8A99C7",
  Mn: "#9C7AC7",
  Fe: "#E06633",
  Co: "#F090A0",
  Ni: "#50D050",
  Cu: "#C88033",
  Zn: "#7D80B0",
  Ga: "#C28F8F",
  Ge: "#668F8F",
  As: "#BD80E3",
  Se: "#FFA100",
  Br: "#A62929",
  Kr: "#5CB8D1",
  Rb: "#702EB0",
  Sr: "#00FF00",
  Y: "#94FFFF",
  Zr: "#94E0E0",
  Nb: "#73C2C9",
  Mo: "#54B5B5",
  Ru: "#248F8F",
  Rh: "#0A7D8C",
  Pd: "#006985",
  Ag: "#C0C0C0",
  Cd: "#FFD98F",
  In: "#A67573",
  Sn: "#668080",
  Sb: "#9E63B5",
  Te: "#D47A00",
  I: "#940094",
  Xe: "#429EB0",
  Cs: "#57178F",
  Ba: "#00C900",
  La: "#70D4FF",
  Ce: "#FFFFC7",
  Pt: "#D0D0E0",
  Au: "#FFD123",
  Hg: "#B8B8D0",
  Pb: "#575961",
  Bi: "#9E4FB5",
  U: "#008FFF",
};

/** Default covalent-ish radii (Angstrom) for sphere sizing */
const ELEMENT_RADII: Record<string, number> = {
  H: 0.25,
  He: 0.28,
  C: 0.35,
  N: 0.35,
  O: 0.33,
  F: 0.32,
  Si: 0.45,
  P: 0.4,
  S: 0.4,
  Cl: 0.38,
  Fe: 0.45,
  Cu: 0.42,
  Zn: 0.42,
  Br: 0.42,
  I: 0.48,
};
const DEFAULT_RADIUS = 0.38;

// ── Types ───────────────────────────────────────────────────────────────────
interface AtomData {
  element: string;
  x: number;
  y: number;
  z: number;
  cartesian?: boolean; // true = x,y,z are Angstrom; false/undefined = fractional
}

interface LatticeParams {
  a: number;
  b: number;
  c: number;
  alpha: number;
  beta: number;
  gamma: number;
}

interface MaterialStructureViewerProps {
  atoms: AtomData[];
  lattice?: LatticeParams;
  className?: string;
}

// ── Lazy-loaded 3D scene (SSR disabled) ─────────────────────────────────────
const Scene3D = dynamic(() => import("./MaterialStructureScene"), {
  ssr: false,
  loading: () => <StructureViewerFallback />,
});

function StructureViewerFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-900 rounded-xl">
      <div className="text-center">
        <div className="relative mx-auto w-16 h-16">
          <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
          <div className="absolute inset-2 rounded-full bg-blue-500/40 animate-pulse" />
          <div className="absolute inset-4 rounded-full bg-blue-500/60 animate-pulse" />
        </div>
        <p className="text-xs text-gray-400 mt-4">Loading 3D viewer...</p>
      </div>
    </div>
  );
}

/** Convert fractional (abc) to Cartesian (xyz) using lattice parameters. */
function fracToCart(
  fx: number, fy: number, fz: number,
  lat: LatticeParams
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

/** Build the 12 edges of a parallelepiped unit cell. */
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

export function MaterialStructureViewer({
  atoms,
  lattice,
  className,
}: MaterialStructureViewerProps) {
  const { positions, colors, radii, bonds, cellEdges } = useMemo(() => {
    if (atoms.length === 0) {
      return { positions: [], colors: [], radii: [], bonds: [], cellEdges: [] };
    }

    const hasLattice = lattice && lattice.a > 0;

    // Check if coordinates are already Cartesian (from API flag) or fractional
    // If no flag, detect: if max coordinate > 1.1, likely Cartesian Angstrom
    const hasFlag = atoms.length > 0 && atoms[0].cartesian !== undefined;
    const maxCoord = Math.max(...atoms.map(a => Math.max(Math.abs(a.x), Math.abs(a.y), Math.abs(a.z))));
    const isCartesian = hasFlag ? atoms[0].cartesian === true : maxCoord > 1.1;

    let cartAtoms: { element: string; x: number; y: number; z: number }[];

    if (!isCartesian && hasLattice) {
      // Fractional coordinates — convert to Cartesian using lattice
      cartAtoms = [];
      const cellOffsets = atoms.length < 8 ? [0, 1] : [0];

      for (const dx of cellOffsets) {
        for (const dy of cellOffsets) {
          for (const dz of cellOffsets) {
            for (const a of atoms) {
              const [cx, cy, cz] = fracToCart(a.x + dx, a.y + dy, a.z + dz, lattice!);
              cartAtoms.push({ element: a.element, x: cx, y: cy, z: cz });
            }
          }
        }
      }
    } else {
      // Already Cartesian Angstrom — use directly
      cartAtoms = atoms;
    }

    // Compute unit cell center for centering everything together
    let originX = 0, originY = 0, originZ = 0;
    if (hasLattice) {
      // Center of the conventional unit cell (at fractional 0.5, 0.5, 0.5)
      const cellCenter = fracToCart(0.5, 0.5, 0.5, lattice!);
      originX = cellCenter[0];
      originY = cellCenter[1];
      originZ = cellCenter[2];
    } else {
      // Fallback: center of mass
      originX = cartAtoms.reduce((s, a) => s + a.x, 0) / cartAtoms.length;
      originY = cartAtoms.reduce((s, a) => s + a.y, 0) / cartAtoms.length;
      originZ = cartAtoms.reduce((s, a) => s + a.z, 0) / cartAtoms.length;
    }

    const pos = cartAtoms.map((a) => [a.x - originX, a.y - originY, a.z - originZ] as [number, number, number]);
    const cols = cartAtoms.map((a) => CPK_COLORS[a.element] ?? "#888888");
    const rads = cartAtoms.map((a) => ELEMENT_RADII[a.element] ?? DEFAULT_RADIUS);

    // Auto-detect bonds with proper Cartesian distances
    const bondList: [number, number][] = [];
    const BOND_MAX = 3.5; // Angstrom — covers metallic bonds too
    const BOND_MIN = 0.5;
    for (let i = 0; i < pos.length; i++) {
      for (let j = i + 1; j < pos.length; j++) {
        const dx = pos[i][0] - pos[j][0];
        const dy = pos[i][1] - pos[j][1];
        const dz = pos[i][2] - pos[j][2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < BOND_MAX && dist > BOND_MIN) {
          bondList.push([i, j]);
        }
      }
    }

    // Unit cell wireframe edges — centered with same origin as atoms
    let edges: [number, number, number, number, number, number][] = [];
    if (hasLattice) {
      edges = unitCellEdges(lattice!).map((e) => [
        e[0] - originX, e[1] - originY, e[2] - originZ,
        e[3] - originX, e[4] - originY, e[5] - originZ,
      ] as [number, number, number, number, number, number]);
    }

    return { positions: pos, colors: cols, radii: rads, bonds: bondList, cellEdges: edges };
  }, [atoms, lattice]);

  return (
    <div className={cn("w-full h-80 rounded-xl overflow-hidden bg-gray-900", className)}>
      <Scene3D
        positions={positions}
        colors={colors}
        radii={radii}
        bonds={bonds}
        cellEdges={cellEdges}
      />
    </div>
  );
}
