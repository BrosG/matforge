"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.matcraft.ai/api/v1";

const PROPERTIES = [
  { value: "band_gap", label: "Band Gap (eV)" },
  { value: "formation_energy", label: "Formation Energy (eV/atom)" },
  { value: "energy_above_hull", label: "Energy Above Hull (eV/atom)" },
  { value: "density", label: "Density (g/cm\u00B3)" },
  { value: "volume", label: "Volume (\u00C5\u00B3)" },
  { value: "bulk_modulus", label: "Bulk Modulus (GPa)" },
  { value: "shear_modulus", label: "Shear Modulus (GPa)" },
  { value: "young_modulus", label: "Young's Modulus (GPa)" },
  { value: "poisson_ratio", label: "Poisson Ratio" },
  { value: "total_magnetization", label: "Magnetization (\u00B5B)" },
  { value: "dielectric_constant", label: "Dielectric Constant" },
  { value: "thermal_conductivity", label: "Thermal Conductivity (W/m\u00B7K)" },
  { value: "seebeck_coefficient", label: "Seebeck Coefficient (\u00B5V/K)" },
  { value: "n_elements", label: "Number of Elements" },
  { value: "efermi", label: "Fermi Energy (eV)" },
];

interface ScatterPoint {
  id: string;
  formula: string;
  x: number;
  y: number;
  color?: number;
}

export default function ScatterPage() {
  const [xProp, setXProp] = useState("band_gap");
  const [yProp, setYProp] = useState("density");
  const [colorProp, setColorProp] = useState("");
  const [crystalSystem, setCrystalSystem] = useState("");
  const [data, setData] = useState<ScatterPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<ScatterPoint | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const sp = new URLSearchParams({
      x_prop: xProp,
      y_prop: yProp,
      limit: "10000",
    });
    if (colorProp) sp.set("color_prop", colorProp);
    if (crystalSystem) sp.set("crystal_system", crystalSystem);

    try {
      const res = await fetch(`${API_BASE}/materials/scatter?${sp}`);
      const json = await res.json();
      setData(json.data || []);
    } catch {
      setData([]);
    }
    setLoading(false);
  }, [xProp, yProp, colorProp, crystalSystem]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Compute bounds for SVG viewBox
  const xVals = data.map((d) => d.x).filter((v) => Number.isFinite(v));
  const yVals = data.map((d) => d.y).filter((v) => Number.isFinite(v));
  const xMin = Math.min(...xVals, 0);
  const xMax = Math.max(...xVals, 1);
  const yMin = Math.min(...yVals, 0);
  const yMax = Math.max(...yVals, 1);
  const xRange = xMax - xMin || 1;
  const yRange = yMax - yMin || 1;

  const W = 800;
  const H = 500;
  const PAD = 60;

  const toSvgX = (v: number) => PAD + ((v - xMin) / xRange) * (W - 2 * PAD);
  const toSvgY = (v: number) => H - PAD - ((v - yMin) / yRange) * (H - 2 * PAD);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Property Scatter Plot
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            Visualize correlations between any two material properties across {data.length.toLocaleString()} materials.
          </p>

          {/* Controls */}
          <div className="flex flex-wrap gap-4 mb-6">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">X Axis</span>
              <select
                value={xProp}
                onChange={(e) => setXProp(e.target.value)}
                className="text-sm border rounded-lg px-3 py-2 bg-white"
              >
                {PROPERTIES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">Y Axis</span>
              <select
                value={yProp}
                onChange={(e) => setYProp(e.target.value)}
                className="text-sm border rounded-lg px-3 py-2 bg-white"
              >
                {PROPERTIES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">Color By</span>
              <select
                value={colorProp}
                onChange={(e) => setColorProp(e.target.value)}
                className="text-sm border rounded-lg px-3 py-2 bg-white"
              >
                <option value="">None</option>
                {PROPERTIES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">Crystal System</span>
              <select
                value={crystalSystem}
                onChange={(e) => setCrystalSystem(e.target.value)}
                className="text-sm border rounded-lg px-3 py-2 bg-white"
              >
                <option value="">All</option>
                {["Cubic", "Hexagonal", "Tetragonal", "Orthorhombic", "Monoclinic", "Triclinic", "Trigonal"].map((cs) => (
                  <option key={cs} value={cs}>{cs}</option>
                ))}
              </select>
            </label>
          </div>

          {/* Chart */}
          <div className="bg-white rounded-xl border shadow-sm p-4 overflow-x-auto">
            {loading ? (
              <div className="h-[500px] flex items-center justify-center text-gray-400">
                Loading {xProp} vs {yProp}...
              </div>
            ) : (
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-h-[500px]">
                {/* Axes */}
                <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="#e5e7eb" strokeWidth={1} />
                <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="#e5e7eb" strokeWidth={1} />

                {/* Axis labels */}
                <text x={W / 2} y={H - 10} textAnchor="middle" className="text-xs" fill="#6b7280">
                  {PROPERTIES.find((p) => p.value === xProp)?.label || xProp}
                </text>
                <text x={15} y={H / 2} textAnchor="middle" transform={`rotate(-90, 15, ${H / 2})`} className="text-xs" fill="#6b7280">
                  {PROPERTIES.find((p) => p.value === yProp)?.label || yProp}
                </text>

                {/* Tick marks */}
                {[0, 0.25, 0.5, 0.75, 1].map((t) => (
                  <g key={t}>
                    <text x={toSvgX(xMin + t * xRange)} y={H - PAD + 15} textAnchor="middle" fill="#9ca3af" fontSize={9}>
                      {(xMin + t * xRange).toPrecision(3)}
                    </text>
                    <text x={PAD - 8} y={toSvgY(yMin + t * yRange) + 3} textAnchor="end" fill="#9ca3af" fontSize={9}>
                      {(yMin + t * yRange).toPrecision(3)}
                    </text>
                  </g>
                ))}

                {/* Points */}
                {data.map((d, i) => (
                  <circle
                    key={i}
                    cx={toSvgX(d.x)}
                    cy={toSvgY(d.y)}
                    r={2.5}
                    fill={d === hoveredPoint ? "#ef4444" : "#3b82f6"}
                    opacity={0.6}
                    onMouseEnter={() => setHoveredPoint(d)}
                    onMouseLeave={() => setHoveredPoint(null)}
                    className="cursor-pointer"
                  />
                ))}

                {/* Tooltip */}
                {hoveredPoint && (
                  <g>
                    <rect
                      x={toSvgX(hoveredPoint.x) + 8}
                      y={toSvgY(hoveredPoint.y) - 30}
                      width={120}
                      height={24}
                      rx={4}
                      fill="white"
                      stroke="#e5e7eb"
                    />
                    <text
                      x={toSvgX(hoveredPoint.x) + 14}
                      y={toSvgY(hoveredPoint.y) - 14}
                      fill="#1f2937"
                      fontSize={10}
                      fontWeight="bold"
                    >
                      {hoveredPoint.formula}
                    </text>
                  </g>
                )}
              </svg>
            )}
            <p className="text-xs text-gray-400 mt-2 text-center">
              {data.length.toLocaleString()} materials plotted.{" "}
              <Link href="/materials" className="text-blue-500 hover:underline">
                Browse all
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
