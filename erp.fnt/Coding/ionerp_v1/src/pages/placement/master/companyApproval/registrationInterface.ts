// registrationInterface.ts

export interface RegistrationRecord {
    reg_id: number;
    company_name: string;
    company_type?: string;
    industry?: string;
    website?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
    contact_person?: string;
    contact_email?: string;
    contact_phone?: string;
    description?: string;
    status: number;
    status_label: string;
    remarks?: string;
    review_date?: string;
    create_date: string;
  }
  
  // Helpers for UI styling based on status
  export const STATUS_COLORS: Record<number, string> = {
    0: "warning", // Pending
    1: "success", // Approved
    2: "danger",  // Rejected
  };
  
  export const STATUS_LABELS: Record<number, string> = {
    0: "Pending",
    1: "Approved",
    2: "Rejected",
  };
