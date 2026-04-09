import { getSession } from "next-auth/react";
import type {
  Campaign,
  CampaignListResponse,
  CampaignResult,
} from "@/types/campaign";
import type {
  DatasetSearchResponse,
  DatasetImportResponse,
  DatasetSource,
} from "@/types/dataset";
import type {
  Template,
  TemplateListResponse,
  TemplateForkResponse,
} from "@/types/template";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export class ApiError extends Error {
  constructor(
    public status: number,
    public data: unknown,
    message?: string
  ) {
    super(message || `API Error ${status}`);
  }
}

async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const session = await getSession();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (session?.accessToken) {
    headers["Authorization"] = `Bearer ${session.accessToken}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new ApiError(res.status, data, data.detail || `Error ${res.status}`);
    }

    if (res.status === 204) return undefined as T;
    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}

/** Unauthenticated fetch for public endpoints */
async function publicRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new ApiError(res.status, data, data.detail || `Error ${res.status}`);
    }

    if (res.status === 204) return undefined as T;
    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}

export interface AnalyticsData {
  total_campaigns: number;
  completed_campaigns: number;
  running_campaigns: number;
  failed_campaigns: number;
  total_evaluated: number;
  total_pareto: number;
  avg_wall_time: number | null;
  domain_counts: Record<string, number>;
  recent_campaigns: Campaign[];
}

export interface MaterialSummary {
  id: string;
  external_id: string;
  source_db: string;
  formula: string;
  formula_anonymous: string | null;
  elements: string[];
  n_elements: number;
  band_gap: number | null;
  formation_energy: number | null;
  energy_above_hull: number | null;
  density: number | null;
  space_group: string | null;
  crystal_system: string | null;
  is_stable: boolean;
  tags: string[];
}

export interface MaterialDetail extends MaterialSummary {
  composition: Record<string, number>;
  total_magnetization: number | null;
  volume: number | null;
  lattice_params: Record<string, number> | null;
  structure_data: {
    atoms?: { element: string; x: number; y: number; z: number }[];
  } | null;
  properties_json: Record<string, unknown>;
  source_url: string | null;
  fetched_at: string;
  updated_at: string | null;
}

export interface HealthFull {
  status: string;
  database: { connected: boolean; users?: number; campaigns?: number; materials?: number };
  redis: { connected: boolean };
  celery: { connected: boolean; workers: number };
  engine: { version: string };
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  is_admin: boolean;
}

export const api = {
  campaigns: {
    list: (page = 1, limit = 20, domain?: string, status?: string) => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (domain) params.set("domain", domain);
      if (status) params.set("status", status);
      return apiRequest<CampaignListResponse>(`/campaigns?${params}`);
    },
    get: (id: string) => apiRequest<Campaign>(`/campaigns/${id}`),
    create: (data: {
      name: string;
      description?: string;
      domain: string;
      definition_yaml: string;
      config?: Record<string, unknown>;
    }) =>
      apiRequest<Campaign>("/campaigns", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    run: (
      id: string,
      config: { budget?: number; rounds?: number; seed?: number }
    ) =>
      apiRequest<Campaign>(`/campaigns/${id}/run`, {
        method: "POST",
        body: JSON.stringify(config),
      }),
    results: (id: string) =>
      apiRequest<CampaignResult>(`/campaigns/${id}/results`),
    delete: (id: string) =>
      apiRequest<void>(`/campaigns/${id}`, { method: "DELETE" }),
    export: (id: string, format: "csv" | "json" | "cif" | "poscar" = "csv") =>
      `${API_BASE}/campaigns/${id}/export?format=${format}`,
    analytics: () => apiRequest<AnalyticsData>("/campaigns/analytics"),
  },
  explore: {
    list: (page = 1, limit = 20, domain?: string, search?: string) => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (domain) params.set("domain", domain);
      if (search) params.set("search", search);
      return publicRequest<CampaignListResponse>(`/campaigns/public?${params}`);
    },
    get: (id: string) =>
      publicRequest<CampaignResult>(`/campaigns/public/${id}`),
  },
  users: {
    me: () => apiRequest<UserProfile>("/users/me"),
    updateProfile: (data: { full_name?: string; email?: string }) =>
      apiRequest<UserProfile>("/users/me", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  },
  datasets: {
    search: (data: {
      source: DatasetSource;
      elements?: string[];
      formula?: string;
      property_range?: Record<string, [number, number]>;
      max_results?: number;
    }) =>
      apiRequest<DatasetSearchResponse>("/datasets/search", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    import: (data: {
      source: string;
      external_ids: string[];
      campaign_id: string;
    }) =>
      apiRequest<DatasetImportResponse>("/datasets/import", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
  templates: {
    list: (page = 1, limit = 20, domain?: string, search?: string, sort?: "recent" | "popular") => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (domain) params.set("domain", domain);
      if (search) params.set("search", search);
      if (sort) params.set("sort", sort);
      return apiRequest<TemplateListResponse>(`/templates?${params}`);
    },
    get: (id: string) => apiRequest<Template>(`/templates/${id}`),
    create: (data: {
      name: string;
      description?: string;
      domain: string;
      definition_yaml: string;
      tags?: string[];
    }) =>
      apiRequest<Template>("/templates", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    like: (id: string) =>
      apiRequest<{ liked: boolean; likes_count: number }>(`/templates/${id}/like`, {
        method: "POST",
      }),
    fork: (id: string) =>
      apiRequest<TemplateForkResponse>(`/templates/${id}/fork`, {
        method: "POST",
      }),
    delete: (id: string) =>
      apiRequest<void>(`/templates/${id}`, { method: "DELETE" }),
  },
  materials: {
    list: (params?: {
      page?: number;
      limit?: number;
      q?: string;
      elements?: string;
      formula?: string;
      crystal_system?: string;
      band_gap_min?: number;
      band_gap_max?: number;
      formation_energy_min?: number;
      formation_energy_max?: number;
      is_stable?: boolean;
      source_db?: string;
      sort_by?: string;
      sort_dir?: string;
    }) => {
      const p = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
        });
      }
      return publicRequest<{
        materials: MaterialSummary[];
        total: number;
        page: number;
        limit: number;
      }>(`/materials?${p}`);
    },
    get: (id: string) => publicRequest<MaterialDetail>(`/materials/${id}`),
    related: (id: string, limit = 12) =>
      publicRequest<MaterialSummary[]>(`/materials/${id}/related?limit=${limit}`),
    stats: () =>
      publicRequest<{
        total_materials: number;
        stable_materials: number;
        sources: Record<string, number>;
        crystal_systems: Record<string, number>;
        n_elements_distribution: Record<number, number>;
        avg_band_gap: number | null;
      }>("/materials/stats"),
    elements: () => publicRequest<Record<string, number>>("/materials/elements"),
  },
  system: {
    health: () => publicRequest<{ status: string }>("/health"),
    healthFull: () => publicRequest<HealthFull>("/health/full"),
    info: () =>
      publicRequest<{ name: string; version: string; engine_version: string; environment: string }>("/info"),
  },
};
