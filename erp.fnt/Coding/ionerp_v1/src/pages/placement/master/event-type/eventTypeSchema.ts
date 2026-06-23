import { z } from "zod";

export const Schema = z.object({
  event_code: z.string().min(1, "Event Code is required"),
  event_name: z.string().min(1, "Event Name is required"),
});

export const SchemaFields = [
  {
    group: "",
    fields: [
      {
        type: "text",
        name: "event_code",
        label: "Event Code",
        placeholder: "Enter Event Code",
        required: true,
      },
      {
        type: "text",
        name: "event_name",
        label: "Event Name",
        placeholder: "Enter Event Name",
        required: true,
      },
    ],
  },
];

export const SchemaColumnDefs = [
  {
    headerName: "Event Code",
    field: "event_code",
    sortable: true,
    filter: true,
  },
  {
    headerName: "Event Name",
    field: "event_name",
    sortable: true,
    filter: true,
  },
];