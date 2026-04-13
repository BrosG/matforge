"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Box,
  Layers,
  Circle,
  Replace,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Copy,
  Download,
  Atom,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.matcraft.ai/api/v1";

/* ---------- Tab definitions ---------- */

type TabId = "supercell" | "surface" | "nanoparticle" | "substitution" | "inverse";

interface TabDef {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const TABS: TabDef[] = [
  {
    id: "supercell",
    label: "Supercell",
    icon: <Box className="h-4 w-4" />,
    description: "Expand a unit cell by repeating it along lattice directions.",
  },
  {
    id: "surface",
    label: "Surface",
    icon: <Layers className="h-4 w-4" />,
    description: "Generate a surface slab with Miller indices, thickness, and vacuum.",
  },
  {
    id: "nanoparticle",
    label: "Nanoparticle",
    icon: <Circle className="h-4 w-4" />,
    description: "Carve a spherical nanoparticle from a bulk crystal structure.",
  },
  {
    id: "substitution",
    label: "Substitution",
    icon: <Replace className="h-4 w-4" />,
    description: "Substitute one element for another in the crystal lattice.",
  },
  {
    id: "inverse",
    label: "Inverse Design",
    icon: <Sparkles className="h-4 w-4" />,
    description: "Use AI to find structures matching target properties.",
  },
];

const CRYSTAL_SYSTEMS = [
  "cubic",
  "hexagonal",
  "tetragonal",
  "orthorhombic",
  "monoclinic",
  "triclinic",
  "trigonal",
];

/* ---------- Types ---------- */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApiResult = Record<string, any>;

interface FormState {
  materialId: string;
  // supercell
  nx: number;
  ny: number;
  nz: number;
  // surface
  millerH: number;
  millerK: number;
  millerL: number;
  slabThickness: number;
  vacuum: number;
  // nanoparticle
  radius: number;
  // substitution
  originalElement: string;
  substituteElement: string;
  fraction: number;
  // inverse design
  targetBandGap: string;
  targetFormationEnergy: string;
  targetBulkModulus: string;
  requiredElements: string;
  excludedElements: string;
  crystalSystem: string;
}

const defaultForm: FormState = {
  materialId: "",
  nx: 2,
  ny: 2,
  nz: 2,
  millerH: 1,
  millerK: 1,
  millerL: 0,
  slabThickness: 10,
  vacuum: 15,
  radius: 10,
  originalElement: "",
  substituteElement: "",
  fraction: 0.5,
  targetBandGap: "",
  targetFormationEnergy: "",
  targetBulkModulus: "",
  requiredElements: "",
  excludedElements: "",
  crystalSystem: "",
};

/* ---------- Helpers ---------- */

const inputClass =
  "w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-400 dark:focus:border-blue-600 border-border placeholder:text-muted-foreground";

const labelClass = "block text-xs font-medium text-muted-foreground mb-1.5";

function parseCommaSeparated(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/* ---------- Component ---------- */

export function BuilderForm() {
  const [activeTab, setActiveTab] = useState<TabId>("supercell");
  const [form, setForm] = useState<FormState>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  /* ---- Validation ---- */

  function validate(): string | null {
    if (activeTab !== "inverse") {
      if (!form.materialId.trim()) return "Material ID is required.";
    }

    switch (activeTab) {
      case "supercell":
        if (form.nx < 1 || form.ny < 1 || form.nz < 1)
          return "Supercell dimensions must be at least 1.";
        if (form.nx > 10 || form.ny > 10 || form.nz > 10)
          return "Supercell dimensions cannot exceed 10.";
        break;
      case "surface":
        if (form.millerH === 0 && form.millerK === 0 && form.millerL === 0)
          return "At least one Miller index must be non-zero.";
        if (form.slabThickness <= 0) return "Slab thickness must be positive.";
        if (form.vacuum <= 0) return "Vacuum thickness must be positive.";
        break;
      case "nanoparticle":
        if (form.radius <= 0) return "Radius must be positive.";
        if (form.radius > 100) return "Radius cannot exceed 100 angstroms.";
        break;
      case "substitution":
        if (!form.originalElement.trim()) return "Original element is required.";
        if (!form.substituteElement.trim()) return "Substitute element is required.";
        if (form.fraction <= 0 || form.fraction > 1)
          return "Fraction must be between 0 (exclusive) and 1 (inclusive).";
        break;
      case "inverse":
        if (
          !form.targetBandGap &&
          !form.targetFormationEnergy &&
          !form.targetBulkModulus &&
          !form.requiredElements
        )
          return "Specify at least one target property or required elements.";
        break;
    }
    return null;
  }

  /* ---- Submit ---- */

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      setResult(null);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let endpoint: string;
      let body: Record<string, unknown>;

      switch (activeTab) {
        case "supercell":
          endpoint = "/builder/supercell";
          body = {
            material_id: form.materialId.trim(),
            nx: form.nx,
            ny: form.ny,
            nz: form.nz,
          };
          break;
        case "surface":
          endpoint = "/builder/surface";
          body = {
            material_id: form.materialId.trim(),
            miller_h: form.millerH,
            miller_k: form.millerK,
            miller_l: form.millerL,
            slab_thickness: form.slabThickness,
            vacuum: form.vacuum,
          };
          break;
        case "nanoparticle":
          endpoint = "/builder/nanoparticle";
          body = {
            material_id: form.materialId.trim(),
            radius: form.radius,
          };
          break;
        case "substitution":
          endpoint = "/builder/substitute";
          body = {
            material_id: form.materialId.trim(),
            original_element: form.originalElement.trim(),
            substitute_element: form.substituteElement.trim(),
            fraction: form.fraction,
          };
          break;
        case "inverse":
          endpoint = "/builder/inverse_design";
          body = {};
          if (form.targetBandGap) body.target_band_gap = parseFloat(form.targetBandGap);
          if (form.targetFormationEnergy)
            body.target_formation_energy = parseFloat(form.targetFormationEnergy);
          if (form.targetBulkModulus)
            body.target_bulk_modulus = parseFloat(form.targetBulkModulus);
          if (form.requiredElements)
            body.required_elements = parseCommaSeparated(form.requiredElements);
          if (form.excludedElements)
            body.excluded_elements = parseCommaSeparated(form.excludedElements);
          if (form.crystalSystem) body.crystal_system = form.crystalSystem;
          break;
      }

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        throw new Error(
          errBody?.detail || errBody?.message || `Request failed (${res.status})`
        );
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopyJson() {
    if (result) {
      navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    }
  }

  function handleDownloadJson() {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeTab}-result.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ---- Shared material ID input ---- */

  const materialIdInput = (
    <div>
      <label className={labelClass}>Material ID</label>
      <input
        type="text"
        className={inputClass}
        placeholder='e.g. "mp-149" or "JVASP-1002"'
        value={form.materialId}
        onChange={(e) => set("materialId", e.target.value)}
      />
    </div>
  );

  /* ---- Tab form bodies ---- */

  function renderForm() {
    switch (activeTab) {
      case "supercell":
        return (
          <div className="space-y-4">
            {materialIdInput}
            <div>
              <label className={labelClass}>Supercell Dimensions (nx, ny, nz)</label>
              <div className="grid grid-cols-3 gap-3">
                {(["nx", "ny", "nz"] as const).map((dim) => (
                  <div key={dim}>
                    <div className="text-xs text-center text-muted-foreground mb-1">
                      {dim}
                    </div>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      className={inputClass}
                      value={form[dim]}
                      onChange={(e) => set(dim, parseInt(e.target.value) || 1)}
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                Each value between 1 and 10. Total atoms = unit cell atoms x nx x ny x nz.
              </p>
            </div>
          </div>
        );

      case "surface":
        return (
          <div className="space-y-4">
            {materialIdInput}
            <div>
              <label className={labelClass}>Miller Indices (h k l)</label>
              <div className="grid grid-cols-3 gap-3">
                {(
                  [
                    ["millerH", "h"],
                    ["millerK", "k"],
                    ["millerL", "l"],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key}>
                    <div className="text-xs text-center text-muted-foreground mb-1">
                      {label}
                    </div>
                    <input
                      type="number"
                      className={inputClass}
                      value={form[key]}
                      onChange={(e) =>
                        set(key, parseInt(e.target.value) || 0)
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Slab Thickness (A)</label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  className={inputClass}
                  value={form.slabThickness}
                  onChange={(e) =>
                    set("slabThickness", parseFloat(e.target.value) || 1)
                  }
                />
              </div>
              <div>
                <label className={labelClass}>Vacuum (A)</label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  className={inputClass}
                  value={form.vacuum}
                  onChange={(e) =>
                    set("vacuum", parseFloat(e.target.value) || 1)
                  }
                />
              </div>
            </div>
          </div>
        );

      case "nanoparticle":
        return (
          <div className="space-y-4">
            {materialIdInput}
            <div>
              <label className={labelClass}>Radius (angstroms)</label>
              <input
                type="number"
                min={1}
                max={100}
                step={0.5}
                className={inputClass}
                value={form.radius}
                onChange={(e) => set("radius", parseFloat(e.target.value) || 1)}
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                Spherical cutoff radius in angstroms (1 - 100).
              </p>
            </div>
          </div>
        );

      case "substitution":
        return (
          <div className="space-y-4">
            {materialIdInput}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Original Element</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="e.g. Si"
                  value={form.originalElement}
                  onChange={(e) => set("originalElement", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Substitute Element</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="e.g. Ge"
                  value={form.substituteElement}
                  onChange={(e) => set("substituteElement", e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>
                Fraction ({(form.fraction * 100).toFixed(0)}%)
              </label>
              <input
                type="range"
                min={0.01}
                max={1}
                step={0.01}
                className="w-full accent-blue-600"
                value={form.fraction}
                onChange={(e) => set("fraction", parseFloat(e.target.value))}
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        );

      case "inverse":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>Target Band Gap (eV)</label>
                <input
                  type="number"
                  step={0.1}
                  min={0}
                  className={inputClass}
                  placeholder="e.g. 1.5"
                  value={form.targetBandGap}
                  onChange={(e) => set("targetBandGap", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Target Formation Energy (eV/atom)</label>
                <input
                  type="number"
                  step={0.1}
                  className={inputClass}
                  placeholder="e.g. -0.5"
                  value={form.targetFormationEnergy}
                  onChange={(e) => set("targetFormationEnergy", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Target Bulk Modulus (GPa)</label>
                <input
                  type="number"
                  step={1}
                  min={0}
                  className={inputClass}
                  placeholder="e.g. 200"
                  value={form.targetBulkModulus}
                  onChange={(e) => set("targetBulkModulus", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Required Elements</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="e.g. Si, O"
                  value={form.requiredElements}
                  onChange={(e) => set("requiredElements", e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">Comma-separated.</p>
              </div>
              <div>
                <label className={labelClass}>Excluded Elements</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="e.g. Pb, Cd"
                  value={form.excludedElements}
                  onChange={(e) => set("excludedElements", e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">Comma-separated.</p>
              </div>
            </div>
            <div>
              <label className={labelClass}>Crystal System</label>
              <select
                className={inputClass}
                value={form.crystalSystem}
                onChange={(e) => set("crystalSystem", e.target.value)}
              >
                <option value="">Any</option>
                {CRYSTAL_SYSTEMS.map((cs) => (
                  <option key={cs} value={cs}>
                    {cs.charAt(0).toUpperCase() + cs.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );
    }
  }

  /* ---- Result rendering ---- */

  function renderResult() {
    if (!result) return null;

    // Extract common fields that the API might return
    const formula = result.formula || result.reduced_formula;
    const nAtoms =
      result.n_atoms ?? result.num_atoms ?? result.natoms ?? result.nsites;
    const lattice = result.lattice;
    const spaceGroup = result.space_group || result.spacegroup;
    const volume = result.volume;

    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-green-200 dark:border-green-800/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <CardTitle className="text-lg">Generated Structure</CardTitle>
              </div>
              <div className="flex gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyJson}
                  className="gap-1.5 text-xs"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy JSON
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadJson}
                  className="gap-1.5 text-xs"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Summary badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              {formula && (
                <Badge variant="info">Formula: {formula}</Badge>
              )}
              {nAtoms != null && (
                <Badge variant="secondary">Atoms: {nAtoms}</Badge>
              )}
              {spaceGroup && (
                <Badge variant="secondary">Space Group: {spaceGroup}</Badge>
              )}
              {volume != null && (
                <Badge variant="secondary">
                  Volume: {typeof volume === "number" ? volume.toFixed(2) : volume} A^3
                </Badge>
              )}
            </div>

            {/* Lattice parameters */}
            {lattice && (
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Lattice Parameters
                </h4>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {["a", "b", "c", "alpha", "beta", "gamma"].map((param) => {
                    const val = lattice[param];
                    if (val == null) return null;
                    return (
                      <div
                        key={param}
                        className="text-center p-2 rounded-lg bg-muted/50"
                      >
                        <div className="text-xs text-muted-foreground">{param}</div>
                        <div className="text-sm font-semibold text-foreground">
                          {typeof val === "number" ? val.toFixed(3) : val}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Raw JSON (collapsed) */}
            <details className="group">
              <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                Show full JSON response
              </summary>
              <pre className="mt-2 p-3 rounded-lg bg-muted/50 text-xs overflow-auto max-h-64 text-foreground">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  /* ---- Main render ---- */

  const currentTab = TABS.find((t) => t.id === activeTab)!;

  return (
    <div className="space-y-6">
      {/* Tab navigation */}
      <div className="flex flex-wrap gap-1.5 p-1.5 rounded-xl bg-muted/60 dark:bg-muted/30">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setResult(null);
              setError(null);
            }}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              activeTab === tab.id
                ? "bg-white dark:bg-gray-800 text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-gray-800/50"
            )}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Form card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            {currentTab.icon}
            <CardTitle className="text-xl">{currentTab.label}</CardTitle>
          </div>
          <CardDescription>{currentTab.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderForm()}
              </motion.div>
            </AnimatePresence>

            {/* Error display */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 text-sm"
              >
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <div className="mt-6">
              <Button
                type="submit"
                variant="gradient"
                size="lg"
                loading={loading}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {loading ? "Generating..." : "Generate Structure"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      {renderResult()}
    </div>
  );
}
