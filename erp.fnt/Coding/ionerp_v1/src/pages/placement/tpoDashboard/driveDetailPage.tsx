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
  User,
  Award,
  BookOpen,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import axiosInstance from "../../../utils/api";
import { PlacementApiEndpoint } from "../../../utils/ApiEndpoint/placementApiEndpoints";
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
  override_reason?: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<
  AppStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  APPLIED: { label: "Applied", bg: "#dbeafe", text: "#1d4ed8", border: "#93c5fd" },
  SHORTLISTED: { label: "Shortlisted", bg: "#fef9c3", text: "#854d0e", border: "#fde047" },
  WAITLISTED: { label: "Waitlisted", bg: "#e0e7ff", text: "#4338ca", border: "#a5b4fc" },
  IN_PROCESS: { label: "In Process", bg: "#fce7f3", text: "#9d174d", border: "#f9a8d4" },
  OFFERED: { label: "Offered", bg: "#d1fae5", text: "#065f46", border: "#6ee7b7" },
  REJECTED: { label: "Rejected", bg: "#fee2e2", text: "#991b1b", border: "#fca5a5" },
  WITHDRAWN: { label: "Withdrawn", bg: "#f3f4f6", text: "#6b7280", border: "#d1d5db" },
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

const StatusBadge: React.FC<{
  status: AppStatus;
  overrideReason?: string | null;
  onClickReason?: () => void;
}> = ({ status, overrideReason, onClickReason }) => {
  if (status === "SHORTLISTED" && overrideReason) {
    return (
      <span
        title="Click to view TPO remarks"
        onClick={onClickReason}
        style={{
          padding: "3px 10px",
          borderRadius: 20,
          fontSize: 11,
          fontWeight: 700,
          background: "#f0fdf4",
          color: "#166534",
          border: "1.5px solid #4ade80",
          whiteSpace: "nowrap",
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          cursor: "pointer"
        }}
      >
        🛡 Shortlisted by TPO
      </span>
    );
  }
  if (status === "REJECTED" && overrideReason) {
    return (
      <span
        title="Click to view TPO remarks"
        onClick={onClickReason}
        style={{
          padding: "3px 10px",
          borderRadius: 20,
          fontSize: 11,
          fontWeight: 700,
          background: "#fef2f2",
          color: "#991b1b",
          border: "1.5px solid #fca5a5",
          whiteSpace: "nowrap",
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          cursor: "pointer"
        }}
      >
        ✕ Rejected by TPO
      </span>
    );
  }
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

// ─── Student Profile Modal ──────────────────────────────────────────────────────────────────

const StudentProfileModal: React.FC<{
  applicant: DriveApplicant;
  onClose: () => void;
  onViewTpoRemarks?: (remarks: { studentName: string; reason: string; status: string }) => void;
}> = ({ applicant, onClose, onViewTpoRemarks }) => {
  const [skills, setSkills] = useState<any[]>([]);
  const [certs, setCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [sRes, cRes] = await Promise.all([
          axiosInstance.get(PlacementApiEndpoint.studentProfile.get_skills, {
            params: { profile_id: applicant.profile_id },
          }),
          axiosInstance.get(PlacementApiEndpoint.studentProfile.get_certifications, {
            params: { profile_id: applicant.profile_id },
          }),
        ]);
        setSkills((sRes.data as any)?.data ?? []);
        setCerts((cRes.data as any)?.data ?? []);
      } catch {
        setSkills([]);
        setCerts([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [applicant.profile_id]);

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.55)",
        zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center",
        backdropFilter: "blur(3px)",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 16,
          width: "100%",
          maxWidth: 520,
          maxHeight: "85vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 64px rgba(0,0,0,0.22)",
        }}
      >
        {/* Header */}
        <div style={{ background: `linear-gradient(135deg, ${CLR.navy} 0%, ${CLR.navyLight} 100%)`, padding: "18px 22px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <User size={20} color="#fff" />
            </div>
            <div>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>{applicant.name}</div>
              <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, marginTop: 1 }}>{applicant.usno} • {applicant.email}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 20, fontWeight: 700, lineHeight: 1 }}>
            ×
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ padding: "20px 22px", overflowY: "auto", flex: 1 }}>

          {/* Quick stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
            {[
              { label: "Department", value: applicant.department, color: CLR.navy },
              { label: "CGPA", value: applicant.cgpa?.toFixed(2) ?? "—", color: applicant.cgpa >= 8 ? "#065f46" : applicant.cgpa >= 6 ? "#1d4ed8" : "#dc2626" },
              { label: "Backlogs", value: applicant.backlogs === 0 ? "None" : `${applicant.backlogs}`, color: applicant.backlogs > 0 ? "#dc2626" : "#374151" },
            ].map((item) => (
              <div key={item.label} style={{ background: "#f8fafc", borderRadius: 8, padding: "10px 12px", border: "1px solid #e5e7eb" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#aaa", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: item.color }}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* Current Status */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#888", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 8 }}>
              Current Status
            </div>
            <StatusBadge
              status={applicant.status}
              overrideReason={applicant.override_reason}
              onClickReason={() =>
                applicant.override_reason &&
                onViewTpoRemarks &&
                onViewTpoRemarks({
                  studentName: applicant.name,
                  reason: applicant.override_reason,
                  status: applicant.status,
                })
              }
            />
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "24px 0", color: "#aaa" }}>
              <Loader2 size={22} className="animate-spin" style={{ color: CLR.navyLight, margin: "0 auto 8px" }} />
              <div style={{ fontSize: 12 }}>Loading profile…</div>
            </div>
          ) : (
            <>
              {/* Skills */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                  <Award size={13} color={CLR.navyLight} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#888", letterSpacing: "0.5px", textTransform: "uppercase" }}>Skills</span>
                </div>
                {skills.length === 0 ? (
                  <div style={{ fontSize: 12, color: "#bbb", fontStyle: "italic" }}>No skills added</div>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {skills.map((sk: any, idx: number) => (
                      <span key={idx} style={{ padding: "4px 10px", background: "#eff6ff", color: CLR.navyLight, border: "1px solid #bfdbfe", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                        {sk.skill_name ?? sk.skill ?? sk.name ?? JSON.stringify(sk)}
                        {sk.proficiency_level && <span style={{ color: "#93c5fd", marginLeft: 4 }}>({sk.proficiency_level})</span>}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Certifications */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                  <BookOpen size={13} color={CLR.navyLight} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#888", letterSpacing: "0.5px", textTransform: "uppercase" }}>Certifications</span>
                </div>
                {certs.length === 0 ? (
                  <div style={{ fontSize: 12, color: "#bbb", fontStyle: "italic" }}>No certifications added</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {certs.map((cert: any, idx: number) => (
                      <div key={idx} style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "8px 12px" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#065f46" }}>{cert.certification_name ?? cert.title ?? cert.name ?? "Certification"}</div>
                        {cert.issuing_organization && <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>🏢 {cert.issuing_organization}</div>}
                        {cert.issue_date && <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 1 }}>📅 {cert.issue_date}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
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
          The system will automatically shortlist up to{" "}
          <strong style={{ color: "#16a34a" }}>
            {vacancy !== null && vacancy > 0 ? `${vacancy} student${vacancy !== 1 ? "s" : ""}` : "all eligible students"}
          </strong>{" "}
          using a <strong>two-phase priority approach</strong>:
        </p>
        <div
          style={{
            background: "#f0fdf4",
            border: "1px solid #86efac",
            borderRadius: 8,
            padding: "10px 14px",
            fontSize: 12,
            color: "#166534",
            marginBottom: 8,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Phase 1 — Eligible Branch Students (Priority)</div>
          <div>Students from configured eligible branches, sorted by CGPA ↓, shortlisted first up to vacancy.</div>
        </div>
        <div
          style={{
            background: "#eef2ff",
            border: "1px solid #a5b4fc",
            borderRadius: 8,
            padding: "10px 14px",
            fontSize: 12,
            color: "#3730a3",
            marginBottom: 8,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Phase 2 — CGPA Fill-up (only if slots remain)</div>
          <div>Remaining slots filled from <em>other</em> branches with CGPA ≥ min threshold, sorted by CGPA ↓ (9.3 → 9.0 → 8.7…) until shortlisted = vacancy.</div>
        </div>
        <div
          style={{
            background: "#fef9c3",
            border: "1px solid #fde047",
            borderRadius: 8,
            padding: "10px 14px",
            fontSize: 12,
            color: "#713f12",
            marginBottom: 18,
          }}
        >
          🕐 Everyone else → <strong>WAITLISTED</strong>
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


// ─── Resume Viewer Modal ────────────────────────────────────────────────────────

const ResumeViewerModal: React.FC<{
  src: string;
  studentName: string;
  onClose: () => void;
  onDownload: () => void;
}> = ({ src, studentName, onClose, onDownload }) => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.88)",
      zIndex: 9999,
      display: "flex",
      flexDirection: "column",
    }}
    onClick={onClose}
  >
    {/* Header */}
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 32px",
        color: "#fff"
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ fontSize: 18, fontWeight: 600 }}>{studentName}'s Resume</div>
      <div style={{ display: "flex", gap: 16 }}>
        <button
          onClick={onDownload}
          style={{
            background: "rgba(255,255,255,0.1)",
            border: "none",
            color: "#fff",
            padding: "8px 16px",
            borderRadius: 6,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8
          }}
        >
          <Download size={18} /> Download
        </button>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "#fff",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <XCircle size={28} />
        </button>
      </div>
    </div>
    {/* PDF frame */}
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        flex: 1,
        padding: "0 32px 20px",
        minHeight: 0,
        position: "relative",
      }}
    >
      <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 4, overflow: "hidden", background: "#323639" }}>
        {/* Cover the built-in PDF toolbar of the browser */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 50, background: "#323639", zIndex: 10, pointerEvents: "none" }} />
        <iframe
          src={src}
          style={{ width: "100%", height: "calc(100% + 50px)", border: "none", marginTop: -50 }}
          title={`${studentName} Resume`}
        />
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

  // Resume viewer modal
  const [resumeViewerSrc, setResumeViewerSrc] = useState<string | null>(null);
  const [resumeViewerName, setResumeViewerName] = useState<string>("");
  const handleCloseResumeViewer = useCallback(() => {
    if (resumeViewerSrc) setTimeout(() => URL.revokeObjectURL(resumeViewerSrc), 5_000);
    setResumeViewerSrc(null);
    setResumeViewerName("");
  }, [resumeViewerSrc]);

  // Student profile viewer modal
  const [profileViewer, setProfileViewer] = useState<DriveApplicant | null>(null);

  // TPO Remarks popup modal state
  const [tpoRemarks, setTpoRemarks] = useState<{ studentName: string; reason: string; status: string } | null>(null);
  const [hasToastedOverrides, setHasToastedOverrides] = useState(false);

  // Reset toast on drive change
  useEffect(() => {
    setHasToastedOverrides(false);
  }, [driveId]);

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
        const apps = Array.isArray(body.data?.applicants)
          ? body.data.applicants
          : Array.isArray(body.data)
            ? body.data
            : [];
        setApplicants(apps);

        // Display a toast popup summarizing TPO decisions on page load
        if (!hasToastedOverrides && apps.length > 0) {
          const overrides = apps.filter((a: any) => a.override_reason);
          if (overrides.length > 0) {
            const approved = overrides.filter((a: any) => a.status === "SHORTLISTED").map((a: any) => a.name);
            const rejected = overrides.filter((a: any) => a.status === "REJECTED").map((a: any) => a.name);
            let summary = "";
            if (approved.length > 0) summary += `Shortlisted: ${approved.join(", ")}. `;
            if (rejected.length > 0) summary += `Rejected: ${rejected.join(", ")}.`;
            if (summary) {
              toast.info(`TPO Override Decisions: ${summary}`, { autoClose: 10000 });
              setHasToastedOverrides(true);
            }
          }
        }
      }
    } catch {
      toast.error("Failed to load applicants.");
    } finally {
      setAppLoading(false);
    }
  }, [driveId, hasToastedOverrides]);

  useEffect(() => {
    fetchApplicants();
  }, [fetchApplicants]);

  // ── Computed stats ─────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const count = (s: AppStatus) =>
      applicants.filter((a) => a.status === s).length;
    return {
      APPLIED: count("APPLIED"),
      SHORTLISTED: count("SHORTLISTED"),
      WAITLISTED: count("WAITLISTED"),
      REJECTED: count("REJECTED"),
      IN_PROCESS: count("IN_PROCESS"),
      WITHDRAWN: count("WITHDRAWN"),
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

  const someChecked =
    filtered.some((a) => selected.has(a.application_id)) && !allChecked;

  const toggleAll = () => {
    if (allChecked) {
      // Deselect all visible
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((a) => next.delete(a.application_id));
        return next;
      });
    } else {
      // Select all visible (any status — for resume bulk download)
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((a) => next.add(a.application_id));
        return next;
      });
    }
  };

  // ── Run shortlisting (auto — no manual selection needed) ──────────────────
  const [autoShortlisting, setAutoShortlisting] = useState(false);

  const handleRunShortlisting = () => {
    const vac = drive?.vacancy_count ?? null;
    const isUnlimited = vac === null || vac <= 0;
    const totalCount = applicants.length;
    const alreadyShortlisted = stats.SHORTLISTED;
    const remainingVacancy = !isUnlimited && vac !== null ? vac - alreadyShortlisted : null;

    // Already at capacity?
    if (!isUnlimited && remainingVacancy !== null && remainingVacancy <= 0) {
      toast.warn(`Vacancy cap (${vac}) already reached — ${alreadyShortlisted} shortlisted.`);
      return;
    }
    // Need more total applicants than vacancy to run auto-shortlisting
    if (!isUnlimited && vac !== null && totalCount <= vac) {
      toast.warn(
        `Total applied (${totalCount}) must exceed vacancy (${vac}) to run auto-shortlisting.`
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


  // ── Open resume in modal viewer ───────────────────────────────────────────
  const handleOpenResume = useCallback(async (resumeId: number, studentName: string) => {
    try {
      const res = await axiosInstance.get(
        PlacementApiEndpoint.studentProfile.download_resume,
        { params: { resume_id: resumeId }, responseType: "blob" }
      );
      const blob = new Blob([res.data as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setResumeViewerSrc(url + '#toolbar=0&navpanes=0&scrollbar=0');
      setResumeViewerName(studentName);
    } catch {
      toast.error("Could not load resume. Please try again.");
    }
  }, []);

  // ── Download resume ───────────────────────────────────────────────────────
  const handleDownloadResume = useCallback(async (resumeId: number, studentName: string) => {
    try {
      const res = await axiosInstance.get(
        PlacementApiEndpoint.studentProfile.download_resume,
        { params: { resume_id: resumeId }, responseType: "blob" }
      );
      const blob = new Blob([res.data as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${studentName}_resume.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5_000);
    } catch {
      toast.error("Could not download resume. Please try again.");
    }
  }, []);

  // ── Bulk download resumes for selected applicants ──────────────────────
  const [bulkDownloading, setBulkDownloading] = useState(false);

  const handleBulkDownloadResumes = useCallback(async () => {
    const selectedApplicants = applicants.filter(
      (a) => selected.has(a.application_id) && a.resume_id !== null
    );
    if (selectedApplicants.length === 0) {
      toast.warn("No selected students have a resume to download.");
      return;
    }
    setBulkDownloading(true);
    let downloaded = 0;
    let failed = 0;
    for (const applicant of selectedApplicants) {
      try {
        const res = await axiosInstance.get(
          PlacementApiEndpoint.studentProfile.download_resume,
          { params: { resume_id: applicant.resume_id }, responseType: "blob" }
        );
        const blob = new Blob([res.data as ArrayBuffer], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${applicant.name}_resume.pdf`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 5_000);
        downloaded++;
        // Small delay between downloads so browser doesn't block them
        await new Promise((r) => setTimeout(r, 400));
      } catch {
        failed++;
      }
    }
    setBulkDownloading(false);
    if (downloaded > 0) toast.success(`${downloaded} resume${downloaded > 1 ? "s" : ""} downloaded.`);
    if (failed > 0) toast.error(`${failed} resume${failed > 1 ? "s" : ""} failed to download.`);
  }, [applicants, selected]);

  // ── Export applicants to Excel (.xls) ────────────────────────────────────
  const handleExportExcel = useCallback(() => {
    const driveName = drive?.drive_name ?? "applicants";
    const dateStr = new Date().toISOString().slice(0, 10);
    const esc = (v: string | number) =>
      String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const headers = ["#", "Student Name", "USN", "Email", "Branch", "CGPA", "Backlogs", "Applied On", "Status"];
    const headerXml = headers
      .map((h) => `<Cell><Data ss:Type="String">${esc(h)}</Data></Cell>`)
      .join("");
    const rowsXml = filtered
      .map((a, idx) => {
        const vals: (string | number)[] = [
          idx + 1, a.name, a.usno, a.email, a.department,
          a.cgpa, a.backlogs, fmtDate(a.applied_at), a.status,
        ];
        const cells = vals
          .map((v, ci) =>
            `<Cell><Data ss:Type="${ci === 0 || ci === 5 || ci === 6 ? "Number" : "String"
            }">${esc(v)}</Data></Cell>`
          )
          .join("");
        return `<Row>${cells}</Row>`;
      })
      .join("");
    const xml = [
      `<?xml version="1.0"?>`,
      `<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"`,
      `  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">`,
      `  <Worksheet ss:Name="Applicants"><Table>`,
      `    <Row>${headerXml}</Row>${rowsXml}`,
      `  </Table></Worksheet></Workbook>`,
    ].join("\n");
    const blob = new Blob([xml], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${driveName}_applicants_${dateStr}.xls`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 5_000);
  }, [filtered, drive]);

  // ── Shortlist ALL applied students (when applied ≤ vacancy after deadline) ──────
  const [shortlistingAll, setShortlistingAll] = useState(false);

  const handleShortlistAll = async () => {
    const appliedStudents = applicants.filter((a) => a.status === "APPLIED");
    if (appliedStudents.length === 0) {
      toast.warn("No APPLIED students to shortlist.");
      return;
    }
    if (!window.confirm(
      `Shortlist all ${appliedStudents.length} applied student${appliedStudents.length > 1 ? "s" : ""}?\n\n` +
      `(Application deadline has passed and applied count is within vacancy.)`
    )) return;
    setShortlistingAll(true);
    try {
      const res = await axiosInstance.post(
        PlacementApiEndpoint.applications.shortlist,
        { drive_id: Number(driveId), application_ids: appliedStudents.map((a) => a.application_id) }
      );
      const body = res.data as any;
      if (body?.status) {
        toast.success(`${appliedStudents.length} student${appliedStudents.length > 1 ? "s" : ""} shortlisted.`);
        fetchApplicants();
      } else {
        toast.error(body?.message || "Shortlist All failed.");
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data?.detail || "Shortlist All failed.";
      toast.error(typeof msg === "string" ? msg : "Shortlist All failed.");
    } finally {
      setShortlistingAll(false);
    }
  };

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

  // ── Shortlist single waitlisted applicant ─────────────────────────────────
  const handleShortlistOne = async (applicationId: number, studentName: string) => {
    try {
      const res = await axiosInstance.post(
        PlacementApiEndpoint.applications.shortlist,
        { drive_id: Number(driveId), application_ids: [applicationId] }
      );
      const body = res.data as any;
      if (body?.status) {
        toast.success(`${studentName} has been shortlisted.`);
        fetchApplicants();
      } else {
        toast.error(body?.message || "Shortlist failed.");
      }
    } catch {
      toast.error("Shortlist failed.");
    }
  };

  // ── Bulk action state ─────────────────────────────────────────────────────
  const [bulkActioning, setBulkActioning] = useState<"shortlist" | "reject" | "waitlist" | null>(null);

  // ── Bulk shortlist selected waitlisted applicants ─────────────────────────
  const handleBulkShortlist = async () => {
    const waitlistSelected = applicants.filter(
      (a) => selected.has(a.application_id) && a.status === "WAITLISTED"
    );
    if (waitlistSelected.length === 0) {
      toast.warn("No waitlisted students selected.");
      return;
    }
    if (!window.confirm(`Shortlist ${waitlistSelected.length} selected waitlisted student${waitlistSelected.length > 1 ? "s" : ""}?`)) return;
    setBulkActioning("shortlist");
    try {
      const res = await axiosInstance.post(
        PlacementApiEndpoint.applications.shortlist,
        { drive_id: Number(driveId), application_ids: waitlistSelected.map((a) => a.application_id) }
      );
      const body = res.data as any;
      if (body?.status) {
        toast.success(`${waitlistSelected.length} student${waitlistSelected.length > 1 ? "s" : ""} shortlisted.`);
        setSelected(new Set());
        fetchApplicants();
      } else {
        toast.error(body?.message || "Bulk shortlist failed.");
      }
    } catch {
      toast.error("Bulk shortlist failed.");
    } finally {
      setBulkActioning(null);
    }
  };

  // ── Bulk reject selected waitlisted applicants ────────────────────────────
  const handleBulkReject = async () => {
    const waitlistSelected = applicants.filter(
      (a) => selected.has(a.application_id) && a.status === "WAITLISTED"
    );
    if (waitlistSelected.length === 0) {
      toast.warn("No waitlisted students selected.");
      return;
    }
    if (!window.confirm(`Reject ${waitlistSelected.length} selected waitlisted student${waitlistSelected.length > 1 ? "s" : ""}? This cannot be undone.`)) return;
    setBulkActioning("reject");
    let done = 0;
    let failed = 0;
    for (const applicant of waitlistSelected) {
      try {
        const res = await axiosInstance.post(
          PlacementApiEndpoint.applications.reject,
          { application_id: applicant.application_id }
        );
        const body = res.data as any;
        if (body?.status) done++; else failed++;
      } catch { failed++; }
    }
    setBulkActioning(null);
    if (done > 0) toast.success(`${done} student${done > 1 ? "s" : ""} rejected.`);
    if (failed > 0) toast.error(`${failed} rejection${failed > 1 ? "s" : ""} failed.`);
    setSelected(new Set());
    fetchApplicants();
  };

  // ── Move single shortlisted student back to waitlist ──────────────────────────
  const handleWaitlistOne = async (applicationId: number, studentName: string) => {
    if (!window.confirm(`Move ${studentName} back to Waitlist?`)) return;
    try {
      const res = await axiosInstance.post(
        PlacementApiEndpoint.applications.waitlist,
        { application_id: applicationId }
      );
      const body = res.data as any;
      if (body?.status) {
        toast.success(`${studentName} moved to waitlist.`);
        fetchApplicants();
      } else {
        toast.error(body?.message || "Waitlist failed.");
      }
    } catch {
      toast.error("Waitlist failed.");
    }
  };

  // ── Bulk move selected shortlisted students back to waitlist ───────────────────
  const handleBulkWaitlist = async () => {
    const shortlistSelected = applicants.filter(
      (a) => selected.has(a.application_id) && a.status === "SHORTLISTED"
    );
    if (shortlistSelected.length === 0) {
      toast.warn("No shortlisted students selected.");
      return;
    }
    if (!window.confirm(`Move ${shortlistSelected.length} student${shortlistSelected.length > 1 ? "s" : ""} back to Waitlist?`)) return;
    setBulkActioning("waitlist");
    let done = 0;
    let failed = 0;
    for (const applicant of shortlistSelected) {
      try {
        const res = await axiosInstance.post(
          PlacementApiEndpoint.applications.waitlist,
          { application_id: applicant.application_id }
        );
        const body = res.data as any;
        if (body?.status) done++; else failed++;
      } catch { failed++; }
    }
    setBulkActioning(null);
    if (done > 0) toast.success(`${done} student${done > 1 ? "s" : ""} moved to waitlist.`);
    if (failed > 0) toast.error(`${failed} failed.`);
    setSelected(new Set());
    fetchApplicants();
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

          {/* Back button — right side */}
          <button
            onClick={() => navigate("/tpo/placement-drive")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "8px 18px",
              fontSize: 13,
              fontWeight: 700,
              color: "#fff",
              background: CLR.navy,
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              transition: "background 0.15s",
              alignSelf: "flex-start",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = CLR.navyLight)}
            onMouseLeave={(e) => (e.currentTarget.style.background = CLR.navy)}
          >
            Back
          </button>

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
        {stats.WITHDRAWN > 0 && (
          <StatCard
            icon={<X size={18} />}
            label="Withdrawn"
            value={stats.WITHDRAWN}
            accent="#6b7280"
            bg="#f3f4f6"
            active={filterStatus === "WITHDRAWN"}
            onClick={() =>
              setFilterStatus(filterStatus === "WITHDRAWN" ? "ALL" : "WITHDRAWN")
            }
          />
        )}
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
            size={14}
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#aaa",
              pointerEvents: "none",
            }}
          />
          <input
            id="drive-detail-search"
            type="text"
            placeholder=""
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 10px 8px 34px",
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
            <option value="SHORTLISTED">Shortlisted</option>
            <option value="WAITLISTED">Waitlisted</option>
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
          onClick={handleExportExcel}
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

        {/* Run Shortlisting + Shortlist All logic */}
        {(() => {
          const appliedCount = applicants.filter((a) => a.status === "APPLIED").length;
          const totalCount = applicants.length;
          const capReached = vacancy !== null && stats.SHORTLISTED >= vacancy;
          const deadlinePassed = drive?.application_deadline
            ? new Date() > new Date(drive.application_deadline)
            : false;
          // Shortlist All: deadline passed AND applied ≤ vacancy (or no vacancy cap)
          const canShortlistAll =
            !capReached &&
            !shortlistingAll &&
            appliedCount > 0 &&
            deadlinePassed &&
            (vacancy === null || appliedCount <= vacancy);
          // Run Shortlisting: applied > vacancy
          const canRun =
            !capReached &&
            !autoShortlisting &&
            (vacancy === null || totalCount > vacancy);

          return (
            <>
              {/* Info banner: deadline passed but applied ≤ vacancy */}
              {!capReached && deadlinePassed && vacancy !== null && appliedCount <= vacancy && appliedCount > 0 && (
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
                  Deadline passed — {appliedCount} applied ≤ {vacancy} vacancy
                </div>
              )}

              {/* Shortlist All button (post-deadline, applied ≤ vacancy) */}
              {canShortlistAll && (
                <button
                  id="shortlist-all-btn"
                  onClick={handleShortlistAll}
                  disabled={shortlistingAll}
                  title={`Deadline passed and applied (${appliedCount}) ≤ vacancy (${vacancy}). Shortlist all applied students.`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 16px",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#fff",
                    background: shortlistingAll ? "#6b7280" : "#16a34a",
                    border: "none",
                    borderRadius: 6,
                    cursor: shortlistingAll ? "not-allowed" : "pointer",
                    transition: "background 0.18s",
                  }}
                >
                  <CheckCircle2 size={13} />
                  {shortlistingAll ? "Shortlisting…" : `Shortlist All (${appliedCount})`}
                </button>
              )}

              {/* Run Shortlisting button (applied > vacancy) */}
              <button
                id="run-shortlisting-btn"
                onClick={handleRunShortlisting}
                disabled={!canRun || autoShortlisting}
                title={
                  capReached
                    ? `Vacancy cap reached (${vacancy})`
                    : vacancy !== null && totalCount <= vacancy
                      ? deadlinePassed
                        ? `Use "Shortlist All" above — deadline passed, applied ≤ vacancy`
                        : `Applied (${totalCount}) must exceed vacancy (${vacancy}) to run auto-shortlisting`
                      : "Auto-shortlist: branch-eligible students + high-CGPA students (any branch), sorted by CGPA"
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
            </>
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
            gridTemplateColumns: "40px minmax(0, 2fr) minmax(0, 1.2fr) minmax(0, 0.8fr) minmax(0, 0.8fr) minmax(0, 1.2fr) minmax(0, 1fr) minmax(0, 1.6fr) minmax(0, 1.4fr)",
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
              ref={(el) => { if (el) el.indeterminate = someChecked; }}
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
          <span style={{ textAlign: "center" }}>Status</span>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, flexWrap: "wrap" }}>
            <span>Actions</span>

            {/* Bulk Download — visible whenever items are selected */}
            {selected.size > 0 && (
              <button
                id="bulk-download-resumes-btn"
                onClick={handleBulkDownloadResumes}
                disabled={bulkDownloading}
                title={`Download resumes for ${selected.size} selected student${selected.size > 1 ? "s" : ""}`}
                style={{
                  display: "flex", alignItems: "center", gap: 4,
                  padding: "4px 9px", fontSize: 10, fontWeight: 700,
                  color: bulkDownloading ? "#ccc" : CLR.navy,
                  background: bulkDownloading ? "rgba(255,255,255,0.2)" : "#fff",
                  border: "none", borderRadius: 4,
                  cursor: bulkDownloading ? "not-allowed" : "pointer",
                  whiteSpace: "nowrap", transition: "background 0.15s",
                }}
              >
                <Download size={11} />
                {bulkDownloading ? "Downloading…" : `↓ Resumes (${selected.size})`}
              </button>
            )}

            {/* Bulk Shortlist + Reject — only visible on Waitlisted tab with selection */}
            {filterStatus === "WAITLISTED" && selected.size > 0 && (
              <>
                <button
                  id="bulk-shortlist-btn"
                  onClick={handleBulkShortlist}
                  disabled={bulkActioning !== null}
                  title={`Shortlist ${selected.size} selected waitlisted student${selected.size > 1 ? "s" : ""}`}
                  style={{
                    display: "flex", alignItems: "center", gap: 3,
                    padding: "4px 9px", fontSize: 10, fontWeight: 700,
                    color: bulkActioning ? "#aaa" : "#065f46",
                    background: bulkActioning ? "rgba(255,255,255,0.15)" : "#d1fae5",
                    border: "1px solid #6ee7b7", borderRadius: 4,
                    cursor: bulkActioning ? "not-allowed" : "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  ✓ {bulkActioning === "shortlist" ? "Shortlisting…" : `Shortlist (${selected.size})`}
                </button>
                <button
                  id="bulk-reject-btn"
                  onClick={handleBulkReject}
                  disabled={bulkActioning !== null}
                  title={`Reject ${selected.size} selected waitlisted student${selected.size > 1 ? "s" : ""}`}
                  style={{
                    display: "flex", alignItems: "center", gap: 3,
                    padding: "4px 9px", fontSize: 10, fontWeight: 700,
                    color: bulkActioning ? "#aaa" : "#991b1b",
                    background: bulkActioning ? "rgba(255,255,255,0.15)" : "#fee2e2",
                    border: "1px solid #fca5a5", borderRadius: 4,
                    cursor: bulkActioning ? "not-allowed" : "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  ✕ {bulkActioning === "reject" ? "Rejecting…" : `Reject (${selected.size})`}
                </button>
              </>
            )}

            {/* Bulk Waitlist — only visible on Shortlisted tab with selection */}
            {filterStatus === "SHORTLISTED" && selected.size > 0 && (
              <button
                id="bulk-waitlist-btn"
                onClick={handleBulkWaitlist}
                disabled={bulkActioning !== null}
                title={`Move ${selected.size} shortlisted student${selected.size > 1 ? "s" : ""} back to Waitlist`}
                style={{
                  display: "flex", alignItems: "center", gap: 3,
                  padding: "4px 9px", fontSize: 10, fontWeight: 700,
                  color: bulkActioning ? "#aaa" : "#4338ca",
                  background: bulkActioning ? "rgba(255,255,255,0.15)" : "#e0e7ff",
                  border: "1px solid #a5b4fc", borderRadius: 4,
                  cursor: bulkActioning ? "not-allowed" : "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                ⟳ {bulkActioning === "waitlist" ? "Moving…" : `Waitlist (${selected.size})`}
              </button>
            )}
          </div>
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
                  gridTemplateColumns: "40px minmax(0, 2fr) minmax(0, 1.2fr) minmax(0, 0.8fr) minmax(0, 0.8fr) minmax(0, 1.2fr) minmax(0, 1fr) minmax(0, 1.6fr) minmax(0, 1.4fr)",
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
                    onChange={() => toggleOne(applicant.application_id)}
                    style={{
                      cursor: "pointer",
                      width: 14,
                      height: 14,
                      accentColor: CLR.navyLight,
                    }}
                  />
                </div>

                {/* Student info */}
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: CLR.navy }}>
                    {applicant.name}
                  </div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 1 }}>{applicant.usno}</div>
                  <div style={{ fontSize: 11, color: "#bbb" }}>{applicant.email}</div>
                  <button
                    id={`view-profile-${applicant.application_id}`}
                    onClick={() => setProfileViewer(applicant)}
                    title="View student profile, skills & certifications"
                    style={{
                      marginTop: 5,
                      display: "inline-flex", alignItems: "center", gap: 3,
                      fontSize: 10, fontWeight: 700,
                      color: CLR.navyLight, background: "#eff6ff",
                      border: "1px solid #bfdbfe", borderRadius: 4,
                      padding: "2px 7px", cursor: "pointer",
                    }}
                  >
                    <User size={9} /> View Profile
                  </button>
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
                    <div style={{ display: "flex", gap: 4 }}>
                      <button
                        id={`view-resume-${applicant.application_id}`}
                        onClick={() => handleOpenResume(applicant.resume_id!, applicant.name)}
                        title="View Resume"
                        style={{
                          display: "flex", alignItems: "center", gap: 3,
                          fontSize: 11, fontWeight: 700,
                          color: CLR.navyLight, background: "#eff6ff",
                          border: "1px solid #bfdbfe", borderRadius: 4,
                          padding: "3px 7px", cursor: "pointer",
                        }}
                      >
                        👁 View
                      </button>
                      <button
                        id={`download-resume-${applicant.application_id}`}
                        onClick={() => handleDownloadResume(applicant.resume_id!, applicant.name)}
                        title="Download Resume"
                        className="relative flex items-center justify-center w-9 h-9 bg-[#7FB3FA] rounded-full overflow-hidden shadow-sm group hover:bg-[#6ba2e8] transition-colors duration-200 focus:outline-none flex-shrink-0"
                        aria-label="Download"
                      >
                        {/* Long Shadow Effect */}
                        <div
                          className="absolute w-[200%] h-[200%] bg-black/15 pointer-events-none transform rotate-45 origin-top-left left-1/2 top-1/2"
                          style={{ mixBlendMode: 'multiply' }}
                        />

                        {/* Download Icon (Arrow + Bar) */}
                        <div className="relative z-10 flex flex-col items-center justify-center w-full h-full text-white">
                          {/* Downward Arrow */}
                          <svg
                            className="w-4 h-4 transform group-hover:translate-y-0.5 transition-transform duration-200"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                            strokeLinecap="square"
                            strokeLinejoin="miter"
                          >
                            <path d="M12 4v12m0 0l-5-5m5 5l5-5" />
                          </svg>

                          {/* Horizontal Bar */}
                          <div className="w-3.5 h-[2px] bg-white mt-[1px] rounded-sm" />
                        </div>
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: 11, color: "#bbb" }}>—</span>
                  )}
                </div>

                {/* Applied On */}
                <div style={{ fontSize: 12, color: "#555" }}>
                  {fmtDate(applicant.applied_at)}
                </div>

                {/* Status (badge only) */}
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <StatusBadge
                    status={applicant.status}
                    overrideReason={applicant.override_reason}
                    onClickReason={() =>
                      applicant.override_reason &&
                      setTpoRemarks({
                        studentName: applicant.name,
                        reason: applicant.override_reason,
                        status: applicant.status,
                      })
                    }
                  />
                </div>

                {/* Actions (buttons only) */}
                <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>

                  {/* APPLIED — Reject */}
                  {applicant.status === "APPLIED" && (
                    <button
                      id={`reject-btn-${applicant.application_id}`}
                      onClick={() => handleReject(applicant.application_id, applicant.name)}
                      title="Reject this applicant"
                      style={{
                        width: "100%", padding: "4px 8px", fontSize: 10, fontWeight: 700,
                        color: "#dc2626", background: "#fff",
                        border: "1px solid #fca5a5", borderRadius: 4, cursor: "pointer",
                        whiteSpace: "nowrap", textAlign: "center",
                      }}
                    >
                      ✕ Reject
                    </button>
                  )}

                  {/* WAITLISTED — Shortlist + Reject */}
                  {applicant.status === "WAITLISTED" && (
                    <>
                      <button
                        id={`shortlist-btn-${applicant.application_id}`}
                        onClick={() => handleShortlistOne(applicant.application_id, applicant.name)}
                        title="Move to Shortlisted"
                        style={{
                          width: "100%", padding: "4px 8px", fontSize: 10, fontWeight: 700,
                          color: "#065f46", background: "#d1fae5",
                          border: "1px solid #6ee7b7", borderRadius: 4, cursor: "pointer",
                          whiteSpace: "nowrap", textAlign: "center",
                        }}
                      >
                        ✓ Shortlist
                      </button>
                      <button
                        id={`reject-waitlist-btn-${applicant.application_id}`}
                        onClick={() => handleReject(applicant.application_id, applicant.name)}
                        title="Reject this waitlisted applicant"
                        style={{
                          width: "100%", padding: "4px 8px", fontSize: 10, fontWeight: 700,
                          color: "#dc2626", background: "#fff",
                          border: "1px solid #fca5a5", borderRadius: 4, cursor: "pointer",
                          whiteSpace: "nowrap", textAlign: "center",
                        }}
                      >
                        ✕ Reject
                      </button>
                    </>
                  )}

                  {/* SHORTLISTED — Waitlist (demote) */}
                  {applicant.status === "SHORTLISTED" && (
                    <button
                      id={`waitlist-btn-${applicant.application_id}`}
                      onClick={() => handleWaitlistOne(applicant.application_id, applicant.name)}
                      title="Move back to Waitlist"
                      style={{
                        width: "100%", padding: "4px 8px", fontSize: 10, fontWeight: 700,
                        color: "#4338ca", background: "#e0e7ff",
                        border: "1px solid #a5b4fc", borderRadius: 4, cursor: "pointer",
                        whiteSpace: "nowrap", textAlign: "center",
                      }}
                    >
                      ⟳ Waitlist
                    </button>
                  )}

                  {/* REJECTED — Waitlist (restore) */}
                  {applicant.status === "REJECTED" && (
                    <span style={{ fontSize: 10, color: "#bbb", fontStyle: "italic" }}>No action</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Resume Viewer Modal ── */}
      {resumeViewerSrc && (
        <ResumeViewerModal
          src={resumeViewerSrc}
          studentName={resumeViewerName}
          onClose={handleCloseResumeViewer}
          onDownload={() => {
            const a = document.createElement("a");
            a.href = resumeViewerSrc;
            a.download = `${resumeViewerName}_resume.pdf`;
            a.click();
          }}
        />
      )}

      {/* ── Student Profile Modal ── */}
      {profileViewer && (
        <StudentProfileModal
          applicant={profileViewer}
          onClose={() => setProfileViewer(null)}
          onViewTpoRemarks={(remarks) => setTpoRemarks(remarks)}
        />
      )}

      {/* ── TPO Remarks Modal Popup ── */}
      {tpoRemarks && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "Inter, sans-serif"
        }}>
          <div style={{ background: "#fff", padding: 24, borderRadius: 12, width: 400, boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
            <h3 style={{ margin: "0 0 12px 0", fontSize: 16, fontWeight: 700, color: CLR.navy }}>
              TPO Override Remarks
            </h3>
            <p style={{ margin: "0 0 8px 0", fontSize: 13, color: "#374151" }}>
              <strong>Student:</strong> {tpoRemarks.studentName}
            </p>
            <p style={{ margin: "0 0 8px 0", fontSize: 13, color: "#374151" }}>
              <strong>Status:</strong> <span style={{ color: tpoRemarks.status === "SHORTLISTED" ? "#166534" : "#991b1b", fontWeight: 700 }}>
                {tpoRemarks.status === "SHORTLISTED" ? "Shortlisted by TPO" : "Rejected by TPO"}
              </span>
            </p>
            <div style={{ margin: "12px 0 20px 0" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Remarks / Justification</div>
              <div style={{ background: "#f9fafb", padding: 12, borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, color: "#4b5563", minHeight: 60, whiteSpace: "pre-wrap" }}>
                {tpoRemarks.reason}
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setTpoRemarks(null)}
                style={{
                  padding: "8px 16px", background: CLR.navy, color: "#fff",
                  border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer"
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
