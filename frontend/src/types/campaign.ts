export interface Campaign {
  id: string;
  name: string;
  description: string | null;
  domain: string;
  status: "pending" | "running" | "completed" | "failed";
  config: CampaignConfig;
  progress: number;
  current_round: number;
  total_rounds: number;
  total_evaluated: number;
  pareto_size: number;
  wall_time_seconds: number | null;
  owner_id: string;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface CampaignConfig {
  budget?: number;
  rounds?: number;
  surrogate_evals?: number;
  seed?: number;
}

export interface MaterialRecord {
  id: string;
  params: number[];
  properties: Record<string, number>;
  composition: Record<string, number>;
  score: number;
  source: string;
  uncertainty: Record<string, number>;
  dominated: boolean;
  round_number: number;
}

export interface CampaignResult {
  campaign: Campaign;
  pareto_front: MaterialRecord[];
  all_materials: MaterialRecord[];
}

export interface CampaignListResponse {
  campaigns: Campaign[];
  total: number;
  page: number;
  limit: number;
}

export type Domain =
  | "water"
  | "battery"
  | "solar"
  | "co2"
  | "catalyst"
  | "hydrogen"
  | "construction"
  | "bio"
  | "agri"
  | "electronics"
  | "textile"
  | "thermoelectric"
  | "superconductor"
  | "polymer"
  | "coating"
  | "ceramic";

export const DOMAIN_LABELS: Record<Domain, string> = {
  water: "Water Filtration",
  battery: "Battery Materials",
  solar: "Solar Cells",
  co2: "CO2 Capture",
  catalyst: "Catalysis",
  hydrogen: "Hydrogen Storage",
  construction: "Construction Materials",
  bio: "Biomaterials",
  agri: "Agricultural Materials",
  electronics: "Electronics",
  textile: "Smart Textiles",
  thermoelectric: "Thermoelectrics",
  superconductor: "Superconductors",
  polymer: "Polymers & Plastics",
  coating: "Coatings & Thin Films",
  ceramic: "Advanced Ceramics",
};
