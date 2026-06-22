import React from "react";
import ModalContainer from "../../../../components/Modal/ModalContainer";
import { RegistrationRecord, STATUS_COLORS, STATUS_LABELS } from "./registrationInterface";

interface RegistrationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: RegistrationRecord | null;
}

const RegistrationDetailModal: React.FC<RegistrationDetailModalProps> = ({
  isOpen,
  onClose,
  record,
}) => {
  if (!record) return null;

  const renderField = (label: string, value: any) => (
    <div className="col-span-1">
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className="text-sm font-semibold break-words mt-1">{value || "—"}</p>
    </div>
  );

  const statusColorMap: Record<number, string> = {
    0: "bg-yellow-100 text-yellow-800 border-yellow-200",
    1: "bg-green-100 text-green-800 border-green-200",
    2: "bg-red-100 text-red-800 border-red-200",
  };

  return (
    <ModalContainer isOpen={isOpen} onClose={onClose} title="Registration Details" size="5xl">
      <div className="p-4 bg-white">
        {/* Header */}
        <div className="flex flex-col space-y-2 mb-4">
          <h2 className="text-xl font-bold text-gray-800">{record.company_name}</h2>
          <div className="flex items-center space-x-2">
            <span
              className={`px-2 py-1 text-xs font-semibold rounded-full border ${
                statusColorMap[record.status] || "bg-gray-100 text-gray-800 border-gray-200"
              }`}
            >
              {STATUS_LABELS[record.status] || "Unknown"}
            </span>
            <span className="text-xs text-gray-500">
              Submitted on {new Date(record.create_date).toLocaleString()}
            </span>
          </div>
        </div>

        <hr className="mb-4" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-3">
            <h3 className="text-sm font-bold text-blue-600 mb-2">Company Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {renderField("Company Type", record.company_type)}
              {renderField("Industry", record.industry)}
              {renderField("Website", record.website)}
              {renderField("Email", record.email)}
              {renderField("Phone", record.phone)}
              {renderField("Description", record.description)}
            </div>
          </div>

          {/* Location */}
          <div className="col-span-1 md:col-span-3">
            <h3 className="text-sm font-bold text-blue-600 mt-4 mb-2">Location & Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {renderField("Address", record.address)}
              {renderField("City", record.city)}
              {renderField("State", record.state)}
              {renderField("Country", record.country)}
              {renderField("Pincode", record.pincode)}
            </div>
          </div>

          {/* Contact Person */}
          <div className="col-span-1 md:col-span-3">
            <h3 className="text-sm font-bold text-blue-600 mt-4 mb-2">Contact Person Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {renderField("Contact Name", record.contact_person)}
              {renderField("Contact Email", record.contact_email)}
              {renderField("Contact Phone", record.contact_phone)}
            </div>
          </div>

          {/* Review Details (if processed) */}
          {record.status !== 0 && (
            <div className="col-span-1 md:col-span-3">
              <h3 className="text-sm font-bold text-blue-600 mt-4 mb-2">Approval / Rejection Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderField(
                  "Review Date",
                  record.review_date ? new Date(record.review_date).toLocaleString() : "—"
                )}
                <div className="col-span-1 md:col-span-2">
                  {renderField("Remarks", record.remarks)}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
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
