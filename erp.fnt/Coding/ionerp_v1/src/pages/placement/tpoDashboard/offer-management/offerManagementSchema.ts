import { z } from "zod";
import offerManagementService from "./offerManagementService";

export const Schema = z
  .object({
    id: z.union([z.string(), z.number()]).optional(),
    company_id: z.string().min(1, "Company is required"),
    drive_id: z.string().min(1, "Placement Drive is required"),
    student_id: z.string().min(1, "Student is required"),
    designation: z.string().min(1, "Designation / Job Role is required"),
    package_ctc: z
      .string()
      .min(1, "Package (CTC) is required")
      .refine(
        (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
        "Package (CTC) must be a positive number"
      ),
    location: z.string().min(1, "Job Location is required"),
    offer_date: z.union([z.string(), z.date()], {
      required_error: "Offer Date is required",
      invalid_type_error: "Offer Date must be a valid date",
    }),
    joining_date: z.union([z.string(), z.date()], {
      required_error: "Joining Date is required",
      invalid_type_error: "Joining Date must be a valid date",
    }),
    status: z.string().min(1, "Status is required"),
    remarks: z.string().optional().nullable(),
    offer_letter: z.any().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.offer_date && data.joining_date) {
        const oDate = new Date(data.offer_date);
        const jDate = new Date(data.joining_date);
        return jDate >= oDate;
      }
      return true;
    },
    {
      message: "Joining Date cannot be earlier than Offer Date",
      path: ["joining_date"],
    }
  )
  .refine(
    (data) => {
      if (!data.id && data.joining_date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const jDate = new Date(data.joining_date);
        return jDate > today;
      }
      return true;
    },
    {
      message: "Joining Date must be a future date",
      path: ["joining_date"],
    }
  );

export const SchemaFields = [
  {
    group: "Offer Details",
    fields: [
      {
        type: "select",
        name: "company_id",
        label: "Company",
        placeholder: "Select Company",
        required: true,
        loadOptions: async () => {
          const companies = await offerManagementService.getCompanies();
          return companies.map((c: any) => ({
            label: c.company_name,
            value: String(c.company_id),
          }));
        },
      },
      {
        type: "select",
        name: "drive_id",
        label: "Placement Drive",
        placeholder: "Select Placement Drive",
        required: true,
        dependsOn: "company_id",
        loadOptions: async (companyId: any) => {
          if (!companyId) return [];
          const drives = await offerManagementService.getDrives();
          return drives
            .filter((d: any) => String(d.company_id) === String(companyId))
            .map((d: any) => ({
              label: d.drive_name,
              value: String(d.drive_id),
            }));
        },
      },
      {
        type: "select",
        name: "student_id",
        label: "Student",
        placeholder: "Select Student",
        required: true,
        dependsOn: "drive_id",
        loadOptions: async (driveId: any) => {
          if (!driveId) return [];
          const students = await offerManagementService.getInterviewPassedStudents(driveId);
          return students.map((s: any) => ({
            label: `${s.name} (${s.usno || s.regno || s.student_id})`,
            value: String(s.student_id),
          }));
        },
      },
      {
        type: "text",
        name: "designation",
        label: "Designation / Job Role",
        placeholder: "Enter Designation (e.g. Software Engineer)",
        required: true,
      },
      {
        type: "text",
        name: "package_ctc",
        label: "Package (CTC in LPA)",
        placeholder: "Enter CTC (e.g. 6.5)",
        required: true,
      },
      {
        type: "text",
        name: "location",
        label: "Job Location",
        placeholder: "Enter Location (e.g. Bangalore, Remote)",
        required: true,
      },
      {
        type: "singledate",
        name: "offer_date",
        label: "Offer Date",
        required: true,
      },
      {
        type: "singledate",
        name: "joining_date",
        label: "Joining Date",
        required: true,
      },
      {
        type: "select",
        name: "status",
        label: "Status",
        placeholder: "Select Offer Status",
        required: true,
        options: [
          { label: "Generated", value: "Generated" },
          { label: "Sent", value: "Sent" },
          { label: "Accepted", value: "Accepted" },
          { label: "Rejected", value: "Rejected" },
          { label: "Revoked", value: "Revoked" },
          { label: "Expired", value: "Expired" },
        ],
      },
      {
        type: "textarea",
        name: "remarks",
        label: "Remarks",
        placeholder: "Enter any special instructions or remarks",
        required: false,
      },
      {
        type: "file",
        name: "offer_letter",
        label: "Offer Letter Document",
        placeholder: "Upload Offer Letter",
        required: false,
        accept: ".pdf,.doc,.docx",
      },
    ],
  },
];

export const SchemaColumnDefs = [
  {
    headerName: "Offer ID",
    field: "id",
    sortable: true,
    filter: true,
    width: 100,
  },
  {
    headerName: "Company",
    field: "company_name",
    sortable: true,
    filter: true,
  },
  {
    headerName: "Student",
    field: "student_name",
    sortable: true,
    filter: true,
    cellRenderer: (params: any) => {
      const name = params.data.student_name || "";
      const usn = params.data.usn || "";
      return usn ? `${name} (${usn})` : name;
    },
  },
  {
    headerName: "Drive",
    field: "drive_name",
    sortable: true,
    filter: true,
  },
  {
    headerName: "Designation / Role",
    field: "designation",
    sortable: true,
    filter: true,
  },
  {
    headerName: "CTC (LPA)",
    field: "package_ctc",
    sortable: true,
    filter: true,
    width: 110,
    valueFormatter: (params: any) => (params.value ? `${params.value} LPA` : "-"),
  },
  {
    headerName: "Offer Date",
    field: "offer_date",
    sortable: true,
    filter: true,
    width: 120,
    valueFormatter: (params: any) => {
      if (!params.value) return "-";
      try {
        return new Date(params.value).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      } catch {
        return params.value;
      }
    },
  },
  {
    headerName: "Joining Date",
    field: "joining_date",
    sortable: true,
    filter: true,
    width: 120,
    valueFormatter: (params: any) => {
      if (!params.value) return "-";
      try {
        return new Date(params.value).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      } catch {
        return params.value;
      }
    },
  },
  {
    headerName: "Created By",
    field: "created_by_name",
    sortable: true,
    filter: true,
    width: 130,
  },
];
