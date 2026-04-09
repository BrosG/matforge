const API_BASE =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000/api/v1";

// ── Interfaces ──────────────────────────────────────────────────────────────

export interface MaterialSummary {
  id: string;
  external_id: string;
  source_db: string;
  formula: string;
  formula_anonymous: string;
  elements: string[];
  n_elements: number;
  band_gap: number | null;
  formation_energy: number | null;
  energy_above_hull: number | null;
  density: number | null;
  space_group: string | null;
  crystal_system: string | null;
  is_stable: boolean | null;
  tags: string[];
}

export interface MaterialDetail extends MaterialSummary {
  composition: Record<string, number> | null;
  total_magnetization: number | null;
  volume: number | null;
  lattice_params: {
    a: number;
    b: number;
    c: number;
    alpha: number;
    beta: number;
    gamma: number;
  } | null;
  structure_data: {
    atoms: { element: string; x: number; y: number; z: number }[];
  } | null;
  properties_json: Record<string, unknown> | null;
  source_url: string | null;
  fetched_at: string | null;
  updated_at: string | null;
}

export interface MaterialListResponse {
  materials: MaterialSummary[];
  total: number;
  page: number;
  limit: number;
}

export interface MaterialStats {
  total_materials: number;
  stable_materials: number;
  sources: Record<string, number>;
  crystal_systems: Record<string, number>;
  n_elements_distribution: Record<string, number>;
  avg_band_gap: number;
}

export interface MaterialSearchParams {
  page?: number;
  limit?: number;
  q?: string;
  elements?: string;
  formula?: string;
  crystal_system?: string;
  band_gap_min?: string;
  band_gap_max?: string;
  formation_energy_min?: string;
  formation_energy_max?: string;
  is_stable?: string;
  source_db?: string;
  sort_by?: string;
  sort_dir?: string;
}

// ── Fetch helpers ───────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, revalidate = 60): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    next: { revalidate },
  });

  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText} for ${path}`);
  }

  return res.json() as Promise<T>;
}

export async function fetchMaterials(
  params: MaterialSearchParams = {}
): Promise<MaterialListResponse> {
  const sp = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      sp.set(key, String(value));
    }
  }

  const qs = sp.toString();
  return apiFetch<MaterialListResponse>(
    `/materials${qs ? `?${qs}` : ""}`,
    30
  );
}

export async function fetchMaterial(id: string): Promise<MaterialDetail> {
  return apiFetch<MaterialDetail>(`/materials/${encodeURIComponent(id)}`, 3600);
}

export async function fetchRelatedMaterials(
  id: string,
  limit = 12
): Promise<MaterialSummary[]> {
  return apiFetch<MaterialSummary[]>(
    `/materials/${encodeURIComponent(id)}/related?limit=${limit}`,
    3600
  );
}

export async function fetchMaterialStats(): Promise<MaterialStats> {
  return apiFetch<MaterialStats>("/materials/stats", 300);
}
