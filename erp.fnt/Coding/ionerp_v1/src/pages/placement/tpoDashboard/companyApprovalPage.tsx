import React, { useEffect, useState, useMemo, useCallback } from "react";
import DataTable from "../../../components/Table/DataTable";
import { PlacementApiEndpoint } from "../../../utils/ApiEndpoint/placementApiEndpoint";
import axiosInstance from "../../../utils/api";
import { toast } from "react-toastify";
import { RegistrationRecord } from "./tpoDashboardSchema";
import RegistrationDetailModal from "./registrationDetailModal";
import RejectReasonModal from "./rejectReasonModal";
import { Check, X, Eye } from "lucide-react";

const STAT_CARD_CONFIG = {
  total: {
    bg: "#eff6ff",
    border: "#bfdbfe",
    accent: "#2563eb",
    text: "#1e40af",
  },
  pending: {
    bg: "#fffbeb",
    border: "#fde68a",
    accent: "#d97706",
    text: "#92400e",
  },
  approved: {
    bg: "#ecfdf5",
    border: "#a7f3d0",
    accent: "#059669",
    text: "#065f46",
  },
  rejected: {
    bg: "#fff1f2",
    border: "#fecdd3",
    accent: "#dc2626",
    text: "#9f1239",
  },
} as const;

function useAnimatedCounter(target: number, duration = 1600) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (target === 0) {
      setValue(0);
      return;
    }

    const startTime = performance.now();
    let frameId = 0;

    const tick = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setValue(Math.floor(eased * target));

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      } else {
        setValue(target);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [target, duration]);

  return value;
}

// ── Status helpers — handles BOTH string ENUM and int from backend ───────────
const getStatusKey = (status: any): "PENDING" | "APPROVED" | "REJECTED" => {
  if (typeof status === "string") return status.toUpperCase() as any;
  if (status === 0) return "PENDING";
  if (status === 1) return "APPROVED";
  return "REJECTED";
};

const STATUS_CONFIG: Record<
  string,
  { label: string; dot: string; badge: string }
> = {
  PENDING: {
    label: "Pending",
    dot: "bg-amber-500",
    badge: "bg-amber-50 text-black border border-amber-200",
  },
  APPROVED: {
    label: "Approved",
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-black border border-emerald-200",
  },
  REJECTED: {
    label: "Rejected",
    dot: "bg-rose-500",
    badge: "bg-rose-50 text-black border border-rose-200",
  },
};

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (
    parts
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "C"
  );
};

// ── Flat Summary Card ─────────────────────────────────────────────────────────
const AnimatedSummaryCard: React.FC<{
  label: string;
  count: number;
  subtitle: string;
  theme: keyof typeof STAT_CARD_CONFIG;
  isActive?: boolean;
  onClick?: () => void;
}> = ({ label, count, subtitle, theme, isActive, onClick }) => {
  const animatedCount = useAnimatedCounter(count);
  const config = STAT_CARD_CONFIG[theme];

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl px-5 py-4 text-left transition-colors duration-150"
      style={{
        fontFamily: "'Roboto', sans-serif",
        backgroundColor: config.bg,
        border: `1.5px solid ${isActive ? config.accent : config.border}`,
      }}
    >
      <div className="mb-3 min-w-0">
        <h3
          className="truncate text-sm font-semibold uppercase tracking-wide"
          style={{ color: config.text }}
        >
          {label}
        </h3>
        <p className="mt-0.5 truncate text-xs font-medium text-gray-500">
          {subtitle}
        </p>
      </div>

      <div className="flex items-end justify-between gap-2">
        <span className="text-4xl font-black leading-none tracking-tight text-gray-800">
          {animatedCount.toLocaleString()}
        </span>
        <span
          className="mb-0.5 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
          style={{ backgroundColor: config.accent }}
        >
          {label}
        </span>
      </div>
    </button>
  );
};

// ── Company Approval Page ─────────────────────────────────────────────────────
const CompanyApprovalPage: React.FC = () => {
  const [data, setData] = useState<RegistrationRecord[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "ALL" | "PENDING" | "APPROVED" | "REJECTED"
  >("ALL");

  // Modals
  const [viewRecord, setViewRecord] = useState<RegistrationRecord | null>(null);
  const [rejectRecord, setRejectRecord] = useState<RegistrationRecord | null>(
    null,
  );

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(
        PlacementApiEndpoint.companyRegistration.list,
      );
      const body = res.data as any;
      setData(Array.isArray(body?.data) ? body.data : []);
    } catch {
      toast.error("Failed to load registrations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const tabThemeMap: Record<string, keyof typeof STAT_CARD_CONFIG> = {
    ALL: "total",
    PENDING: "pending",
    APPROVED: "approved",
    REJECTED: "rejected",
  };

  // ── Summary counts ──────────────────────────────────────────────────────────
  const counts = useMemo(
    () => ({
      total: data.length,
      pending: data.filter((r) => getStatusKey(r.status) === "PENDING").length,
      approved: data.filter((r) => getStatusKey(r.status) === "APPROVED")
        .length,
      rejected: data.filter((r) => getStatusKey(r.status) === "REJECTED")
        .length,
    }),
    [data],
  );

  // ── Filtered rows ───────────────────────────────────────────────────────────
  const filteredData = useMemo(
    () =>
      activeTab === "ALL"
        ? data
        : data.filter((r) => getStatusKey(r.status) === activeTab),
    [data, activeTab],
  );

  // ── Approve ────────────────────────────────────────────────────────────────
  const handleApprove = useCallback(
    async (record: RegistrationRecord) => {
      if (!window.confirm(`Approve registration for "${record.company_name}"?`))
        return;
      try {
        const res = await axiosInstance.put(
          PlacementApiEndpoint.companyRegistration.approve,
          {
            reg_id: record.reg_id,
            remarks: "Approved by TPO",
          },
        );
        const body = res.data as any;
        if (body?.status) {
          toast.success(body.message || "Company approved successfully.");
          fetchData();
        } else {
          toast.error(body?.message || "Failed to approve.");
        }
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Approval failed.");
      }
    },
    [fetchData],
  );

  // ── Reject submit ───────────────────────────────────────────────────────────
  const handleRejectConfirm = useCallback(
    async (reason: string) => {
      if (!rejectRecord) return;
      try {
        const res = await axiosInstance.put(
          PlacementApiEndpoint.companyRegistration.reject,
          {
            reg_id: rejectRecord.reg_id,
            remarks: reason,
          },
        );
        const body = res.data as any;
        if (body?.status) {
          toast.success(body.message || "Company rejected.");
          setRejectRecord(null);
          fetchData();
        } else {
          toast.error(body?.message || "Failed to reject.");
        }
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Rejection failed.");
      }
    },
    [rejectRecord, fetchData],
  );

  // ── ag-grid column defs ─────────────────────────────────────────────────────
  const columnDefs = useMemo(
    () => [
      {
        headerName: "#",
        field: "reg_id",
        width: 48,
        flex: 0,
        sortable: true,
        filter: true,
        cellClass: "ca-grid-cell",
        cellRenderer: (params: any) => (
          <span className="inline-flex h-5 min-w-[22px] items-center justify-center rounded-md bg-gray-100 px-1.5 text-[11px] font-bold text-black">
            {params.value}
          </span>
        ),
      },
      {
        headerName: "Company Name",
        field: "company_name",
        flex: 1.2,
        minWidth: 100,
        maxWidth: 150,
        sortable: true,
        filter: true,
        cellClass: "ca-grid-cell ca-grid-cell-company",
        cellRenderer: (params: any) => {
          const name = params.value || "—";
          return (
            <div className="flex h-full w-full min-w-0 items-center gap-1.5">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-slate-800 to-slate-600 text-[10px] font-bold text-white">
                {getInitials(name)}
              </div>
              <span className="truncate text-[12px] font-semibold text-black">
                {name}
              </span>
            </div>
          );
        },
      },
      {
        headerName: "Industry",
        field: "industry",
        flex: 1.1,
        minWidth: 85,
        sortable: true,
        filter: true,
        cellClass: "ca-grid-cell",
        cellRenderer: (params: any) => (
          <span className="inline-flex max-w-full truncate rounded-md border border-gray-200 bg-white px-1.5 py-0.5 text-[11px] font-medium text-black">
            {params.value || "—"}
          </span>
        ),
      },
      {
        headerName: "City",
        field: "city",
        width: 72,
        flex: 0,
        sortable: true,
        filter: true,
        cellClass: "ca-grid-cell",
        cellRenderer: (params: any) => (
          <span className="truncate text-[12px] font-medium text-black">
            {params.value || "—"}
          </span>
        ),
      },
      {
        headerName: "Contact Email",
        field: "contact_email",
        flex: 2.2,
        minWidth: 110,
        sortable: true,
        filter: true,
        cellClass: "ca-grid-cell",
        cellRenderer: (params: any) => (
          <span className="truncate text-[12px] text-black/75">
            {params.value || "—"}
          </span>
        ),
      },
      {
        headerName: "Status",
        field: "status",
        width: 92,
        flex: 0,
        sortable: true,
        filter: false,
        cellClass: "ca-grid-cell",
        cellRenderer: (params: any) => {
          const key = getStatusKey(params.data?.status);
          const cfg = STATUS_CONFIG[key] ?? {
            label: key,
            dot: "bg-gray-400",
            badge: "bg-gray-50 text-black border border-gray-200",
          };
          return (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${cfg.badge}`}
            >
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${cfg.dot}`}
              />
              {cfg.label}
            </span>
          );
        },
      },
      {
        headerName: "Submitted On",
        field: "create_date",
        width: 96,
        flex: 0,
        sortable: true,
        filter: false,
        cellClass: "ca-grid-cell",
        valueFormatter: (params: any) =>
          params.value
            ? new Date(params.value).toLocaleDateString("en-IN")
            : "—",
        cellRenderer: (params: any) => (
          <span className="whitespace-nowrap text-[12px] font-medium text-black/70">
            {params.value
              ? new Date(params.value).toLocaleDateString("en-IN")
              : "—"}
          </span>
        ),
      },
      {
        headerName: "Actions",
        field: "action",
        width: 104,
        flex: 0,
        sortable: false,
        filter: false,
        cellClass: "ca-grid-cell ca-grid-cell-actions",
        cellRenderer: (params: any) => {
          const row: RegistrationRecord = params.data;
          if (!row) return null;
          const isPending = getStatusKey(row.status) === "PENDING";
          return (
            <div className="flex h-full items-center gap-1">
              <button
                onClick={() => setViewRecord(row)}
                className="ca-action-btn flex h-7 w-7 items-center justify-center rounded-md border border-blue-200 bg-blue-50 text-blue-600 transition-colors hover:bg-blue-100"
                title="View details"
              >
                <Eye className="h-3.5 w-3.5" />
              </button>
              {isPending && (
                <>
                  <button
                    onClick={() => handleApprove(row)}
                    className="ca-action-btn flex h-7 w-7 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-100"
                    title="Approve"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setRejectRecord(row)}
                    className="ca-action-btn flex h-7 w-7 items-center justify-center rounded-md border border-rose-200 bg-rose-50 text-rose-700 transition-colors hover:bg-rose-100"
                    title="Reject"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          );
        },
      },
    ],
    [handleApprove],
  );

  // ── Tabs ────────────────────────────────────────────────────────────────────
  const TABS: {
    label: string;
    key: "ALL" | "PENDING" | "APPROVED" | "REJECTED";
    count: number;
  }[] = [
    { label: "All", key: "ALL", count: counts.total },
    { label: "Pending", key: "PENDING", count: counts.pending },
    { label: "Approved", key: "APPROVED", count: counts.approved },
    { label: "Rejected", key: "REJECTED", count: counts.rejected },
  ];

  return (
    <div
      className="ca-approval-page p-6"
      style={{ fontFamily: "'Roboto', sans-serif" }}
    >
      <style>{`
        .ca-approval-page,
        .ca-approval-page * {
          font-family: 'Roboto', sans-serif;
        }
        .ca-approval-page .ca-action-btn {
          padding: 0 !important;
          width: 28px !important;
          height: 28px !important;
          min-width: 28px !important;
          min-height: 28px !important;
        }
        .ca-list-panel {
          border-radius: 12px;
          overflow: hidden;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }
        .ca-list-panel > div > div {
          margin-bottom: 0 !important;
        }
        .ca-list-panel .ag-theme-alpine {
          --ag-background-color: transparent;
          --ag-header-background-color: #f8fafc;
          --ag-header-foreground-color: #111827;
          --ag-odd-row-background-color: #ffffff;
          --ag-row-hover-color: #f8fafc;
          --ag-border-color: #e5e7eb;
          --ag-font-family: 'Roboto', sans-serif;
          --ag-font-size: 12px;
          --ag-row-border-color: #f1f5f9;
          --ag-cell-horizontal-padding: 5px;
          --ag-header-height: 30px;
          --ag-floating-filter-height: 28px;
          --ag-list-item-height: 28px;
        }
        .ca-list-panel .ag-header-cell-custom {
          font-weight: 700 !important;
          color: #111827 !important;
          font-size: 11px !important;
        }
        .ca-list-panel .ag-header-cell,
        .ca-list-panel .ag-header-group-cell {
          padding-left: 5px !important;
          padding-right: 5px !important;
        }
        .ca-list-panel .ag-cell.ca-grid-cell-company {
          padding-right: 2px !important;
        }
        .ca-list-panel .ag-cell[col-id="industry"] {
          padding-left: 2px !important;
        }
        .ca-list-panel .ag-row {
          border-bottom: 1px solid #f1f5f9 !important;
        }
        .ca-list-panel .ag-row-hover {
          background: linear-gradient(90deg, #f8fafc 0%, #ffffff 100%) !important;
        }
        .ca-list-panel .ag-cell {
          display: flex;
          align-items: center;
          line-height: 1.2;
        }
        .ca-list-panel .ag-floating-filter {
          padding: 2px 4px !important;
        }
        .ca-list-panel .ag-floating-filter-input,
        .ca-list-panel .ag-floating-filter-input input {
          min-height: 22px !important;
          height: 22px !important;
          font-size: 11px !important;
          border-radius: 6px !important;
        }
        .ca-list-panel .ag-body-horizontal-scroll {
          display: none !important;
        }
        .ca-list-panel .ag-center-cols-viewport {
          overflow-x: hidden !important;
        }
        .ca-grid-row-even {
          background: #fcfcfd !important;
        }
      `}</style>

      {/* Page header */}
      <div className="mb-6">
        <h2 className="text-2xl font-black tracking-tight text-black">
          Company Approval
        </h2>
        <p className="mt-1 text-sm font-medium text-black/55">
          Review and approve/reject recruiter self-registrations
        </p>
      </div>

      {/* Summary cards — full-width 3D row */}
      <div className="mb-6 grid w-full grid-cols-4 gap-4">
        <AnimatedSummaryCard
          label="Total"
          count={counts.total}
          subtitle="All registrations"
          theme="total"
          isActive={activeTab === "ALL"}
          onClick={() => setActiveTab("ALL")}
        />
        <AnimatedSummaryCard
          label="Pending"
          count={counts.pending}
          subtitle="Awaiting review"
          theme="pending"
          isActive={activeTab === "PENDING"}
          onClick={() => setActiveTab("PENDING")}
        />
        <AnimatedSummaryCard
          label="Approved"
          count={counts.approved}
          subtitle="Verified companies"
          theme="approved"
          isActive={activeTab === "APPROVED"}
          onClick={() => setActiveTab("APPROVED")}
        />
        <AnimatedSummaryCard
          label="Rejected"
          count={counts.rejected}
          subtitle="Declined requests"
          theme="rejected"
          isActive={activeTab === "REJECTED"}
          onClick={() => setActiveTab("REJECTED")}
        />
      </div>

      {/* Filter tabs */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1 gap-0.5">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const accent = STAT_CARD_CONFIG[tabThemeMap[tab.key]].accent;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  isActive ? "text-white" : "text-gray-600 hover:bg-gray-100"
                }`}
                style={isActive ? { backgroundColor: accent } : undefined}
              >
                {tab.label}
                <span
                  className={`rounded px-1.5 py-0.5 text-xs font-bold ${
                    isActive
                      ? "bg-white/25 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-sm font-medium text-black/50">
          Showing{" "}
          <span className="font-bold text-black">{filteredData.length}</span>{" "}
          records
        </p>
      </div>

      {/* DataTable */}
      <div className="ca-list-panel">
        <DataTable
          columnDefs={columnDefs}
          rowData={filteredData}
          showAddButton={false}
          headerFilter={true}
          pageSize={20}
          loading={isLoading}
          rowHeight={36}
          getRowClass={(params) =>
            (params.node.rowIndex ?? 0) % 2 === 0 ? "ca-grid-row-even" : ""
          }
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

export default CompanyApprovalPage;
