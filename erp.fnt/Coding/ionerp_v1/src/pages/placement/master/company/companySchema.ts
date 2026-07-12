import { z } from "zod";

export const Schema = z.object({
  company_name: z.string().min(1, {
    message: "Company Name is required",
  }),
  company_type: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  email: z
    .string()
    .email({
      message: "Valid Email is required",
    })
    .or(z.literal(""))
    .optional()
    .nullable(),
  phone: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  pincode: z.string().optional().nullable(),

  contact_person: z.string().optional().nullable(),
  contact_designation: z.string().optional().nullable(),
  contact_phone: z.string().optional().nullable(),
  contact_email: z
    .string()
    .email({
      message: "Valid Contact Email is required",
    })
    .or(z.literal(""))
    .optional()
    .nullable(),
});

export const SchemaFields = [
  {
    group: "Company Profile",
    fields: [
      {
        type: "text",
        name: "company_name",
        label: "Company Name",
        required: true,
      },
      {
        type: "select",
        name: "company_type",
        label: "Company Type",
        required: false,
        options: [
          { label: "Select Company Type", value: "" },
          { label: "Private Ltd", value: "Private Ltd" },
          { label: "Public Ltd", value: "Public Ltd" },
          { label: "Partnership", value: "Partnership" },
          { label: "Proprietorship", value: "Proprietorship" },
          { label: "MNC", value: "MNC" },
          { label: "Startup", value: "Startup" },
          { label: "Government", value: "Government" },
        ],
      },
      {
        type: "select",
        name: "industry",
        label: "Industry",
        required: false,
        options: [
          { label: "Select Industry", value: "" },
          { label: "IT / Software", value: "IT / Software" },
          { label: "Manufacturing", value: "Manufacturing" },
          { label: "Finance / Banking", value: "Finance / Banking" },
          { label: "Healthcare", value: "Healthcare" },
          { label: "Education", value: "Education" },
          { label: "Consulting", value: "Consulting" },
          { label: "Other", value: "Other" },
        ],
      },
      {
        type: "text",
        name: "website",
        label: "Website URL",
        required: false,
        placeholder: "e.g. www.example.com",
      },
      {
        type: "text",
        name: "email",
        label: "Email Address",
        required: false,
        placeholder: "e.g. contact@example.com",
      },
      {
        type: "text",
        name: "phone",
        label: "Phone Number",
        required: false,
        placeholder: "e.g. +91 9876543210",
      },
      {
        type: "textarea",
        name: "description",
        label: "Company Description / About",
        required: false,
        placeholder: "Brief description of the organization's business, culture, etc.",
      },
    ],
  },
  {
    group: "Address Details",
    fields: [
      {
        type: "text",
        name: "address",
        label: "Street Address",
        required: false,
        placeholder: "e.g. Electronics City Phase 1",
      },
      {
        type: "text",
        name: "city",
        label: "City",
        required: false,
        placeholder: "e.g. Bangalore",
      },
      {
        type: "text",
        name: "state",
        label: "State / Region",
        required: false,
        placeholder: "e.g. Karnataka",
      },
      {
        type: "text",
        name: "country",
        label: "Country",
        required: false,
        placeholder: "e.g. India",
      },
      {
        type: "text",
        name: "pincode",
        label: "ZIP / Postal Code",
        required: false,
        placeholder: "e.g. 560100",
      },
    ],
  },
  {
    group: "Primary Recruiter Contact",
    fields: [
      {
        type: "text",
        name: "contact_person",
        label: "Contact Name",
        required: false,
        placeholder: "e.g. Sudha Murty",
      },
      {
        type: "text",
        name: "contact_designation",
        label: "Contact Designation",
        required: false,
        placeholder: "e.g. TA Lead / HR Manager",
      },
      {
        type: "text",
        name: "contact_phone",
        label: "Contact Phone Number",
        required: false,
        placeholder: "e.g. 9876543210",
      },
      {
        type: "text",
        name: "contact_email",
        label: "Contact Email Address",
        required: false,
        placeholder: "e.g. recruiter@example.com",
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
    headerName: "Industry",
    field: "industry",
    sortable: true,
    filter: true,
  },
  {
    headerName: "Email",
    field: "email",
    sortable: true,
    filter: true,
  },
  {
    headerName: "Phone",
    field: "phone",
    sortable: true,
    filter: true,
  },
  {
    headerName: "Contact Person",
    field: "contact_person",
    sortable: true,
    filter: true,
  },
  {
    headerName: "Website",
    field: "website",
    sortable: true,
    filter: true,
  },
];

export default Schema;