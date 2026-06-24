import { z } from "zod";

export const Schema = z.object({
  company_name: z.string().min(1, {
    message: "Company Name is required",
  }),
  company_code: z.string().min(1, {
    message: "Company Code is required",
  }),
  company_email: z.string().email({
    message: "Valid Email is required",
  }),
  company_phone: z.string().min(10, {
    message: "Phone Number is required",
  }),
  company_address: z.string().min(1, {
    message: "Address is required",
  }),
  company_contact_person: z.string().optional(),
  company_contact_phone: z.string().optional(),
  company_contact_email: z.string().optional(),
  company_website: z.string().optional(),
  company_industry: z.string().optional(),
  company_established_year: z.union([z.string(), z.number()]).optional(),
  company_employees: z.union([z.string(), z.number()]).optional(),
  company_linkedin: z.string().optional(),
});

export const SchemaFields = [
  {
    group: "",
    fields: [
      {
        type: "text",
        name: "company_name",
        label: "Company Name",
        required: true,
      },
      {
        type: "text",
        name: "company_code",
        label: "Company Code",
        required: true,
      },
      {
        type: "text",
        name: "company_email",
        label: "Email",
        required: true,
      },
      {
        type: "text",
        name: "company_phone",
        label: "Phone",
        required: true,
      },
      {
        type: "text",
        name: "company_address",
        label: "Address",
        required: true,
      },
      {
        type: "text",
        name: "company_contact_person",
        label: "Contact Person",
        required: false,
      },
      {
        type: "text",
        name: "company_contact_phone",
        label: "Contact Phone",
        required: false,
      },
      {
        type: "text",
        name: "company_contact_email",
        label: "Contact Email",
        required: false,
      },
      {
        type: "text",
        name: "company_website",
        label: "Website",
        required: false,
      },
      {
        type: "text",
        name: "company_industry",
        label: "Industry",
        required: false,
      },
      {
        type: "number",
        name: "company_established_year",
        label: "Established Year",
        required: false,
      },
      {
        type: "number",
        name: "company_employees",
        label: "Employees",
        required: false,
      },
      {
        type: "text",
        name: "company_linkedin",
        label: "LinkedIn",
        required: false,
      },
    ],
  },
];

export const SchemaColumnDefs = [
  {
    headerName: "Company Name",
    field: "company_name",
    sortable: true,
    filter: true,
  },
  {
    headerName: "Company Code",
    field: "company_code",
    sortable: true,
    filter: true,
  },
  {
    headerName: "Email",
    field: "company_email",
    sortable: true,
    filter: true,
  },
  {
    headerName: "Phone",
    field: "company_phone",
    sortable: true,
    filter: true,
  },
  {
    headerName: "Contact Person",
    field: "company_contact_person",
    sortable: true,
    filter: true,
  },
  {
    headerName: "Website",
    field: "company_website",
    sortable: true,
    filter: true,
  },
];

export default Schema;