export type DatasetSource =
  | "materials_project"
  | "aflow"
  | "oqmd"
  | "optimade"
  | "jarvis"
  | "perovskite_db"
  | "gnome"
  | "opendac";

export interface DatasetEntry {
  external_id: string;
  formula: string;
  properties: Record<string, number>;
  source_db: string;
}

export interface DatasetSearchResponse {
  entries: DatasetEntry[];
  total: number;
  source: string;
}

export interface DatasetImportResponse {
  imported: number;
  campaign_id: string;
}

export const DATASET_SOURCE_LABELS: Record<DatasetSource, string> = {
  materials_project: "Materials Project",
  aflow: "AFLOW",
  oqmd: "OQMD",
  optimade: "OPTIMADE",
  jarvis: "JARVIS-DFT",
  perovskite_db: "Perovskite DB",
  gnome: "GNoME",
  opendac: "OpenDAC",
};
