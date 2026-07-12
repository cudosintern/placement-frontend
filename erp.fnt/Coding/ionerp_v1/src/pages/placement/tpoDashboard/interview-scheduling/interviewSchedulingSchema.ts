import { z } from "zod";
import interviewSchedulingService from "./interviewSchedulingService";

export const Schema = z
  .object({
    drive_id: z.string().min(1, "Drive is required"),
    round_id: z.string().min(1, "Round is required"),
    venue_type: z.string().min(1, "Venue Type is required"),
    venue_details: z.string().optional().nullable(),
    meeting_link: z.string().optional().nullable(),
    interview_date: z.union([z.string(), z.date()]),
    start_time: z.union([z.string(), z.date()]),
    end_time: z.union([z.string(), z.date()]),
  })
  .refine(
    (data) => {
      if (data.venue_type === "Online") {
        return !!data.meeting_link && data.meeting_link.trim() !== "";
      }
      return true;
    },
    {
      message: "Meeting Link is required for Online interviews",
      path: ["meeting_link"],
    }
  )
  .refine(
    (data) => {
      if (data.start_time && data.end_time) {
        const getStr = (val: any) => {
          if (val instanceof Date) {
            const h = String(val.getHours()).padStart(2, "0");
            const m = String(val.getMinutes()).padStart(2, "0");
            const s = String(val.getSeconds()).padStart(2, "0");
            return `${h}:${m}:${s}`;
          }
          return String(val);
        };
        return getStr(data.start_time) < getStr(data.end_time);
      }
      return true;
    },
    {
      message: "Start Time must be less than End Time",
      path: ["end_time"],
    }
  );

export const SchemaFields = [
  {
    group: "",
    fields: [
      {
        type: "select",
        name: "drive_id",
        label: "Drive",
        placeholder: "Select Drive",
        required: true,
        loadOptions: async () => {
          const drives = await interviewSchedulingService.getDrives();
          return drives.map((item: any) => ({
            label: item.drive_name,
            value: String(item.drive_id),
          }));
        },
      },
      {
        type: "select",
        name: "round_id",
        label: "Round",
        placeholder: "Select Round",
        required: true,
        dependsOn: "drive_id",
        loadOptions: async (driveId: any) => {
          if (!driveId) return [];
          const rounds = await interviewSchedulingService.getDriveRounds(Number(driveId));
          return rounds.map((item: any) => ({
            label: `${item.round_number}. ${item.round_name} (${item.round_type})`,
            value: String(item.round_id),
          }));
        },
      },
      {
        type: "select",
        name: "venue_type",
        label: "Venue Type",
        placeholder: "Select Venue Type",
        required: true,
        options: [
          { label: "Online", value: "Online" },
          { label: "Offline", value: "Offline" },
        ],
      },
      {
        type: "text",
        name: "meeting_link",
        label: "Meeting Link",
        placeholder: "Enter Meeting Link (Online only)",
        required: false,
      },
      {
        type: "textarea",
        name: "venue_details",
        label: "Venue Details / Location",
        placeholder: "Enter Room No, Block, etc.",
        required: false,
      },
      {
        type: "singledate",
        name: "interview_date",
        label: "Date",
        required: true,
      },
      {
        type: "time",
        name: "start_time",
        label: "Start Time",
        required: true,
      },
      {
        type: "time",
        name: "end_time",
        label: "End Time",
        required: true,
      },
    ],
  },
];

export const SchemaColumnDefs = [
  {
    headerName: "Drive Name",
    field: "drive_name",
    sortable: true,
    filter: true,
  },
  {
    headerName: "Round Name",
    field: "round_name",
    sortable: true,
    filter: true,
  },
  {
    headerName: "Venue Type",
    field: "venue_type",
    sortable: true,
    filter: true,
  },
  {
    headerName: "Venue Details",
    field: "venue_details",
    sortable: true,
    filter: false,
  },
  {
    headerName: "Meeting Link",
    field: "meeting_link",
    sortable: false,
    filter: false,
    cellRenderer: (params: any) => {
      if (params.value) {
        return `<a href="${params.value}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">${params.value}</a>`;
      }
      return "-";
    },
  },
  {
    headerName: "Date",
    field: "interview_date",
    sortable: true,
    filter: true,
  },
  {
    headerName: "Start Time",
    field: "start_time",
    sortable: true,
    filter: false,
  },
  {
    headerName: "End Time",
    field: "end_time",
    sortable: true,
    filter: false,
  },
];
