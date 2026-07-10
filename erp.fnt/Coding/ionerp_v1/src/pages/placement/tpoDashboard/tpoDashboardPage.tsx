import React, { useEffect, useState, useMemo, useCallback } from "react";
import DataTable from "../../../components/Table/DataTable";
import { PlacementApiEndpoint } from "../../../utils/ApiEndpoint/placementApiEndpoint";
import axiosInstance from "../../../utils/api";
import { toast } from "react-toastify";
import { RegistrationRecord, TpoDashboardColumnDefs } from "./tpoDashboardSchema";
import RegistrationDetailModal from "./registrationDetailModal";
import RejectReasonModal from "./rejectReasonModal";
import {
  Building,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Check,
  X,
} from "lucide-react";

// ── Summary Card Component ──────────────────────────────────────────────────
const SummaryCard: React.FC<{
  label: string;
  count: number;
  icon: React.ReactNode;
  gradientClass: string;
  iconBgClass: string;
  shadowClass: string;
}> = ({ label, count, icon, gradientClass, iconBgClass, shadowClass }) => (
  <div className={`flex-1 min-w-[220px] bg-gradient-to-br ${gradientClass} text-white p-6 rounded-2xl ${shadowClass} hover:-translate-y-1.5 hover:shadow-lg transition-all duration-300 flex items-center justify-between border border-white/10 relative overflow-hidden group`}>
    <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/5 rounded-full group-hover:scale-150 transition-all duration-500" />
    <div className="space-y-1 z-10">
      <p className="text-xs font-bold uppercase tracking-wider opacity-75">{label}</p>
      <h3 className="text-3xl font-extrabold tracking-tight">{count}</h3>
    </div>
    <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${iconBgClass} backdrop-blur-md z-10 shadow-inner`}>
      {icon}
    </div>
  </div>
);

// ── Main Page Component ─────────────────────────────────────────────────────
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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      const res = await axiosInstance.put(PlacementApiEndpoint.companyRegistration.approve, {
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
      const res = await axiosInstance.put(PlacementApiEndpoint.companyRegistration.reject, {
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
      width: 130,
      flex: 0,
      sortable: true,
      filter: false,
      cellRenderer: (params: any) => {
        const statusVal = params.data?.status;
        const isActive = statusVal === 1;
        const isPending = statusVal === 0;
        const isRejected = statusVal === 2;

        let colorClasses = "bg-gray-50 text-gray-700 border-gray-200 dark:bg-slate-800 dark:text-gray-300 dark:border-slate-700";
        if (isPending) colorClasses = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50";
        if (isActive) colorClasses = "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/50";
        if (isRejected) colorClasses = "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/50";

        let indicatorClass = "bg-gray-500";
        if (isPending) indicatorClass = "bg-amber-500";
        if (isActive) indicatorClass = "bg-green-500";
        if (isRejected) indicatorClass = "bg-red-500";

        let statusLabel = "Unknown";
        if (isPending) statusLabel = "Pending";
        if (isActive) statusLabel = "Approved";
        if (isRejected) statusLabel = "Rejected";

        return (
          <div className="flex items-center h-full">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${colorClasses}`}>
              <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${indicatorClass}`} />
              {statusLabel}
            </span>
          </div>
        );
      },
    },
    // Action buttons column
    {
      headerName: "Action",
      field: "action",
      width: 250,
      flex: 0,
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        const row: RegistrationRecord = params.data;
        if (!row) return null;
        const isPending = row.status === 0;
        return (
          <div className="flex items-center space-x-2 h-full">
            <button
              className="flex items-center space-x-1 border border-indigo-200 hover:bg-indigo-50 dark:hover:bg-slate-800 text-indigo-600 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95"
              onClick={() => setViewRecord(row)}
              title="View Details"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>View</span>
            </button>
            {isPending && (
              <>
                <button
                  className="flex items-center space-x-1 border border-green-200 hover:bg-green-50 dark:hover:bg-slate-800 text-green-700 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95"
                  onClick={() => handleApprove(row)}
                  title="Approve"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Approve</span>
                </button>
                <button
                  className="flex items-center space-x-1 border border-red-200 hover:bg-red-50 dark:hover:bg-slate-800 text-red-600 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95"
                  onClick={() => setRejectRecord(row)}
                  title="Reject"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Reject</span>
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
    { label: "All Registrations", value: 0 },
    { label: "Pending",           value: 1 },
    { label: "Approved",          value: 2 },
    { label: "Rejected",          value: 3 },
  ];

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">
      
      {/* Page title */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">TPO Approval Dashboard</h2>
        <p className="text-xs text-gray-400 mt-1">Review and approve self-registered companies requesting access to the placement module.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard
          label="Total Registrations"
          count={total}
          icon={<Building className="h-5 w-5 text-white" />}
          gradientClass="from-indigo-600 to-indigo-500"
          iconBgClass="bg-white/20"
          shadowClass="shadow-[0_10px_25px_-5px_rgba(79,70,229,0.3)]"
        />
        <SummaryCard
          label="Pending Approvals"
          count={pending}
          icon={<Clock className="h-5 w-5 text-white" />}
          gradientClass="from-amber-500 to-orange-400"
          iconBgClass="bg-white/20"
          shadowClass="shadow-[0_10px_25px_-5px_rgba(245,158,11,0.3)]"
        />
        <SummaryCard
          label="Approved Companies"
          count={approved}
          icon={<CheckCircle className="h-5 w-5 text-white" />}
          gradientClass="from-emerald-600 to-teal-500"
          iconBgClass="bg-white/20"
          shadowClass="shadow-[0_10px_25px_-5px_rgba(16,185,129,0.3)]"
        />
        <SummaryCard
          label="Rejected Records"
          count={rejected}
          icon={<XCircle className="h-5 w-5 text-white" />}
          gradientClass="from-rose-600 to-red-500"
          iconBgClass="bg-white/20"
          shadowClass="shadow-[0_10px_25px_-5px_rgba(239,68,68,0.3)]"
        />
      </div>

      {/* Tabs list */}
      <div className="flex space-x-2 bg-gray-100/80 dark:bg-slate-900 p-1.5 rounded-xl max-w-xl border border-gray-150/40">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setTab(tab.value)}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all duration-200 ${
              activeTab === tab.value
                ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-sm border border-gray-100 dark:border-slate-700"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* DataTable */}
      <div className="bg-white dark:bg-slate-950 rounded-2xl border border-gray-100 dark:border-slate-800 overflow-hidden shadow-sm">
        <DataTable
          columnDefs={columnDefs}
          rowData={filteredData}
          showAddButton={false}
          showExportButton={false}
          headerFilter={true}
          pageSize={20}
          loading={isLoading}
        />
      </div>

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
