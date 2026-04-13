import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Database,
  Clock,
  Layers,
  Atom,
  Download,
} from "lucide-react";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { CompositionBadge } from "@/components/materials/CompositionBadge";
import { ElementBadge } from "@/components/materials/ElementBadge";
import { PropertyTable } from "@/components/materials/PropertyTable";
import { MaterialStructureViewer } from "@/components/materials/MaterialStructureViewer";
import { MaterialCard } from "@/components/materials/MaterialCard";
import { CopyCitation } from "@/components/materials/CopyCitation";
import { LatticeToggle } from "@/components/materials/LatticeToggle";
import { ElectronicStructureSection } from "@/components/materials/ElectronicStructureSection";
import { CopilotChat } from "@/components/materials/CopilotChat";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import JsonLd from "@/components/seo/JsonLd";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";
import { cn } from "@/lib/utils";
import {
  fetchMaterial,
  fetchRelatedMaterials,
  type MaterialDetail,
} from "@/lib/materials-api";

const SITE_URL = "https://matcraft.ai";

export const revalidate = 0; // Always fetch fresh — data changes during ingestion

// ── Metadata ────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  let material: MaterialDetail;
  try {
    material = await fetchMaterial(id);
  } catch {
    return { title: "Material Not Found" };
  }

  const props: string[] = [];
  if (material.band_gap !== null)
    props.push(`band gap ${material.band_gap.toFixed(2)} eV`);
  if (material.formation_energy !== null)
    props.push(
      `formation energy ${material.formation_energy.toFixed(3)} eV/atom`
    );
  if (material.crystal_system)
    props.push(`${material.crystal_system} crystal system`);
  if (material.is_stable !== null)
    props.push(material.is_stable ? "thermodynamically stable" : "unstable");

  const description = `${material.formula} — ${props.join(", ")}. View crystal structure, electronic properties, and related materials on MatCraft.`;

  // Material-specific keywords for SEO
  const keywords = [
    material.formula,
    ...material.elements,
    material.crystal_system,
    material.space_group,
    material.source_db === "materials_project" ? "Materials Project" : material.source_db,
    "crystal structure",
    "DFT",
    material.band_gap !== null && material.band_gap > 0 ? "semiconductor" : material.band_gap === 0 ? "metal" : null,
    material.is_stable ? "stable" : "unstable",
    "band gap",
    "formation energy",
    "materials science",
  ].filter(Boolean).join(", ");

  return {
    title: `${material.formula} — ${material.crystal_system || ""} ${material.space_group || ""} | MatCraft`,
    description,
    keywords,
    openGraph: {
      title: `${material.formula} | MatCraft Materials Database`,
      description,
      url: `${SITE_URL}/materials/${id}`,
      siteName: "MatCraft",
      type: "article",
    },
    alternates: {
      canonical: `${SITE_URL}/materials/${id}`,
    },
  };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatProp(value: number | null | undefined, digits = 4): string {
  if (value === null || value === undefined) return "--";
  return Number(value.toPrecision(digits)).toString();
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "--";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ── Page Component ──────────────────────────────────────────────────────────

export default async function MaterialDetailPage({ params }: PageProps) {
  const { id } = await params;

  let material: MaterialDetail;
  try {
    material = await fetchMaterial(id);
  } catch {
    notFound();
  }

  let relatedMaterials: MaterialDetail[] = [];
  try {
    relatedMaterials = await fetchRelatedMaterials(id) as MaterialDetail[];
  } catch {
    relatedMaterials = [];
  }

  const hasStructure =
    material.structure_data?.atoms && material.structure_data.atoms.length > 0;

  // Build property maps grouped by category
  const thermodynamicProps: Record<string, number | null> = {
    band_gap: material.band_gap,
    formation_energy: material.formation_energy,
    energy_above_hull: material.energy_above_hull,
    density: material.density,
    volume: material.volume,
  };

  const thermodynamicUnits: Record<string, string> = {
    band_gap: "eV",
    formation_energy: "eV/atom",
    energy_above_hull: "eV/atom",
    density: "g/cm\u00B3",
    volume: "\u00C5\u00B3",
  };

  const mechanicalProps: Record<string, number | null> = {
    bulk_modulus: material.bulk_modulus,
    shear_modulus: material.shear_modulus,
    young_modulus: material.young_modulus,
    poisson_ratio: material.poisson_ratio,
  };

  const mechanicalUnits: Record<string, string> = {
    bulk_modulus: "GPa",
    shear_modulus: "GPa",
    young_modulus: "GPa",
    poisson_ratio: "",
  };

  const electronicProps: Record<string, number | null> = {
    efermi: material.efermi,
    total_magnetization: material.total_magnetization,
    dielectric_constant: material.dielectric_constant,
    refractive_index: material.refractive_index,
    effective_mass_electron: material.effective_mass_electron,
    effective_mass_hole: material.effective_mass_hole,
  };

  const electronicUnits: Record<string, string> = {
    efermi: "eV",
    total_magnetization: "\u00B5B",
    dielectric_constant: "",
    refractive_index: "",
    effective_mass_electron: "m\u2091",
    effective_mass_hole: "m\u2091",
  };

  const thermalProps: Record<string, number | null> = {
    thermal_conductivity: material.thermal_conductivity,
    seebeck_coefficient: material.seebeck_coefficient,
  };

  const thermalUnits: Record<string, string> = {
    thermal_conductivity: "W/(m\u00B7K)",
    seebeck_coefficient: "\u00B5V/K",
  };

  // Check if sections have any non-null values
  const hasValues = (props: Record<string, number | null>) =>
    Object.values(props).some((v) => v !== null && v !== undefined);

  // Application suitability scores (rule-based)
  const appScores: { name: string; score: number; reason: string }[] = [];

  if (material.band_gap !== null) {
    const bg = material.band_gap;
    // Solar cell
    if (bg >= 0.8 && bg <= 2.0) {
      const solarScore = bg >= 1.1 && bg <= 1.5 ? 9 : bg >= 0.8 && bg <= 2.0 ? 6 : 3;
      appScores.push({ name: "Solar Absorber", score: solarScore, reason: `Band gap ${bg.toFixed(2)} eV ${bg >= 1.1 && bg <= 1.5 ? "(optimal Shockley-Queisser range)" : "(viable range)"}` });
    }
    // LED/display
    if (material.is_gap_direct && bg >= 1.5 && bg <= 3.5) {
      appScores.push({ name: "LED / Display", score: 7, reason: `Direct gap ${bg.toFixed(2)} eV in visible range` });
    }
    // Thermoelectric
    if (bg > 0 && bg < 1.0 && material.seebeck_coefficient !== null) {
      appScores.push({ name: "Thermoelectric", score: 7, reason: `Narrow gap + Seebeck data available` });
    }
    // Semiconductor
    if (bg >= 0.5 && bg <= 4.0) {
      appScores.push({ name: "Semiconductor", score: Math.round(8 - Math.abs(bg - 1.5)), reason: `Band gap ${bg.toFixed(2)} eV` });
    }
    // Insulator / dielectric
    if (bg > 4.0) {
      appScores.push({ name: "Dielectric / Insulator", score: 8, reason: `Wide gap ${bg.toFixed(2)} eV` });
    }
  }

  // Structural / mechanical
  if (material.bulk_modulus !== null && material.bulk_modulus > 200) {
    appScores.push({ name: "Hard Coating", score: Math.min(9, Math.round(material.bulk_modulus / 50)), reason: `Bulk modulus ${material.bulk_modulus.toFixed(0)} GPa` });
  }

  // Battery cathode (contains Li + transition metal + O)
  const els = new Set(material.elements);
  if (els.has("Li") && els.has("O") && material.is_stable) {
    appScores.push({ name: "Battery Cathode", score: 7, reason: "Li-containing oxide, stable" });
  }

  // Catalyst (transition metal compound, stable)
  const catalystEls = ["Fe", "Co", "Ni", "Pt", "Pd", "Ru", "Ir", "Rh"];
  if (catalystEls.some((e) => els.has(e)) && material.is_stable) {
    appScores.push({ name: "Catalyst Candidate", score: 6, reason: `Contains ${catalystEls.filter(e => els.has(e)).join(", ")}` });
  }

  // Legacy combined view for backward compat
  const properties = { ...thermodynamicProps };
  const units = { ...thermodynamicUnits };

  return (
    <>
      {/* JSON-LD: Dataset + ChemicalSubstance */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Dataset",
          name: `${material.formula} Material Data`,
          description: `Crystal structure and properties of ${material.formula} from ${material.source_db}.`,
          url: `${SITE_URL}/materials/${id}`,
          license: "https://creativecommons.org/licenses/by/4.0/",
          creator: {
            "@type": "Organization",
            name: "MatCraft",
            url: SITE_URL,
          },
          distribution: {
            "@type": "DataDownload",
            contentUrl: `${SITE_URL}/materials/${id}`,
            encodingFormat: "text/html",
          },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ChemicalSubstance",
          name: material.formula,
          molecularFormula: material.formula,
          identifier: material.external_id,
          url: `${SITE_URL}/materials/${id}`,
          ...(material.band_gap !== null && {
            additionalProperty: [
              { "@type": "PropertyValue", name: "Band Gap", value: material.band_gap, unitCode: "eV" },
              ...(material.formation_energy !== null ? [{ "@type": "PropertyValue", name: "Formation Energy", value: material.formation_energy, unitCode: "eV/atom" }] : []),
              ...(material.density !== null ? [{ "@type": "PropertyValue", name: "Density", value: material.density, unitCode: "g/cm3" }] : []),
              ...(material.crystal_system ? [{ "@type": "PropertyValue", name: "Crystal System", value: material.crystal_system }] : []),
              ...(material.space_group ? [{ "@type": "PropertyValue", name: "Space Group", value: material.space_group }] : []),
            ],
          }),
        }}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: SITE_URL },
          { name: "Materials", url: `${SITE_URL}/materials` },
          { name: material.formula, url: `${SITE_URL}/materials/${id}` },
        ]}
      />

      <Header />

      <main className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 pt-16">
        {/* Breadcrumb + back link */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-2">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link
              href="/materials"
              className="inline-flex items-center gap-1 hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Materials
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">
              {material.formula}
            </span>
          </nav>
        </div>

        {/* Header section */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left column: details */}
            <div className="flex-1 min-w-0">
              {/* Formula + status */}
              <div className="flex flex-wrap items-start gap-4 mb-6">
                <CompositionBadge
                  formula={material.formula}
                  className="text-2xl md:text-3xl"
                />
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {material.is_stable !== null && (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1 rounded-full",
                        material.is_stable
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                      )}
                    >
                      {material.is_stable ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      {material.is_stable ? "Stable" : "Unstable"}
                    </span>
                  )}
                  {material.crystal_system && (
                    <Badge variant="info" className="text-sm">
                      <Layers className="h-3.5 w-3.5 mr-1" />
                      {material.crystal_system}
                    </Badge>
                  )}
                  {material.space_group && (
                    <Badge variant="secondary" className="text-sm">
                      {material.space_group}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-sm gap-1">
                    <Database className="h-3.5 w-3.5" />
                    {material.source_db}
                  </Badge>
                </div>
              </div>

              {/* External ID + source link */}
              <div className="flex flex-wrap items-center gap-3 mb-6 text-sm text-muted-foreground">
                <span>
                  ID:{" "}
                  <code className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">
                    {material.external_id}
                  </code>
                </span>
                {material.source_url && (
                  <a
                    href={material.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    View Source
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                {material.fetched_at && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Fetched {formatDate(material.fetched_at)}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  {material.structure_data?.atoms && (
                    <span className="text-gray-400">{material.structure_data.atoms.length} atoms</span>
                  )}
                </span>
                {/* Structure export buttons */}
                {material.structure_data?.atoms && material.structure_data.atoms.length > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Download className="h-3.5 w-3.5 text-gray-400" />
                    {(["cif", "poscar", "xyz"] as const).map((fmt) => (
                      <a
                        key={fmt}
                        href={`${process.env.NEXT_PUBLIC_API_URL || "https://api.matcraft.ai/api/v1"}/materials/${id}/export/${fmt}`}
                        className="text-xs px-1.5 py-0.5 rounded bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-700 transition-colors"
                        download
                      >
                        {fmt.toUpperCase()}
                      </a>
                    ))}
                  </span>
                )}
                {/* Jupyter notebook export */}
                {material.external_id?.startsWith("mp-") && (
                  <a
                    href={`${process.env.NEXT_PUBLIC_API_URL || "https://api.matcraft.ai/api/v1"}/electronic/notebook/${material.external_id}`}
                    className="text-xs px-1.5 py-0.5 rounded bg-purple-100 hover:bg-purple-200 text-purple-700 transition-colors"
                    download
                  >
                    Jupyter
                  </a>
                )}
              </div>

              {/* Elements */}
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-foreground/80 mb-2">
                  Elements
                </h2>
                <div className="flex flex-wrap gap-2">
                  {material.elements.map((el) => (
                    <ElementBadge key={el} element={el} size="lg" />
                  ))}
                </div>
              </div>

              {/* Composition */}
              {material.composition &&
                Object.keys(material.composition).length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-sm font-semibold text-foreground/80 mb-2">
                      Composition
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(material.composition).map(
                        ([el, frac]) => (
                          <div
                            key={el}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 border text-sm"
                          >
                            <ElementBadge element={el} size="sm" />
                            <span className="font-mono text-gray-700">
                              {typeof frac === "number"
                                ? `${(frac * 100).toFixed(1)}%`
                                : String(frac)}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* Warnings / Provenance Alerts */}
              {material.warnings && material.warnings.length > 0 && (
                <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <h2 className="text-sm font-semibold text-amber-800 mb-1">
                    Warnings
                  </h2>
                  <ul className="text-sm text-amber-700 list-disc list-inside">
                    {material.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Provenance */}
              {(material.calculation_method || material.is_theoretical !== null) && (
                <div className="mb-6 flex flex-wrap gap-2">
                  {material.calculation_method && (
                    <Badge variant="outline" className="text-xs gap-1">
                      DFT: {material.calculation_method}
                    </Badge>
                  )}
                  {material.is_theoretical !== null && (
                    <Badge
                      variant={material.is_theoretical ? "secondary" : "info"}
                      className="text-xs"
                    >
                      {material.is_theoretical ? "Theoretical / Computed" : "Experimental"}
                    </Badge>
                  )}
                  {material.magnetic_ordering && (
                    <Badge variant="outline" className="text-xs">
                      {material.magnetic_ordering}
                    </Badge>
                  )}
                  {material.experimentally_observed && (
                    <Badge variant="info" className="text-xs">
                      Experimentally Observed
                    </Badge>
                  )}
                  {material.is_gap_direct !== null && material.band_gap !== null && material.band_gap > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {material.is_gap_direct ? "Direct Gap" : "Indirect Gap"}
                    </Badge>
                  )}
                </div>
              )}

              {/* Experimental References */}
              {material.icsd_ids && material.icsd_ids.length > 0 && (
                <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <h2 className="text-sm font-semibold text-green-800 mb-1">
                    Experimental Validation
                  </h2>
                  <p className="text-sm text-green-700">
                    Structure verified in ICSD (Inorganic Crystal Structure Database):
                    {" "}{material.icsd_ids.slice(0, 5).map(id => `#${id}`).join(", ")}
                    {material.icsd_ids.length > 5 && ` and ${material.icsd_ids.length - 5} more`}
                  </p>
                </div>
              )}

              {/* Decomposition Pathway */}
              {material.decomposes_to && material.decomposes_to.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-sm font-semibold text-foreground/80 mb-2">
                    Decomposition Pathway
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {material.decomposes_to.map((phase, i) => (
                      <div
                        key={i}
                        className="px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700"
                      >
                        {typeof phase === "object" && phase !== null
                          ? `${(phase as Record<string, unknown>).formula ?? JSON.stringify(phase)}`
                          : String(phase)}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Competing phases this material would decompose into
                  </p>
                </div>
              )}

              {/* Thermodynamic Properties */}
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Thermodynamic Properties
                </h2>
                <PropertyTable properties={thermodynamicProps} units={thermodynamicUnits} sourceDb={material.source_db} />
              </div>

              {/* Mechanical Properties */}
              {(hasValues(mechanicalProps) || material.source_db === "aflow") && (
                <div className="mb-6">
                  <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Mechanical Properties
                  </h2>
                  <PropertyTable properties={mechanicalProps} units={mechanicalUnits} sourceDb={material.source_db} />
                </div>
              )}

              {/* Electronic & Magnetic Properties */}
              {(hasValues(electronicProps) || material.source_db === "aflow") && (
                <div className="mb-6">
                  <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Electronic &amp; Magnetic Properties
                  </h2>
                  <PropertyTable properties={electronicProps} units={electronicUnits} sourceDb={material.source_db} />
                </div>
              )}

              {/* Thermal Properties */}
              {(hasValues(thermalProps) || material.source_db === "aflow") && (
                <div className="mb-6">
                  <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Thermal Properties
                  </h2>
                  <PropertyTable properties={thermalProps} units={thermalUnits} sourceDb={material.source_db} />
                </div>
              )}

              {/* Electronic Structure Charts (Band Structure, DOS, Phase Diagram) */}
              {material.external_id?.startsWith("mp-") && (
                <ElectronicStructureSection
                  mpId={material.external_id}
                  elements={material.elements}
                  isMpMaterial={true}
                />
              )}

              {/* Oxidation States */}
              {material.oxidation_states &&
                Object.keys(material.oxidation_states).length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-sm font-semibold text-foreground/80 mb-2">
                      Oxidation States
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(material.oxidation_states).map(
                        ([el, state]) => (
                          <div
                            key={el}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-50 border text-sm"
                          >
                            <ElementBadge element={el} size="sm" />
                            <span className="font-mono text-gray-700">
                              {Number(state) > 0 ? `+${state}` : String(state)}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* Lattice Parameters with Primitive/Conventional Toggle */}
              {material.lattice_params && (
                <LatticeToggle lattice={material.lattice_params} />
              )}

              {/* Additional Properties (from properties_json catch-all) */}
              {material.properties_json &&
                (() => {
                  // Show properties from JSON that aren't already displayed
                  const displayed = new Set([
                    "band_gap", "formation_energy", "energy_above_hull", "density", "volume",
                    "bulk_modulus", "shear_modulus", "young_modulus", "poisson_ratio",
                    "total_magnetization", "dielectric_constant", "refractive_index",
                    "effective_mass_electron", "effective_mass_hole",
                    "thermal_conductivity", "seebeck_coefficient",
                    "formation_energy_per_atom",
                  ]);
                  const extra = Object.entries(material.properties_json).filter(
                    ([k, v]) =>
                      !displayed.has(k) &&
                      !k.startsWith("_") &&
                      typeof v === "number"
                  );
                  if (extra.length === 0) return null;
                  const extraProps: Record<string, number | null> = {};
                  for (const [k, v] of extra) {
                    extraProps[k] = v as number;
                  }
                  return (
                    <div className="mb-6">
                      <h2 className="text-sm font-semibold text-foreground/80 mb-2">
                        Additional Properties
                      </h2>
                      <PropertyTable properties={extraProps} />
                    </div>
                  );
                })()}

              {/* Tags */}
              {material.tags && material.tags.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-sm font-semibold text-foreground/80 mb-2">
                    Tags
                  </h2>
                  <div className="flex flex-wrap gap-1.5">
                    {material.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Application Suitability Scores */}
              {appScores.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-sm font-semibold text-foreground/80 mb-2">
                    Application Suitability
                  </h2>
                  <div className="space-y-2">
                    {appScores.sort((a, b) => b.score - a.score).map((app) => (
                      <div key={app.name} className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg border border-border">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                          style={{
                            backgroundColor: app.score >= 8 ? "#dcfce7" : app.score >= 6 ? "#fef9c3" : "#fef2f2",
                            color: app.score >= 8 ? "#166534" : app.score >= 6 ? "#854d0e" : "#991b1b",
                          }}
                        >
                          {app.score}/10
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground">{app.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{app.reason}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    AI-estimated scores based on computed properties. Not a substitute for experimental validation.
                  </p>
                </div>
              )}

              {/* Citation / Data Source */}
              <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h2 className="text-sm font-semibold text-blue-800 mb-1">
                  Data Source &amp; Citation
                </h2>
                <p className="text-sm text-blue-700">
                  Data from {material.source_db === "materials_project" ? "The Materials Project" :
                    material.source_db === "aflow" ? "AFLOW" :
                    material.source_db === "jarvis" ? "JARVIS-DFT (NIST)" :
                    material.source_db}
                  {" "}(ID: {material.external_id})
                </p>
                {material.source_url && (
                  <a
                    href={material.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    View original data source
                  </a>
                )}
                {material.source_db === "materials_project" && (
                  <CopyCitation
                    text="Cite: A. Jain et al., APL Materials 1, 011002 (2013). DOI: 10.1063/1.4812323"
                    citation={`A. Jain et al., "Commentary: The Materials Project: A materials genome approach to accelerating materials innovation." APL Materials 1, 011002 (2013). DOI: 10.1063/1.4812323. Material: ${material.formula} (${material.external_id}). Data accessed via MatCraft (matcraft.ai).`}
                  />
                )}
                {material.source_db === "aflow" && (
                  <CopyCitation
                    text="Cite: S. Curtarolo et al., Comp. Mat. Sci. 58, 218 (2012). DOI: 10.1016/j.commatsci.2012.02.005"
                    citation={`S. Curtarolo et al., "AFLOW: An automatic framework for high-throughput materials discovery." Computational Materials Science 58, 218-226 (2012). DOI: 10.1016/j.commatsci.2012.02.005. Material: ${material.formula} (${material.external_id}). Data accessed via MatCraft (matcraft.ai).`}
                  />
                )}
                {material.source_db === "jarvis" && (
                  <CopyCitation
                    text="Cite: K. Choudhary et al., npj Comput. Mater. 6, 173 (2020). DOI: 10.1038/s41524-020-00440-1"
                    citation={`K. Choudhary et al., "The Joint Automated Repository for Various Integrated Simulations (JARVIS) for Data-Driven Materials Design." npj Computational Materials 6, 173 (2020). DOI: 10.1038/s41524-020-00440-1. Material: ${material.formula} (${material.external_id}). Data accessed via MatCraft (matcraft.ai).`}
                  />
                )}
                {material.database_ids && Object.keys(material.database_ids).length > 0 && (
                  <p className="text-xs text-blue-600 mt-1">
                    Cross-references: {Object.entries(material.database_ids).map(([db, ids]) =>
                      `${db.toUpperCase()}: ${Array.isArray(ids) ? ids.slice(0, 3).join(", ") : ids}`
                    ).join(" | ")}
                  </p>
                )}
              </div>
            </div>

            {/* Right column: 3D structure viewer */}
            <div className="lg:w-[420px] flex-shrink-0">
              <div className="sticky top-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                  <Atom className="h-4 w-4 text-blue-500" />
                  Crystal Structure
                </h2>
                {hasStructure ? (
                  <MaterialStructureViewer
                    atoms={material.structure_data!.atoms}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    latticeMatrix={(material.structure_data as any)?.lattice_matrix}
                    lattice={
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      (material.structure_data as any)?.viewer_lattice ??
                      material.lattice_params ??
                      undefined
                    }
                    className="h-96 lg:h-[28rem]"
                  />
                ) : (
                  <div className="h-96 lg:h-[28rem] rounded-xl border bg-gray-900 flex items-center justify-center">
                    <div className="text-center">
                      <Atom className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">
                        No structure data available
                      </p>
                    </div>
                  </div>
                )}

                {/* Quick stats below viewer */}
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div className="text-center p-3 bg-card rounded-xl border border-border shadow-sm">
                    <div className="text-[10px] text-gray-400 uppercase tracking-wide">
                      Band Gap
                    </div>
                    <div className="text-base font-bold text-foreground">
                      {formatProp(material.band_gap)}
                    </div>
                    <div className="text-[10px] text-muted-foreground">eV</div>
                  </div>
                  <div className="text-center p-3 bg-card rounded-xl border border-border shadow-sm">
                    <div className="text-[10px] text-gray-400 uppercase tracking-wide">
                      E<sub>form</sub>
                    </div>
                    <div className="text-base font-bold text-foreground">
                      {formatProp(material.formation_energy)}
                    </div>
                    <div className="text-[10px] text-muted-foreground">eV/atom</div>
                  </div>
                  <div className="text-center p-3 bg-card rounded-xl border border-border shadow-sm">
                    <div className="text-[10px] text-gray-400 uppercase tracking-wide">
                      E<sub>hull</sub>
                    </div>
                    <div className="text-base font-bold text-foreground">
                      {formatProp(material.energy_above_hull)}
                    </div>
                    <div className="text-[10px] text-muted-foreground">eV/atom</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Related Materials */}
        {relatedMaterials.length > 0 && (
          <section className="border-t border-border bg-muted/30">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
              <h2 className="text-xl font-bold text-foreground mb-6">
                Related Materials
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {relatedMaterials.map((m) => (
                  <MaterialCard key={m.id} material={m} />
                ))}
              </div>
              <div className="text-center mt-8">
                <Button variant="outline" asChild>
                  <Link href="/materials">Browse All Materials</Link>
                </Button>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />

      {/* Materials Co-pilot Chat */}
      <CopilotChat
        materialId={material.external_id}
        materialFormula={material.formula}
      />
    </>
  );
}
