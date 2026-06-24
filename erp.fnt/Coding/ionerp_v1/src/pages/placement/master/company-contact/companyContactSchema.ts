import { z } from "zod";

export const Schema = z.object({
  company_id: z.string().min(1, { message: "Company is required" }),
  contact_name: z.string().min(1, { message: "Contact Name is required" }),
  designation_id: z.string().min(1, { message: "Designation is required" }),
  email: z.string().email({ message: "Valid Email is required" }),
  mobile: z.string().min(10, { message: "Mobile Number is required" }),
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
        options: [],
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
        name: "designation_id",
        label: "Designation",
        placeholder: "Select Designation",
        required: true,
        options: [],
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
    filter: false,
  },
  {
    headerName: "Contact Name",
    field: "contact_name",
    sortable: true,
    filter: false,
  },
  {
    headerName: "Designation",
    field: "designation_name",
    sortable: true,
    filter: false,
  },
  {
    headerName: "Email",
    field: "email",
    sortable: true,
    filter: false,
  },
  {
    headerName: "Mobile",
    field: "mobile",
    sortable: true,
    filter: false,
  },
 {
  headerName: "Primary",
  field: "is_primary",
  sortable: true,
  filter: false,
  cellRenderer: (params: any) => {
    return params.value ? "✅ Primary" : "";
  },
},
];
//test