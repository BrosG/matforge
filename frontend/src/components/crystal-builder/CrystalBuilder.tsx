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
  X,
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
}: {
  atom: PlacedAtom;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDrag: (id: string, pos: [number, number, number]) => void;
}) {
  const color = CPK_COLORS[atom.element] ?? "#888888";
  const radius = ELEMENT_RADII[atom.element] ?? DEFAULT_RADIUS;
  const meshRef = useRef<THREE.Mesh>(null);
  const isDragging = useRef(false);
  const { camera, gl } = useThree();

  const handlePointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      onSelect(atom.id);
      isDragging.current = true;
      (e.target as HTMLElement)?.setPointerCapture?.(e.pointerId);
    },
    [atom.id, onSelect]
  );

  const handlePointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (!isDragging.current || !meshRef.current) return;
      e.stopPropagation();
      // Project atom position to screen, then unproject mouse at same depth
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

function ClickPlane({
  onPlace,
}: {
  onPlace: (pos: [number, number, number]) => void;
}) {
  const handleClick = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      // Only handle clicks on the plane, not on atoms
      if (e.object.userData.isPlacementPlane) {
        e.stopPropagation();
        const pt = e.point;
        onPlace([
          Math.round(pt.x * 20) / 20,
          Math.round(pt.y * 20) / 20,
          Math.round(pt.z * 20) / 20,
        ]);
      }
    },
    [onPlace]
  );

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      onPointerDown={handleClick}
      userData={{ isPlacementPlane: true }}
    >
      <planeGeometry args={[50, 50]} />
      <meshStandardMaterial visible={false} />
    </mesh>
  );
}

function BuilderScene({
  atoms,
  selectedId,
  cellEdges,
  onSelect,
  onPlace,
  onDrag,
}: {
  atoms: PlacedAtom[];
  selectedId: string | null;
  cellEdges: [number, number, number, number, number, number][];
  onSelect: (id: string | null) => void;
  onPlace: (pos: [number, number, number]) => void;
  onDrag: (id: string, pos: [number, number, number]) => void;
}) {
  // Compute reasonable camera distance
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
      onPointerMissed={() => onSelect(null)}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <directionalLight position={[-5, -5, -8]} intensity={0.3} />

      {/* Placement plane + grid */}
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

      {/* Unit cell wireframe */}
      {cellEdges.map((e, i) => (
        <CellEdge
          key={`cell-${i}`}
          start={[e[0], e[1], e[2]]}
          end={[e[3], e[4], e[5]]}
        />
      ))}

      {/* Atoms */}
      {atoms.map((atom) => (
        <AtomSphere
          key={atom.id}
          atom={atom}
          isSelected={atom.id === selectedId}
          onSelect={onSelect}
          onDrag={onDrag}
        />
      ))}

      <OrbitControls
        makeDefault
        enablePan
        enableZoom
        enableRotate
        mouseButtons={{
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.PAN,
          RIGHT: THREE.MOUSE.PAN,
        }}
      />
    </Canvas>
  );
}

// ── Export helpers ─────────────────────────────────────────────────────────

function generateCIF(atoms: PlacedAtom[], lattice: LatticeParams): string {
  const lines = [
    "data_crystal_builder",
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

  // Group atoms by element
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
    "Crystal Builder Structure",
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
    "Crystal Builder Structure",
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

// ── API helper ────────────────────────────────────────────────────────────
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.matcraft.ai/api/v1";

// ── Main component ────────────────────────────────────────────────────────
export default function CrystalBuilder() {
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

  // Auto-load material from URL param
  useEffect(() => {
    const mid = searchParams.get("materialId");
    if (mid) {
      loadMaterial(mid);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (state.selectedId && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement)) {
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
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [state.selectedId]);

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
          // Detect crystal system
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
            (a: { element: string; x: number; y: number; z: number; cartesian?: boolean }) => {
              let cx = a.x, cy = a.y, cz = a.z;
              // Convert fractional to cartesian if needed
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
  }, []);

  const handleDrag = useCallback((id: string, pos: [number, number, number]) => {
    dispatch({ type: "MOVE_ATOM", id, x: pos[0], y: pos[1], z: pos[2] });
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
            Crystal Structure Builder
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
        </div>
      </header>

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
                    onClick={() => setActiveElement(el)}
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
        <main className="flex-1 min-h-[300px] lg:min-h-0 relative">
          <BuilderScene
            atoms={state.atoms}
            selectedId={state.selectedId}
            cellEdges={cellEdges}
            onSelect={handleSelect}
            onPlace={handlePlace}
            onDrag={handleDrag}
          />
          {/* Overlay hint */}
          {state.atoms.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center bg-black/40 backdrop-blur-sm rounded-xl px-6 py-4">
                <Atom className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                <p className="text-sm text-gray-300">
                  Click on the grid to place{" "}
                  <span className="font-semibold text-white">{activeElement}</span>{" "}
                  atoms
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Right-click/middle-click to pan, scroll to zoom
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

            {/* Selected atom info */}
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
    </div>
  );
}
