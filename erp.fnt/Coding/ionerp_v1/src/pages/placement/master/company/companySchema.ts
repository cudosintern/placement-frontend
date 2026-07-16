import { z } from "zod";
import axiosInstance from "../../../../utils/api";
import { PlacementApiEndpoint } from "../../../../utils/ApiEndpoint/placementApiEndpoints";

export const Schema = z.object({
  company_name: z.string().min(1, {
    message: "Company Name is required",
  }),
  company_type: z.string().min(1, {
    message: "Company Type is required",
  }),
  industry: z.string().min(1, {
    message: "Industry is required",
  }),
  website: z.string().min(1, {
    message: "Website URL is required",
  }).url({
    message: "Invalid website URL",
  }),
  email: z.string().min(1, {
    message: "Email Address is required",
  }).email({
    message: "Valid Email is required",
  }),
  phone: z.string().min(10, {
    message: "Phone number must be at least 10 digits",
  }),
  description: z.string().optional().nullable(),
  
  address: z.string().min(1, {
    message: "Street Address is required",
  }),
  city: z.string().min(1, {
    message: "City is required",
  }),
  state: z.string().min(1, {
    message: "State / Region is required",
  }),
  country: z.string().min(1, {
    message: "Country is required",
  }),
  pincode: z.string().min(6, {
    message: "ZIP / Postal Code must be 6 characters",
  }),

  contact_person: z.string().min(1, {
    message: "Contact Name is required",
  }),
  contact_designation: z.string().min(1, {
    message: "Contact Designation is required",
  }),
  contact_phone: z.string().min(10, {
    message: "Contact Phone number must be at least 10 digits",
  }),
  contact_email: z.string().min(1, {
    message: "Contact Email Address is required",
  }).email({
    message: "Valid Contact Email is required",
  }),
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
        required: true,
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
        required: true,
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
        required: true,
        placeholder: "e.g. https://www.example.com",
      },
      {
        type: "text",
        name: "email",
        label: "Email Address",
        required: true,
        placeholder: "e.g. contact@example.com",
      },
      {
        type: "text",
        name: "phone",
        label: "Phone Number",
        required: true,
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
        required: true,
        placeholder: "e.g. Electronics City Phase 1",
      },
      {
        type: "select",
        name: "country",
        label: "Country",
        placeholder: "Select Country",
        required: true,
        loadOptions: async () => {
          try {
            const response = await axiosInstance.get(
              PlacementApiEndpoint.companyRegistration.countries
            );
            const resData = response.data as any;
            if (resData?.status && Array.isArray(resData.data)) {
              return resData.data.map((c: any) => ({
                label: c.name,
                value: c.name,
              }));
            }
            return [];
          } catch (error) {
            console.error("Failed to load countries:", error);
            return [];
          }
        },
      },
      {
        type: "select",
        name: "state",
        label: "State / Region",
        placeholder: "Select State",
        required: true,
        dependsOn: "country",
        loadOptions: async (countryName: any) => {
          try {
            const response = await axiosInstance.get(
              `${PlacementApiEndpoint.companyRegistration.states}?country_name=${encodeURIComponent(
                countryName
              )}`
            );
            const resData = response.data as any;
            if (resData?.status && Array.isArray(resData.data)) {
              return resData.data.map((s: any) => ({
                label: s.name,
                value: s.name,
              }));
            }
            return [];
          } catch (error) {
            console.error("Failed to load states:", error);
            return [];
          }
        },
      },
      {
        type: "select",
        name: "city",
        label: "City",
        placeholder: "Select City",
        required: true,
        dependsOn: "state",
        loadOptions: async (stateName: any) => {
          try {
            const response = await axiosInstance.get(
              `${PlacementApiEndpoint.companyRegistration.cities}?state_name=${encodeURIComponent(
                stateName
              )}`
            );
            const resData = response.data as any;
            if (resData?.status && Array.isArray(resData.data)) {
              return resData.data.map((c: any) => ({
                label: c.name,
                value: c.name,
              }));
            }
            return [];
          } catch (error) {
            console.error("Failed to load cities:", error);
            return [];
          }
        },
      },
      {
        type: "text",
        name: "pincode",
        label: "ZIP / Postal Code",
        required: true,
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
        required: true,
        placeholder: "e.g. Sudha Murty",
      },
      {
        type: "text",
        name: "contact_designation",
        label: "Contact Designation",
        required: true,
        placeholder: "e.g. TA Lead / HR Manager",
      },
      {
        type: "text",
        name: "contact_phone",
        label: "Contact Phone Number",
        required: true,
        placeholder: "e.g. 9876543210",
      },
      {
        type: "text",
        name: "contact_email",
        label: "Contact Email Address",
        required: true,
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