/**
 * Company response interface for the placement master "Company" page.
 *
 * This file defines the shape of company objects returned by APIs or used within
 * the frontend. It intentionally contains no JSX or runtime components so it can
 * remain a `.ts` file and be imported as a type-only module.
 */

export interface CompanyResponse {
  // backend may use either `company_id` / `company_name` or `id` / `name`
  company_id?: number;
  id?: number;
  company_name?: string;
  name?: string;
  company_code?: string;
  company_email?: string;
  email?: string;
  company_phone?: string;
  phone?: string;
  company_address?: string;
  address?: string;
  status?: number; // 1 = active, 0 = inactive
  isActive?: boolean;
  createdAt?: string; // ISO date string
  updatedAt?: string; // ISO date string
  // Additional optional fields commonly useful for company records
  company_contact_person?: string;
  contact_person?: string;
  company_contact_phone?: string;
  contact_phone?: string;
  company_contact_email?: string;
  contact_email?: string;
  company_website?: string;
  website?: string;
  company_industry?: string;
  industry?: string;
  company_established_year?: number | string;
  established_year?: number | string;
  company_employees?: number | string;
  employees?: number | string;
  company_linkedin?: string;
  linkedin?: string;
}

export type CompanyListResponse = CompanyResponse[];

// No default export — this file only exports TypeScript types/interfaces.