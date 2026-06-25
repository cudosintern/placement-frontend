import React, { useState, useEffect, useMemo } from "react";
import DynamicFormBuilder from "../../../../components/FormBuilder/DynamicFormBuilder";
import { Schema, SchemaFields } from "./companyRegistrationSchema";
import { PlacementApiEndpoint } from "../../../../utils/ApiEndpoint/placementapiEndpoint";
import axiosInstance from "../../../../utils/api";
import { toast } from "react-toastify";
import { Building2, CheckCircle2, ClipboardList, MapPin, UserRound } from "lucide-react";

const SECTION_STEPS = [
  { icon: Building2, label: "Company Info", desc: "Business details" },
  { icon: UserRound, label: "Primary Contact", desc: "HR / recruiter" },
  { icon: ClipboardList, label: "Recruitment Intent", desc: "Hiring needs" },
];

const CompanyRegistrationPage: React.FC = () => {
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPincodeAvailable, setIsPincodeAvailable] = useState(false);

  useEffect(() => {
    const checkPincodeAvailability = async () => {
      try {
        const response = await axiosInstance.get(
          PlacementApiEndpoint.companyRegistration.checkPincode
        );
        const resData = response.data as any;
        if (resData?.status && resData.data?.pincode_available) {
          setIsPincodeAvailable(true);
        }
      } catch (error) {
        console.error("Failed to check pincode availability:", error);
      }
    };
    checkPincodeAvailability();
  }, []);

  const dynamicFields = useMemo(() => {
    return SchemaFields.map((group) => {
      if (group.group === "Company Information") {
        const fields = group.fields.filter((field) => {
          if (field.name === "pincode" && !isPincodeAvailable) {
            return false;
          }
          return true;
        });
        return { ...group, fields };
      }
      return group;
    });
  }, [isPincodeAvailable]);

  const handleFormSubmit = async (data: any) => {
    try {
      const response = await axiosInstance.post(
        PlacementApiEndpoint.companyRegistration.submit,
        data
      );
      const resData = response.data as any;
      if (resData?.status) {
        toast.success(resData.message || "Registration submitted successfully!");
        setIsSuccess(true);
      } else {
        toast.error(resData?.message || "Failed to submit registration.");
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to submit registration.");
    }
  };

  if (isSuccess) {
    return (
      <div className="cr-registration-page mx-auto max-w-3xl px-4 py-8" style={{ fontFamily: "'Roboto', sans-serif" }}>
        <style>{`
          .cr-registration-page, .cr-registration-page * {
            font-family: 'Roboto', sans-serif;
          }
        `}</style>

        <div
          className="flex flex-col items-center rounded-3xl border border-white bg-white px-8 py-14 text-center"
          style={{
            boxShadow:
              "0 1px 0 rgba(255,255,255,0.9) inset, 0 16px 40px -16px rgba(5,150,105,0.22), 0 4px 0 #047857",
          }}
        >
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-[0_4px_0_#a7f3d0]">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h2 className="text-3xl font-black tracking-tight text-black">Registration Submitted</h2>
          <p className="mt-3 max-w-md text-sm font-medium leading-relaxed text-black/60">
            Thank you for registering. Your details have been submitted to the placement cell.
            You will receive an email confirmation once your registration is approved.
          </p>
          <button
            onClick={() => setIsSuccess(false)}
            className="mt-8 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-[0_4px_0_#047857] transition-all hover:-translate-y-0.5 hover:bg-emerald-500 active:translate-y-0.5 active:shadow-[0_1px_0_#047857]"
          >
            Submit Another Registration
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cr-registration-page mx-auto max-w-5xl px-4 py-6" style={{ fontFamily: "'Roboto', sans-serif" }}>
      <style>{`
        .cr-registration-page, .cr-registration-page * {
          font-family: 'Roboto', sans-serif;
        }
        .cr-form-panel form h3 {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-top: 0.5rem;
          margin-bottom: 0.25rem;
          padding: 0.85rem 1rem;
          border-radius: 1rem;
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
          border: 1px solid #e5e7eb;
          font-size: 0.95rem !important;
          font-weight: 700 !important;
          color: #000000 !important;
          box-shadow: 0 3px 0 #e5e7eb;
        }
        .cr-form-panel form > div:not(:first-child) h3 {
          margin-top: 1.25rem;
        }
        .cr-form-panel form label {
          font-weight: 600 !important;
          color: #111827 !important;
        }
        .cr-form-panel form input,
        .cr-form-panel form select,
        .cr-form-panel form textarea {
          border-radius: 0.85rem !important;
          border-color: #e5e7eb !important;
          box-shadow: 0 2px 0 #f3f4f6;
        }
        .cr-form-panel form input:focus,
        .cr-form-panel form select:focus,
        .cr-form-panel form textarea:focus {
          border-color: #2563eb !important;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
        }
        .cr-form-panel form button[type="reset"] {
          border-radius: 0.75rem !important;
          background: #ffffff !important;
          border: 1px solid #e5e7eb !important;
          color: #000000 !important;
          font-weight: 700 !important;
          padding: 0.75rem 1.5rem !important;
          box-shadow: 0 3px 0 #d1d5db !important;
        }
        .cr-form-panel form button[type="reset"]:hover {
          transform: translateY(-2px);
        }
      `}</style>

      {/* Header */}
      <div
        className="mb-6 rounded-3xl border border-white bg-white p-6"
        style={{
          boxShadow:
            "0 1px 0 rgba(255,255,255,0.9) inset, 0 14px 32px -14px rgba(37,99,235,0.18), 0 4px 0 #1d4ed8",
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-[0_4px_0_#bfdbfe]">
              <Building2 className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-black">Company Registration</h1>
              <p className="mt-1 max-w-2xl text-sm font-medium text-black/55">
                Register your company for campus placements. Fields marked with{" "}
                <span className="font-bold text-rose-600">*</span> are required.
              </p>
            </div>
          </div>
         
        </div>
      </div>

      {/* Steps */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {SECTION_STEPS.map((step, index) => {
          const Icon = step.icon;
          return (
            <div
              key={step.label}
              className="rounded-2xl border border-white bg-white p-4"
              style={{
                boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset, 0 8px 24px -10px rgba(0,0,0,0.12), 0 3px 0 #e5e7eb",
              }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-black text-white shadow-[0_3px_0_rgba(0,0,0,0.25)]">
                  {index + 1}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-blue-600" />
                    <p className="text-sm font-bold text-black">{step.label}</p>
                  </div>
                  <p className="text-xs font-medium text-black/50">{step.desc}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Form panel */}
      <div
        className="cr-form-panel rounded-3xl border border-white bg-white p-6 md:p-8"
        style={{
          boxShadow:
            "0 1px 0 rgba(255,255,255,0.9) inset, 0 18px 44px -18px rgba(0,0,0,0.14), 0 4px 0 #e5e7eb",
        }}
      >
        <DynamicFormBuilder
          fields={dynamicFields}
          schema={Schema}
          onSubmit={handleFormSubmit}
          columnLayout={2}
          submitbuttonName="Register Company"
          resetbuttonName="Clear Form"
          initialValues={{ country: "India" }}
          submitButtonClassName="!rounded-xl !bg-blue-600 !px-6 !py-3 !text-sm !font-bold !text-white !shadow-[0_4px_0_#1d4ed8] hover:!bg-blue-500 hover:!-translate-y-0.5 active:!translate-y-0.5 active:!shadow-[0_1px_0_#1d4ed8]"
        />
      </div>
    </div>
  );
};

export default CompanyRegistrationPage;
