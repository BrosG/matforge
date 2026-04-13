import { cn } from "@/lib/utils";

interface PropertyTableProps {
  properties: Record<string, number | null>;
  units?: Record<string, string>;
}

/** Property definitions: human-readable name, tooltip explanation, typical range. */
const PROPERTY_INFO: Record<string, { label: string; tooltip: string; range?: string }> = {
  band_gap: {
    label: "Band Gap",
    tooltip: "Energy difference between valence and conduction bands. Determines if material is a metal (0 eV), semiconductor (0.5\u20134 eV), or insulator (>4 eV).",
    range: "0\u201312 eV",
  },
  formation_energy: {
    label: "Formation Energy",
    tooltip: "Energy released or absorbed when forming this compound from its elements. Negative = exothermic (favorable to form). More negative = more stable.",
    range: "\u22125 to +2 eV/atom",
  },
  energy_above_hull: {
    label: "Energy Above Hull",
    tooltip: "Distance from the thermodynamic convex hull. 0 = stable against all competing phases. >0.025 eV/atom = likely unstable and hard to synthesize.",
    range: "0\u20130.5 eV/atom",
  },
  density: {
    label: "Density",
    tooltip: "Mass per unit volume. Ranges from ~1 g/cm\u00B3 (Li) to ~22 g/cm\u00B3 (Os). Important for weight-sensitive applications.",
    range: "1\u201322 g/cm\u00B3",
  },
  volume: {
    label: "Volume",
    tooltip: "Unit cell volume. Determines how many atoms fit in a given space. Useful for comparing similar structures.",
    range: "10\u20132000 \u00C5\u00B3",
  },
  bulk_modulus: {
    label: "Bulk Modulus",
    tooltip: "Resistance to uniform compression. Higher = harder to compress. Diamond ~440 GPa, rubber ~2 GPa.",
    range: "1\u2013500 GPa",
  },
  shear_modulus: {
    label: "Shear Modulus",
    tooltip: "Resistance to shape change under shear stress. Predicts hardness and rigidity. Steel ~80 GPa.",
    range: "1\u2013250 GPa",
  },
  young_modulus: {
    label: "Young\u2019s Modulus",
    tooltip: "Stiffness under tension/compression. Higher = stiffer. Steel ~200 GPa, bone ~20 GPa, rubber ~0.01 GPa.",
    range: "0.01\u2013600 GPa",
  },
  poisson_ratio: {
    label: "Poisson Ratio",
    tooltip: "How much material contracts sideways when stretched. Most materials 0.2\u20130.4. Cork \u22480, rubber \u22480.5. Auxetics <0.",
    range: "\u22121 to 0.5",
  },
  total_magnetization: {
    label: "Magnetization",
    tooltip: "Net magnetic moment per unit cell. 0 = non-magnetic. >0.5 \u00B5B typically indicates magnetic ordering (ferro/antiferro).",
    range: "0\u201310 \u00B5B",
  },
  dielectric_constant: {
    label: "Dielectric Constant",
    tooltip: "Electronic contribution to dielectric response. Higher = better charge screening. Important for capacitors and semiconductor doping.",
    range: "1\u2013200",
  },
  refractive_index: {
    label: "Refractive Index",
    tooltip: "Speed of light in material relative to vacuum. Diamond 2.42, glass 1.5, water 1.33. Determines optical properties.",
    range: "1\u20134",
  },
  thermal_conductivity: {
    label: "Thermal Conductivity",
    tooltip: "How well material conducts heat. Diamond ~2000 W/(m\u00B7K), copper ~400, glass ~1, aerogel ~0.02.",
    range: "0.01\u20132000 W/(m\u00B7K)",
  },
  seebeck_coefficient: {
    label: "Seebeck Coefficient",
    tooltip: "Voltage generated per degree of temperature difference. Key thermoelectric property. Good thermoelectrics: >200 \u00B5V/K.",
    range: "\u2212500 to 500 \u00B5V/K",
  },
  effective_mass_electron: {
    label: "Effective Mass (e\u207B)",
    tooltip: "How heavy electrons behave in the crystal. Lower = faster carriers = higher mobility. Free electron = 1.0 m\u2091.",
    range: "0.01\u201310 m\u2091",
  },
  effective_mass_hole: {
    label: "Effective Mass (h\u207A)",
    tooltip: "How heavy holes (missing electrons) behave. Lower = better p-type conductivity. Typically heavier than electrons.",
    range: "0.1\u201320 m\u2091",
  },
  efermi: {
    label: "Fermi Energy",
    tooltip: "Highest occupied energy level at 0 K. Reference point for all electronic energies. Position relative to band edges determines carrier type.",
    range: "\u221215 to 15 eV",
  },
};

/** Get human-readable label for a property key. */
function getLabel(key: string): string {
  return PROPERTY_INFO[key]?.label ?? key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Format a number to 4 significant figures. */
function formatValue(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  return Number(value.toPrecision(4)).toString();
}

export function PropertyTable({ properties, units }: PropertyTableProps) {
  // Only show rows that have actual values — never show dashes for missing data
  const entries = Object.entries(properties).filter(
    ([, v]) => v !== null && v !== undefined
  );

  if (entries.length === 0) {
    return null; // Don't render empty tables
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="px-4 py-2.5 text-left font-semibold text-gray-700">
              Property
            </th>
            <th className="px-4 py-2.5 text-right font-semibold text-gray-700">
              Value
            </th>
            {units && (
              <th className="px-4 py-2.5 text-left font-semibold text-gray-700">
                Unit
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {entries.map(([key, value], idx) => {
            const info = PROPERTY_INFO[key];
            return (
              <tr
                key={key}
                className={cn(
                  "border-b last:border-b-0 transition-colors",
                  idx % 2 === 1 ? "bg-gray-50/50" : "bg-white"
                )}
              >
                <td className="px-4 py-2.5 text-gray-600">
                  <span className="group relative cursor-help">
                    {getLabel(key)}
                    {info?.tooltip && (
                      <span className="invisible group-hover:visible absolute left-0 top-full mt-1 z-50 w-72 p-3 text-xs text-gray-700 bg-white border border-gray-200 rounded-lg shadow-lg">
                        <span className="font-semibold block mb-1">{info.label}</span>
                        {info.tooltip}
                        {info.range && (
                          <span className="block mt-1 text-gray-400">Typical range: {info.range}</span>
                        )}
                      </span>
                    )}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-gray-900">
                  {value === null || value === undefined
                    ? <span className="text-gray-400">&mdash;</span>
                    : formatValue(value)}
                </td>
                {units && (
                  <td className="px-4 py-2.5 text-gray-500 text-xs">
                    {units[key] ?? ""}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
