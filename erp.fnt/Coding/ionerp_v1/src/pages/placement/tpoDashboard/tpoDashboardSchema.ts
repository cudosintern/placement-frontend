// tpoDashboardSchema.ts
// ag-grid column definitions for the TPO Dashboard registration table.
// Follows the same pattern as companySchema.ts → SchemaColumnDefs.

export interface RegistrationRecord {
  reg_id: number;
  company_id: number | null;
  company_name: string;
  company_type: string | null;
  industry: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  pincode: string | null;
  contact_person: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  description: string | null;
  status: number;            // 0=Pending, 1=Approved, 2=Rejected
  status_label: string;      // "Pending" | "Approved" | "Rejected"
  reviewed_by: number | null;
  review_date: string | null;
  remarks: string | null;
  create_date: string;
  modify_date: string | null;
}

// ag-grid columnDefs — used in DataTable columnDefs prop
export const TpoDashboardColumnDefs = [
  {
    headerName: "ID",
    field: "reg_id",
    width: 80,
    sortable: true,
    filter: true,
    flex: 0,
  },
  {
    headerName: "Company Name",
    field: "company_name",
    flex: 1,
    sortable: true,
    filter: true,
  },
  {
    headerName: "Industry",
    field: "industry",
    flex: 1,
    sortable: true,
    filter: true,
  },
  {
    headerName: "City",
    field: "city",
    width: 120,
    sortable: true,
    filter: true,
    flex: 0,
  },
  {
    headerName: "Contact Email",
    field: "contact_email",
    flex: 1,
    sortable: true,
    filter: true,
  },
  {
    headerName: "Submitted On",
    field: "create_date",
    width: 160,
    flex: 0,
    sortable: true,
    filter: false,
    valueFormatter: (params: any) =>
      params.value ? new Date(params.value).toLocaleDateString("en-IN") : "—",
  },
];
