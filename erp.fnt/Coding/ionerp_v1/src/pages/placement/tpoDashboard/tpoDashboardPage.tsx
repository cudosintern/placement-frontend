import React, { useEffect, useState, useMemo, useCallback } from "react";
import DataTable from "../../../components/Table/DataTable";
import { PlacementApiEndpoint } from "../../../utils/ApiEndpoint/placementApiEndpoint";
import axiosInstance from "../../../utils/api";
import { toast } from "react-toastify";
import { RegistrationRecord, TpoDashboardColumnDefs } from "./tpoDashboardSchema";
import RegistrationDetailModal from "./registrationDetailModal";
import RejectReasonModal from "./rejectReasonModal";

// ── Status config ──────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<number, { label: string; className: string }> = {
  0: { label: "Pending",  className: "bg-yellow-100 text-yellow-800 border border-yellow-300" },
  1: { label: "Approved", className: "bg-green-100  text-green-800  border border-green-300" },
  2: { label: "Rejected", className: "bg-red-100    text-red-800    border border-red-300" },
};

// ── Summary Card ───────────────────────────────────────────────────────────
const SummaryCard: React.FC<{
  label: string;
  count: number;
  colorClass: string;
}> = ({ label, count, colorClass }) => (
  <div className={`rounded-lg border p-4 flex flex-col items-center justify-center ${colorClass} min-w-[100px]`}>
    <span className="text-2xl font-bold">{count}</span>
    <span className="text-xs font-medium mt-1">{label}</span>
  </div>
);

// ── Main Page ──────────────────────────────────────────────────────────────
const TpoDashboardPage: React.FC = () => {
  const [data, setData]         = useState<RegistrationRecord[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [activeTab, setTab]     = useState<number>(0); // 0=All 1=Pending 2=Approved 3=Rejected

  // Modal state
  const [viewRecord,    setViewRecord]    = useState<RegistrationRecord | null>(null);
  const [rejectRecord,  setRejectRecord]  = useState<RegistrationRecord | null>(null);

  // ── Fetch all registrations ──────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(PlacementApiEndpoint.companyRegistration.list);
      const body = res.data as any;
      setData(Array.isArray(body?.data) ? body.data : []);
    } catch {
      toast.error("Failed to load registrations.");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Filter by tab ────────────────────────────────────────────────────────
  const filteredData = useMemo(() => {
    if (activeTab === 1) return data.filter((r) => r.status === 0);
    if (activeTab === 2) return data.filter((r) => r.status === 1);
    if (activeTab === 3) return data.filter((r) => r.status === 2);
    return data;
  }, [data, activeTab]);

  // ── Summary counts ───────────────────────────────────────────────────────
  const total    = data.length;
  const pending  = data.filter((r) => r.status === 0).length;
  const approved = data.filter((r) => r.status === 1).length;
  const rejected = data.filter((r) => r.status === 2).length;

  // ── Approve ──────────────────────────────────────────────────────────────
  const handleApprove = useCallback(async (record: RegistrationRecord) => {
    try {
      const res  = await axiosInstance.put(PlacementApiEndpoint.companyRegistration.approve, {
        reg_id: record.reg_id,
        remarks: "Approved by TPO",
      });
      const body = res.data as any;
      if (body?.status) {
        toast.success(body.message || "Company approved successfully.");
        fetchData();
      } else {
        toast.error(body?.message || "Failed to approve.");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Error approving company.");
    }
  }, [fetchData]);

  // ── Reject ───────────────────────────────────────────────────────────────
  const handleRejectConfirm = useCallback(async (reason: string) => {
    if (!rejectRecord) return;
    try {
      const res  = await axiosInstance.put(PlacementApiEndpoint.companyRegistration.reject, {
        reg_id:  rejectRecord.reg_id,
        remarks: reason,
      });
      const body = res.data as any;
      if (body?.status) {
        toast.success(body.message || "Company rejected.");
        setRejectRecord(null);
        fetchData();
      } else {
        toast.error(body?.message || "Failed to reject.");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Error rejecting company.");
    }
  }, [rejectRecord, fetchData]);

  // ── ag-grid column defs (with action column appended) ────────────────────
  const columnDefs = useMemo(() => [
    ...TpoDashboardColumnDefs,
    // Status badge column
    {
      headerName: "Status",
      field: "status",
      width: 120,
      flex: 0,
      sortable: true,
      filter: false,
      cellRenderer: (params: any) => {
        const cfg = STATUS_CONFIG[params.data?.status] ?? { label: "Unknown", className: "bg-gray-100 text-gray-700" };
        return (
          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${cfg.className}`}>
            {cfg.label}
          </span>
        );
      },
    },
    // Action buttons column
    {
      headerName: "Action",
      field: "action",
      width: 230,
      flex: 0,
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        const row: RegistrationRecord = params.data;
        if (!row) return null;
        const isPending = row.status === 0;
        return (
          <div className="flex items-center space-x-1 h-full">
            <button
              className="text-xs text-blue-600 underline px-2 py-1 rounded hover:bg-blue-50"
              onClick={() => setViewRecord(row)}
            >
              View
            </button>
            {isPending && (
              <>
                <button
                  className="text-xs text-green-700 px-2 py-1 rounded border border-green-300 hover:bg-green-50"
                  onClick={() => handleApprove(row)}
                >
                  Approve
                </button>
                <button
                  className="text-xs text-red-700 px-2 py-1 rounded border border-red-300 hover:bg-red-50"
                  onClick={() => setRejectRecord(row)}
                >
                  Reject
                </button>
              </>
            )}
          </div>
        );
      },
    },
  ], [handleApprove]);

  // ── Tabs config ──────────────────────────────────────────────────────────
  const tabs = [
    { label: "All",      value: 0 },
    { label: "Pending",  value: 1 },
    { label: "Approved", value: 2 },
    { label: "Rejected", value: 3 },
  ];

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="p-6">
      {/* Page title */}
      <h2 className="text-xl font-bold text-gray-800 mb-5">TPO Dashboard</h2>

      {/* Summary cards */}
      <div className="flex flex-wrap gap-4 mb-6">
        <SummaryCard label="Total"    count={total}    colorClass="bg-blue-50 border-blue-200 text-blue-900" />
        <SummaryCard label="Pending"  count={pending}  colorClass="bg-yellow-50 border-yellow-200 text-yellow-900" />
        <SummaryCard label="Approved" count={approved} colorClass="bg-green-50 border-green-200 text-green-900" />
        <SummaryCard label="Rejected" count={rejected} colorClass="bg-red-50 border-red-200 text-red-900" />
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-gray-200 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setTab(tab.value)}
            className={`pb-2 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.value
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* DataTable — same pattern as CompanyList */}
      <DataTable
        columnDefs={columnDefs}
        rowData={filteredData}
        showAddButton={false}
        showExportButton={false}
        headerFilter={true}
        pageSize={20}
        loading={isLoading}
      />

      {/* View Detail Modal */}
      <RegistrationDetailModal
        isOpen={!!viewRecord}
        onClose={() => setViewRecord(null)}
        record={viewRecord}
      />

      {/* Reject Reason Modal */}
      <RejectReasonModal
        isOpen={!!rejectRecord}
        onClose={() => setRejectRecord(null)}
        onSubmit={handleRejectConfirm}
        companyName={rejectRecord?.company_name ?? ""}
      />
    </div>
  );
};

export default TpoDashboardPage;
