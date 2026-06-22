import React, { useState } from "react";
import ModalContainer from "../../../../components/Modal/ModalContainer";

interface RejectReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  companyName: string;
}

const RejectReasonModal: React.FC<RejectReasonModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  companyName,
}) => {
  const [reason, setReason] = useState("");

  const handleSubmit = () => {
    if (reason.trim() === "") {
      return; // Do nothing if empty
    }
    onSubmit(reason.trim());
    setReason("");
  };

  return (
    <ModalContainer isOpen={isOpen} onClose={onClose} title="Reject Registration" size="md">
      <div className="p-4 space-y-4">
        <p className="text-sm text-gray-600">
          Provide a reason for rejecting <strong>{companyName}</strong>. This is required.
        </p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rejection Reason <span className="text-red-500">*</span>
          </label>
          <textarea
            className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            autoFocus
          ></textarea>
          {reason.trim() === "" && (
            <p className="text-xs text-red-500 mt-1">Reason is required</p>
          )}
        </div>

        <div className="flex justify-end space-x-2 mt-4">
          <button
            className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className={`px-4 py-2 rounded-md text-white ${
              reason.trim() === "" ? "bg-red-300 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"
            }`}
            onClick={handleSubmit}
            disabled={reason.trim() === ""}
          >
            Confirm Reject
          </button>
        </div>
      </div>
    </ModalContainer>
  );
};

export default RejectReasonModal;
