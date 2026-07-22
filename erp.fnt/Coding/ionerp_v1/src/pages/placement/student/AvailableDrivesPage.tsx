import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import * as profileService from "./studentProfileService";
import {
  DriveListItem,
  DriveEligibleBranch,
  DriveRound,
  applyToDrive,
  withdrawFromDrive,
  getMyApplications,
  mapAppStatus,
} from "./studentProfileService";
import { AllStudentRow } from "./studentProfileTypes";

// ─── Types ────────────────────────────────────────────────────────────────────

type DriveType = "On-Campus" | "Off-Campus" | "Pool Campus";
type Tier = 1 | 2 | 3;
type ApplyStatus = "not_applied" | "applied" | "shortlisted" | "rejected";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtSalary = (min: number | null, max: number | null) => {
  if (!min && !max) return "Not disclosed";
  if (!max || min === max) return `${min} LPA`;
  return `${min}–${max} LPA`;
};

const fmtDate = (d: string | null) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const daysLeft = (d: string | null) => {
  if (!d) return 999;
  const diff = new Date(d).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
};

const TIER_COLOR: Record<number, { bg: string; color: string }> = {
  1: { bg: "#17375e", color: "#fff" },
  2: { bg: "#2563eb", color: "#fff" },
  3: { bg: "#6b7280", color: "#fff" },
};

const STATUS_CONFIG: Record<ApplyStatus, { label: string; bg: string; color: string }> = {
  not_applied: { label: "Not Applied", bg: "#f3f4f6", color: "#555" },
  applied:     { label: "Applied",     bg: "#dbeafe", color: "#1d4ed8" },
  shortlisted: { label: "Shortlisted", bg: "#d1fae5", color: "#065f46" },
  rejected:    { label: "Rejected",    bg: "#fee2e2", color: "#991b1b" },
};

// ─── Main Component ───────────────────────────────────────────────────────────

const AvailableDrivesPage: React.FC = () => {
  // ── URL param: student_id present means came via "View Drives" from profile ──
  const [searchParams] = useSearchParams();
  const profileStudentId = Number(searchParams.get("student_id")) || null;
  const profileMode = profileStudentId !== null;

  // ── Drives from API ───────────────────────────────────────────────────────
  const [drives, setDrives] = useState<DriveListItem[]>([]);
  const [loadingDrives, setLoadingDrives] = useState(true);

  // Drive detail cache: driveId → { branches, rounds, description }
  const [detailCache, setDetailCache] = useState<Record<number, DriveListItem>>({});
  const [loadingDetail, setLoadingDetail] = useState<number | null>(null);

  const loadDrives = useCallback(async () => {
    setLoadingDrives(true);
    try {
      const data = await profileService.getActiveDrives();
      setDrives(Array.isArray(data) ? data : []);
    } catch {
      setDrives([]);
    } finally {
      setLoadingDrives(false);
    }
  }, []);

  useEffect(() => { loadDrives(); }, [loadDrives]);

  // ── Students from API (only needed in profileMode: TPO viewing drives for a student) ─────
  const [allStudents, setAllStudents] = useState<AllStudentRow[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(profileMode);

  const loadStudents = useCallback(async () => {
    if (!profileMode) {
      // Student accessing directly — no need to load all students list
      setLoadingStudents(false);
      return;
    }
    setLoadingStudents(true);
    try {
      // getAllStudentsList returns StudentsListResponse { students: [], total_count, ... }
      // NOT a plain array — must access .students
      const response = await profileService.getAllStudentsList();
      setAllStudents(Array.isArray(response?.students) ? response.students : []);
    } catch {
      setAllStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  }, [profileMode]);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  // ── Selected student ──────────────────────────────────────────────────────
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(profileStudentId);

  useEffect(() => {
    if (profileMode) setSelectedStudentId(profileStudentId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileStudentId]);

  const selectedStudent = useMemo(
    () => (selectedStudentId ? allStudents.find((s) => s.student_id === selectedStudentId) ?? null : null),
    [selectedStudentId, allStudents]
  );

  // Student attributes for eligibility check
  const STUDENT_CGPA     = selectedStudent ? (selectedStudent.current_cgpa ?? selectedStudent.cgpa_actual ?? 0) : 0;
  const STUDENT_BACKLOGS = selectedStudent?.backlogs ?? 0;
  const STUDENT_DEPT_ID  = selectedStudent?.department_id ?? null;
  const STUDENT_BATCH_ID = (selectedStudent as any)?.academic_batch_id ?? null;

  // ── Filters ───────────────────────────────────────────────────────────────
  const [search, setSearch]                     = useState("");
  const [typeFilter, setTypeFilter]             = useState<DriveType | "All">("All");
  const [tierFilter, setTierFilter]             = useState<number>(0);
  const [showEligibleOnly, setShowEligibleOnly] = useState(false);
  const [expandedId, setExpandedId]             = useState<number | null>(null);

  // ── Apply map (per drive) ─────────────────────────────────────────────────
  const [applyMap, setApplyMap]     = useState<Record<number, ApplyStatus>>({});
  const [applying, setApplying]     = useState<number | null>(null);
  const [applySuccess, setApplySuccess] = useState<number | null>(null);
  const [withdrawing, setWithdrawing]   = useState<number | null>(null);
  const [withdrawSuccess, setWithdrawSuccess] = useState<number | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);

  // ── Load real application statuses from backend on student change ─────────
  useEffect(() => {
    const profileId = selectedStudent?.profile_id ?? null;
    if (!profileId) return;
    getMyApplications(profileId).then((apps) => {
      const map: Record<number, ApplyStatus> = {};
      apps.forEach((a) => { map[a.drive_id] = mapAppStatus(a.status); });
      setApplyMap(map);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStudent?.profile_id]);

  // ── Eligibility logic (based on dept_id + batch_year + cgpa + backlogs) ───
  const isEligible = useCallback((d: DriveListItem): boolean => {
    if (!selectedStudent) return false;
    const cgpaOk    = STUDENT_CGPA >= d.min_cgpa;
    const backlogOk = STUDENT_BACKLOGS <= d.max_backlogs;

    // Check branch match using eligible_branches from detail cache
    const detail    = detailCache[d.drive_id];
    const branches: DriveEligibleBranch[] = detail?.eligible_branches ?? [];

    // If detail not loaded yet: only check cgpa + backlogs
    if (branches.length === 0) return cgpaOk && backlogOk;

    // Match: student's dept_id must be in eligible branches
    const branchMatch = branches.some((b) => b.dept_id === STUDENT_DEPT_ID);
    return cgpaOk && backlogOk && branchMatch;
  }, [STUDENT_CGPA, STUDENT_BACKLOGS, STUDENT_DEPT_ID, selectedStudent, detailCache]);

  // ── Load drive detail when expanded ──────────────────────────────────────
  const handleExpand = useCallback(async (driveId: number) => {
    if (expandedId === driveId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(driveId);
    if (!detailCache[driveId]) {
      setLoadingDetail(driveId);
      const detail = await profileService.getDriveDetail(driveId);
      if (detail) {
        setDetailCache((prev) => ({ ...prev, [driveId]: detail }));
      }
      setLoadingDetail(null);
    }
  }, [expandedId, detailCache]);

  // ── Filtered drives ───────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return drives.filter((d) => {
      if (
        search &&
        !d.company_name.toLowerCase().includes(search.toLowerCase()) &&
        !d.job_role.toLowerCase().includes(search.toLowerCase()) &&
        !d.drive_name.toLowerCase().includes(search.toLowerCase())
      ) return false;
      if (typeFilter !== "All" && d.drive_type !== typeFilter) return false;
      if (tierFilter !== 0 && d.tier !== tierFilter) return false;
      if (showEligibleOnly && !isEligible(d)) return false;
      return true;
    });
  }, [drives, search, typeFilter, tierFilter, showEligibleOnly, isEligible]);

  const eligibleCount = drives.filter(isEligible).length;
  const appliedCount  = Object.values(applyMap).filter(
    (s) => s === "applied" || s === "shortlisted"
  ).length;

  // ── Apply handler (real API) ──────────────────────────────────────────────
  const handleApply = async (driveId: number) => {
    const profileId = selectedStudent?.profile_id;
    const studentId = selectedStudent?.student_id;
    if (!profileId) { openRegisterModal(); return; }

    setApplying(driveId);
    setApplyError(null);

    try {
      // 1. Fetch the student's active resume first
      let activeResumeId: number | null = null;
      if (studentId) {
        const resumes = await profileService.getResumes(studentId);
        const active  = resumes.find((r) => r.is_active === 1 && r.status === 1);
        activeResumeId = active?.resume_id ?? null;
      }

      // 2. Submit application with active resume_id (null if no resume uploaded yet)
      const result = await applyToDrive(driveId, profileId, activeResumeId);
      if (result) {
        setApplyMap((prev) => ({ ...prev, [driveId]: mapAppStatus(result.status) }));
        setApplySuccess(driveId);
        setTimeout(() => setApplySuccess(null), 2500);
      } else {
        setApplyError("Failed to submit application. Please try again.");
      }
    } catch {
      setApplyError("Failed to submit application. Please try again.");
    } finally {
      setApplying(null);
    }
  };


  // ── Withdraw handler (real API) ────────────────────────────────────────────
  const handleWithdraw = async (driveId: number, companyName: string) => {
    const profileId = selectedStudent?.profile_id;
    if (!profileId) return;
    
    const currentStatus = applyMap[driveId];
    const isShortlisted = currentStatus === "shortlisted";
    const confirmMsg = isShortlisted
      ? `Are you sure you want to withdraw your application for ${companyName}?\n\nYou are currently Shortlisted. Withdrawing will remove you from the shortlist and the next waitlisted student will be promoted.`
      : `Are you sure you want to withdraw your application for ${companyName}?\n\nThis action cannot be undone if rounds have already been scheduled.`;
      
    const confirmed = window.confirm(confirmMsg);
    if (!confirmed) return;
    setWithdrawing(driveId);
    try {
      const result = await withdrawFromDrive(driveId, profileId);
      if (result) {
        setApplyMap((prev) => ({ ...prev, [driveId]: "not_applied" }));
        setWithdrawSuccess(driveId);
        setTimeout(() => setWithdrawSuccess(null), 2500);
      } else {
        setApplyError("Failed to withdraw application. Please contact the TPO.");
      }
    } catch {
      setApplyError("Failed to withdraw application. Please contact the TPO.");
    } finally {
      setWithdrawing(null);
    }
  };

  // ── Not-registered modal ──────────────────────────────────────────────────
  const navigate = useNavigate();
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [navCountdown, setNavCountdown] = useState(3);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const openRegisterModal = () => {
    setNavCountdown(3);
    setShowRegisterModal(true);
    countdownRef.current = setInterval(() => {
      setNavCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          setShowRegisterModal(false);
          navigate("/student/profile");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const closeRegisterModal = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setShowRegisterModal(false);
  };

  const navigateNow = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setShowRegisterModal(false);
    navigate("/student/profile");
  };

  useEffect(() => {
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, []);

  // ── Styles ────────────────────────────────────────────────────────────────
  const cardBase: React.CSSProperties = {
    background: "#fff",
    borderRadius: 6,
    boxShadow: "0 1px 4px rgba(0,0,0,0.09)",
    overflow: "hidden",
  };

  const isLoading = loadingDrives || loadingStudents;
  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 240, color: "#888", fontSize: 14, flexDirection: "column", gap: 10 }}>
        <div style={{ fontSize: 28 }}>⏳</div>
        Loading drives...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1060, margin: "0 auto", padding: "0 4px" }}>

      {/* ── Not-Registered Popup Modal ── */}
      {showRegisterModal && (
        <div
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 9999,
            backdropFilter: "blur(2px)",
          }}
          onClick={closeRegisterModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 10,
              width: "100%",
              maxWidth: 420,
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
              overflow: "hidden",
            }}
          >
            <div style={{ background: "linear-gradient(135deg, #17375e 0%, #1e4d8c 100%)", padding: "18px 22px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>⚠️</div>
              <div>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>Registration Required</div>
                <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 2 }}>You must complete your placement profile first</div>
              </div>
              <button onClick={closeRegisterModal} style={{ marginLeft: "auto", background: "none", border: "none", color: "rgba(255,255,255,0.8)", fontSize: 20, cursor: "pointer" }}>×</button>
            </div>
            <div style={{ padding: "24px 24px 20px" }}>
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                <p style={{ fontSize: 14, color: "#333", fontWeight: 600, margin: "0 0 8px" }}>
                  <strong>{selectedStudent?.name}</strong> is not yet registered for placement.
                </p>
                <p style={{ fontSize: 13, color: "#666", margin: 0, lineHeight: 1.6 }}>
                  Please complete your <strong>Student Profile</strong> registration before applying.
                </p>
              </div>
              <div style={{ background: "#f0f4f8", borderRadius: 8, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#17375e", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800 }}>{navCountdown}</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#17375e" }}>Redirecting to Student Profile…</div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>Automatically navigating in {navCountdown}s</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={closeRegisterModal} style={{ flex: 1, padding: "10px", fontSize: 13, fontWeight: 600, color: "#555", background: "#fff", border: "1px solid #d1d5db", borderRadius: 6, cursor: "pointer" }}>Cancel</button>
                <button onClick={navigateNow} style={{ flex: 2, padding: "10px", fontSize: 13, fontWeight: 700, color: "#fff", background: "#17375e", border: "none", borderRadius: 6, cursor: "pointer" }}>Go to Student Profile →</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Page Header ── */}
      <div style={{ marginBottom: 22, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#17375e" }}>Available Drives</h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#888" }}>
            {profileMode
              ? "Active placement drives — showing your eligibility against each drive."
              : "Active placement drives open for your batch. Go to your profile to check eligibility and apply."}
          </p>
        </div>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: "#17375e",
            color: "#fff",
            border: "none",
            padding: "6px 14px",
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 2px 4px rgba(23,55,94,0.3)",
          }}
        >
          Back
        </button>
      </div>

      {/* ── Student Banner (profile mode only) ── */}
      {profileMode && (
        <div style={{ ...cardBase, padding: "14px 20px", marginBottom: 20, background: "linear-gradient(135deg, #17375e 0%, #1e4d8c 100%)", border: "none", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, border: "2px solid rgba(255,255,255,0.4)" }}>👤</div>
            <div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>Viewing as Student</div>
              <div style={{ color: "#fff", fontSize: 15, fontWeight: 700, marginTop: 2 }}>
                {selectedStudent ? `${selectedStudent.name} (${selectedStudent.usno})` : "Loading…"}
              </div>
            </div>
          </div>
          {selectedStudent && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginLeft: "auto" }}>
              {[
                { icon: "🎓", label: "CGPA",     value: STUDENT_CGPA ? String(STUDENT_CGPA) : "N/A" },
                { icon: "🏫", label: "Branch",   value: selectedStudent.department_name ?? "—" },
                { icon: "⚠️", label: "Backlogs", value: String(STUDENT_BACKLOGS) },
                { icon: "🆔", label: "USN",      value: selectedStudent.usno },
              ].map(({ icon, label, value }) => (
                <div key={label} style={{ background: "rgba(255,255,255,0.15)", borderRadius: 6, padding: "4px 12px", fontSize: 12, color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }}>
                  <span style={{ opacity: 0.75 }}>{icon} {label}: </span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Stats Bar ── */}
      <div style={{ display: "grid", gridTemplateColumns: profileMode ? "repeat(4, 1fr)" : "repeat(2, 1fr)", gap: 12, marginBottom: 20 }}>
        {(profileMode
          ? [
              { label: "Active Drives",   value: drives.length,  color: "#17375e", bg: "#eef2f7" },
              { label: "You're Eligible", value: eligibleCount,  color: "#065f46", bg: "#d1fae5" },
              { label: "Applied",         value: appliedCount,   color: "#1d4ed8", bg: "#dbeafe" },
              { label: "Your CGPA",       value: STUDENT_CGPA || "—", color: "#92400e", bg: "#fef3c7" },
            ]
          : [
              { label: "Active Drives",  value: drives.length, color: "#17375e", bg: "#eef2f7" },
              { label: "Showing",        value: filtered.length, color: "#065f46", bg: "#d1fae5" },
            ]
        ).map(({ label, value, color, bg }) => (
          <div key={label} style={{ ...cardBase, padding: "14px 18px", background: bg, boxShadow: "none", border: `1px solid ${color}22` }}>
            <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── Eligibility Banner (profile mode) ── */}
      {profileMode && selectedStudent && (
        <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 6, padding: "10px 16px", marginBottom: 20, fontSize: 13, color: "#166534", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>✓</span>
          <strong>{selectedStudent.name}</strong> is eligible for&nbsp;
          <strong>&nbsp;{eligibleCount} active drive{eligibleCount !== 1 ? "s" : ""}&nbsp;</strong>.
          Apply before the deadlines.
        </div>
      )}

      {/* ── Browse-only notice ── */}
      {!profileMode && (
        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 6, padding: "10px 16px", marginBottom: 20, fontSize: 13, color: "#1e40af", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 16 }}>ℹ️</span>
          <span>You are browsing active drives. <strong>Go to your Student Profile → View Drives</strong> to check eligibility and apply.</span>
        </div>
      )}

      {/* ── Apply Success Toast ── */}
      {applySuccess !== null && (
        <div style={{ background: "#d1fae5", border: "1px solid #6ee7b7", borderRadius: 6, padding: "10px 16px", marginBottom: 20, fontSize: 13, color: "#065f46", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>🎉</span>
          <strong>Application submitted!</strong>&nbsp;You applied for&nbsp;
          <strong>{drives.find((d) => d.drive_id === applySuccess)?.company_name}</strong>. Good luck!
        </div>
      )}

      {/* ── Withdraw Success Toast ── */}
      {withdrawSuccess !== null && (
        <div style={{ background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 6, padding: "10px 16px", marginBottom: 20, fontSize: 13, color: "#92400e", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>↩</span>
          <strong>Application withdrawn.</strong>&nbsp;Your application for&nbsp;
          <strong>{drives.find((d) => d.drive_id === withdrawSuccess)?.company_name}</strong> has been cancelled.
        </div>
      )}

      {/* ── No drives from backend ── */}
      {drives.length === 0 && (
        <div style={{ ...cardBase, padding: 48, textAlign: "center", color: "#aaa" }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
          <p style={{ fontWeight: 700, color: "#666" }}>No active drives</p>
          <p style={{ fontSize: 13 }}>The TPO has not published any active drives yet.</p>
        </div>
      )}

      {/* ── Filters ── */}
      {drives.length > 0 && (
        <div style={{ ...cardBase, padding: "14px 18px", marginBottom: 20, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          <input
            type="text"
            id="drive-search"
            placeholder="Search company, role or drive name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 4, fontSize: 13, outline: "none", width: 240 }}
          />
          <select id="drive-type-filter" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)} style={{ padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 4, fontSize: 13, background: "#fff", cursor: "pointer" }}>
            <option value="All">All Types</option>
            <option value="On-Campus">On-Campus</option>
            <option value="Off-Campus">Off-Campus</option>
            <option value="Pool Campus">Pool Campus</option>
          </select>
          <select id="drive-tier-filter" value={tierFilter} onChange={(e) => setTierFilter(Number(e.target.value))} style={{ padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 4, fontSize: 13, background: "#fff", cursor: "pointer" }}>
            <option value={0}>All Tiers</option>
            <option value={1}>Tier 1</option>
            <option value={2}>Tier 2</option>
            <option value={3}>Tier 3</option>
          </select>
          {profileMode && (
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#444", cursor: "pointer", marginLeft: "auto" }}>
              <input
                type="checkbox"
                id="eligible-only-toggle"
                checked={showEligibleOnly}
                onChange={(e) => setShowEligibleOnly(e.target.checked)}
                style={{ width: 15, height: 15, cursor: "pointer" }}
              />
              Show eligible only
            </label>
          )}
          <span style={{ fontSize: 12, color: "#888", marginLeft: profileMode ? 0 : "auto" }}>
            {filtered.length} drive{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* ── Drive Cards ── */}
      {drives.length > 0 && filtered.length === 0 ? (
        <div style={{ ...cardBase, padding: 48, textAlign: "center", color: "#aaa" }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🔍</div>
          <p style={{ fontWeight: 700, color: "#666" }}>No drives match your filters</p>
          <p style={{ fontSize: 13 }}>Try changing the search or filter options.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {filtered.map((d) => {
            const detail       = detailCache[d.drive_id];
            const branches: DriveEligibleBranch[] = detail?.eligible_branches ?? [];
            const rounds: DriveRound[]            = detail?.rounds ?? [];
            const branchAcronyms                  = branches.map((b) => b.dept_acronym);

            // Eligibility sub-checks (only meaningful in profile mode)
            const cgpaOk      = STUDENT_CGPA >= d.min_cgpa;
            const backlogOk   = STUDENT_BACKLOGS <= d.max_backlogs;
            const branchMatch = branches.length === 0 ? true : branches.some((b) => b.dept_id === STUDENT_DEPT_ID);
            const eligible    = profileMode ? (cgpaOk && backlogOk && branchMatch) : false;

            const expanded        = expandedId === d.drive_id;
            const days            = daysLeft(d.application_deadline);
            const isExpired       = d.application_deadline ? new Date(d.application_deadline) < new Date(new Date().toDateString()) : false;
            const urgentDeadline  = !isExpired && days <= 5;
            const currentStatus   = applyMap[d.drive_id] ?? "not_applied";
            const statusCfg       = STATUS_CONFIG[currentStatus];
            const isApplying      = applying === d.drive_id;
            const tierColor       = TIER_COLOR[d.tier] ?? TIER_COLOR[3];

            return (
              <div
                key={d.drive_id}
                style={{
                  ...cardBase,
                  border: `1px solid ${isExpired ? "#e5e7eb" : profileMode && eligible ? "#bfdbfe" : "#e5e7eb"}`,
                  transition: "box-shadow 0.2s",
                  opacity: isExpired ? 0.15 : profileMode && !eligible ? 0.88 : 1,
                  pointerEvents: isExpired ? "none" : undefined,
                }}
              >
                {/* Expired deadline banner */}
                {isExpired && (
                  <div style={{ background: "#f1f5f9", borderBottom: "1px solid #cbd5e1", padding: "6px 20px", fontSize: 11, color: "#64748b", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                    <span>🔒</span>
                    <span>Application deadline has passed — this drive is no longer accepting applications.</span>
                  </div>
                )}

                {/* Not-eligible warning strip (profile mode only) */}
                {!isExpired && profileMode && !eligible && (
                  <div style={{ background: "#fff7ed", borderBottom: "1px solid #fed7aa", padding: "6px 20px", fontSize: 11, color: "#9a3412", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                    <span>⚠️</span>
                    <span>
                      {selectedStudent?.name ?? "This student"} does not meet:{" "}
                      {[
                        !cgpaOk      && `CGPA ≥ ${d.min_cgpa} (current: ${STUDENT_CGPA || "N/A"})`,
                        !backlogOk   && `max ${d.max_backlogs} backlog(s) (current: ${STUDENT_BACKLOGS})`,
                        !branchMatch && branches.length > 0 && `branch not eligible`,
                      ].filter(Boolean).join(" · ")}
                    </span>
                  </div>
                )}

                {/* Card Body */}
                <div style={{ padding: "16px 20px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>

                    {/* Company initial logo */}
                    <div style={{ width: 46, height: 46, borderRadius: 8, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: "#17375e", flexShrink: 0, border: "1px solid #e5e7eb" }}>
                      {d.company_name.charAt(0).toUpperCase()}
                    </div>

                    {/* Main info */}
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 16, fontWeight: 700, color: "#17375e" }}>{d.company_name}</span>
                        <span style={{ padding: "2px 8px", borderRadius: 3, fontSize: 10, fontWeight: 700, letterSpacing: "0.5px", background: tierColor.bg, color: tierColor.color }}>
                          TIER {d.tier}
                        </span>
                        {profileMode && (
                          <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: statusCfg.bg, color: statusCfg.color }}>
                            {statusCfg.label}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 13, color: "#444", marginTop: 2, fontWeight: 500 }}>{d.job_role}</div>
                      <div style={{ fontSize: 12, color: "#777", marginTop: 1 }}>{d.drive_name}</div>

                      {/* Meta chips */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 12px", marginTop: 8, fontSize: 12, color: "#555" }}>
                        <span>💰 {fmtSalary(d.ctc_min, d.ctc_max)}</span>
                        {d.location && <span>📍 {d.location}</span>}
                        <span>🏫 {d.drive_type}</span>
                        <span>💼 {d.work_type}</span>
                        {d.vacancy_count && <span>🧑‍💼 {d.vacancy_count} vacancies</span>}
                        <span style={{ color: isExpired ? "#94a3b8" : urgentDeadline ? "#c0392b" : "#555", fontWeight: urgentDeadline ? 700 : 400 }}>
                          📅 {isExpired ? "Closed" : "Closes"} {fmtDate(d.application_deadline)}
                          {!isExpired && urgentDeadline && days > 0 && <span style={{ marginLeft: 4 }}>({days} day{days !== 1 ? "s" : ""} left!)</span>}
                          {!isExpired && days === 0 && <span style={{ marginLeft: 4 }}>(Closing today!)</span>}
                          {isExpired && <span style={{ marginLeft: 4, color: "#94a3b8", fontWeight: 600 }}>(Expired)</span>}
                        </span>
                      </div>

                      {/* Eligibility criteria chips */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                        {profileMode ? (
                          <>
                            <span title={`Required ≥ ${d.min_cgpa} | Student CGPA: ${STUDENT_CGPA}`} style={{ padding: "3px 9px", borderRadius: 3, fontSize: 11, background: cgpaOk ? "#d1fae5" : "#fee2e2", color: cgpaOk ? "#065f46" : "#991b1b", fontWeight: 600, cursor: "help" }}>
                              CGPA ≥ {d.min_cgpa} {cgpaOk ? "✓" : "✗"}
                            </span>
                            <span title={`Max ${d.max_backlogs} backlogs | Student: ${STUDENT_BACKLOGS}`} style={{ padding: "3px 9px", borderRadius: 3, fontSize: 11, background: backlogOk ? "#d1fae5" : "#fee2e2", color: backlogOk ? "#065f46" : "#991b1b", fontWeight: 600, cursor: "help" }}>
                              {d.max_backlogs === 0 ? "No Backlogs" : `≤ ${d.max_backlogs} Backlog${d.max_backlogs > 1 ? "s" : ""}`} {backlogOk ? "✓" : "✗"}
                            </span>
                            {branches.length > 0 ? branches.map((b) => {
                              const isMe = b.dept_id === STUDENT_DEPT_ID;
                              return (
                                <span key={b.id} style={{ padding: "3px 9px", borderRadius: 3, fontSize: 11, background: isMe ? "#dbeafe" : "#f3f4f6", color: isMe ? "#1d4ed8" : "#666", fontWeight: isMe ? 700 : 500, border: isMe ? "1px solid #93c5fd" : "1px solid transparent" }}>
                                  {b.dept_acronym} {isMe ? "✓" : ""}
                                </span>
                              );
                            }) : (
                              <span style={{ padding: "3px 9px", borderRadius: 3, fontSize: 11, background: "#f3f4f6", color: "#888" }}>Expand to check branches</span>
                            )}
                          </>
                        ) : (
                          <>
                            <span style={{ padding: "3px 9px", borderRadius: 3, fontSize: 11, background: "#f3f4f6", color: "#555", fontWeight: 600 }}>CGPA ≥ {d.min_cgpa}</span>
                            <span style={{ padding: "3px 9px", borderRadius: 3, fontSize: 11, background: "#f3f4f6", color: "#555", fontWeight: 600 }}>
                              {d.max_backlogs === 0 ? "No Backlogs" : `≤ ${d.max_backlogs} Backlog${d.max_backlogs > 1 ? "s" : ""}`}
                            </span>
                            {branchAcronyms.map((b) => (
                              <span key={b} style={{ padding: "3px 9px", borderRadius: 3, fontSize: 11, background: "#f3f4f6", color: "#555", fontWeight: 500 }}>{b}</span>
                            ))}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right: eligible badge + action buttons */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
                      {profileMode && (eligible ? (
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#065f46", background: "#d1fae5", padding: "3px 10px", borderRadius: 20, border: "1px solid #6ee7b7" }}>✓ Eligible</span>
                      ) : (
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#991b1b", background: "#fee2e2", padding: "3px 10px", borderRadius: 20, border: "1px solid #fca5a5" }}>✗ Not Eligible</span>
                      ))}

                      {/* Apply / Withdraw buttons */}
                      {profileMode && currentStatus === "not_applied" ? (
                        <button
                          id={`apply-btn-${d.drive_id}`}
                          disabled={isApplying}
                          onClick={() => {
                            if (!selectedStudent?.is_registered) { openRegisterModal(); return; }
                            if (eligible) handleApply(d.drive_id);
                          }}
                          style={{ padding: "8px 20px", fontSize: 12, fontWeight: 700, color: eligible ? "#fff" : "#aaa", background: isApplying ? "#6b7280" : eligible ? "#17375e" : "#e5e7eb", border: "none", borderRadius: 4, cursor: isApplying ? "not-allowed" : "pointer", minWidth: 100, transition: "background 0.2s" }}
                        >
                          {isApplying ? "Applying…" : eligible ? "Apply Now" : "Not Eligible"}
                        </button>
                      ) : profileMode && (currentStatus === "applied" || currentStatus === "shortlisted") ? (
                        <>
                          <button disabled style={{ padding: "8px 20px", fontSize: 12, fontWeight: 700, color: statusCfg.color, background: statusCfg.bg, border: `1px solid ${statusCfg.color}44`, borderRadius: 4, cursor: "default", minWidth: 100 }}>✔ {statusCfg.label}</button>
                          <button
                            id={`withdraw-btn-${d.drive_id}`}
                            disabled={withdrawing === d.drive_id}
                            onClick={() => handleWithdraw(d.drive_id, d.company_name)}
                            style={{ padding: "7px 16px", fontSize: 12, fontWeight: 700, color: withdrawing === d.drive_id ? "#aaa" : "#b91c1c", background: "#fff", border: `1px solid ${withdrawing === d.drive_id ? "#d1d5db" : "#fca5a5"}`, borderRadius: 4, cursor: "pointer", minWidth: 100 }}
                          >
                            {withdrawing === d.drive_id ? "Withdrawing…" : "↩ Withdraw"}
                          </button>
                        </>
                      ) : profileMode && currentStatus !== "not_applied" ? (
                        <button disabled style={{ padding: "8px 20px", fontSize: 12, fontWeight: 700, color: statusCfg.color, background: statusCfg.bg, border: `1px solid ${statusCfg.color}44`, borderRadius: 4, cursor: "default", minWidth: 100 }}>{statusCfg.label}</button>
                      ) : null}

                      <button
                        id={`expand-btn-${d.drive_id}`}
                        onClick={() => handleExpand(d.drive_id)}
                        style={{ background: "none", border: "none", fontSize: 12, color: "#17375e", cursor: "pointer", textDecoration: "underline", padding: 0 }}
                      >
                        {loadingDetail === d.drive_id ? "Loading…" : expanded ? "Hide Details ▲" : "View Details ▼"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expanded && (
                  <div style={{ borderTop: "1px solid #e5e7eb", background: "#f9fafb", padding: "16px 20px" }}>
                    {loadingDetail === d.drive_id ? (
                      <div style={{ textAlign: "center", color: "#888", fontSize: 13, padding: "16px 0" }}>Loading details…</div>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 32px" }}>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>About the Role</div>
                          <p style={{ fontSize: 13, color: "#444", margin: 0, lineHeight: 1.6 }}>{detail?.job_description ?? "No description provided."}</p>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Selection Process</div>
                          {rounds.length > 0 ? (
                            <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#444", lineHeight: 1.8 }}>
                              {rounds.map((r) => <li key={r.round_id}>{r.round_name} <span style={{ color: "#888", fontSize: 11 }}>({r.round_type})</span></li>)}
                            </ol>
                          ) : (
                            <p style={{ fontSize: 13, color: "#888", margin: 0 }}>No rounds defined yet.</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Eligibility summary (profile mode only) */}
                    {profileMode && !loadingDetail && (
                      <div style={{ marginTop: 16, padding: "12px 16px", background: eligible ? "#f0fdf4" : "#fff7ed", borderRadius: 6, border: `1px solid ${eligible ? "#86efac" : "#fed7aa"}` }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
                          Eligibility Check for {selectedStudent?.name ?? "Student"}
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {[
                            { label: `CGPA: ${STUDENT_CGPA} ≥ ${d.min_cgpa}`,                                                         pass: cgpaOk },
                            { label: `Backlogs: ${STUDENT_BACKLOGS} ≤ ${d.max_backlogs}`,                                             pass: backlogOk },
                            { label: `Branch: ${selectedStudent?.department_name ?? "—"} ${branchMatch ? "✓ allowed" : "✗ not allowed"}`, pass: branchMatch },
                          ].map(({ label, pass }) => (
                            <div key={label} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: pass ? "#d1fae5" : "#fee2e2", color: pass ? "#065f46" : "#991b1b" }}>
                              <span>{pass ? "✓" : "✗"}</span>{label}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ height: 32 }} />
    </div>
  );
};

export default AvailableDrivesPage;
