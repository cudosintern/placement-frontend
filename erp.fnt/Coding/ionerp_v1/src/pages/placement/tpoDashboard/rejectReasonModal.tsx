import React, { useState } from "react";
import ModalContainer from "../../../components/Modal/ModalContainer";

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
    if (reason.trim() === "") return;
    onSubmit(reason.trim());
    setReason("");
  };

  const handleClose = () => {
    setReason("");
    onClose();
  };

  return (
    <ModalContainer isOpen={isOpen} onClose={handleClose} title="Reject Registration" size="md">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          You are rejecting the registration for{" "}
          <span className="font-semibold text-gray-800">{companyName}</span>.
          Please provide a reason — this is mandatory.
        </p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rejection Reason <span className="text-red-500">*</span>
          </label>
          <textarea
            className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-red-300 focus:border-red-400 outline-none"
            rows={4}
            placeholder="Enter reason for rejection..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            autoFocus
          />
          {reason.trim() === "" && (
            <p className="text-xs text-red-500 mt-1">Reason cannot be empty.</p>
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-2">
          <button
            className="px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            onClick={handleClose}
          >
            Cancel
          </button>
          <button
            className={`px-4 py-2 text-sm rounded-md text-white font-medium ${
              reason.trim() === ""
                ? "bg-red-300 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700"
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
