import { z } from "zod";

export const Schema = z.object({
  company_id: z.string().min(1, { message: "Company is required" }),
  contact_name: z.string().min(1, { message: "Contact Name is required" }),
  designation: z.any(),
  email: z.string().email({ message: "Valid Email is required" }),
  mobile: z.string().regex(/^\d{10}$/, { message: "Mobile Number must be exactly 10 numeric digits" }),
  is_primary: z.any().optional(),
});

export const SchemaFields = [
  {
    group: "",
    fields: [
      {
        type: "select",
        name: "company_id",
        label: "Company",
        placeholder: "Select Company",
        required: true,
        loadOptions: async () => {
          return [
            { label: "Infosys", value: "1" },
            { label: "TCS", value: "2" },
            { label: "Wipro", value: "3" },
          ];
        },
      },
      {
        type: "text",
        name: "contact_name",
        label: "Contact Name",
        placeholder: "Enter Contact Name",
        required: true,
      },
      {
        type: "select",
        name: "designation",
        label: "Designation",
        placeholder: "Select Designation",
        required: true,
        loadOptions: async () => [],
      },
      {
        type: "text",
        name: "email",
        label: "Email",
        placeholder: "Enter Email",
        required: true,
      },
      {
        type: "text",
        name: "mobile",
        label: "Mobile Number",
        placeholder: "Enter Mobile Number",
        required: true,
      },
      {
        type: "checkbox",
        name: "is_primary",
        label: "Primary Contact",
        required: false,
      },
    ],
  },
];

export const SchemaColumnDefs = [
  {
    headerName: "Company",
    field: "company_name",
    sortable: true,
    filter: true,
  },
  {
    headerName: "Contact Name",
    valueGetter: (params: any) =>
      `${params.data.first_name || ""} ${params.data.last_name || ""}`.trim(),
    sortable: true,
    filter: true,
  },
  {
    headerName: "Designation",
    field: "designation_name",
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
    headerName: "Mobile",
    field: "phone",
    sortable: true,
    filter: true,
  },
  {
    headerName: "Primary",
    field: "is_primary",
    sortable: true,
    filter: true,
    cellRenderer: (params: any) => {
      return params.value ? "✅ Primary" : "";
    },
  },
  {
    headerName: "Interviewer",
    field: "is_interviewer",
    sortable: true,
    filter: true,
    cellRenderer: (params: any) => {
      return params.value ? "✅ Interviewer" : "";
    },
  },
];