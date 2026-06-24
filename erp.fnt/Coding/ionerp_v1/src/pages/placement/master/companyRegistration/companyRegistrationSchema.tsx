import { z } from "zod";
import axiosInstance from "../../../../utils/api";
import { ApiEndpoint } from "../../../../utils/ApiEndpoint/placementApiEndpoint";

export const Schema = z.object({
  company_name: z.string().min(1, { message: "Company Name is required" }),
  industry: z.string().min(1, { message: "Industry is required" }),
  company_type: z.string().optional(),
  website: z.string().url({ message: "Invalid website URL" }).optional().or(z.literal("")),
  city: z.string().min(1, { message: "City is required" }),
  state: z.string().min(1, { message: "State is required" }),
  country: z.string().min(1, { message: "Country is required" }),
  pincode: z.string().optional(),
  address: z.string().optional(),
  
  contact_person: z.string().min(1, { message: "Contact Name is required" }),
  contact_email: z.string().email({ message: "Invalid email address" }),
  contact_phone: z.string().min(10, { message: "Invalid phone number" }).optional().or(z.literal("")),
  
  email: z.string().email({ message: "Invalid company email address" }).optional().or(z.literal("")),
  phone: z.string().optional(),
  
  description: z.string().optional(),
});

export const SchemaFields = [
  {
    group: "Company Information",
    fields: [
      {
        type: "text",
        name: "company_name",
        label: "Company Name",
        placeholder: "Legal registered name",
        required: true,
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
          { label: "Other", value: "Other" },
        ],
      },
      {
        type: "text",
        name: "website",
        label: "Website",
        placeholder: "https://yourcompany.com",
        required: false,
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
              ApiEndpoint.companyRegistration.countries
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
        label: "State",
        placeholder: "Select State",
        required: true,
        dependsOn: "country",
        loadOptions: async (countryName: any) => {
          try {
            const response = await axiosInstance.get(
              `${ApiEndpoint.companyRegistration.states}?country_name=${encodeURIComponent(
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
              `${ApiEndpoint.companyRegistration.cities}?state_name=${encodeURIComponent(
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
        label: "Pincode",
        placeholder: "Pincode",
        required: false,
      },
      {
        type: "text",
        name: "address",
        label: "Address",
        placeholder: "Company headquarters address",
        required: false,
      },
    ],
  },
  {
    group: "Primary Contact",
    fields: [
      {
        type: "text",
        name: "contact_person",
        label: "Contact Name",
        placeholder: "Full name",
        required: true,
      },
      {
        type: "text",
        name: "contact_email",
        label: "Contact Email",
        placeholder: "hr@company.com",
        required: true,
      },
      {
        type: "text",
        name: "contact_phone",
        label: "Contact Phone",
        placeholder: "+91 98765 43210",
        required: false,
      },
    ],
  },
  {
    group: "Recruitment Intent",
    fields: [
      {
        type: "text",
        name: "description",
        label: "Message to Placement Cell",
        placeholder: "Describe your hiring needs, preferred branches, typical CTC range, etc.",
        required: false,
      },
    ],
  },
];
