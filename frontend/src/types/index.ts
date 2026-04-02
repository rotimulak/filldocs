export type Requisites = Record<string, string>;

export interface RawField {
  label: string;
  value: string;
  matched_key: string | null;
}

export interface ExtractResponse {
  success: boolean;
  requisites: Requisites;
  raw_fields: RawField[];
  warnings: string[];
  message: string;
}

export interface FilledCell {
  label: string;
  value: string;
  requisite_key: string | null;
}

export interface EmptyCell {
  label: string;
}

export interface FillResponse {
  success: boolean;
  filled_fields: number;
  total_instructions: number;
  filled_details: FilledCell[];
  empty_cells: EmptyCell[];
  skipped_count: number;
  download_url: string;
  filename: string;
  message: string;
}

export interface StoredRequisites {
  requisites: Requisites;
  extractedFrom: string;
  extractedAt: string;
}

export const STORAGE_KEY = "filldocs_requisites";
