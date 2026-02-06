export interface Requisites {
  company_name?: string;
  inn?: string;
  kpp?: string;
  ogrn?: string;
  address?: string;
  postal_address?: string;
  bank_name?: string;
  bik?: string;
  account?: string;
  corr_account?: string;
  bank_details?: string;
  director?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
}

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

export interface FillResponse {
  success: boolean;
  filled_fields: number;
  used_fields: Record<string, number>;  // поле -> сколько раз использовано
  unused_fields: string[];               // неиспользованные поля
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
