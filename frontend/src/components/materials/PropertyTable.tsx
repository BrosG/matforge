import { cn } from "@/lib/utils";

interface PropertyTableProps {
  properties: Record<string, number | null>;
  units?: Record<string, string>;
  sourceDb?: string;
}

const PROPERTY_INFO: Record<string, { label: string; tooltip: string; range?: string; icon?: string }> = {
  band_gap: { label: "Band Gap", tooltip: "Energy gap between valence and conduction bands. 0 = metal, 0.5-4 = semiconductor, >4 = insulator.", range: "0-12 eV", icon: "zap" },
  formation_energy: { label: "Formation Energy", tooltip: "Energy to form compound from elements. More negative = more stable.", range: "-5 to +2 eV/atom", icon: "flame" },
  energy_above_hull: { label: "E Above Hull", tooltip: "Distance from convex hull. 0 = thermodynamically stable. >0.025 = likely unstable.", range: "0-0.5 eV/atom", icon: "triangle" },
  density: { label: "Density", tooltip: "Mass per unit volume. Li ~1, Fe ~7.9, Os ~22 g/cm\u00B3.", range: "1-22 g/cm\u00B3", icon: "box" },
  volume: { label: "Volume", tooltip: "Unit cell volume.", range: "10-2000 \u00C5\u00B3", icon: "cube" },
  bulk_modulus: { label: "Bulk Modulus", tooltip: "Resistance to compression. Diamond ~440, rubber ~2 GPa.", range: "1-500 GPa", icon: "shield" },
  shear_modulus: { label: "Shear Modulus", tooltip: "Resistance to shear stress. Steel ~80 GPa.", range: "1-250 GPa", icon: "shield" },
  young_modulus: { label: "Young\u2019s Modulus", tooltip: "Stiffness under tension. Steel ~200, bone ~20 GPa.", range: "0.01-600 GPa", icon: "shield" },
  poisson_ratio: { label: "Poisson Ratio", tooltip: "Lateral contraction when stretched. Most materials 0.2-0.4.", range: "-1 to 0.5", icon: "move" },
  total_magnetization: { label: "Magnetization", tooltip: "Net magnetic moment. >0.5 \u00B5B = ferromagnetic/ferrimagnetic. Antiferromagnets have near-zero net moment.", range: "0-10 \u00B5B", icon: "magnet" },
  dielectric_constant: { label: "Dielectric", tooltip: "Electronic dielectric response. Important for capacitors.", range: "1-200", icon: "circle" },
  refractive_index: { label: "Refractive Index", tooltip: "Speed of light in material vs vacuum. Diamond 2.42, glass 1.5.", range: "1-4", icon: "eye" },
  thermal_conductivity: { label: "Thermal Cond.", tooltip: "Heat conduction rate. Diamond ~2000, copper ~400 W/(m\u00B7K).", range: "0.01-2000 W/(m\u00B7K)", icon: "thermometer" },
  seebeck_coefficient: { label: "Seebeck Coeff.", tooltip: "Thermoelectric voltage per degree. Good >200 \u00B5V/K.", range: "-500 to 500 \u00B5V/K", icon: "battery" },
  effective_mass_electron: { label: "e\u207B Mass", tooltip: "Electron effective mass. Lower = higher mobility.", range: "0.01-10 m\u2091", icon: "atom" },
  effective_mass_hole: { label: "h\u207A Mass", tooltip: "Hole effective mass. Typically heavier than electrons.", range: "0.1-20 m\u2091", icon: "atom" },
  efermi: { label: "Fermi Energy", tooltip: "Highest occupied energy at 0K. Reference for all electronic energies.", range: "-15 to 15 eV", icon: "minus" },
};

const AFLOW_UNAVAILABLE = new Set([
  "formation_energy", "energy_above_hull", "volume", "efermi",
  "dielectric_constant", "refractive_index", "effective_mass_electron",
  "effective_mass_hole", "seebeck_coefficient",
]);

function getLabel(key: string): string {
  return PROPERTY_INFO[key]?.label ?? key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function formatValue(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  if (Math.abs(value) < 0.001 && value !== 0) return value.toExponential(2);
  return Number(value.toPrecision(4)).toString();
}

function getValueColor(key: string, value: number): string {
  if (key === "energy_above_hull") {
    if (value === 0) return "text-green-600 dark:text-green-400";
    if (value < 0.025) return "text-amber-600 dark:text-amber-400";
    return "text-red-500 dark:text-red-400";
  }
  if (key === "band_gap") {
    if (value === 0) return "text-blue-500 dark:text-blue-400";
    if (value >= 1.1 && value <= 1.5) return "text-green-600 dark:text-green-400";
  }
  return "text-foreground";
}

export function PropertyTable({ properties, units, sourceDb }: PropertyTableProps) {
  const isAflow = sourceDb === "aflow";

  const entries = Object.entries(properties).filter(([key, v]) => {
    if (v !== null && v !== undefined) return true;
    if (isAflow && AFLOW_UNAVAILABLE.has(key)) return true;
    return false;
  });

  if (entries.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
      {entries.map(([key, value]) => {
        const info = PROPERTY_INFO[key];
        const isUnavailable = value === null || value === undefined;
        const isAflowNull = isAflow && isUnavailable && AFLOW_UNAVAILABLE.has(key);

        return (
          <div
            key={key}
            className={cn(
              "group relative rounded-xl border p-3 transition-all hover:shadow-sm",
              isUnavailable
                ? "border-dashed border-border/50 bg-muted/20"
                : "border-border bg-card hover:border-primary/20"
            )}
          >
            {/* Label */}
            <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5 truncate">
              {getLabel(key)}
            </div>

            {/* Value */}
            <div className="flex items-baseline gap-1">
              {isAflowNull ? (
                <span className="text-xs text-muted-foreground/50 italic">N/A</span>
              ) : isUnavailable ? (
                <span className="text-sm text-muted-foreground/40">&mdash;</span>
              ) : (
                <>
                  <span className={cn("text-lg font-bold font-mono leading-none", getValueColor(key, value!))}>
                    {formatValue(value!)}
                  </span>
                  {units?.[key] && (
                    <span className="text-[10px] text-muted-foreground font-normal">
                      {units[key]}
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Tooltip on hover */}
            {info?.tooltip && (
              <div className="invisible group-hover:visible absolute left-0 bottom-full mb-1.5 z-50 w-64 p-3 text-xs text-foreground bg-card border border-border rounded-xl shadow-lg">
                <div className="font-semibold mb-1">{info.label}</div>
                {info.tooltip}
                {info.range && (
                  <div className="text-muted-foreground mt-1">Range: {info.range}</div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
