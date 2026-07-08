/**
 * driveDetailPage.tsx
 * ===================
 * TPO Officer view — Drive Detail & Shortlisting (Screen 4).
 *
 * Route : /tpo/placement-drive/:driveId   (navigate here from drivePage "View →")
 *
 * Features:
 *  - Drive header: Company + Drive Name, status, tier, eligibility info
 *  - Stat cards: Applied / Shortlisted / Waitlisted / Rejected / In Process
 *  - Applicant table:
 *      • Sorted by CGPA DESC by default
 *      • Branch filter dropdown (among already-eligible applicants)
 *      • Search by name / USN
 *      • Per-row checkbox for bulk selection
 *      • Select All checkbox
 *      • Per-row "Reject" action
 *      • Resume link
 *  - "Run Shortlisting" button with vacancy cap enforcement
 *  - Edit Drive / Cancel Drive quick actions in header
 *
 * DATA: Calls real backend APIs (placement/drive/applications etc.).
 *       Falls back gracefully if API is not yet live (shows empty state).
 */

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  Search,
  ChevronDown,
  Download,
  Play,
  Building2,
  BadgeCheck,
  AlertTriangle,
} from "lucide-react";
import { toast } from "react-toastify";
import axiosInstance from "../../../utils/api";
import { PlacementApiEndpoint } from "../../../utils/ApiEndpoint/placementapiEndpoint";
import { DriveRecord, DRIVE_STATUS_CONFIG, TIER_CONFIG } from "./driveSchema";

// ─── Types ────────────────────────────────────────────────────────────────────

type AppStatus =
  | "APPLIED"
  | "SHORTLISTED"
  | "WAITLISTED"
  | "IN_PROCESS"
  | "OFFERED"
  | "REJECTED"
  | "WITHDRAWN";

export interface DriveApplicant {
  application_id: number;
  profile_id: number;
  student_id: number;
  name: string;
  usno: string;
  email: string;
  department: string;
  department_id: number;
  cgpa: number;
  backlogs: number;
  resume_id: number | null;
  resume_url: string | null;
  applied_at: string;
  status: AppStatus;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<
  AppStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  APPLIED:     { label: "Applied",     bg: "#dbeafe", text: "#1d4ed8", border: "#93c5fd" },
  SHORTLISTED: { label: "Shortlisted", bg: "#fef9c3", text: "#854d0e", border: "#fde047" },
  WAITLISTED:  { label: "Waitlisted",  bg: "#e0e7ff", text: "#4338ca", border: "#a5b4fc" },
  IN_PROCESS:  { label: "In Process",  bg: "#fce7f3", text: "#9d174d", border: "#f9a8d4" },
  OFFERED:     { label: "Offered",     bg: "#d1fae5", text: "#065f46", border: "#6ee7b7" },
  REJECTED:    { label: "Rejected",    bg: "#fee2e2", text: "#991b1b", border: "#fca5a5" },
  WITHDRAWN:   { label: "Withdrawn",   bg: "#f3f4f6", text: "#6b7280", border: "#d1d5db" },
};

const CLR = {
  navy: "#17375e",
  navyLight: "#1e4d8c",
};

const fmtDate = (d: string | null | undefined) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: string;
  bg: string;
  active?: boolean;
  onClick?: () => void;
}> = ({ icon, label, value, accent, bg, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      flex: "1 1 130px",
      background: active ? accent : bg,
      color: active ? "#fff" : accent,
      border: `1.5px solid ${active ? accent : accent + "55"}`,
      borderRadius: 10,
      padding: "14px 18px",
      cursor: onClick ? "pointer" : "default",
      textAlign: "left",
      transition: "all 0.18s",
      boxShadow: active ? `0 4px 14px ${accent}44` : "0 1px 4px rgba(0,0,0,0.07)",
    }}
  >
    <div style={{ fontSize: 20, marginBottom: 4, opacity: active ? 1 : 0.75 }}>
      {icon}
    </div>
    <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1 }}>{value}</div>
    <div
      style={{
        fontSize: 11,
        fontWeight: 600,
        marginTop: 4,
        opacity: active ? 0.9 : 0.7,
      }}
    >
      {label}
    </div>
  </button>
);

const StatusBadge: React.FC<{ status: AppStatus }> = ({ status }) => {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.APPLIED;
  return (
    <span
      style={{
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 700,
        background: cfg.bg,
        color: cfg.text,
        border: `1px solid ${cfg.border}`,
        whiteSpace: "nowrap",
      }}
    >
      {cfg.label}
    </span>
  );
};

// ─── Confirm Modal ────────────────────────────────────────────────────────────

const ConfirmShortlistModal: React.FC<{
  vacancy: number | null;
  onConfirm: () => void;
  onClose: () => void;
}> = ({ vacancy, onConfirm, onClose }) => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
      backdropFilter: "blur(3px)",
    }}
    onClick={onClose}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        background: "#fff",
        borderRadius: 14,
        width: "100%",
        maxWidth: 440,
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          background: `linear-gradient(135deg, #16a34a 0%, #15803d 100%)`,
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>
          🚀 Confirm Auto-Shortlisting
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "rgba(255,255,255,0.7)",
            fontSize: 22,
            cursor: "pointer",
          }}
        >
          ×
        </button>
      </div>
      <div style={{ padding: "20px 22px" }}>
        <p style={{ margin: "0 0 14px", fontSize: 13, color: "#555", lineHeight: 1.6 }}>
          The system will automatically shortlist the top{" "}
          <strong style={{ color: "#16a34a" }}>
            {vacancy !== null ? vacancy : "N"} student{vacancy !== 1 ? "s" : ""}
          </strong>{" "}
          (up to remaining vacancy) based on <strong>eligible branches</strong> and <strong>highest CGPA</strong>.
        </p>
        <div
          style={{
            background: "#f0fdf4",
            border: "1px solid #86efac",
            borderRadius: 8,
            padding: "10px 14px",
            fontSize: 12,
            color: "#166534",
            marginBottom: 10,
          }}
        >
          ✅ Top applicants (by CGPA, from eligible branches) → <strong>SHORTLISTED</strong>
        </div>
        <div
          style={{
            background: "#eef2ff",
            border: "1px solid #a5b4fc",
            borderRadius: 8,
            padding: "10px 14px",
            fontSize: 12,
            color: "#3730a3",
            marginBottom: 18,
          }}
        >
          🕐 Remaining applicants (ineligible, or outside vacancy cap) → <strong>WAITLISTED</strong>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              padding: "8px 18px",
              fontSize: 13,
              fontWeight: 600,
              color: "#555",
              background: "#fff",
              border: "1px solid #d1d5db",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            style={{
              padding: "8px 22px",
              fontSize: 13,
              fontWeight: 700,
              color: "#fff",
              background: "#16a34a",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Run Shortlisting
          </button>
        </div>
      </div>
    </div>
  </div>
);


// ─── Main Page ────────────────────────────────────────────────────────────────

const DriveDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { driveId } = useParams<{ driveId: string }>();
  const location = useLocation();

  // Drive record — router state used as placeholder while fresh data loads
  const [drive, setDrive] = useState<DriveRecord | null>(
    (location.state as any)?.drive ?? null
  );
  const [driveLoading, setDriveLoading] = useState(true); // always fetch fresh

  // Applicants
  const [applicants, setApplicants] = useState<DriveApplicant[]>([]);
  const [appLoading, setAppLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [filterBranch, setFilterBranch] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState<AppStatus | "ALL">("ALL");

  // Selection
  const [selected, setSelected] = useState<Set<number>>(new Set());

  // Confirm modal
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Always fetch fresh drive detail from API ───────────────────────────────
  useEffect(() => {
    if (!driveId) return;
    (async () => {
      setDriveLoading(true);
      try {
        const res = await axiosInstance.get(
          `${PlacementApiEndpoint.drive.detail}/${driveId}`
        );
        const body = res.data as any;
        if (body?.status) setDrive(body.data);
        else toast.error("Could not load drive details.");
      } catch {
        toast.error("Could not load drive details.");
      } finally {
        setDriveLoading(false);
      }
    })();
  }, [driveId]);

  // ── Fetch applicants ───────────────────────────────────────────────────────
  const fetchApplicants = useCallback(async () => {
    if (!driveId) return;
    setAppLoading(true);
    try {
      const res = await axiosInstance.get(
        PlacementApiEndpoint.applications.list,
        { params: { drive_id: driveId } }
      );
      const body = res.data as any;
      if (body?.status) {
        setApplicants(
          Array.isArray(body.data?.applicants)
            ? body.data.applicants
            : Array.isArray(body.data)
            ? body.data
            : []
        );
      }
    } catch {
      toast.error("Failed to load applicants.");
    } finally {
      setAppLoading(false);
    }
  }, [driveId]);

  useEffect(() => {
    fetchApplicants();
  }, [fetchApplicants]);

  // ── Computed stats ─────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const count = (s: AppStatus) =>
      applicants.filter((a) => a.status === s).length;
    return {
      APPLIED:     count("APPLIED"),
      SHORTLISTED: count("SHORTLISTED"),
      WAITLISTED:  count("WAITLISTED"),
      REJECTED:    count("REJECTED"),
      IN_PROCESS:  count("IN_PROCESS"),
    };
  }, [applicants]);

  // ── Available branches from applicant list ─────────────────────────────────
  const branches = useMemo(() => {
    const m = new Map<number, string>();
    applicants.forEach((a) => m.set(a.department_id, a.department));
    return Array.from(m.entries()).sort((a, b) =>
      a[1].localeCompare(b[1])
    );
  }, [applicants]);

  // ── Filtered + sorted applicants ───────────────────────────────────────────
  const filtered = useMemo(() => {
    return applicants
      .filter((a) => {
        if (filterStatus !== "ALL" && a.status !== filterStatus) return false;
        if (filterBranch !== "ALL" && String(a.department_id) !== filterBranch)
          return false;
        if (search) {
          const q = search.toLowerCase();
          if (
            !a.name.toLowerCase().includes(q) &&
            !a.usno.toLowerCase().includes(q)
          )
            return false;
        }
        return true;
      })
      .sort((a, b) => b.cgpa - a.cgpa); // sort by CGPA DESC
  }, [applicants, filterStatus, filterBranch, search]);

  // ── Select / deselect helpers ──────────────────────────────────────────────
  const toggleOne = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const allChecked =
    filtered.length > 0 && filtered.every((a) => selected.has(a.application_id));

  const toggleAll = () => {
    if (allChecked) {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((a) => next.delete(a.application_id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((a) => {
          // Only allow selecting APPLIED status students for shortlisting
          if (a.status === "APPLIED") next.add(a.application_id);
        });
        return next;
      });
    }
  };

  // ── Run shortlisting (auto — no manual selection needed) ──────────────────
  const [autoShortlisting, setAutoShortlisting] = useState(false);

  const handleRunShortlisting = () => {
    const appliedCount = stats.APPLIED;
    const vac = drive?.vacancy_count ?? null;
    // Gate: only run when applied > vacancy
    if (vac !== null && appliedCount <= vac) {
      toast.warn(
        `Applied (${appliedCount}) must exceed vacancy (${vac}) to run auto-shortlisting.`
      );
      return;
    }
    setShowConfirm(true);
  };

  const confirmShortlist = async () => {
    setAutoShortlisting(true);
    try {
      const res = await axiosInstance.post(
        PlacementApiEndpoint.applications.auto_shortlist,
        { drive_id: Number(driveId) }
      );
      const body = res.data as any;
      if (body?.status) {
        toast.success(
          body.message ||
            `Shortlisting complete: ${body.data?.shortlisted} shortlisted, ${body.data?.waitlisted} waitlisted.`
        );
        setSelected(new Set());
        fetchApplicants();
      } else {
        toast.error(body?.message || "Auto-shortlisting failed.");
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        "Auto-shortlisting failed.";
      toast.error(typeof msg === "string" ? msg : "Auto-shortlisting failed.");
    } finally {
      setAutoShortlisting(false);
    }
  };


  // ── Open resume in new tab via authenticated download ─────────────────────
  const handleOpenResume = useCallback(async (resumeId: number, studentName: string) => {
    try {
      const res = await axiosInstance.get(
        PlacementApiEndpoint.studentProfile.download_resume,
        { params: { resume_id: resumeId }, responseType: "blob" }
      );
      const blob = new Blob([res.data as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const win = window.open(url, "_blank");
      if (!win) {
        // Fallback: download instead
        const a = document.createElement("a");
        a.href = url;
        a.download = `${studentName}_resume.pdf`;
        a.click();
      }
      // Revoke after 60 s to free memory
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      toast.error("Could not open resume. Please try again.");
    }
  }, []);

  // ── Reject single applicant ────────────────────────────────────────────────
  const handleReject = async (applicationId: number, studentName: string) => {
    if (!window.confirm(`Reject ${studentName}? This cannot be undone.`)) return;
    try {
      const res = await axiosInstance.post(
        PlacementApiEndpoint.applications.reject,
        { application_id: applicationId }
      );
      const body = res.data as any;
      if (body?.status) {
        toast.success(`${studentName} has been rejected.`);
        fetchApplicants();
      } else {
        toast.error(body?.message || "Reject failed.");
      }
    } catch {
      toast.error("Reject failed.");
    }
  };

  // ── Render loading ─────────────────────────────────────────────────────────
  if (driveLoading) {
    return (
      <div
        style={{
          display: "flex",
          height: 300,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Loader2
          size={32}
          style={{ color: CLR.navy }}
          className="animate-spin"
        />
      </div>
    );
  }

  const statusCfg = drive ? DRIVE_STATUS_CONFIG[drive.status] ?? DRIVE_STATUS_CONFIG[0] : null;
  const tierCfg = drive ? TIER_CONFIG[drive.tier] ?? TIER_CONFIG[1] : null;
  const vacancy = drive?.vacancy_count ?? null;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        fontFamily: "'Roboto', sans-serif",
        padding: "0 4px 32px",
        maxWidth: 1180,
        margin: "0 auto",
      }}
    >
      {/* ── Breadcrumb ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          color: "#888",
          marginBottom: 18,
        }}
      >
        <span
          style={{ cursor: "pointer", color: CLR.navyLight, fontWeight: 600 }}
          onClick={() => navigate("/tpo/placement-drive")}
        >
          IonERP
        </span>
        <span>/</span>
        <span
          style={{ cursor: "pointer", color: CLR.navyLight, fontWeight: 600 }}
          onClick={() => navigate("/tpo/placement-drive")}
        >
          Placement
        </span>
        <span>/</span>
        <span style={{ fontWeight: 700, color: "#444" }}>Drive Detail</span>
      </div>

      {/* ── Drive Header ── */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: "20px 24px",
          marginBottom: 20,
          boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
        }}
      >
        {/* screen label */}
        <div style={{ fontSize: 10, fontWeight: 700, color: "#aaa", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 8 }}>
          Screen 4 — Drive Detail &amp; Shortlisting
        </div>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => navigate("/tpo/placement-drive")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: 600,
                color: "#555",
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: 7,
                cursor: "pointer",
              }}
            >
              <ArrowLeft size={13} />
              Back
            </button>
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: 22,
                  fontWeight: 900,
                  color: CLR.navy,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Building2 size={18} color={CLR.navyLight} />
                  {drive?.company_name ?? "—"}
                </span>
                <span style={{ color: "#bbb", fontWeight: 300 }}>—</span>
                <span
                  style={{
                    background: `${CLR.navyLight}18`,
                    color: CLR.navyLight,
                    borderRadius: 6,
                    padding: "2px 10px",
                    fontSize: 18,
                    fontWeight: 800,
                  }}
                >
                  {drive?.drive_name ?? "—"}
                </span>
              </h1>

              {/* badges row */}
              <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
                {statusCfg && (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold border ${statusCfg.badge}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                    {statusCfg.label}
                  </span>
                )}
                {tierCfg && (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold border ${tierCfg.badge}`}>
                    {tierCfg.label}
                  </span>
                )}
                <span style={{ fontSize: 12, color: "#555" }}>
                  {drive?.drive_type}
                </span>
                {drive && (
                  <span style={{ fontSize: 12, color: "#888" }}>
                    •{" "}
                    <strong style={{ color: CLR.navy }}>
                      {drive.eligible_student_count}
                    </strong>{" "}
                    eligible
                  </span>
                )}
                {drive?.application_deadline && (
                  <span style={{ fontSize: 12, color: "#888" }}>
                    • App window closes{" "}
                    <strong style={{ color: "#dc2626" }}>
                      {fmtDate(drive.application_deadline)}
                    </strong>
                  </span>
                )}
                {vacancy !== null && (
                  <span
                    style={{
                      fontSize: 12,
                      color: "#065f46",
                      fontWeight: 700,
                      background: "#d1fae5",
                      borderRadius: 20,
                      padding: "2px 10px",
                      border: "1px solid #6ee7b7",
                    }}
                  >
                    Vacancy: {vacancy}
                  </span>
                )}
              </div>
            </div>
          </div>


        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 20,
        }}
      >
        <StatCard
          icon={<Users size={18} />}
          label="Total Applied"
          value={applicants.length}
          accent="#2563eb"
          bg="#dbeafe"
          active={filterStatus === "ALL"}
          onClick={() => setFilterStatus("ALL")}
        />
        <StatCard
          icon={<CheckCircle2 size={18} />}
          label="Shortlisted"
          value={stats.SHORTLISTED}
          accent="#854d0e"
          bg="#fef9c3"
          active={filterStatus === "SHORTLISTED"}
          onClick={() =>
            setFilterStatus(
              filterStatus === "SHORTLISTED" ? "ALL" : "SHORTLISTED"
            )
          }
        />
        <StatCard
          icon={<Clock size={18} />}
          label="Waitlisted"
          value={stats.WAITLISTED}
          accent="#4338ca"
          bg="#e0e7ff"
          active={filterStatus === "WAITLISTED"}
          onClick={() =>
            setFilterStatus(
              filterStatus === "WAITLISTED" ? "ALL" : "WAITLISTED"
            )
          }
        />
        <StatCard
          icon={<XCircle size={18} />}
          label="Rejected"
          value={stats.REJECTED}
          accent="#991b1b"
          bg="#fee2e2"
          active={filterStatus === "REJECTED"}
          onClick={() =>
            setFilterStatus(filterStatus === "REJECTED" ? "ALL" : "REJECTED")
          }
        />
        <StatCard
          icon={<BadgeCheck size={18} />}
          label="In Process"
          value={stats.IN_PROCESS}
          accent="#065f46"
          bg="#d1fae5"
          active={filterStatus === "IN_PROCESS"}
          onClick={() =>
            setFilterStatus(
              filterStatus === "IN_PROCESS" ? "ALL" : "IN_PROCESS"
            )
          }
        />
      </div>

      {/* ── Tabs ── */}
      <div
        style={{
          display: "flex",
          borderBottom: "2px solid #e5e7eb",
          marginBottom: 16,
          gap: 0,
        }}
      >
        {[
          { key: "applications", label: `Applications (${applicants.length})` },
          { key: "rounds", label: "Rounds & Results" },
          { key: "offers", label: "Offers (0)" },
        ].map((tab) => (
          <div
            key={tab.key}
            style={{
              padding: "10px 20px",
              fontSize: 13,
              fontWeight: 700,
              color: tab.key === "applications" ? CLR.navy : "#888",
              borderBottom:
                tab.key === "applications"
                  ? `2.5px solid ${CLR.navy}`
                  : "2.5px solid transparent",
              cursor: "pointer",
              marginBottom: -2,
            }}
          >
            {tab.label}
          </div>
        ))}
      </div>

      {/* ── Filters + Actions Bar ── */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          padding: "12px 16px",
          marginBottom: 12,
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          alignItems: "center",
        }}
      >
        {/* Search */}
        <div
          style={{ position: "relative", flex: "1 1 220px", maxWidth: 280 }}
        >
          <Search
            size={13}
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#aaa",
            }}
          />
          <input
            id="drive-detail-search"
            type="text"
            placeholder="Search student name or USN"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 10px 8px 28px",
              border: "1px solid #d1d5db",
              borderRadius: 6,
              fontSize: 12,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Status filter */}
        <div style={{ position: "relative", flex: "0 0 160px" }}>
          <select
            id="drive-detail-status-filter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            style={{
              width: "100%",
              padding: "8px 28px 8px 10px",
              border: "1px solid #d1d5db",
              borderRadius: 6,
              fontSize: 12,
              background: "#fff",
              cursor: "pointer",
              appearance: "none",
              outline: "none",
            }}
          >
            <option value="ALL">All Status</option>
            <option value="APPLIED">Applied</option>
            <option value="SHORTLISTED">Shortlisted</option>
            <option value="WAITLISTED">Waitlisted</option>
            <option value="IN_PROCESS">In Process</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <ChevronDown
            size={12}
            style={{
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#888",
              pointerEvents: "none",
            }}
          />
        </div>

        {/* Branch filter */}
        <div style={{ position: "relative", flex: "0 0 200px" }}>
          <select
            id="drive-detail-branch-filter"
            value={filterBranch}
            onChange={(e) => setFilterBranch(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 28px 8px 10px",
              border: "1px solid #d1d5db",
              borderRadius: 6,
              fontSize: 12,
              background: "#fff",
              cursor: "pointer",
              appearance: "none",
              outline: "none",
            }}
          >
            <option value="ALL">All Branches</option>
            {branches.map(([id, name]) => (
              <option key={id} value={String(id)}>
                {name}
              </option>
            ))}
          </select>
          <ChevronDown
            size={12}
            style={{
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#888",
              pointerEvents: "none",
            }}
          />
        </div>

        {/* Count */}
        <span style={{ fontSize: 12, color: "#888", marginRight: "auto" }}>
          {filtered.length} student{filtered.length !== 1 ? "s" : ""}
          {selected.size > 0 && (
            <span
              style={{
                marginLeft: 8,
                fontWeight: 700,
                color: CLR.navyLight,
              }}
            >
              • {selected.size} selected
            </span>
          )}
        </span>

        {/* Export */}
        <button
          id="export-applications-btn"
          onClick={() => toast.info("Export feature coming soon.")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "8px 14px",
            fontSize: 12,
            fontWeight: 600,
            color: "#555",
            background: "#fff",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          <Download size={13} />
          Export List
        </button>

        {/* Vacancy warning */}
        {vacancy !== null && stats.SHORTLISTED >= vacancy && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: 11,
              color: "#92400e",
              background: "#fef3c7",
              border: "1px solid #fcd34d",
              borderRadius: 6,
              padding: "6px 10px",
              fontWeight: 600,
            }}
          >
            <AlertTriangle size={12} />
            Vacancy cap reached ({vacancy})
          </div>
        )}

        {/* Run Shortlisting — auto mode: enabled when applied > vacancy */}
        {(() => {
          const appliedCount = applicants.length;
          const capReached = vacancy !== null && stats.SHORTLISTED >= vacancy;
          // Enable when: cap not reached AND applied > vacancy (or no vacancy cap set)
          const canRun =
            !capReached &&
            !autoShortlisting &&
            (vacancy === null || appliedCount > vacancy);
          return (
            <button
              id="run-shortlisting-btn"
              onClick={handleRunShortlisting}
              disabled={!canRun || autoShortlisting}
              title={
                capReached
                  ? `Vacancy cap reached (${vacancy})`
                  : vacancy !== null && appliedCount <= vacancy
                  ? `Applied (${appliedCount}) must exceed vacancy (${vacancy}) to run auto-shortlisting`
                  : "Auto-shortlist top applicants by branch eligibility + CGPA"
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                fontSize: 12,
                fontWeight: 700,
                color: "#fff",
                background: autoShortlisting
                  ? "#6b7280"
                  : !canRun
                  ? "#9ca3af"
                  : "#16a34a",
                border: "none",
                borderRadius: 6,
                cursor: !canRun || autoShortlisting ? "not-allowed" : "pointer",
                transition: "background 0.18s",
              }}
            >
              <Play size={12} />
              {autoShortlisting ? "Shortlisting…" : "Run Shortlisting"}
              {vacancy !== null && (
                <span
                  style={{
                    background: "rgba(255,255,255,0.25)",
                    borderRadius: 4,
                    padding: "1px 6px",
                    fontSize: 10,
                  }}
                >
                  max {vacancy}
                </span>
              )}
            </button>
          );
        })()}
      </div>

      {/* ── Applicant Table ── */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        {/* Table Header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "40px 2.2fr 1.4fr 1fr 1fr 1fr 1fr 1.2fr",
            background: CLR.navy,
            color: "#fff",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.6px",
            textTransform: "uppercase",
            padding: "11px 16px",
            gap: 8,
            alignItems: "center",
          }}
        >
          {/* Select All checkbox */}
          <div>
            <input
              id="select-all-applicants"
              type="checkbox"
              checked={allChecked}
              onChange={toggleAll}
              style={{ cursor: "pointer", width: 14, height: 14, accentColor: "#fff" }}
            />
          </div>
          <span>Student</span>
          <span>Branch</span>
          <span>CGPA</span>
          <span>Backlogs</span>
          <span>Resume</span>
          <span>Applied On</span>
          <span style={{ textAlign: "center" }}>Status / Actions</span>
        </div>

        {/* Loading state */}
        {appLoading ? (
          <div
            style={{
              padding: "48px 24px",
              textAlign: "center",
              color: "#aaa",
            }}
          >
            <Loader2
              size={28}
              className="animate-spin"
              style={{ color: CLR.navyLight, margin: "0 auto 10px" }}
            />
            <div>Loading applicants…</div>
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              padding: "52px 24px",
              textAlign: "center",
              color: "#aaa",
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 10 }}>
              {applicants.length === 0 ? "📋" : "🔍"}
            </div>
            <div style={{ fontWeight: 700, color: "#666", fontSize: 14 }}>
              {applicants.length === 0
                ? "No applications yet for this drive"
                : "No students match your filters"}
            </div>
            {applicants.length === 0 && (
              <div style={{ fontSize: 12, color: "#aaa", marginTop: 6 }}>
                Students will appear here once they apply through the Available
                Drives page.
              </div>
            )}
          </div>
        ) : (
          filtered.map((applicant, i) => {
            const isSelected = selected.has(applicant.application_id);
            const canSelect = applicant.status === "APPLIED";
            return (
              <div
                key={applicant.application_id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "40px 2.2fr 1.4fr 1fr 1fr 1fr 1fr 1.2fr",
                  padding: "13px 16px",
                  gap: 8,
                  borderTop: i === 0 ? "none" : "1px solid #f3f4f6",
                  alignItems: "center",
                  background: isSelected
                    ? "#eef3ff"
                    : i % 2 === 0
                    ? "#fff"
                    : "#fafafa",
                  transition: "background 0.12s",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected)
                    e.currentTarget.style.background = "#f5f7ff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isSelected
                    ? "#eef3ff"
                    : i % 2 === 0
                    ? "#fff"
                    : "#fafafa";
                }}
              >
                {/* Checkbox */}
                <div>
                  <input
                    id={`select-applicant-${applicant.application_id}`}
                    type="checkbox"
                    checked={isSelected}
                    disabled={!canSelect && !isSelected}
                    onChange={() =>
                      canSelect || isSelected
                        ? toggleOne(applicant.application_id)
                        : undefined
                    }
                    title={
                      !canSelect
                        ? `Cannot select — status is ${applicant.status}`
                        : undefined
                    }
                    style={{
                      cursor: canSelect || isSelected ? "pointer" : "not-allowed",
                      width: 14,
                      height: 14,
                      accentColor: CLR.navyLight,
                      opacity: canSelect || isSelected ? 1 : 0.35,
                    }}
                  />
                </div>

                {/* Student info */}
                <div>
                  <div
                    style={{ fontWeight: 700, fontSize: 13, color: CLR.navy }}
                  >
                    {applicant.name}
                  </div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 1 }}>
                    {applicant.usno}
                  </div>
                  <div style={{ fontSize: 11, color: "#bbb" }}>
                    {applicant.email}
                  </div>
                </div>

                {/* Branch */}
                <div style={{ fontSize: 12, color: "#444" }}>
                  {applicant.department}
                </div>

                {/* CGPA */}
                <div>
                  <span
                    style={{
                      fontWeight: 800,
                      fontSize: 15,
                      color:
                        applicant.cgpa >= 8
                          ? "#065f46"
                          : applicant.cgpa >= 6
                          ? "#1d4ed8"
                          : "#dc2626",
                    }}
                  >
                    {applicant.cgpa?.toFixed(2) ?? "—"}
                  </span>
                </div>

                {/* Backlogs */}
                <div>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: applicant.backlogs > 0 ? "#dc2626" : "#6b7280",
                    }}
                  >
                    {applicant.backlogs === 0
                      ? "None"
                      : `${applicant.backlogs} backlog${applicant.backlogs > 1 ? "s" : ""}`}
                  </span>
                </div>

                {/* Resume */}
                <div>
                  {applicant.resume_id ? (
                    <button
                      onClick={() => handleOpenResume(applicant.resume_id!, applicant.name)}
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: CLR.navyLight,
                        textDecoration: "underline",
                        cursor: "pointer",
                        background: "none",
                        border: "none",
                        padding: 0,
                      }}
                    >
                      Resume ↗
                    </button>
                  ) : (
                    <span style={{ fontSize: 11, color: "#bbb" }}>—</span>
                  )}
                </div>

                {/* Applied On */}
                <div style={{ fontSize: 12, color: "#555" }}>
                  {fmtDate(applicant.applied_at)}
                </div>

                {/* Status + Actions */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    justifyContent: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <StatusBadge status={applicant.status} />
                  {applicant.status === "APPLIED" && (
                    <button
                      id={`reject-btn-${applicant.application_id}`}
                      onClick={() =>
                        handleReject(applicant.application_id, applicant.name)
                      }
                      title="Reject this applicant"
                      style={{
                        padding: "3px 8px",
                        fontSize: 10,
                        fontWeight: 700,
                        color: "#dc2626",
                        background: "#fff",
                        border: "1px solid #fca5a5",
                        borderRadius: 4,
                        cursor: "pointer",
                      }}
                    >
                      Reject
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Confirm Auto-Shortlist Modal ── */}
      {showConfirm && (
        <ConfirmShortlistModal
          vacancy={vacancy !== null ? Math.max(0, vacancy - stats.SHORTLISTED) : null}
          onConfirm={confirmShortlist}
          onClose={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
};

export default DriveDetailPage;
