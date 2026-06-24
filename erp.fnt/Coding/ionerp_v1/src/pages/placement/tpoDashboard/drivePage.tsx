import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { toast } from "react-toastify";
import axiosInstance from "../../../utils/api";
import { ApiEndpoint } from "../../../utils/ApiEndpoint/placementapiEndpoint";
import DataTable from "../../../components/Table/DataTable";
import {
  DriveRecord,
  DriveSummary,
  DRIVE_STATUS_CONFIG,
  TIER_CONFIG,
} from "./driveSchema";
import DriveDetailModal from "./driveDetailModal";

// ── Status tab config ──────────────────────────────────────────────────────
const TAB_CONFIG: Record<
  number,
  { label: string; accent: string; count: (s: DriveSummary) => number }
> = {
  0: { label: "All", accent: "#2563eb", count: (s) => s.total },
  1: { label: "Draft", accent: "#64748b", count: (s) => s.draft },
  2: { label: "Scheduled", accent: "#3b82f6", count: (s) => s.scheduled },
  3: { label: "Active", accent: "#059669", count: (s) => s.active },
  4: { label: "Closed", accent: "#e11d48", count: (s) => s.closed },
  5: { label: "Cancelled", accent: "#f97316", count: (s) => s.cancelled },
};

// ── Drive List Page ───────────────────────────────────────────────────────
const DrivePage: React.FC = () => {
  const navigate = useNavigate();

  const [drives, setDrives] = useState<DriveRecord[]>([]);
  const [summary, setSummary] = useState<DriveSummary>({
    total: 0,
    active: 0,
    scheduled: 0,
    draft: 0,
    closed: 0,
    cancelled: 0,
  });
  const [loading, setLoading] = useState(false);

  // 0=All 1=Draft 2=Scheduled 3=Active 4=Closed 5=Cancelled
  const [activeTab, setActiveTab] = useState(0);

  // Detail modal
  const [viewDrive, setViewDrive] = useState<DriveRecord | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // ── Fetch all drives ──────────────────────────────────────────────────────
  const fetchDrives = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(ApiEndpoint.drive.list);
      const body = res.data as any;
      if (body?.status) {
        setDrives(Array.isArray(body.data?.drives) ? body.data.drives : []);
        if (body.data?.summary) setSummary(body.data.summary);
      }
    } catch {
      toast.error("Failed to load placement drives.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrives();
  }, [fetchDrives]);

  // ── Client-side filter ────────────────────────────────────────────────────
  const filteredDrives = useMemo(() => {
    const STATUS_MAP: Record<number, number> = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 };
    if (activeTab === 0) return drives;
    return drives.filter((d) => d.status === STATUS_MAP[activeTab]);
  }, [drives, activeTab]);

  // ── View detail ───────────────────────────────────────────────────────────
  const handleView = useCallback(async (row: DriveRecord) => {
    try {
      const res = await axiosInstance.get(
        `${ApiEndpoint.drive.detail}/${row.drive_id}`,
      );
      const body = res.data as any;
      if (body?.status) {
        setViewDrive(body.data);
        setDetailOpen(true);
      } else toast.error("Could not load drive details.");
    } catch {
      toast.error("Could not load drive details.");
    }
  }, []);

  // ── Navigate to edit ──────────────────────────────────────────────────────
  const handleEditFromDetail = (drive: DriveRecord) => {
    setDetailOpen(false);
    setViewDrive(null);
    navigate("/tpo/placement-drive/edit", { state: { editDrive: drive } });
  };

  // ── Status change ─────────────────────────────────────────────────────────
  const handleStatusChange = useCallback(
    async (driveId: number, newStatus: number, currentLabel: string) => {
      if (
        !window.confirm(
          `Change status from "${currentLabel}" to "${DRIVE_STATUS_CONFIG[newStatus]?.label}"?`,
        )
      )
        return;
      try {
        const res = await axiosInstance.put(ApiEndpoint.drive.status, {
          drive_id: driveId,
          status: newStatus,
        });
        const body = res.data as any;
        if (body?.status) {
          toast.success(body.message || "Status updated.");
          fetchDrives();
        } else toast.error(body?.message || "Failed to update status.");
      } catch {
        toast.error("Failed to update status.");
      }
    },
    [fetchDrives],
  );

  // ── Column defs ───────────────────────────────────────────────────────────
  const columnDefs = useMemo(
    () => [
      {
        headerName: "Drive Name",
        field: "drive_name",
        flex: 2,
        minWidth: 160,
        cellClass: "dp-grid-cell",
      },
      {
        headerName: "Company",
        field: "company_name",
        flex: 1.5,
        minWidth: 130,
        cellClass: "dp-grid-cell",
        cellRenderer: (params: any) => {
          const tier = params.data?.tier ?? 1;
          const tierCfg = TIER_CONFIG[tier] ?? TIER_CONFIG[1];
          return (
            <div className="flex items-center gap-1.5">
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold border ${tierCfg.badge}`}
              >
                {tierCfg.label}
              </span>
              <span className="text-xs text-gray-800">{params.value}</span>
            </div>
          );
        },
      },
      {
        headerName: "Job Role",
        field: "job_role",
        flex: 1.2,
        minWidth: 120,
        cellClass: "dp-grid-cell",
      },
      {
        headerName: "Type",
        field: "drive_type",
        width: 110,
        flex: 0,
        cellClass: "dp-grid-cell",
        cellRenderer: (params: any) => (
          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 border border-indigo-200">
            {params.value}
          </span>
        ),
      },
      {
        headerName: "CTC (LPA)",
        field: "ctc_min",
        width: 100,
        flex: 0,
        cellClass: "dp-grid-cell",
        valueFormatter: (p: any) => {
          const { ctc_min, ctc_max } = p.data ?? {};
          if (!ctc_min && !ctc_max) return "—";
          if (ctc_min && ctc_max) return `${ctc_min}–${ctc_max}`;
          return String(ctc_min ?? ctc_max);
        },
      },
      {
        headerName: "Eligible",
        field: "eligible_student_count",
        width: 80,
        flex: 0,
        cellClass: "dp-grid-cell",
      },
      {
        headerName: "Drive Date",
        field: "drive_date",
        width: 105,
        flex: 0,
        cellClass: "dp-grid-cell",
        valueFormatter: (p: any) =>
          p.value
            ? new Date(p.value).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "—",
      },
      {
        headerName: "Status",
        field: "status",
        width: 110,
        flex: 0,
        cellClass: "dp-grid-cell",
        cellRenderer: (params: any) => {
          const cfg =
            DRIVE_STATUS_CONFIG[params.value] ?? DRIVE_STATUS_CONFIG[0];
          return (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${cfg.badge}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
          );
        },
      },
      {
        headerName: "Action",
        width: 70,
        flex: 0,
        sortable: false,
        filter: false,
        cellClass: "dp-grid-cell",
        cellRenderer: (params: any) => (
          <div className="flex items-center h-full">
            <button
              className="text-xs text-blue-600 underline px-2 py-1 rounded hover:bg-blue-50"
              onClick={() => handleView(params.data)}
            >
              View
            </button>
          </div>
        ),
      },
    ],
    [handleView],
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="dp-drive-page p-6"
      style={{ fontFamily: "'Roboto', sans-serif" }}
    >
      {/* ── Scoped styles — identical pattern to companyApprovalPage ─────── */}
      <style>{`
        .dp-drive-page,
        .dp-drive-page * {
          font-family: 'Roboto', sans-serif;
        }
        .dp-drive-page .dp-action-btn {
          padding: 0 !important;
          width: 28px !important;
          height: 28px !important;
          min-width: 28px !important;
          min-height: 28px !important;
        }
        .dp-list-panel {
          border-radius: 12px;
          overflow: hidden;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }
        .dp-list-panel > div > div {
          margin-bottom: 0 !important;
        }
        .dp-list-panel .ag-theme-alpine {
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
        .dp-list-panel .ag-header-cell {
          font-weight: 700 !important;
          color: #111827 !important;
          font-size: 11px !important;
          padding-left: 5px !important;
          padding-right: 5px !important;
        }
        .dp-list-panel .ag-row {
          border-bottom: 1px solid #f1f5f9 !important;
        }
        .dp-list-panel .ag-row-hover {
          background: linear-gradient(90deg, #f8fafc 0%, #ffffff 100%) !important;
        }
        .dp-list-panel .ag-cell {
          display: flex;
          align-items: center;
          line-height: 1.2;
        }
        .dp-list-panel .ag-floating-filter {
          padding: 2px 4px !important;
        }
        .dp-list-panel .ag-floating-filter-input,
        .dp-list-panel .ag-floating-filter-input input {
          min-height: 22px !important;
          height: 22px !important;
          font-size: 11px !important;
          border-radius: 6px !important;
        }
        .dp-list-panel .ag-body-horizontal-scroll {
          display: none !important;
        }
        .dp-list-panel .ag-center-cols-viewport {
          overflow-x: hidden !important;
        }
        .dp-grid-row-even {
          background: #fcfcfd !important;
        }
      `}</style>

      {/* Page header */}
      <div className="mb-6">
        <h2 className="text-2xl font-black tracking-tight text-black">
          Placement Drives
        </h2>
        <p className="mt-1 text-sm font-medium text-black/55">
          Manage and track all campus placement drives
        </p>
      </div>

      {/* Filter tabs + count — same pill style as company approval */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1 gap-0.5">
          {Object.entries(TAB_CONFIG).map(([key, cfg]) => {
            const tab = Number(key);
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  isActive ? "text-white" : "text-gray-600 hover:bg-gray-100"
                }`}
                style={isActive ? { backgroundColor: cfg.accent } : undefined}
              >
                {cfg.label}
                <span
                  className={`rounded px-1.5 py-0.5 text-xs font-bold ${
                    isActive
                      ? "bg-white/25 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {cfg.count(summary)}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <p className="text-sm font-medium text-black/50">
            Showing{" "}
            <span className="font-bold text-black">
              {filteredDrives.length}
            </span>{" "}
            drives
          </p>
          <button
            onClick={() => navigate("/tpo/placement-drive/create")}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            <Plus size={15} />
            Create Drive
          </button>
        </div>
      </div>

      {/* Data table */}
      <div className="dp-list-panel">
        <DataTable
          columnDefs={columnDefs}
          rowData={filteredDrives}
          showAddButton={false}
          showExportButton={false}
          headerFilter={true}
          pageSize={20}
          loading={loading}
          getRowClass={(params: any) =>
            (params.node.rowIndex ?? 0) % 2 === 0 ? "dp-grid-row-even" : ""
          }
        />
      </div>

      {/* Detail modal */}
      {detailOpen && viewDrive && (
        <DriveDetailModal
          drive={viewDrive}
          onClose={() => {
            setDetailOpen(false);
            setViewDrive(null);
          }}
          onEdit={handleEditFromDetail}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
};

export default DrivePage;
