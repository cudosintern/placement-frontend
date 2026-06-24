import React, { useEffect, useState, useMemo, useRef } from "react";
import DataTable from "../../../../components/Table/DataTable";
import { ApiEndpoint } from "../../../../utils/ApiEndpoint/placementapiEndpoint";
import axiosInstance from "../../../../utils/api";
import { toast } from "react-toastify";
import { RegistrationRecord, STATUS_LABELS } from "./registrationInterface";
import RegistrationDetailModal from "./registrationDetailModal";
import RejectReasonModal from "./rejectReasonModal";

/* ─── inject Fredoka font into <head> once ─── */
function useFredokaFont() {
  useEffect(() => {
    if (document.getElementById("fredoka-font-link")) return;
    const link = document.createElement("link");
    link.id = "fredoka-font-link";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  }, []);
}

/* ─── easeOutExpo animated counter ─── */
const AnimatedCount: React.FC<{ target: number; color: string }> = ({ target, color }) => {
  const [val, setVal] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (raf.current) cancelAnimationFrame(raf.current);
    const dur = 1300;
    const t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min((now - t0) / dur, 1);
      const e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      setVal(Math.round(target * e));
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target]);

  return (
    <span
      style={{
        fontFamily: "'Fredoka', 'Nunito', system-ui, sans-serif",
        fontSize: "2.5rem",
        fontWeight: 700,
        lineHeight: 1,
        color,
        letterSpacing: "-0.5px",
        display: "block",
      }}
    >
      {val.toLocaleString()}
    </span>
  );
};

/* ─── single stat card ─── */
interface CardDef {
  label: string;
  count: number;
  icon: string;
  accent: string;
  bgA: string;
  bgB: string;
  shadow: string;
  bars: { h: number; c: string }[];
  tabIdx: number;
}

const StatCard: React.FC<CardDef & { onSelect: (i: number) => void }> = (props) => {
  const { label, count, icon, accent, bgA, bgB, shadow, bars, tabIdx, onSelect } = props;
  const [hov, setHov] = useState(false);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(tabIdx)}
      onKeyDown={(e) => e.key === "Enter" && onSelect(tabIdx)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        flex: "1 1 0",
        minWidth: 0,
        background: `linear-gradient(150deg, ${bgA} 0%, ${bgB} 100%)`,
        borderRadius: "18px",
        padding: "13px 13px 11px",
        border: "2px solid rgba(255,255,255,0.9)",
        boxShadow: hov
          ? `0 24px 52px -10px ${shadow}, 0 1px 0 0 rgba(255,255,255,0.9) inset`
          : `0 5px 20px -4px ${shadow}, 0 1px 0 0 rgba(255,255,255,0.7) inset`,
        transform: hov ? "translateY(-7px) scale(1.03)" : "translateY(0) scale(1)",
        transition: "all 0.28s cubic-bezier(0.34,1.56,0.64,1)",
        cursor: "pointer",
        userSelect: "none",
        display: "flex",
        flexDirection: "column",
        gap: "5px",
        position: "relative",
        outline: "none",
      }}
    >
      {/* glass shine */}
      <div
        style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "45%",
          background: "linear-gradient(180deg,rgba(255,255,255,0.48) 0%,transparent 100%)",
          borderRadius: "17px 17px 0 0",
          pointerEvents: "none",
        }}
      />

      {/* row 1 — icon + label */}
      <div style={{ display: "flex", alignItems: "center", gap: "7px", zIndex: 1 }}>
        <span
          style={{
            width: 30, height: 30, flexShrink: 0,
            background: "rgba(255,255,255,0.72)",
            borderRadius: "8px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "14px",
            boxShadow: `0 2px 6px -1px ${shadow}`,
          }}
        >
          {icon}
        </span>
        <span
          style={{
            fontFamily: "'Fredoka', 'Nunito', system-ui, sans-serif",
            fontWeight: 700,
            fontSize: "0.7rem",
            letterSpacing: "0.12em",
            color: accent,
            textTransform: "uppercase",
            opacity: 0.8,
            zIndex: 1,
          }}
        >
          {label}
        </span>
      </div>

      {/* row 2 — animated number */}
      <div style={{ zIndex: 1 }}>
        <AnimatedCount target={count} color={accent} />
      </div>

      {/* row 3 — pill bar chart */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: "3px",
          height: "32px",
          borderTop: "1.5px solid rgba(255,255,255,0.55)",
          paddingTop: "5px",
          zIndex: 1,
        }}
      >
        {bars.map((b, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: `${Math.max(3, (b.h / 100) * 27)}px`,
              background: b.c,
              borderRadius: "999px",
              animation: `_pillSlideUp 0.45s ease ${0.04 + i * 0.05}s forwards`,
              opacity: 0,
              boxShadow: `0 2px 5px -1px ${b.c}66`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════════ */
const CompanyApprovalPage: React.FC = () => {
  useFredokaFont();

  const [data, setData] = useState<RegistrationRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [tabValue, setTabValue] = useState<number>(0);

  const [selectedRecord, setSelectedRecord] = useState<RegistrationRecord | null>(null);
  const [isDetailModalOpen, setDetailModalOpen] = useState(false);
  const [isRejectModalOpen, setRejectModalOpen] = useState(false);
  const [recordToReject, setRecordToReject] = useState<RegistrationRecord | null>(null);

  const fetchRegistrations = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(ApiEndpoint.companyRegistration.list);
      const resData = response.data as any;
      if (resData && resData.data) {
        setData(resData.data);
      } else {
        setData([]);
      }
    } catch (error) {
      console.error("Error fetching registrations", error);
      toast.error("Failed to fetch registrations.");
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const filteredData = useMemo(() => {
    switch (tabValue) {
      case 1: return data.filter((item) => item.status === 0);
      case 2: return data.filter((item) => item.status === 1);
      case 3: return data.filter((item) => item.status === 2);
      default: return data;
    }
  }, [data, tabValue]);

  const handleApprove = async (record: RegistrationRecord) => {
    try {
      const payload = { reg_id: record.reg_id, remarks: "Approved from Dashboard" };
      const response = await axiosInstance.put(ApiEndpoint.companyRegistration.approve, payload);
      const resData = response.data as any;
      if (resData?.status) {
        toast.success(resData.message || "Company approved successfully.");
        fetchRegistrations();
      } else {
        toast.error(resData?.message || "Failed to approve company.");
      }
    } catch (error: any) {
      console.error("Approve error", error);
      toast.error(error?.response?.data?.message || "Error approving company.");
    }
  };

  const handleRejectClick = (record: RegistrationRecord) => {
    setRecordToReject(record);
    setRejectModalOpen(true);
  };

  const handleRejectConfirm = async (reason: string) => {
    if (!recordToReject) return;
    try {
      const payload = { reg_id: recordToReject.reg_id, remarks: reason };
      const response = await axiosInstance.put(ApiEndpoint.companyRegistration.reject, payload);
      const resData = response.data as any;
      if (resData?.status) {
        toast.success(resData.message || "Company rejected.");
        setRejectModalOpen(false);
        setRecordToReject(null);
        fetchRegistrations();
      } else {
        toast.error(resData?.message || "Failed to reject company.");
      }
    } catch (error: any) {
      console.error("Reject error", error);
      toast.error(error?.response?.data?.message || "Error rejecting company.");
    }
  };

  const statusColorMap: Record<number, string> = {
    0: "bg-yellow-100 text-yellow-800 border-yellow-200",
    1: "bg-green-100 text-green-800 border-green-200",
    2: "bg-red-100 text-red-800 border-red-200",
  };

  const columnDefs = [
    { headerName: "ID", field: "reg_id", width: 70 },
    { headerName: "Company Name", field: "company_name", flex: 1 },
    { headerName: "Industry", field: "industry", flex: 1 },
    { headerName: "Contact Email", field: "contact_email", flex: 1 },
    { headerName: "City", field: "city", width: 130 },
    {
      headerName: "Status",
      field: "status",
      width: 120,
      cellRenderer: (params: any) => {
        const v = params.data?.status;
        return (
          <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${statusColorMap[v] || "bg-gray-100 text-gray-800"}`}>
            {STATUS_LABELS[v] || "Unknown"}
          </span>
        );
      },
    },
    {
      headerName: "Submitted On",
      field: "create_date",
      width: 170,
      cellRenderer: (params: any) => new Date(params.data?.create_date).toLocaleString(),
    },
    {
      headerName: "Action",
      field: "actions",
      width: 220,
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        const row = params.data as RegistrationRecord;
        if (!row) return null;
        const isPending = row.status === 0;
        return (
          <div className="flex space-x-2 items-center h-full">
            <button
              className="text-sm text-blue-600 underline px-2 py-1 rounded hover:bg-blue-50"
              onClick={() => { setSelectedRecord(row); setDetailModalOpen(true); }}
              title="View"
            >
              View
            </button>
            {isPending && (
              <>
                <button
                  className="text-sm text-green-600 px-2 py-1 rounded border border-green-200 hover:bg-green-50"
                  onClick={() => handleApprove(row)}
                  title="Approve"
                >
                  Approve
                </button>
                <button
                  className="text-sm text-red-600 px-2 py-1 rounded border border-red-200 hover:bg-red-50"
                  onClick={() => handleRejectClick(row)}
                  title="Reject"
                >
                  Reject
                </button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  const tabs = [
    { label: "All",      value: 0 },
    { label: "Pending",  value: 1 },
    { label: "Approved", value: 2 },
    { label: "Rejected", value: 3 },
  ];

  /* ── counts ── */
  const totalCount    = data.length;
  const pendingCount  = data.filter((d) => d.status === 0).length;
  const approvedCount = data.filter((d) => d.status === 1).length;
  const rejectedCount = data.filter((d) => d.status === 2).length;

  /* ── card definitions ── */
  const BARS_BLUE   = [45,60,50,80,65,90,100].map((h,i)=>({ h, c: ["#93c5fd","#60a5fa","#93c5fd","#3b82f6","#60a5fa","#2563eb","#1d4ed8"][i] }));
  const BARS_AMBER  = [30,50,35,60,40,55,70 ].map((h,i)=>({ h, c: ["#fcd34d","#fbbf24","#fcd34d","#f59e0b","#fbbf24","#d97706","#b45309"][i] }));
  const BARS_GREEN  = [40,70,55,85,60,75,90 ].map((h,i)=>({ h, c: ["#6ee7b7","#34d399","#6ee7b7","#10b981","#34d399","#059669","#047857"][i] }));
  const BARS_RED    = [25,45,30,55,35,50,65 ].map((h,i)=>({ h, c: ["#fca5a5","#f87171","#fca5a5","#ef4444","#f87171","#dc2626","#b91c1c"][i] }));

  const cards: CardDef[] = [
    { label:"Total",    count:totalCount,    icon:"📋", accent:"#1a3a8f", bgA:"#dbeafe", bgB:"#bfdbfe", shadow:"rgba(59,130,246,0.4)",   bars:BARS_BLUE,  tabIdx:0 },
    { label:"Pending",  count:pendingCount,  icon:"⏳", accent:"#92400e", bgA:"#fef3c7", bgB:"#fde68a", shadow:"rgba(245,158,11,0.4)",   bars:BARS_AMBER, tabIdx:1 },
    { label:"Approved", count:approvedCount, icon:"✅", accent:"#065f46", bgA:"#d1fae5", bgB:"#a7f3d0", shadow:"rgba(16,185,129,0.4)",   bars:BARS_GREEN, tabIdx:2 },
    { label:"Rejected", count:rejectedCount, icon:"❌", accent:"#7f1d1d", bgA:"#fee2e2", bgB:"#fecaca", shadow:"rgba(239,68,68,0.4)",    bars:BARS_RED,   tabIdx:3 },
  ];

  return (
    <>
      {/* pill-pop keyframe */}
      <style>{`
        @keyframes _pillSlideUp {
          0%   { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="p-6">
        {/* header */}
        <div style={{ marginBottom: "18px" }}>
          <h2 style={{ fontFamily:"'Fredoka','Nunito',system-ui,sans-serif", fontSize:"1.6rem", fontWeight:700, color:"#1e293b", margin:0 }}>
            Company Approval
          </h2>
          <p style={{ color:"#64748b", fontSize:"0.85rem", margin:"3px 0 0" }}>
            Review and approve/reject recruiter self-registrations
          </p>
        </div>

        {/* ── 4 stat cards, equal width ── */}
        <div style={{ display:"flex", gap:"14px", marginBottom:"22px", width:"100%" }}>
          {cards.map((c) => (
            <StatCard key={c.label} {...c} onSelect={setTabValue} />
          ))}
        </div>

        {/* table section */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex space-x-4 border-b border-gray-200 mb-4">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                  tabValue === tab.value
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                onClick={() => setTabValue(tab.value)}
              >
                {tab.label}
                {tab.value === 0 && <span className="ml-1 text-gray-400">{totalCount}</span>}
                {tab.value === 1 && <span className="ml-1 text-gray-400">{pendingCount}</span>}
                {tab.value === 2 && <span className="ml-1 text-gray-400">{approvedCount}</span>}
                {tab.value === 3 && <span className="ml-1 text-gray-400">{rejectedCount}</span>}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="p-10 text-center text-gray-500">Loading registrations...</div>
          ) : (
            <div className="ag-theme-alpine" style={{ height: 600, width: "100%" }}>
              <DataTable
                columnDefs={columnDefs}
                rowData={filteredData}
                showAddButton={false}
                showExportButton={false}
                headerFilter={true}
                pageSize={20}
              />
            </div>
          )}
        </div>

        <RegistrationDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          record={selectedRecord}
        />

        <RejectReasonModal
          isOpen={isRejectModalOpen}
          onClose={() => setRejectModalOpen(false)}
          onSubmit={handleRejectConfirm}
          companyName={recordToReject?.company_name || ""}
        />
      </div>
    </>
  );
};

export default CompanyApprovalPage;
