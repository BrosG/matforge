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
} from "lucide-react";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { CompositionBadge } from "@/components/materials/CompositionBadge";
import { ElementBadge } from "@/components/materials/ElementBadge";
import { PropertyTable } from "@/components/materials/PropertyTable";
import { MaterialStructureViewer } from "@/components/materials/MaterialStructureViewer";
import { MaterialCard } from "@/components/materials/MaterialCard";
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

export const revalidate = 3600;

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

  return {
    title: material.formula,
    description,
    openGraph: {
      title: `${material.formula} | MatCraft Materials`,
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
    total_magnetization: material.total_magnetization,
    dielectric_constant: material.dielectric_constant,
    refractive_index: material.refractive_index,
    effective_mass_electron: material.effective_mass_electron,
    effective_mass_hole: material.effective_mass_hole,
  };

  const electronicUnits: Record<string, string> = {
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

      <main className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
        {/* Breadcrumb + back link */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-2">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link
              href="/materials"
              className="inline-flex items-center gap-1 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Materials
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">
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
              <div className="flex flex-wrap items-center gap-3 mb-6 text-sm text-gray-500">
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
              </div>

              {/* Elements */}
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-2">
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
                    <h2 className="text-sm font-semibold text-gray-700 mb-2">
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
                                ? frac.toFixed(3)
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
                </div>
              )}

              {/* Thermodynamic Properties */}
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-2">
                  Thermodynamic Properties
                </h2>
                <PropertyTable properties={thermodynamicProps} units={thermodynamicUnits} />
              </div>

              {/* Mechanical Properties */}
              {hasValues(mechanicalProps) && (
                <div className="mb-6">
                  <h2 className="text-sm font-semibold text-gray-700 mb-2">
                    Mechanical Properties
                  </h2>
                  <PropertyTable properties={mechanicalProps} units={mechanicalUnits} />
                </div>
              )}

              {/* Electronic & Magnetic Properties */}
              {hasValues(electronicProps) && (
                <div className="mb-6">
                  <h2 className="text-sm font-semibold text-gray-700 mb-2">
                    Electronic &amp; Magnetic Properties
                  </h2>
                  <PropertyTable properties={electronicProps} units={electronicUnits} />
                </div>
              )}

              {/* Thermal Properties */}
              {hasValues(thermalProps) && (
                <div className="mb-6">
                  <h2 className="text-sm font-semibold text-gray-700 mb-2">
                    Thermal Properties
                  </h2>
                  <PropertyTable properties={thermalProps} units={thermalUnits} />
                </div>
              )}

              {/* Oxidation States */}
              {material.oxidation_states &&
                Object.keys(material.oxidation_states).length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-sm font-semibold text-gray-700 mb-2">
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

              {/* Lattice Parameters */}
              {material.lattice_params && (
                <div className="mb-6">
                  <h2 className="text-sm font-semibold text-gray-700 mb-2">
                    Lattice Parameters
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                    {(
                      [
                        ["a", material.lattice_params.a, "A"],
                        ["b", material.lattice_params.b, "A"],
                        ["c", material.lattice_params.c, "A"],
                        ["alpha", material.lattice_params.alpha, "deg"],
                        ["beta", material.lattice_params.beta, "deg"],
                        ["gamma", material.lattice_params.gamma, "deg"],
                      ] as const
                    ).map(([label, value, unit]) => (
                      <div
                        key={label}
                        className="text-center p-3 bg-gray-50 rounded-xl border"
                      >
                        <div className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">
                          {label}
                        </div>
                        <div className="text-sm font-semibold text-gray-800 font-mono">
                          {formatProp(value)}
                        </div>
                        <div className="text-[10px] text-gray-400">{unit}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {material.tags && material.tags.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-sm font-semibold text-gray-700 mb-2">
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
                    lattice={material.lattice_params ?? undefined}
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
                  <div className="text-center p-3 bg-white rounded-xl border shadow-sm">
                    <div className="text-[10px] text-gray-400 uppercase tracking-wide">
                      Band Gap
                    </div>
                    <div className="text-base font-bold text-gray-900">
                      {formatProp(material.band_gap)}
                    </div>
                    <div className="text-[10px] text-gray-400">eV</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-xl border shadow-sm">
                    <div className="text-[10px] text-gray-400 uppercase tracking-wide">
                      E<sub>form</sub>
                    </div>
                    <div className="text-base font-bold text-gray-900">
                      {formatProp(material.formation_energy)}
                    </div>
                    <div className="text-[10px] text-gray-400">eV/atom</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-xl border shadow-sm">
                    <div className="text-[10px] text-gray-400 uppercase tracking-wide">
                      E<sub>hull</sub>
                    </div>
                    <div className="text-base font-bold text-gray-900">
                      {formatProp(material.energy_above_hull)}
                    </div>
                    <div className="text-[10px] text-gray-400">eV/atom</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Related Materials */}
        {relatedMaterials.length > 0 && (
          <section className="border-t bg-gray-50/50">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
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
    </>
  );
}
