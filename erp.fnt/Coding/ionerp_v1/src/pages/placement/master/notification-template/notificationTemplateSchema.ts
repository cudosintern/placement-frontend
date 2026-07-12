import { z } from "zod";

export const Schema = z.object({
  notification_title: z
    .string()
    .min(1, { message: "Notification Title is required" }),

  notification_message: z
    .string()
    .min(1, { message: "Notification Message is required" }),

  notification_type: z
    .string()
    .min(1, { message: "Notification Type is required" }),
});

export const SchemaFields = [
  {
    group: "",
    fields: [
      {
        type: "text",
        name: "notification_title",
        label: "Notification Title",
        placeholder: "Enter Notification Title",
        required: true,
      },
      {
        type: "editor",
        name: "notification_message",
        label: "Notification Message",
        placeholder: "Enter Notification Message",
        required: true,
      },
      {
        type: "select",
        name: "notification_type",
        label: "Notification Type",
        placeholder: "Select Notification Type",
        required: true,
        options: [
          { label: "Email", value: "Email" },
          { label: "SMS", value: "SMS" },
          { label: "Push", value: "Push" },
        ],
      },
      {
  type: "select",
  name: "event_type_id",
  label: "Event Type",
  placeholder: "Select Event Type",
  required: true,
  options: [],
},
    ],
  },
];

export const SchemaColumnDefs = [
  {
    headerName: "Title",
    field: "notification_title",
    sortable: true,
    filter: true,
  },
  {
    headerName: "Message",
    field: "notification_message",
    sortable: true,
    filter: true,
  },
  {
    headerName: "Type",
    field: "notification_type",
    sortable: true,
    filter: true,
  },
 {
  headerName: "Event Type",
  field: "event_type_name",
  sortable: true,
  filter: true,
},
];