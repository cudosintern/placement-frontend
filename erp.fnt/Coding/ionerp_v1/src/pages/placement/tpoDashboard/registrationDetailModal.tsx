import React from "react";
import ModalContainer from "../../../components/Modal/ModalContainer";
import { RegistrationRecord } from "./tpoDashboardSchema";
import { Building2, CalendarDays, CheckCircle2, Clock, MapPin, UserRound, XCircle } from "lucide-react";

interface RegistrationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: RegistrationRecord | null;
}

const statusConfig: Record<number, { label: string; dot: string; badge: string; icon: React.ReactNode }> = {
  0: {
    label: "Pending",
    dot: "bg-amber-500",
    badge: "bg-amber-50 text-black border border-amber-200",
    icon: <Clock className="h-4 w-4" />,
  },
  1: {
    label: "Approved",
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-black border border-emerald-200",
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  2: {
    label: "Rejected",
    dot: "bg-rose-500",
    badge: "bg-rose-50 text-black border border-rose-200",
    icon: <XCircle className="h-4 w-4" />,
  },
};

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("") || "C";
};

const DetailField: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => (
  <div
    className="rounded-xl border border-gray-100 bg-white p-3"
    style={{ boxShadow: "0 2px 0 #f3f4f6" }}
  >
    <p className="text-[11px] font-bold uppercase tracking-wide text-black/45">{label}</p>
    <p className="mt-1 break-words text-sm font-semibold text-black">{value || "—"}</p>
  </div>
);

const SectionBlock: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, icon, children }) => (
  <div
    className="rounded-2xl border border-gray-100 bg-gradient-to-b from-white to-slate-50/80 p-4 md:p-5"
    style={{ boxShadow: "0 3px 0 #e5e7eb" }}
  >
    <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-[0_3px_0_rgba(0,0,0,0.2)]">
        {icon}
      </div>
      <h3 className="text-sm font-bold text-black">{title}</h3>
    </div>
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">{children}</div>
  </div>
);

const RegistrationDetailModal: React.FC<RegistrationDetailModalProps> = ({
  isOpen,
  onClose,
  record,
}) => {
  if (!record) return null;

  const status = statusConfig[record.status] ?? {
    label: "Unknown",
    dot: "bg-gray-400",
    badge: "bg-gray-50 text-black border border-gray-200",
    icon: <Clock className="h-4 w-4" />,
  };

  return (
    <ModalContainer isOpen={isOpen} onClose={onClose} title="Registration Details" size="5xl">
      <div className="rd-detail-modal" style={{ fontFamily: "'Roboto', sans-serif" }}>
        <style>{`
          .rd-detail-modal, .rd-detail-modal * {
            font-family: 'Roboto', sans-serif;
          }
        `}</style>

        {/* Hero header */}
        <div
          className="mb-5 rounded-2xl border border-white bg-white p-5"
          style={{
            boxShadow:
              "0 1px 0 rgba(255,255,255,0.9) inset, 0 12px 28px -12px rgba(0,0,0,0.12), 0 3px 0 #e5e7eb",
          }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-800 to-slate-600 text-lg font-black text-white shadow-[0_4px_0_rgba(0,0,0,0.25)]">
                {getInitials(record.company_name)}
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight text-black">{record.company_name}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-medium text-black/50">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Submitted on{" "}
                  {record.create_date
                    ? new Date(record.create_date).toLocaleString("en-IN")
                    : "—"}
                </div>
              </div>
            </div>

            <span className={`inline-flex items-center gap-2 self-start rounded-full px-3 py-1.5 text-xs font-bold sm:self-auto ${status.badge}`}>
              <span className={`h-2 w-2 rounded-full ${status.dot}`} />
              {status.icon}
              {status.label}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <SectionBlock title="Company Information" icon={<Building2 className="h-4 w-4" />}>
            <DetailField label="Company Type" value={record.company_type} />
            <DetailField label="Industry" value={record.industry} />
            <DetailField label="Website" value={record.website} />
            <DetailField label="Email" value={record.email} />
            <DetailField label="Phone" value={record.phone} />
            <div className="md:col-span-3">
              <DetailField label="Description" value={record.description} />
            </div>
          </SectionBlock>

          <SectionBlock title="Location & Address" icon={<MapPin className="h-4 w-4" />}>
            <div className="md:col-span-3">
              <DetailField label="Address" value={record.address} />
            </div>
            <DetailField label="City" value={record.city} />
            <DetailField label="State" value={record.state} />
            <DetailField label="Country" value={record.country} />
            <DetailField label="Pincode" value={record.pincode} />
          </SectionBlock>

          <SectionBlock title="Contact Person" icon={<UserRound className="h-4 w-4" />}>
            <DetailField label="Name" value={record.contact_person} />
            <DetailField label="Email" value={record.contact_email} />
            <DetailField label="Phone" value={record.contact_phone} />
          </SectionBlock>

          {record.status !== 0 && (
            <SectionBlock title="Review Details" icon={<CheckCircle2 className="h-4 w-4" />}>
              <DetailField
                label="Review Date"
                value={
                  record.review_date
                    ? new Date(record.review_date).toLocaleString("en-IN")
                    : undefined
                }
              />
              <div className="md:col-span-2">
                <DetailField label="Remarks / Reason" value={record.remarks} />
              </div>
            </SectionBlock>
          )}
        </div>

        <div className="mt-6 flex justify-end border-t border-gray-100 pt-4">
          <button
            className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-black shadow-[0_3px_0_#d1d5db] transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_0_#9ca3af] active:translate-y-0.5 active:shadow-[0_1px_0_#d1d5db]"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </ModalContainer>
  );
};

export default RegistrationDetailModal;
