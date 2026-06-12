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
];

export default Schema;