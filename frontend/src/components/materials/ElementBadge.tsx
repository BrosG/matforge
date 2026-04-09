"use client";

import { cn } from "@/lib/utils";

// ── Element data (118 elements) ──────────────────────────────────────────────
export type ElementCategory =
  | "alkali-metal"
  | "alkaline-earth"
  | "transition-metal"
  | "post-transition-metal"
  | "metalloid"
  | "nonmetal"
  | "halogen"
  | "noble-gas"
  | "lanthanide"
  | "actinide";

export interface ElementInfo {
  number: number;
  symbol: string;
  name: string;
  category: ElementCategory;
  row: number;
  col: number;
}

/** Category → Tailwind color classes */
export const CATEGORY_COLORS: Record<
  ElementCategory,
  { bg: string; text: string; border: string; selectedBg: string }
> = {
  "alkali-metal": {
    bg: "bg-red-100",
    text: "text-red-800",
    border: "border-red-300",
    selectedBg: "bg-red-500",
  },
  "alkaline-earth": {
    bg: "bg-orange-100",
    text: "text-orange-800",
    border: "border-orange-300",
    selectedBg: "bg-orange-500",
  },
  "transition-metal": {
    bg: "bg-blue-100",
    text: "text-blue-800",
    border: "border-blue-300",
    selectedBg: "bg-blue-500",
  },
  "post-transition-metal": {
    bg: "bg-teal-100",
    text: "text-teal-800",
    border: "border-teal-300",
    selectedBg: "bg-teal-500",
  },
  metalloid: {
    bg: "bg-green-100",
    text: "text-green-800",
    border: "border-green-300",
    selectedBg: "bg-green-500",
  },
  nonmetal: {
    bg: "bg-yellow-100",
    text: "text-yellow-800",
    border: "border-yellow-300",
    selectedBg: "bg-yellow-500",
  },
  halogen: {
    bg: "bg-purple-100",
    text: "text-purple-800",
    border: "border-purple-300",
    selectedBg: "bg-purple-500",
  },
  "noble-gas": {
    bg: "bg-pink-100",
    text: "text-pink-800",
    border: "border-pink-300",
    selectedBg: "bg-pink-500",
  },
  lanthanide: {
    bg: "bg-gray-200",
    text: "text-gray-800",
    border: "border-gray-400",
    selectedBg: "bg-gray-500",
  },
  actinide: {
    bg: "bg-gray-300",
    text: "text-gray-900",
    border: "border-gray-500",
    selectedBg: "bg-gray-600",
  },
};

/**
 * Complete periodic table data – all 118 elements with standard 18-column
 * grid positions. Lanthanides occupy row 8 and actinides row 9 (displayed
 * below the main table).
 */
export const ELEMENTS: ElementInfo[] = [
  // Period 1
  { number: 1, symbol: "H", name: "Hydrogen", category: "nonmetal", row: 1, col: 1 },
  { number: 2, symbol: "He", name: "Helium", category: "noble-gas", row: 1, col: 18 },
  // Period 2
  { number: 3, symbol: "Li", name: "Lithium", category: "alkali-metal", row: 2, col: 1 },
  { number: 4, symbol: "Be", name: "Beryllium", category: "alkaline-earth", row: 2, col: 2 },
  { number: 5, symbol: "B", name: "Boron", category: "metalloid", row: 2, col: 13 },
  { number: 6, symbol: "C", name: "Carbon", category: "nonmetal", row: 2, col: 14 },
  { number: 7, symbol: "N", name: "Nitrogen", category: "nonmetal", row: 2, col: 15 },
  { number: 8, symbol: "O", name: "Oxygen", category: "nonmetal", row: 2, col: 16 },
  { number: 9, symbol: "F", name: "Fluorine", category: "halogen", row: 2, col: 17 },
  { number: 10, symbol: "Ne", name: "Neon", category: "noble-gas", row: 2, col: 18 },
  // Period 3
  { number: 11, symbol: "Na", name: "Sodium", category: "alkali-metal", row: 3, col: 1 },
  { number: 12, symbol: "Mg", name: "Magnesium", category: "alkaline-earth", row: 3, col: 2 },
  { number: 13, symbol: "Al", name: "Aluminium", category: "post-transition-metal", row: 3, col: 13 },
  { number: 14, symbol: "Si", name: "Silicon", category: "metalloid", row: 3, col: 14 },
  { number: 15, symbol: "P", name: "Phosphorus", category: "nonmetal", row: 3, col: 15 },
  { number: 16, symbol: "S", name: "Sulfur", category: "nonmetal", row: 3, col: 16 },
  { number: 17, symbol: "Cl", name: "Chlorine", category: "halogen", row: 3, col: 17 },
  { number: 18, symbol: "Ar", name: "Argon", category: "noble-gas", row: 3, col: 18 },
  // Period 4
  { number: 19, symbol: "K", name: "Potassium", category: "alkali-metal", row: 4, col: 1 },
  { number: 20, symbol: "Ca", name: "Calcium", category: "alkaline-earth", row: 4, col: 2 },
  { number: 21, symbol: "Sc", name: "Scandium", category: "transition-metal", row: 4, col: 3 },
  { number: 22, symbol: "Ti", name: "Titanium", category: "transition-metal", row: 4, col: 4 },
  { number: 23, symbol: "V", name: "Vanadium", category: "transition-metal", row: 4, col: 5 },
  { number: 24, symbol: "Cr", name: "Chromium", category: "transition-metal", row: 4, col: 6 },
  { number: 25, symbol: "Mn", name: "Manganese", category: "transition-metal", row: 4, col: 7 },
  { number: 26, symbol: "Fe", name: "Iron", category: "transition-metal", row: 4, col: 8 },
  { number: 27, symbol: "Co", name: "Cobalt", category: "transition-metal", row: 4, col: 9 },
  { number: 28, symbol: "Ni", name: "Nickel", category: "transition-metal", row: 4, col: 10 },
  { number: 29, symbol: "Cu", name: "Copper", category: "transition-metal", row: 4, col: 11 },
  { number: 30, symbol: "Zn", name: "Zinc", category: "transition-metal", row: 4, col: 12 },
  { number: 31, symbol: "Ga", name: "Gallium", category: "post-transition-metal", row: 4, col: 13 },
  { number: 32, symbol: "Ge", name: "Germanium", category: "metalloid", row: 4, col: 14 },
  { number: 33, symbol: "As", name: "Arsenic", category: "metalloid", row: 4, col: 15 },
  { number: 34, symbol: "Se", name: "Selenium", category: "nonmetal", row: 4, col: 16 },
  { number: 35, symbol: "Br", name: "Bromine", category: "halogen", row: 4, col: 17 },
  { number: 36, symbol: "Kr", name: "Krypton", category: "noble-gas", row: 4, col: 18 },
  // Period 5
  { number: 37, symbol: "Rb", name: "Rubidium", category: "alkali-metal", row: 5, col: 1 },
  { number: 38, symbol: "Sr", name: "Strontium", category: "alkaline-earth", row: 5, col: 2 },
  { number: 39, symbol: "Y", name: "Yttrium", category: "transition-metal", row: 5, col: 3 },
  { number: 40, symbol: "Zr", name: "Zirconium", category: "transition-metal", row: 5, col: 4 },
  { number: 41, symbol: "Nb", name: "Niobium", category: "transition-metal", row: 5, col: 5 },
  { number: 42, symbol: "Mo", name: "Molybdenum", category: "transition-metal", row: 5, col: 6 },
  { number: 43, symbol: "Tc", name: "Technetium", category: "transition-metal", row: 5, col: 7 },
  { number: 44, symbol: "Ru", name: "Ruthenium", category: "transition-metal", row: 5, col: 8 },
  { number: 45, symbol: "Rh", name: "Rhodium", category: "transition-metal", row: 5, col: 9 },
  { number: 46, symbol: "Pd", name: "Palladium", category: "transition-metal", row: 5, col: 10 },
  { number: 47, symbol: "Ag", name: "Silver", category: "transition-metal", row: 5, col: 11 },
  { number: 48, symbol: "Cd", name: "Cadmium", category: "transition-metal", row: 5, col: 12 },
  { number: 49, symbol: "In", name: "Indium", category: "post-transition-metal", row: 5, col: 13 },
  { number: 50, symbol: "Sn", name: "Tin", category: "post-transition-metal", row: 5, col: 14 },
  { number: 51, symbol: "Sb", name: "Antimony", category: "metalloid", row: 5, col: 15 },
  { number: 52, symbol: "Te", name: "Tellurium", category: "metalloid", row: 5, col: 16 },
  { number: 53, symbol: "I", name: "Iodine", category: "halogen", row: 5, col: 17 },
  { number: 54, symbol: "Xe", name: "Xenon", category: "noble-gas", row: 5, col: 18 },
  // Period 6
  { number: 55, symbol: "Cs", name: "Caesium", category: "alkali-metal", row: 6, col: 1 },
  { number: 56, symbol: "Ba", name: "Barium", category: "alkaline-earth", row: 6, col: 2 },
  // La–Lu → lanthanides row 8
  { number: 57, symbol: "La", name: "Lanthanum", category: "lanthanide", row: 8, col: 3 },
  { number: 58, symbol: "Ce", name: "Cerium", category: "lanthanide", row: 8, col: 4 },
  { number: 59, symbol: "Pr", name: "Praseodymium", category: "lanthanide", row: 8, col: 5 },
  { number: 60, symbol: "Nd", name: "Neodymium", category: "lanthanide", row: 8, col: 6 },
  { number: 61, symbol: "Pm", name: "Promethium", category: "lanthanide", row: 8, col: 7 },
  { number: 62, symbol: "Sm", name: "Samarium", category: "lanthanide", row: 8, col: 8 },
  { number: 63, symbol: "Eu", name: "Europium", category: "lanthanide", row: 8, col: 9 },
  { number: 64, symbol: "Gd", name: "Gadolinium", category: "lanthanide", row: 8, col: 10 },
  { number: 65, symbol: "Tb", name: "Terbium", category: "lanthanide", row: 8, col: 11 },
  { number: 66, symbol: "Dy", name: "Dysprosium", category: "lanthanide", row: 8, col: 12 },
  { number: 67, symbol: "Ho", name: "Holmium", category: "lanthanide", row: 8, col: 13 },
  { number: 68, symbol: "Er", name: "Erbium", category: "lanthanide", row: 8, col: 14 },
  { number: 69, symbol: "Tm", name: "Thulium", category: "lanthanide", row: 8, col: 15 },
  { number: 70, symbol: "Yb", name: "Ytterbium", category: "lanthanide", row: 8, col: 16 },
  { number: 71, symbol: "Lu", name: "Lutetium", category: "lanthanide", row: 8, col: 17 },
  // back to period 6
  { number: 72, symbol: "Hf", name: "Hafnium", category: "transition-metal", row: 6, col: 4 },
  { number: 73, symbol: "Ta", name: "Tantalum", category: "transition-metal", row: 6, col: 5 },
  { number: 74, symbol: "W", name: "Tungsten", category: "transition-metal", row: 6, col: 6 },
  { number: 75, symbol: "Re", name: "Rhenium", category: "transition-metal", row: 6, col: 7 },
  { number: 76, symbol: "Os", name: "Osmium", category: "transition-metal", row: 6, col: 8 },
  { number: 77, symbol: "Ir", name: "Iridium", category: "transition-metal", row: 6, col: 9 },
  { number: 78, symbol: "Pt", name: "Platinum", category: "transition-metal", row: 6, col: 10 },
  { number: 79, symbol: "Au", name: "Gold", category: "transition-metal", row: 6, col: 11 },
  { number: 80, symbol: "Hg", name: "Mercury", category: "transition-metal", row: 6, col: 12 },
  { number: 81, symbol: "Tl", name: "Thallium", category: "post-transition-metal", row: 6, col: 13 },
  { number: 82, symbol: "Pb", name: "Lead", category: "post-transition-metal", row: 6, col: 14 },
  { number: 83, symbol: "Bi", name: "Bismuth", category: "post-transition-metal", row: 6, col: 15 },
  { number: 84, symbol: "Po", name: "Polonium", category: "post-transition-metal", row: 6, col: 16 },
  { number: 85, symbol: "At", name: "Astatine", category: "halogen", row: 6, col: 17 },
  { number: 86, symbol: "Rn", name: "Radon", category: "noble-gas", row: 6, col: 18 },
  // Period 7
  { number: 87, symbol: "Fr", name: "Francium", category: "alkali-metal", row: 7, col: 1 },
  { number: 88, symbol: "Ra", name: "Radium", category: "alkaline-earth", row: 7, col: 2 },
  // Ac–Lr → actinides row 9
  { number: 89, symbol: "Ac", name: "Actinium", category: "actinide", row: 9, col: 3 },
  { number: 90, symbol: "Th", name: "Thorium", category: "actinide", row: 9, col: 4 },
  { number: 91, symbol: "Pa", name: "Protactinium", category: "actinide", row: 9, col: 5 },
  { number: 92, symbol: "U", name: "Uranium", category: "actinide", row: 9, col: 6 },
  { number: 93, symbol: "Np", name: "Neptunium", category: "actinide", row: 9, col: 7 },
  { number: 94, symbol: "Pu", name: "Plutonium", category: "actinide", row: 9, col: 8 },
  { number: 95, symbol: "Am", name: "Americium", category: "actinide", row: 9, col: 9 },
  { number: 96, symbol: "Cm", name: "Curium", category: "actinide", row: 9, col: 10 },
  { number: 97, symbol: "Bk", name: "Berkelium", category: "actinide", row: 9, col: 11 },
  { number: 98, symbol: "Cf", name: "Californium", category: "actinide", row: 9, col: 12 },
  { number: 99, symbol: "Es", name: "Einsteinium", category: "actinide", row: 9, col: 13 },
  { number: 100, symbol: "Fm", name: "Fermium", category: "actinide", row: 9, col: 14 },
  { number: 101, symbol: "Md", name: "Mendelevium", category: "actinide", row: 9, col: 15 },
  { number: 102, symbol: "No", name: "Nobelium", category: "actinide", row: 9, col: 16 },
  { number: 103, symbol: "Lr", name: "Lawrencium", category: "actinide", row: 9, col: 17 },
  // back to period 7
  { number: 104, symbol: "Rf", name: "Rutherfordium", category: "transition-metal", row: 7, col: 4 },
  { number: 105, symbol: "Db", name: "Dubnium", category: "transition-metal", row: 7, col: 5 },
  { number: 106, symbol: "Sg", name: "Seaborgium", category: "transition-metal", row: 7, col: 6 },
  { number: 107, symbol: "Bh", name: "Bohrium", category: "transition-metal", row: 7, col: 7 },
  { number: 108, symbol: "Hs", name: "Hassium", category: "transition-metal", row: 7, col: 8 },
  { number: 109, symbol: "Mt", name: "Meitnerium", category: "transition-metal", row: 7, col: 9 },
  { number: 110, symbol: "Ds", name: "Darmstadtium", category: "transition-metal", row: 7, col: 10 },
  { number: 111, symbol: "Rg", name: "Roentgenium", category: "transition-metal", row: 7, col: 11 },
  { number: 112, symbol: "Cn", name: "Copernicium", category: "transition-metal", row: 7, col: 12 },
  { number: 113, symbol: "Nh", name: "Nihonium", category: "post-transition-metal", row: 7, col: 13 },
  { number: 114, symbol: "Fl", name: "Flerovium", category: "post-transition-metal", row: 7, col: 14 },
  { number: 115, symbol: "Mc", name: "Moscovium", category: "post-transition-metal", row: 7, col: 15 },
  { number: 116, symbol: "Lv", name: "Livermorium", category: "post-transition-metal", row: 7, col: 16 },
  { number: 117, symbol: "Ts", name: "Tennessine", category: "halogen", row: 7, col: 17 },
  { number: 118, symbol: "Og", name: "Oganesson", category: "noble-gas", row: 7, col: 18 },
];

/** Look up element info by symbol (case-insensitive). */
export const ELEMENT_MAP: Record<string, ElementInfo> = Object.fromEntries(
  ELEMENTS.map((e) => [e.symbol, e])
);

// ── ElementBadge component ───────────────────────────────────────────────────

interface ElementBadgeProps {
  element: string;
  size?: "sm" | "md" | "lg";
}

const SIZE_MAP = {
  sm: "w-6 h-6 text-[10px]",
  md: "w-8 h-8 text-xs",
  lg: "w-10 h-10 text-sm",
} as const;

export function ElementBadge({ element, size = "md" }: ElementBadgeProps) {
  const info = ELEMENT_MAP[element];
  const category = info?.category ?? "transition-metal";
  const colors = CATEGORY_COLORS[category];

  return (
    <span
      title={info?.name ?? element}
      className={cn(
        "inline-flex items-center justify-center rounded-md font-bold border select-none",
        SIZE_MAP[size],
        colors.bg,
        colors.text,
        colors.border
      )}
    >
      {element}
    </span>
  );
}
