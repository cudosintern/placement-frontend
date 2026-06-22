import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import * as profileService from "../student/studentProfileService";
import { AllStudentRow } from "../student/studentProfileTypes";

// ─── Types ────────────────────────────────────────────────────────────────────

type DriveType = "On-Campus" | "Off-Campus" | "Pool Campus";
type Tier = 1 | 2 | 3;
type ApplyStatus = "not_applied" | "applied" | "shortlisted" | "rejected";

interface Drive {
  id: number;
  company: string;
  role: string;
  location: string;
  salaryMin: number;
  salaryMax: number;
  type: DriveType;
  tier: Tier;
  minCgpa: number;
  maxBacklogs: number;
  branches: string[]; // branch codes like "CSE", "ISE", "ECE"
  deadline: string;
  status: ApplyStatus;
  logo: string;
  description: string;
  rounds: string[];
}

// ─── Branch mapping (department name → branch code) ───────────────────────────

const DEPT_TO_BRANCH = (deptName?: string | null): string => {
  if (!deptName) return "CSE";
  const d = deptName.toLowerCase();
  if (d.includes("computer science")) return "CSE";
  if (d.includes("information science")) return "ISE";
  if (d.includes("electronics & communication") || d.includes("electronics and communication")) return "ECE";
  if (d.includes("electronics & electrical") || d.includes("electrical")) return "EEE";
  if (d.includes("mechanical")) return "MECH";
  if (d.includes("civil")) return "CIVIL";
  if (d.includes("chemical")) return "CHEM";
  if (d.includes("biotech") || d.includes("biotechnology")) return "BT";
  // Fallback: take first word, uppercase
  return deptName.split(/[\s&,]/)[0].toUpperCase().slice(0, 4);
};

// ─── Dummy Drive Data ─────────────────────────────────────────────────────────

const DUMMY_DRIVES: Drive[] = [
  {
    id: 1,
    company: "Amazon Web Services",
    role: "SDE – 1",
    location: "Bangalore",
    salaryMin: 18,
    salaryMax: 24,
    type: "On-Campus",
    tier: 1,
    minCgpa: 7.5,
    maxBacklogs: 0,
    branches: ["CSE", "ISE"],
    deadline: "2025-01-18",
    status: "not_applied",
    logo: "🟠",
    description:
      "Join AWS as a Software Development Engineer. You will design, build, and maintain distributed systems at cloud scale.",
    rounds: ["Online Test", "Technical Interview 1", "Technical Interview 2", "HR Round"],
  },
  {
    id: 2,
    company: "Infosys Ltd.",
    role: "Systems Engineer",
    location: "Pune, Bangalore",
    salaryMin: 4.5,
    salaryMax: 6.5,
    type: "On-Campus",
    tier: 1,
    minCgpa: 7.0,
    maxBacklogs: 0,
    branches: ["CSE", "ECE", "ISE"],
    deadline: "2025-01-22",
    status: "not_applied",
    logo: "🔵",
    description:
      "Infosys is hiring Systems Engineers for its digital transformation projects across Banking, Insurance, and Retail domains.",
    rounds: ["Aptitude Test", "Technical Interview", "HR Interview"],
  },
  {
    id: 3,
    company: "Wipro Technologies",
    role: "Project Engineer",
    location: "Hyderabad, Chennai",
    salaryMin: 3.5,
    salaryMax: 5.0,
    type: "On-Campus",
    tier: 2,
    minCgpa: 6.5,
    maxBacklogs: 1,
    branches: ["CSE", "ECE", "EEE", "ISE"],
    deadline: "2025-01-28",
    status: "not_applied",
    logo: "⚙️",
    description:
      "Wipro is looking for passionate engineers to join as Project Engineers in their Enterprise IT service vertical.",
    rounds: ["Online Assessment", "Group Discussion", "HR Interview"],
  },
  {
    id: 4,
    company: "Google India",
    role: "Associate Product Manager",
    location: "Hyderabad",
    salaryMin: 20,
    salaryMax: 30,
    type: "On-Campus",
    tier: 1,
    minCgpa: 8.0,
    maxBacklogs: 0,
    branches: ["CSE", "ISE"],
    deadline: "2025-02-05",
    status: "not_applied",
    logo: "🔴",
    description:
      "Google is hiring APMs to work on product strategy, UX, and go-to-market planning for its India-facing products.",
    rounds: ["Aptitude + Essay", "Case Study", "Panel Interview", "Leadership Round"],
  },
  {
    id: 5,
    company: "TCS NQT",
    role: "Assistant System Engineer",
    location: "Multiple Cities",
    salaryMin: 3.36,
    salaryMax: 7.0,
    type: "Pool Campus",
    tier: 2,
    minCgpa: 6.0,
    maxBacklogs: 2,
    branches: ["CSE", "ECE", "EEE", "ISE", "MECH"],
    deadline: "2025-02-10",
    status: "not_applied",
    logo: "🌐",
    description:
      "TCS NQT is a national level qualifying test. Shortlisted candidates join as ASE with fast-track promotion to SE.",
    rounds: ["NQT Online Test", "Technical Interview", "HR Interview"],
  },
  {
    id: 6,
    company: "Microsoft",
    role: "Software Engineer – FTE",
    location: "Hyderabad",
    salaryMin: 22,
    salaryMax: 28,
    type: "On-Campus",
    tier: 1,
    minCgpa: 8.0,
    maxBacklogs: 0,
    branches: ["CSE", "ISE"],
    deadline: "2025-02-15",
    status: "not_applied",
    logo: "🟦",
    description:
      "Microsoft India Development Center is hiring FTE Software Engineers to work on Office 365, Azure, and Teams products.",
    rounds: ["Online Coding Test", "Technical Round 1", "Technical Round 2", "Technical Round 3", "HR"],
  },
  {
    id: 7,
    company: "Accenture",
    role: "Associate Software Engineer",
    location: "Bangalore, Mumbai",
    salaryMin: 4.5,
    salaryMax: 6.5,
    type: "Off-Campus",
    tier: 2,
    minCgpa: 6.0,
    maxBacklogs: 2,
    branches: ["CSE", "ECE", "ISE", "EEE"],
    deadline: "2025-02-20",
    status: "not_applied",
    logo: "🟣",
    description:
      "Accenture's Digital Business Integration practice is hiring ASEs to work on SAP, Salesforce, and cloud-native projects.",
    rounds: ["Online Test", "Virtual Interview 1", "Virtual Interview 2"],
  },
  {
    id: 8,
    company: "Capgemini",
    role: "Analyst",
    location: "Pune",
    salaryMin: 3.8,
    salaryMax: 5.5,
    type: "Off-Campus",
    tier: 3,
    minCgpa: 6.0,
    maxBacklogs: 2,
    branches: ["CSE", "ECE", "ISE"],
    deadline: "2025-03-01",
    status: "not_applied",
    logo: "🔷",
    description:
      "Capgemini is hiring Analysts for its APAC delivery centers. You will work with European banking and insurance clients.",
    rounds: ["Game-based Assessment", "Technical Interview", "HR Interview"],
  },
];

// ─── Helper ───────────────────────────────────────────────────────────────────

const fmtSalary = (min: number, max: number) =>
  min === max ? `${min} LPA` : `${min}–${max} LPA`;

const fmtDate = (d: string) => {
  const dt = new Date(d);
  return dt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const daysLeft = (d: string) => {
  const diff = new Date(d).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
};

const TIER_COLOR: Record<Tier, { bg: string; color: string }> = {
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

const buildInitialApplyMap = (): Record<number, ApplyStatus> =>
  Object.fromEntries(DUMMY_DRIVES.map((d) => [d.id, d.status]));

// ─── Main Component ────────────────────────────────────────────────────────────

const AvailableDrivesPage: React.FC = () => {
  // ── URL query: student_id present means we came from a student profile ────
  const [searchParams] = useSearchParams();
  const profileStudentId = Number(searchParams.get("student_id")) || null;
  // profileMode = true  → locked to one student (came via "View Drives" button)
  // profileMode = false → browse-only, no student context, no Apply button
  const profileMode = profileStudentId !== null;

  // ── Student list from API ─────────────────────────────────────────────────
  const [allStudents, setAllStudents] = useState<AllStudentRow[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);

  const loadStudents = useCallback(async () => {
    setLoadingStudents(true);
    try {
      const data = await profileService.getAllStudentsList();
      setAllStudents(Array.isArray(data) ? data : []);
    } catch {
      setAllStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  // ── Student selector ──────────────────────────────────────────────────────
  // In profile mode, always locked to the student from the URL.
  // In browse mode, no student is selected at all.
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(
    profileStudentId
  );

  // Sync if URL param changes
  useEffect(() => {
    if (profileMode) {
      setSelectedStudentId(profileStudentId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileStudentId]);

  const selectedStudent = useMemo(
    () => (selectedStudentId ? allStudents.find((s) => s.student_id === selectedStudentId) ?? null : null),
    [selectedStudentId, allStudents]
  );

  // Derive student attributes for eligibility
  const STUDENT_CGPA    = selectedStudent ? (selectedStudent.current_cgpa ?? selectedStudent.cgpa_actual ?? 0) : 0;
  const STUDENT_BACKLOGS = selectedStudent?.backlogs ?? 0;
  const STUDENT_BRANCH  = DEPT_TO_BRANCH(selectedStudent?.department_name);

  // ── Filters ───────────────────────────────────────────────────────────────
  const [search, setSearch]                     = useState("");
  const [typeFilter, setTypeFilter]             = useState<DriveType | "All">("All");
  const [tierFilter, setTierFilter]             = useState<Tier | 0>(0);
  const [showEligibleOnly, setShowEligibleOnly] = useState(false);
  const [expandedId, setExpandedId]             = useState<number | null>(null);

  // ── Apply state (per drive) ───────────────────────────────────────────────
  const [applyMap, setApplyMap]     = useState<Record<number, ApplyStatus>>(buildInitialApplyMap);
  const [applying, setApplying]     = useState<number | null>(null);
  const [applySuccess, setApplySuccess] = useState<number | null>(null);

  // ── Eligibility logic ─────────────────────────────────────────────────────
  const isEligible = (d: Drive) =>
    STUDENT_CGPA >= d.minCgpa &&
    STUDENT_BACKLOGS <= d.maxBacklogs &&
    d.branches.includes(STUDENT_BRANCH);

  // ── Filtered drives ───────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return DUMMY_DRIVES.filter((d) => {
      if (
        search &&
        !d.company.toLowerCase().includes(search.toLowerCase()) &&
        !d.role.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      if (typeFilter !== "All" && d.type !== typeFilter) return false;
      if (tierFilter !== 0 && d.tier !== tierFilter) return false;
      if (showEligibleOnly && !isEligible(d)) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, typeFilter, tierFilter, showEligibleOnly, selectedStudentId, STUDENT_CGPA, STUDENT_BACKLOGS, STUDENT_BRANCH]);

  const eligibleCount = DUMMY_DRIVES.filter(isEligible).length;
  const appliedCount  = Object.values(applyMap).filter(
    (s) => s === "applied" || s === "shortlisted"
  ).length;

  // ── Apply handler ─────────────────────────────────────────────────────────
  const handleApply = (driveId: number) => {
    setApplying(driveId);
    setTimeout(() => {
      setApplyMap((prev) => ({ ...prev, [driveId]: "applied" }));
      setApplying(null);
      setApplySuccess(driveId);
      setTimeout(() => setApplySuccess(null), 2500);
    }, 600);
  };

  // ── Withdraw handler ──────────────────────────────────────────────────────
  // Withdrawal is only allowed when status = "applied" (no rounds started).
  // Once shortlisted/rejected the selection process has begun — cannot withdraw.
  const [withdrawing, setWithdrawing] = useState<number | null>(null);
  const [withdrawSuccess, setWithdrawSuccess] = useState<number | null>(null);

  const handleWithdraw = (driveId: number, companyName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to withdraw your application for ${companyName}?\n\nThis action cannot be undone if rounds have already been scheduled.`
    );
    if (!confirmed) return;
    setWithdrawing(driveId);
    setTimeout(() => {
      setApplyMap((prev) => ({ ...prev, [driveId]: "not_applied" }));
      setWithdrawing(null);
      setWithdrawSuccess(driveId);
      setTimeout(() => setWithdrawSuccess(null), 2500);
    }, 600);
  };

  // ── Not-registered guard ───────────────────────────────────────────────────
  // If a student tries to apply but hasn't registered a placement profile,
  // show a modal and auto-navigate to /student/profile after a countdown.
  const navigate = useNavigate();
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [navCountdown, setNavCountdown] = useState(3);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const openRegisterModal = () => {
    setNavCountdown(3);
    setShowRegisterModal(true);
    // Start countdown
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

  // Cleanup timer on unmount
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

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loadingStudents) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 240, color: "#888", fontSize: 14, flexDirection: "column", gap: 10 }}>
        <div style={{ fontSize: 28 }}>⏳</div>
        Loading students...
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
              animation: "slideUp 0.25s ease",
            }}
          >
            {/* Modal header */}
            <div
              style={{
                background: "linear-gradient(135deg, #17375e 0%, #1e4d8c 100%)",
                padding: "18px 22px",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 38, height: 38, borderRadius: "50%",
                  background: "rgba(255,255,255,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, flexShrink: 0,
                }}
              >
                ⚠️
              </div>
              <div>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>Registration Required</div>
                <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 2 }}>
                  You must complete your placement profile first
                </div>
              </div>
              <button
                onClick={closeRegisterModal}
                style={{
                  marginLeft: "auto", background: "none", border: "none",
                  color: "rgba(255,255,255,0.8)", fontSize: 20, cursor: "pointer", lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            {/* Modal body */}
            <div style={{ padding: "24px 24px 20px" }}>
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                <p style={{ fontSize: 14, color: "#333", fontWeight: 600, margin: "0 0 8px" }}>
                  <strong>{selectedStudent?.name}</strong> is not yet registered for placement.
                </p>
                <p style={{ fontSize: 13, color: "#666", margin: 0, lineHeight: 1.6 }}>
                  Please complete your <strong>Student Profile</strong> registration before applying
                  to any placement drive.
                </p>
              </div>

              {/* Countdown bar */}
              <div
                style={{
                  background: "#f0f4f8",
                  borderRadius: 8,
                  padding: "12px 16px",
                  marginBottom: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: "#17375e", color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, fontWeight: 800, flexShrink: 0,
                  }}
                >
                  {navCountdown}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#17375e" }}>
                    Redirecting to Student Profile…
                  </div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
                    Automatically navigating in {navCountdown} second{navCountdown !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={closeRegisterModal}
                  style={{
                    flex: 1, padding: "10px", fontSize: 13, fontWeight: 600,
                    color: "#555", background: "#fff",
                    border: "1px solid #d1d5db", borderRadius: 6,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={navigateNow}
                  style={{
                    flex: 2, padding: "10px", fontSize: 13, fontWeight: 700,
                    color: "#fff", background: "#17375e",
                    border: "none", borderRadius: 6,
                    cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}
                >
                  Go to Student Profile →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Page Header ── */}
      <div style={{ marginBottom: 22 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#17375e" }}>
          Available Drives
        </h2>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#888" }}>
          {profileMode
            ? "Placement drives open for your batch — showing your eligibility."
            : "Placement drives open for your batch. Go to your profile to check eligibility and apply."}
        </p>
      </div>

      {/* ── Student Banner (profile mode only) ── */}
      {profileMode && (
        <div
          style={{
            ...cardBase,
            padding: "14px 20px",
            marginBottom: 20,
            background: "linear-gradient(135deg, #17375e 0%, #1e4d8c 100%)",
            border: "none",
            display: "flex",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                flexShrink: 0,
                border: "2px solid rgba(255,255,255,0.4)",
              }}
            >
              👤
            </div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.7)",
                  fontWeight: 600,
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                }}
              >
                Viewing as Student
              </div>
              <div
                style={{
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: 700,
                  marginTop: 2,
                }}
              >
                {selectedStudent ? `${selectedStudent.name} (${selectedStudent.usno})` : "Loading…"}
              </div>
            </div>
          </div>

          {/* Student quick-info chips */}
          {selectedStudent && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginLeft: "auto" }}>
              {[
                { icon: "🎓", label: "CGPA", value: STUDENT_CGPA ? String(STUDENT_CGPA) : "N/A" },
                { icon: "🏫", label: "Branch", value: STUDENT_BRANCH },
                { icon: "⚠️", label: "Backlogs", value: String(STUDENT_BACKLOGS) },
                { icon: "🆔", label: "USN", value: selectedStudent.usno },
              ].map(({ icon, label, value }) => (
                <div
                  key={label}
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    borderRadius: 6,
                    padding: "4px 12px",
                    fontSize: 12,
                    color: "#fff",
                    border: "1px solid rgba(255,255,255,0.2)",
                  }}
                >
                  <span style={{ opacity: 0.75 }}>{icon} {label}: </span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Student Stats Bar ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: profileMode ? "repeat(4, 1fr)" : "repeat(2, 1fr)",
          gap: 12,
          marginBottom: 20,
        }}
      >
        {(profileMode
          ? [
              { label: "Total Drives",    value: DUMMY_DRIVES.length, color: "#17375e", bg: "#eef2f7" },
              { label: "You're Eligible", value: eligibleCount,       color: "#065f46", bg: "#d1fae5" },
              { label: "Applied",         value: appliedCount,         color: "#1d4ed8", bg: "#dbeafe" },
              { label: "Your CGPA",       value: STUDENT_CGPA || "—", color: "#92400e", bg: "#fef3c7" },
            ]
          : [
              { label: "Total Drives",   value: DUMMY_DRIVES.length, color: "#17375e", bg: "#eef2f7" },
              { label: "Active Drives",  value: DUMMY_DRIVES.length, color: "#065f46", bg: "#d1fae5" },
            ]
        ).map(({ label, value, color, bg }) => (
          <div
            key={label}
            style={{
              ...cardBase,
              padding: "14px 18px",
              background: bg,
              boxShadow: "none",
              border: `1px solid ${color}22`,
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── Eligibility Banner (profile mode only) ── */}
      {profileMode && selectedStudent && (
        <div
          style={{
            background: "#f0fdf4",
            border: "1px solid #86efac",
            borderRadius: 6,
            padding: "10px 16px",
            marginBottom: 20,
            fontSize: 13,
            color: "#166534",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 16 }}>✓</span>
          <strong>{selectedStudent.name}</strong> is eligible for{" "}
          <strong>&nbsp;{eligibleCount} active drive{eligibleCount !== 1 ? "s" : ""}&nbsp;</strong>.
          Apply before the deadlines.
        </div>
      )}

      {/* ── Browse-only notice (direct navigation, no student context) ── */}
      {!profileMode && (
        <div
          style={{
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: 6,
            padding: "10px 16px",
            marginBottom: 20,
            fontSize: 13,
            color: "#1e40af",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 16 }}>ℹ️</span>
          <span>
            You are browsing available drives.{" "}
            <strong>Go to your Student Profile → View Drives</strong>{" "}
            to check eligibility and apply.
          </span>
        </div>
      )}

      {/* ── Apply Success Toast ── */}
      {applySuccess !== null && (
        <div
          style={{
            background: "#d1fae5",
            border: "1px solid #6ee7b7",
            borderRadius: 6,
            padding: "10px 16px",
            marginBottom: 20,
            fontSize: 13,
            color: "#065f46",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 18 }}>🎉</span>
          <strong>Application submitted!</strong>&nbsp;You have applied for{" "}
          <strong>{DUMMY_DRIVES.find((d) => d.id === applySuccess)?.company}</strong>.
          Good luck!
        </div>
      )}

      {/* ── Withdraw Success Toast ── */}
      {withdrawSuccess !== null && (
        <div
          style={{
            background: "#fef3c7",
            border: "1px solid #fcd34d",
            borderRadius: 6,
            padding: "10px 16px",
            marginBottom: 20,
            fontSize: 13,
            color: "#92400e",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 18 }}>↩</span>
          <strong>Application withdrawn.</strong>&nbsp;Your application for{" "}
          <strong>{DUMMY_DRIVES.find((d) => d.id === withdrawSuccess)?.company}</strong>{" "}
          has been cancelled. You can re-apply before the deadline.
        </div>
      )}

      {/* ── Filters ── */}
      <div
        style={{
          ...cardBase,
          padding: "14px 18px",
          marginBottom: 20,
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "center",
        }}
      >
        <input
          type="text"
          id="drive-search"
          placeholder="Search company or role…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "8px 12px",
            border: "1px solid #d1d5db",
            borderRadius: 4,
            fontSize: 13,
            outline: "none",
            width: 220,
          }}
        />

        <select
          id="drive-type-filter"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as any)}
          style={{ padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 4, fontSize: 13, background: "#fff", cursor: "pointer" }}
        >
          <option value="All">All Types</option>
          <option value="On-Campus">On-Campus</option>
          <option value="Off-Campus">Off-Campus</option>
          <option value="Pool Campus">Pool Campus</option>
        </select>

        <select
          id="drive-tier-filter"
          value={tierFilter}
          onChange={(e) => setTierFilter(Number(e.target.value) as any)}
          style={{ padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 4, fontSize: 13, background: "#fff", cursor: "pointer" }}
        >
          <option value={0}>All Tiers</option>
          <option value={1}>Tier 1</option>
          <option value={2}>Tier 2</option>
          <option value={3}>Tier 3</option>
        </select>

        {/* Show eligible only filter — only in profile mode */}
        {profileMode && (
          <label
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#444", cursor: "pointer", marginLeft: "auto" }}
          >
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

      {/* ── Drive Cards ── */}
      {filtered.length === 0 ? (
        <div style={{ ...cardBase, padding: 48, textAlign: "center", color: "#aaa" }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🔍</div>
          <p style={{ fontWeight: 700, color: "#666" }}>No drives found</p>
          <p style={{ fontSize: 13 }}>Try changing the filters.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {filtered.map((d) => {
            const cgpaOk      = STUDENT_CGPA >= d.minCgpa;
            const backlogOk   = STUDENT_BACKLOGS <= d.maxBacklogs;
            const branchMatch = d.branches.includes(STUDENT_BRANCH);
            const eligible    = cgpaOk && backlogOk && branchMatch;
            const expanded    = expandedId === d.id;
            const days        = daysLeft(d.deadline);
            const urgentDeadline = days <= 5;
            const currentStatus  = applyMap[d.id] ?? d.status;
            const statusCfg      = STATUS_CONFIG[currentStatus];
            const isApplying     = applying === d.id;

            return (
              <div
                key={d.id}
                style={{
                  ...cardBase,
                  border: `1px solid ${eligible ? "#bfdbfe" : "#e5e7eb"}`,
                  transition: "box-shadow 0.2s",
                  opacity: eligible ? 1 : 0.88,
                }}
              >
                {/* Not-eligible warning strip */}
                {!eligible && (
                  <div
                    style={{
                      background: "#fff7ed",
                      borderBottom: "1px solid #fed7aa",
                      padding: "6px 20px",
                      fontSize: 11,
                      color: "#9a3412",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span>⚠️</span>
                    <span>
                      {selectedStudent?.name ?? "This student"} does not meet:{" "}
                      {[
                        !cgpaOk && `CGPA ≥ ${d.minCgpa} (current: ${STUDENT_CGPA || "N/A"})`,
                        !backlogOk && `max ${d.maxBacklogs} backlog(s) (current: ${STUDENT_BACKLOGS})`,
                        !branchMatch && `branch (${STUDENT_BRANCH} not in: ${d.branches.join(", ")})`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </div>
                )}

                {/* Card Body */}
                <div style={{ padding: "16px 20px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>

                    {/* Logo */}
                    <div
                      style={{
                        width: 46, height: 46, borderRadius: 8,
                        background: "#f3f4f6", display: "flex",
                        alignItems: "center", justifyContent: "center",
                        fontSize: 24, flexShrink: 0, border: "1px solid #e5e7eb",
                      }}
                    >
                      {d.logo}
                    </div>

                    {/* Main info */}
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 16, fontWeight: 700, color: "#17375e" }}>{d.company}</span>
                        <span
                          style={{
                            padding: "2px 8px", borderRadius: 3, fontSize: 10, fontWeight: 700,
                            letterSpacing: "0.5px",
                            background: TIER_COLOR[d.tier].bg, color: TIER_COLOR[d.tier].color,
                          }}
                        >
                          TIER {d.tier}
                        </span>
                        {/* Status chip (Not Applied / Applied / etc.) — only in profile mode */}
                        {profileMode && (
                          <span
                            style={{
                              padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                              background: statusCfg.bg, color: statusCfg.color,
                            }}
                          >
                            {statusCfg.label}
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: 13, color: "#444", marginTop: 2, fontWeight: 500 }}>{d.role}</div>

                      {/* Meta chips */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 12px", marginTop: 8, fontSize: 12, color: "#555" }}>
                        <span>💰 {fmtSalary(d.salaryMin, d.salaryMax)}</span>
                        <span>📍 {d.location}</span>
                        <span>🏫 {d.type}</span>
                        <span style={{ color: urgentDeadline ? "#c0392b" : "#555", fontWeight: urgentDeadline ? 700 : 400 }}>
                          📅 Closes {fmtDate(d.deadline)}
                          {urgentDeadline && days > 0 && (
                            <span style={{ marginLeft: 4, color: "#c0392b" }}>
                              ({days} day{days !== 1 ? "s" : ""} left!)
                            </span>
                          )}
                          {days === 0 && <span style={{ marginLeft: 4, color: "#c0392b" }}>(Closing today!)</span>}
                        </span>
                      </div>

                      {/* ── Eligibility Criteria Chips ── */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                        {profileMode ? (
                          // Profile mode: show coloured pass/fail chips
                          <>
                            <span
                              title={`Required ≥ ${d.minCgpa} | Student CGPA: ${STUDENT_CGPA}`}
                              style={{
                                padding: "3px 9px", borderRadius: 3, fontSize: 11,
                                background: cgpaOk ? "#d1fae5" : "#fee2e2",
                                color: cgpaOk ? "#065f46" : "#991b1b",
                                fontWeight: 600, cursor: "help",
                              }}
                            >
                              CGPA ≥ {d.minCgpa} {cgpaOk ? "✓" : "✗"}
                            </span>

                            <span
                              title={`Max ${d.maxBacklogs} backlogs | Student: ${STUDENT_BACKLOGS}`}
                              style={{
                                padding: "3px 9px", borderRadius: 3, fontSize: 11,
                                background: backlogOk ? "#d1fae5" : "#fee2e2",
                                color: backlogOk ? "#065f46" : "#991b1b",
                                fontWeight: 600, cursor: "help",
                              }}
                            >
                              {d.maxBacklogs === 0
                                ? "No Backlogs"
                                : `≤ ${d.maxBacklogs} Backlog${d.maxBacklogs > 1 ? "s" : ""}`}{" "}
                              {backlogOk ? "✓" : "✗"}
                            </span>

                            {d.branches.map((b) => {
                              const isStudentBranch = b === STUDENT_BRANCH;
                              return (
                                <span
                                  key={b}
                                  style={{
                                    padding: "3px 9px", borderRadius: 3, fontSize: 11,
                                    background: isStudentBranch ? "#dbeafe" : "#f3f4f6",
                                    color: isStudentBranch ? "#1d4ed8" : "#666",
                                    fontWeight: isStudentBranch ? 700 : 500,
                                    border: isStudentBranch ? "1px solid #93c5fd" : "1px solid transparent",
                                  }}
                                >
                                  {b} {isStudentBranch ? "✓" : ""}
                                </span>
                              );
                            })}
                          </>
                        ) : (
                          // Browse mode: neutral requirement chips — no pass/fail colouring
                          <>
                            <span style={{ padding: "3px 9px", borderRadius: 3, fontSize: 11, background: "#f3f4f6", color: "#555", fontWeight: 600 }}>
                              CGPA ≥ {d.minCgpa}
                            </span>
                            <span style={{ padding: "3px 9px", borderRadius: 3, fontSize: 11, background: "#f3f4f6", color: "#555", fontWeight: 600 }}>
                              {d.maxBacklogs === 0 ? "No Backlogs" : `≤ ${d.maxBacklogs} Backlog${d.maxBacklogs > 1 ? "s" : ""}`}
                            </span>
                            {d.branches.map((b) => (
                              <span key={b} style={{ padding: "3px 9px", borderRadius: 3, fontSize: 11, background: "#f3f4f6", color: "#555", fontWeight: 500 }}>
                                {b}
                              </span>
                            ))}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right: eligible badge (profile mode only) + action */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
                      {profileMode && (eligible ? (
                        <span
                          style={{
                            fontSize: 11, fontWeight: 700, color: "#065f46",
                            background: "#d1fae5", padding: "3px 10px",
                            borderRadius: 20, border: "1px solid #6ee7b7",
                          }}
                        >
                          ✓ Eligible
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: 11, fontWeight: 700, color: "#991b1b",
                            background: "#fee2e2", padding: "3px 10px",
                            borderRadius: 20, border: "1px solid #fca5a5",
                          }}
                        >
                          ✗ Not Eligible
                        </span>
                      ))}

                      {/* ── Apply / Status / Withdraw buttons (profile mode only) ── */}
                      {profileMode && currentStatus === "not_applied" ? (
                        // ── Not applied → Show Apply Now (guard: must be registered)
                        <button
                          id={`apply-btn-${d.id}`}
                          disabled={isApplying}
                          onClick={() => {
                            if (!selectedStudent?.is_registered) {
                              // Not registered → show popup, navigate to profile
                              openRegisterModal();
                              return;
                            }
                            if (eligible) handleApply(d.id);
                          }}
                          style={{
                            padding: "8px 20px", fontSize: 12, fontWeight: 700,
                            color: eligible ? "#fff" : "#aaa",
                            background: isApplying ? "#6b7280" : eligible ? "#17375e" : "#e5e7eb",
                            border: "none", borderRadius: 4,
                            cursor: isApplying ? "not-allowed" : "pointer",
                            minWidth: 100, transition: "background 0.2s",
                          }}
                        >
                          {isApplying ? "Applying…" : eligible ? "Apply Now" : "Not Eligible"}
                        </button>
                      ) : profileMode && currentStatus === "applied" ? (
                        // ── Applied → Show status badge + Withdraw button
                        // Withdrawal allowed only at this stage (no rounds started yet)
                        <>
                          <button
                            disabled
                            style={{
                              padding: "8px 20px", fontSize: 12, fontWeight: 700,
                              color: statusCfg.color, background: statusCfg.bg,
                              border: `1px solid ${statusCfg.color}44`, borderRadius: 4,
                              cursor: "default", minWidth: 100,
                            }}
                          >
                            ✔ Applied
                          </button>
                          <button
                            id={`withdraw-btn-${d.id}`}
                            disabled={withdrawing === d.id}
                            onClick={() => handleWithdraw(d.id, d.company)}
                            title="No rounds have started — you can still withdraw"
                            style={{
                              padding: "7px 16px", fontSize: 12, fontWeight: 700,
                              color: withdrawing === d.id ? "#aaa" : "#b91c1c",
                              background: withdrawing === d.id ? "#f3f4f6" : "#fff",
                              border: `1px solid ${withdrawing === d.id ? "#d1d5db" : "#fca5a5"}`,
                              borderRadius: 4,
                              cursor: withdrawing === d.id ? "not-allowed" : "pointer",
                              minWidth: 100, transition: "all 0.2s",
                              display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                            }}
                          >
                            {withdrawing === d.id ? "Withdrawing…" : "↩ Withdraw"}
                          </button>
                          <span style={{ fontSize: 10, color: "#6b7280", textAlign: "center", maxWidth: 110, lineHeight: 1.3 }}>
                            Rounds not started yet
                          </span>
                        </>
                      ) : profileMode && currentStatus !== "not_applied" && currentStatus !== "applied" ? (
                        // ── Shortlisted / Rejected → Rounds in progress, no withdraw
                        <>
                          <button
                            disabled
                            style={{
                              padding: "8px 20px", fontSize: 12, fontWeight: 700,
                              color: statusCfg.color, background: statusCfg.bg,
                              border: `1px solid ${statusCfg.color}44`, borderRadius: 4,
                              cursor: "default", minWidth: 100,
                            }}
                          >
                            {statusCfg.label}
                          </button>
                          <span
                            title="Withdrawal not allowed once rounds have started"
                            style={{
                              fontSize: 10, color: "#9a3412",
                              background: "#fff7ed", border: "1px solid #fed7aa",
                              borderRadius: 4, padding: "3px 8px",
                              textAlign: "center", maxWidth: 110, lineHeight: 1.4,
                              cursor: "help",
                            }}
                          >
                            🔒 Rounds started — cannot withdraw
                          </span>
                        </>
                      ) : null}

                      <button
                        id={`expand-btn-${d.id}`}
                        onClick={() => setExpandedId(expanded ? null : d.id)}
                        style={{
                          background: "none", border: "none", fontSize: 12,
                          color: "#17375e", cursor: "pointer",
                          textDecoration: "underline", padding: 0,
                        }}
                      >
                        {expanded ? "Hide Details ▲" : "View Details ▼"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expanded && (
                  <div
                    style={{
                      borderTop: "1px solid #e5e7eb",
                      background: "#f9fafb",
                      padding: "16px 20px",
                    }}
                  >
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 32px" }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
                          About the Role
                        </div>
                        <p style={{ fontSize: 13, color: "#444", margin: 0, lineHeight: 1.6 }}>{d.description}</p>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
                          Selection Process
                        </div>
                        <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#444", lineHeight: 1.8 }}>
                          {d.rounds.map((r, i) => <li key={i}>{r}</li>)}
                        </ol>
                      </div>
                    </div>

                    {/* Eligibility check summary (profile mode only) */}
                    {profileMode && (
                    <div
                      style={{
                        marginTop: 16, padding: "12px 16px",
                        background: eligible ? "#f0fdf4" : "#fff7ed",
                        borderRadius: 6,
                        border: `1px solid ${eligible ? "#86efac" : "#fed7aa"}`,
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
                        Eligibility Check for {selectedStudent?.name ?? "Student"}
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {[
                          { label: `CGPA: ${STUDENT_CGPA} ≥ ${d.minCgpa}`, pass: cgpaOk },
                          { label: `Backlogs: ${STUDENT_BACKLOGS} ≤ ${d.maxBacklogs}`, pass: backlogOk },
                          { label: `Branch: ${STUDENT_BRANCH} ${branchMatch ? "✓ allowed" : "✗ not allowed"}`, pass: branchMatch },
                        ].map(({ label, pass }) => (
                          <div
                            key={label}
                            style={{
                              display: "flex", alignItems: "center", gap: 5,
                              padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                              background: pass ? "#d1fae5" : "#fee2e2",
                              color: pass ? "#065f46" : "#991b1b",
                            }}
                          >
                            <span>{pass ? "✓" : "✗"}</span>
                            {label}
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
