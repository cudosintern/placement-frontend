import { z } from "zod";

export const Schema = z.object({
  company_name: z.string().min(1, {
    message: "Company Name is required",
  }),
  industry: z.string().optional(),
  website: z.string().optional(),
  email: z.string().email({
    message: "Valid Email is required",
  }).or(z.literal("")).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  contact_person: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_email: z.string().email({
    message: "Valid Contact Email is required",
  }).or(z.literal("")).optional(),
  description: z.string().optional(),
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
        name: "industry",
        label: "Industry",
        required: false,
      },
      {
        type: "text",
        name: "website",
        label: "Website",
        required: false,
      },
      {
        type: "text",
        name: "email",
        label: "Email",
        required: false,
      },
      {
        type: "text",
        name: "phone",
        label: "Phone",
        required: false,
      },
      {
        type: "text",
        name: "address",
        label: "Address",
        required: false,
      },
      {
        type: "text",
        name: "contact_person",
        label: "Contact Person",
        required: false,
      },
      {
        type: "text",
        name: "contact_phone",
        label: "Contact Phone",
        required: false,
      },
      {
        type: "text",
        name: "contact_email",
        label: "Contact Email",
        required: false,
      },
      {
        type: "textarea",
        name: "description",
        label: "Description",
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