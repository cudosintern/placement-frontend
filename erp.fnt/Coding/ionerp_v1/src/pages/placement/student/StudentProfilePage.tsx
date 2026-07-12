import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import * as profileService from "./studentProfileService";
import { StudentResume } from "./studentProfileService";
import StudentOffersPage from "./StudentOffersPage";
import {
  AllStudentRow,
  StudentProfile,
  StudentSkill,
  StudentCertification,
  StudentCourse,
  StudentSgpaCgpa,
  StudentCgpa,
  ProficiencyLevel,
} from "./studentProfileTypes";

// ─── Proficiency Config ────────────────────────────────────────────────────────

const PROFICIENCY_OPTIONS: ProficiencyLevel[] = [
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
];

const PROFICIENCY_CONFIG: Record<
  ProficiencyLevel,
  { label: string; color: string; bg: string; bar: string; width: string }
> = {
  BEGINNER: {
    label: "Beginner",
    color: "#92400e",
    bg: "#fef3c7",
    bar: "#f59e0b",
    width: "30%",
  },
  INTERMEDIATE: {
    label: "Intermediate",
    color: "#1e40af",
    bg: "#dbeafe",
    bar: "#3b82f6",
    width: "65%",
  },
  ADVANCED: {
    label: "Advanced",
    color: "#065f46",
    bg: "#d1fae5",
    bar: "#10b981",
    width: "100%",
  },
};

// ─── Shared Styles ─────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  border: "1px solid #d8d8d8",
  borderRadius: 3,
  fontSize: 13,
  background: "#fff",
  color: "#222",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

const selectStyle: React.CSSProperties = { ...inputStyle, cursor: "pointer" };

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: "#5f6772",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  display: "block",
  marginBottom: 5,
};

// ─── Small Sub-components ──────────────────────────────────────────────────────

const SectionTitle: React.FC<{ title: string }> = ({ title }) => (
  <div
    style={{
      fontSize: 13,
      fontWeight: 700,
      color: "#44546a",
      borderBottom: "1px solid #ddd",
      paddingBottom: 10,
      marginBottom: 18,
      marginTop: 10,
      letterSpacing: "0.5px",
      textTransform: "uppercase",
    }}
  >
    {title}
  </div>
);

const InfoField: React.FC<{
  label: string;
  value?: string | number | null;
  linkHref?: string;
}> = ({ label, value, linkHref }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    <label style={labelStyle}>{label}</label>
    {linkHref && value ? (
      <a
        href={linkHref}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          fontSize: 13,
          color: "#17375e",
          textDecoration: "underline",
          wordBreak: "break-all",
        }}
      >
        {String(value)}
      </a>
    ) : (
      <span
        style={{
          fontSize: 13,
          color: value ? "#222" : "#aaa",
          minHeight: 20,
        }}
      >
        {value != null && value !== "" ? String(value) : "\u2014"}
      </span>
    )}
  </div>
);

const ProficiencyBadge: React.FC<{ level: ProficiencyLevel }> = ({ level }) => {
  const cfg = PROFICIENCY_CONFIG[level] ?? PROFICIENCY_CONFIG.BEGINNER;
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 700,
        background: cfg.bg,
        color: cfg.color,
        letterSpacing: "0.3px",
      }}
    >
      {cfg.label}
    </span>
  );
};

const computeCertStatus = (expiryDate?: string | null): "Active" | "Expired" => {
  if (!expiryDate) return "Active";
  return new Date(expiryDate) < new Date() ? "Expired" : "Active";
};

// ─── Skill Form ────────────────────────────────────────────────────────────────

interface SkillFormData {
  skill_name: string;
  proficiency_level: ProficiencyLevel;
}

const SkillForm: React.FC<{
  initial?: SkillFormData;
  onSave: (data: SkillFormData) => void;
  onCancel: () => void;
  saving?: boolean;
  isEdit?: boolean;
}> = ({ initial, onSave, onCancel, saving, isEdit }) => {
  const [name, setName] = useState(initial?.skill_name ?? "");
  const [level, setLevel] = useState<ProficiencyLevel>(
    initial?.proficiency_level ?? "BEGINNER"
  );
  const [nameErr, setNameErr] = useState("");

  const handleSave = () => {
    if (!name.trim()) {
      setNameErr("Skill name is required");
      return;
    }
    onSave({ skill_name: name.trim(), proficiency_level: level });
  };

  return (
    <div
      style={{
        background: "#f0f5ff",
        border: "1px solid #c8d8f0",
        borderRadius: 6,
        padding: "16px 18px",
        marginBottom: 14,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, color: "#17375e", marginBottom: 12 }}>
        {isEdit ? "\u270F Edit Skill" : "\uff0b Add New Skill"}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px 16px",
          alignItems: "flex-end",
        }}
      >
        <div>
          <label style={labelStyle}>
            Skill Name <span style={{ color: "#c0392b" }}>*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setNameErr(""); }}
            placeholder="e.g. Python, React, SQL"
            style={{ ...inputStyle, borderColor: nameErr ? "#c0392b" : "#d8d8d8" }}
          />
          {nameErr && <p style={{ color: "#c0392b", fontSize: 11, marginTop: 4 }}>{nameErr}</p>}
        </div>
        <div>
          <label style={labelStyle}>Proficiency Level</label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as ProficiencyLevel)}
            style={selectStyle}
          >
            {PROFICIENCY_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {PROFICIENCY_CONFIG[o].label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: "7px 18px",
            fontSize: 13,
            fontWeight: 700,
            color: "#fff",
            background: saving ? "#9db8d8" : "#17375e",
            border: "none",
            borderRadius: 4,
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Saving..." : isEdit ? "Update Skill" : "Add Skill"}
        </button>
        <button
          onClick={onCancel}
          style={{
            padding: "7px 14px",
            fontSize: 13,
            color: "#555",
            background: "#fff",
            border: "1px solid #ccc",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

// ─── Certification Form ────────────────────────────────────────────────────────

interface CertFormData {
  certification_name: string;
  issuing_organization: string;
  issue_date: string;
  expiry_date: string;
  credential_id: string;
  credential_url: string;
}

const EMPTY_CERT: CertFormData = {
  certification_name: "",
  issuing_organization: "",
  issue_date: "",
  expiry_date: "",
  credential_id: "",
  credential_url: "",
};

const CertForm: React.FC<{
  initial?: CertFormData;
  onSave: (data: CertFormData) => void;
  onCancel: () => void;
  saving?: boolean;
  isEdit?: boolean;
}> = ({ initial, onSave, onCancel, saving, isEdit }) => {
  const [form, setForm] = useState<CertFormData>(initial ?? EMPTY_CERT);
  const [errors, setErrors] = useState<Partial<CertFormData>>({});

  const set = (key: keyof CertFormData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    };

  const handleSave = () => {
    const errs: Partial<CertFormData> = {};
    if (!form.certification_name.trim()) errs.certification_name = "Required";
    if (!form.issuing_organization.trim()) errs.issuing_organization = "Required";
    if (!form.issue_date) errs.issue_date = "Required";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    onSave(form);
  };

  const fields: { key: keyof CertFormData; label: string; type: string; placeholder: string; required?: boolean }[] = [
    { key: "certification_name", label: "Certification Name", type: "text", placeholder: "AWS Cloud Practitioner", required: true },
    { key: "issuing_organization", label: "Issued By", type: "text", placeholder: "Amazon Web Services", required: true },
    { key: "issue_date", label: "Issue Date", type: "date", placeholder: "", required: true },
    { key: "expiry_date", label: "Expiry Date (Optional)", type: "date", placeholder: "" },
    { key: "credential_id", label: "Credential ID", type: "text", placeholder: "ABC-123-XYZ" },
    { key: "credential_url", label: "Credential URL", type: "url", placeholder: "https://credential.link/..." },
  ];

  return (
    <div
      style={{
        background: "#f0f5ff",
        border: "1px solid #c8d8f0",
        borderRadius: 6,
        padding: "16px 18px",
        marginBottom: 14,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, color: "#17375e", marginBottom: 12 }}>
        {isEdit ? "\u270F Edit Certification" : "\uff0b Add New Certification"}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 20px" }}>
        {fields.map(({ key, label, type, placeholder, required }) => (
          <div key={key}>
            <label style={labelStyle}>
              {label} {required && <span style={{ color: "#c0392b" }}>*</span>}
            </label>
            <input
              type={type}
              value={form[key]}
              onChange={set(key)}
              placeholder={placeholder}
              style={{ ...inputStyle, borderColor: errors[key] ? "#c0392b" : "#d8d8d8" }}
            />
            {errors[key] && <p style={{ color: "#c0392b", fontSize: 11, marginTop: 4 }}>{errors[key]}</p>}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: "7px 18px",
            fontSize: 13,
            fontWeight: 700,
            color: "#fff",
            background: saving ? "#9db8d8" : "#17375e",
            border: "none",
            borderRadius: 4,
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Saving..." : isEdit ? "Update Certification" : "Add Certification"}
        </button>
        <button
          onClick={onCancel}
          style={{
            padding: "7px 14px",
            fontSize: 13,
            color: "#555",
            background: "#fff",
            border: "1px solid #ccc",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN PROFILE PAGE
// ═══════════════════════════════════════════════════════════════════════════════

type TabKey = "register" | "skills" | "certifications" | "resume" | "offers";

const StudentProfilePage: React.FC<{ studentId: number }> = ({ studentId }) => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>("register");

  // ── Student data from API
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [skills, setSkills] = useState<StudentSkill[]>([]);
  const [certs, setCerts] = useState<StudentCertification[]>([]);
  const [courses, setCourses] = useState<StudentCourse[]>([]);
  const [sgpaCgpaRecords, setSgpaCgpaRecords] = useState<StudentSgpaCgpa[]>([]);
  const [overallCgpa, setOverallCgpa] = useState<StudentCgpa | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Profile list state (for when no studentId)
  const [allStudents, setAllStudents] = useState<AllStudentRow[]>([]);

  // ── Quick-register modal state
  const [registerTarget, setRegisterTarget] = useState<AllStudentRow | null>(null);
  const [regDraft, setRegDraft] = useState<{
    linkedin_url: string;
    github_url: string;
    portfolio_url: string;
    career_objective: string;
    preferred_locations: string;
  }>({
    linkedin_url: "",
    github_url: "",
    portfolio_url: "",
    career_objective: "",
    preferred_locations: "",
  });
  const [regSaving, setRegSaving] = useState(false);

  // ── Profile edit
  const [editProfile, setEditProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState<Partial<StudentProfile>>({});
  const [savingProfile, setSavingProfile] = useState(false);

  // ── Skills state
  const [addingSkill, setAddingSkill] = useState(false);
  const [editSkillId, setEditSkillId] = useState<number | null>(null);
  const [skillSaving, setSkillSaving] = useState(false);

  // ── Certs state
  const [addingCert, setAddingCert] = useState(false);
  const [editCertId, setEditCertId] = useState<number | null>(null);
  const [certSaving, setCertSaving] = useState(false);

  // ── Resume state
  const [resumes, setResumes] = useState<StudentResume[]>([]);
  const [resumeUploading, setResumeUploading] = useState(false);
  const resumeFileRef = useRef<HTMLInputElement>(null);

  // ── Inline PDF viewer state
  const [pdfViewResumeId, setPdfViewResumeId] = useState<number | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const prevBlobUrlRef = useRef<string | null>(null);

  // ── Load from API ────────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      if (studentId) {
        const [p, s, c, r] = await Promise.all([
          profileService.getProfile(studentId),
          profileService.getSkills(studentId),
          profileService.getCertifications(studentId),
          profileService.getResumes(studentId),
        ]);
        setProfile(p);
        setSkills(s);
        setCerts(c);
        setResumes(r);

        // Fetch academic data using regno from the profile
        if (p?.regno) {
          await loadAcademicData(p.regno);
        }
      } else {
        const rows = await profileService.getAllStudentsList();
        setAllStudents(rows);
      }
    } catch (err) {
      console.error("loadAll error:", err);
    }
    setLoading(false);
  }, [studentId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ── Load academic data by regno ──────────────────────────────────────────────
  const loadAcademicData = async (regno: string) => {
    try {
      const [co, sg, cg] = await Promise.all([
        profileService.getStudentCourses(regno),
        profileService.getStudentSgpaCgpa(regno),
        profileService.getStudentCgpa(regno),
      ]);
      setCourses(co);
      setSgpaCgpaRecords(sg);
      setOverallCgpa(cg);
    } catch (err) {
      console.error("loadAcademicData error:", err);
    }
  };

  // ── Inline PDF viewer helper ──────────────────────────────────────────────
  const openInlinePdf = async (resumeId: number) => {
    // Toggle off if same resume clicked again
    if (pdfViewResumeId === resumeId) {
      setPdfViewResumeId(null);
      if (prevBlobUrlRef.current) { URL.revokeObjectURL(prevBlobUrlRef.current); prevBlobUrlRef.current = null; }
      setPdfBlobUrl(null);
      return;
    }
    setPdfLoading(true);
    setPdfViewResumeId(resumeId);
    try {
      const url = await profileService.getResumeBlobUrl(resumeId);
      // Revoke previous blob URL to free memory
      if (prevBlobUrlRef.current) URL.revokeObjectURL(prevBlobUrlRef.current);
      prevBlobUrlRef.current = url;
      setPdfBlobUrl(url);
    } catch {
      toast.error("Failed to load resume preview.");
      setPdfViewResumeId(null);
    }
    setPdfLoading(false);
  };

  const closeInlinePdf = () => {
    setPdfViewResumeId(null);
    if (prevBlobUrlRef.current) { URL.revokeObjectURL(prevBlobUrlRef.current); prevBlobUrlRef.current = null; }
    setPdfBlobUrl(null);
  };

  // ── Profile helpers ────────────────────────────────────────────────────────────
  const startEditProfile = () => {
    if (!profile) return;
    setProfileDraft({ ...profile });
    setEditProfile(true);
  };

  const saveProfile = async () => {
    if (!profile) return;
    setSavingProfile(true);
    const updated = await profileService.updateProfile({
      profile_id: profile.profile_id,
      linkedin_url: profileDraft.linkedin_url ?? undefined,
      github_url: profileDraft.github_url ?? undefined,
      portfolio_url: profileDraft.portfolio_url ?? undefined,
      resume_path: profileDraft.resume_path ?? undefined,
      // current_cgpa, backlogs, is_placement_eligible are read-only (set at registration)
      career_objective: profileDraft.career_objective ?? undefined,
      preferred_locations: profileDraft.preferred_locations ?? undefined,
    });
    if (updated) {
      setProfile(updated);
      setEditProfile(false);
      toast.success("Profile updated!");
    } else {
      toast.error("Failed to update profile.");
    }
    setSavingProfile(false);
  };

  // ── Skill helpers ──────────────────────────────────────────────────────────────
  const handleAddSkill = async (data: SkillFormData) => {
    if (!profile) return;
    setSkillSaving(true);
    const created = await profileService.addSkill({
      profile_id: profile.profile_id,
      student_id: profile.student_id,
      skill_name: data.skill_name,
      proficiency_level: data.proficiency_level,
    });
    if (created) {
      setSkills((prev) => [created, ...prev]);
      setAddingSkill(false);
      toast.success(`"${data.skill_name}" added!`);
    } else {
      toast.error("Failed to add skill.");
    }
    setSkillSaving(false);
  };

  const handleEditSkill = async (skillId: number, data: SkillFormData) => {
    setSkillSaving(true);
    const updated = await profileService.updateSkill({
      skill_id: skillId,
      skill_name: data.skill_name,
      proficiency_level: data.proficiency_level,
    });
    if (updated) {
      setSkills((prev) => prev.map((s) => (s.skill_id === skillId ? updated : s)));
      setEditSkillId(null);
      toast.success(`"${data.skill_name}" updated!`);
    } else {
      toast.error("Failed to update skill.");
    }
    setSkillSaving(false);
  };

  const handleDeleteSkill = async (skillId: number, skillName: string) => {
    if (!window.confirm(`Remove skill "${skillName}"?`)) return;
    const ok = await profileService.deleteSkill(skillId);
    if (ok) {
      setSkills((prev) => prev.filter((s) => s.skill_id !== skillId));
      toast.success(`"${skillName}" removed.`);
    } else {
      toast.error("Failed to delete skill.");
    }
  };

  // ── Cert helpers ───────────────────────────────────────────────────────────────
  const handleAddCert = async (data: CertFormData) => {
    if (!profile) return;
    setCertSaving(true);
    const created = await profileService.addCertification({
      profile_id: profile.profile_id,
      student_id: profile.student_id,
      certification_name: data.certification_name,
      issuing_organization: data.issuing_organization,
      issue_date: data.issue_date || undefined,
      expiry_date: data.expiry_date || undefined,
      credential_id: data.credential_id || undefined,
      credential_url: data.credential_url || undefined,
    });
    if (created) {
      setCertSaving(false);
      setAddingCert(false);
      await loadAll();
      toast.success(`"${data.certification_name}" added!`);
    } else {
      setCertSaving(false);
      toast.error("Failed to add certification.");
    }
  };

  const handleEditCert = async (certId: number, data: CertFormData) => {
    setCertSaving(true);
    const updated = await profileService.updateCertification({
      certification_id: certId,
      certification_name: data.certification_name,
      issuing_organization: data.issuing_organization,
      issue_date: data.issue_date || undefined,
      expiry_date: data.expiry_date || undefined,
      credential_id: data.credential_id || undefined,
      credential_url: data.credential_url || undefined,
    });
    if (updated) {
      setCertSaving(false);
      setEditCertId(null);
      await loadAll();
      toast.success(`"${data.certification_name}" updated!`);
    } else {
      setCertSaving(false);
      toast.error("Failed to update certification.");
    }
  };

  const handleDeleteCert = async (certId: number, certName: string) => {
    if (!window.confirm(`Remove certification "${certName}"?`)) return;
    const ok = await profileService.deleteCertification(certId);
    if (ok) {
      setCerts((prev) => prev.filter((c) => c.certification_id !== certId));
      toast.success(`"${certName}" removed.`);
    } else {
      toast.error("Failed to delete certification.");
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: "#888", fontSize: 14 }}>
        Loading profile...
      </div>
    );
  }

  // ── Student List View ────────────────────────────────────────────────────────
  if (!studentId) {
    const thStyle: React.CSSProperties = {
      background: "#17375e",
      color: "#fff",
      padding: "10px 14px",
      textAlign: "left",
      fontWeight: 600,
      fontSize: 12,
      letterSpacing: "0.3px",
      whiteSpace: "nowrap",
    };
    const tdStyle: React.CSSProperties = {
      padding: "10px 14px",
      borderBottom: "1px solid #eee",
      color: "#333",
      fontSize: 13,
      verticalAlign: "middle",
    };
    const listCardStyle: React.CSSProperties = {
      background: "#fff",
      borderRadius: 4,
      boxShadow: "0 1px 4px rgba(0,0,0,0.10)",
      marginBottom: 20,
      overflow: "hidden",
    };

    const registeredCount = allStudents.filter((s) => s.is_registered).length;

    const handleRegisterClick = (row: AllStudentRow) => {
      setRegisterTarget(row);
      setRegDraft({
        linkedin_url: "",
        github_url: "",
        portfolio_url: "",
        career_objective: "",
        preferred_locations: "",
      });
    };

    const handleRegisterSubmit = async () => {
      if (!registerTarget) return;
      setRegSaving(true);
      const created = await profileService.addProfile({
        student_id: registerTarget.student_id,
        current_cgpa: registerTarget.cgpa_actual ?? undefined,
        backlogs: 0,
        is_placement_eligible: (registerTarget.cgpa_actual ?? 0) >= 6 ? 1 : 0,
        linkedin_url: regDraft.linkedin_url || undefined,
        github_url: regDraft.github_url || undefined,
        portfolio_url: regDraft.portfolio_url || undefined,
        career_objective: regDraft.career_objective || undefined,
        preferred_locations: regDraft.preferred_locations || undefined,
      });
      if (created) {
        toast.success(`${registerTarget.name} registered for Placement!`);
        setRegisterTarget(null);
        await loadAll();
      } else {
        toast.error("Failed to register student.");
      }
      setRegSaving(false);
    };

    return (
      <div style={{ maxWidth: 1040, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#17375e", letterSpacing: "0.3px" }}>
            All Students
          </h3>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#888" }}>
            {registeredCount} of {allStudents.length} students registered for Placement.
            Unregistered students can be registered using the <strong>Register</strong> button.
          </p>
        </div>

        {/* ── Inline Register Modal ── */}
        {registerTarget && (
          <div
            style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: 9999,
            }}
            onClick={(e) => { if (e.target === e.currentTarget) setRegisterTarget(null); }}
          >
            <div
              style={{
                background: "#fff", borderRadius: 6, width: "100%", maxWidth: 560,
                boxShadow: "0 8px 40px rgba(0,0,0,0.22)", overflow: "hidden",
              }}
            >
              {/* Modal Header */}
              <div style={{ background: "#17375e", padding: "14px 22px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>
                  Register for Placement
                </span>
                <button
                  onClick={() => setRegisterTarget(null)}
                  style={{ background: "none", border: "none", color: "#fff", fontSize: 20, cursor: "pointer", lineHeight: 1 }}
                >
                  &#x2715;
                </button>
              </div>

              <div style={{ padding: "20px 22px", maxHeight: "80vh", overflowY: "auto" }}>
                {/* ── Personal Information (read-only) ── */}
                <div style={{ fontSize: 11, fontWeight: 700, color: "#44546a", borderBottom: "1px solid #ddd", paddingBottom: 8, marginBottom: 14, letterSpacing: "0.5px", textTransform: "uppercase" }}>
                  Personal Information
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 16px", marginBottom: 18 }}>
                  <div>
                    <label style={labelStyle}>Student Name</label>
                    <input type="text" value={registerTarget.name} readOnly
                      style={{ ...inputStyle, background: "#f3f4f6", color: "#555", cursor: "not-allowed" }} />
                  </div>
                  <div>
                    <label style={labelStyle}>USN</label>
                    <input type="text" value={registerTarget.usno} readOnly
                      style={{ ...inputStyle, background: "#f3f4f6", color: "#555", cursor: "not-allowed", fontFamily: "monospace" }} />
                  </div>
                  <div>
                    <label style={labelStyle}>Department</label>
                    <input type="text"
                      value={registerTarget.department_name ?? (registerTarget.department_id ? `Dept ID: ${registerTarget.department_id}` : "N/A")}
                      readOnly
                      style={{ ...inputStyle, background: "#f3f4f6", color: "#555", cursor: "not-allowed" }} />
                  </div>
                  <div>
                    <label style={labelStyle}>Email</label>
                    <input type="text" value={registerTarget.email ?? "N/A"} readOnly
                      style={{ ...inputStyle, background: "#f3f4f6", color: "#555", cursor: "not-allowed" }} />
                  </div>
                </div>

                {/* ── Academic Information (read-only from DB) ── */}
                <div style={{ fontSize: 11, fontWeight: 700, color: "#44546a", borderBottom: "1px solid #ddd", paddingBottom: 8, marginBottom: 14, letterSpacing: "0.5px", textTransform: "uppercase" }}>
                  Academic Information
                  <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 400, color: "#aaa", textTransform: "none" }}>(from academic records — read only)</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px 16px", marginBottom: 18 }}>
                  <div>
                    <label style={labelStyle}>Current CGPA</label>
                    <input type="text" value={registerTarget.cgpa_actual ?? "N/A"} readOnly
                      style={{ ...inputStyle, background: "#f3f4f6", color: "#17375e", cursor: "not-allowed", fontWeight: 700 }} />
                  </div>
                  <div>
                    <label style={labelStyle}>Backlogs</label>
                    <input type="text" value="0" readOnly
                      style={{ ...inputStyle, background: "#f3f4f6", color: "#555", cursor: "not-allowed" }} />
                  </div>
                  <div>
                    <label style={labelStyle}>Placement Eligible</label>
                    <input type="text"
                      value={(registerTarget.cgpa_actual ?? 0) >= 6 ? "Yes" : "No"}
                      readOnly
                      style={{
                        ...inputStyle, background: "#f3f4f6", cursor: "not-allowed", fontWeight: 700,
                        color: (registerTarget.cgpa_actual ?? 0) >= 6 ? "#155724" : "#721c24",
                      }} />
                  </div>
                </div>

                {/* ── Placement Details (editable) ── */}
                <div style={{ fontSize: 11, fontWeight: 700, color: "#44546a", borderBottom: "1px solid #ddd", paddingBottom: 8, marginBottom: 14, letterSpacing: "0.5px", textTransform: "uppercase" }}>
                  Placement Details
                  <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 400, color: "#aaa", textTransform: "none" }}>(optional — can be added later)</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 16px", marginBottom: 18 }}>
                  {[
                    { key: "linkedin_url" as const, label: "LinkedIn URL", placeholder: "https://linkedin.com/in/..." },
                    { key: "github_url" as const, label: "GitHub URL", placeholder: "https://github.com/..." },
                    { key: "portfolio_url" as const, label: "Portfolio URL", placeholder: "https://myportfolio.com" },
                    { key: "preferred_locations" as const, label: "Preferred Locations", placeholder: "Bangalore, Mumbai" },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label style={labelStyle}>{label}</label>
                      <input
                        type="text"
                        value={regDraft[key]}
                        onChange={(e) => setRegDraft((prev) => ({ ...prev, [key]: e.target.value }))}
                        placeholder={placeholder}
                        style={inputStyle}
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <label style={labelStyle}>Career Objective</label>
                  <textarea
                    value={regDraft.career_objective}
                    onChange={(e) => setRegDraft((prev) => ({ ...prev, career_objective: e.target.value }))}
                    placeholder="Brief career objective..."
                    rows={3}
                    style={{ ...inputStyle, resize: "vertical" }}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{ padding: "14px 22px", borderTop: "1px solid #eee", display: "flex", gap: 10, justifyContent: "flex-end", background: "#fafafa" }}>
                <button
                  onClick={() => setRegisterTarget(null)}
                  style={{ padding: "8px 18px", fontSize: 13, color: "#555", background: "#fff", border: "1px solid #ccc", borderRadius: 4, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRegisterSubmit}
                  disabled={regSaving}
                  style={{
                    padding: "8px 22px", fontSize: 13, fontWeight: 700,
                    color: "#fff", background: regSaving ? "#9db8d8" : "#17375e",
                    border: "none", borderRadius: 4,
                    cursor: regSaving ? "not-allowed" : "pointer",
                  }}
                >
                  {regSaving ? "Registering..." : "Register Student"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Students Table ── */}
        <div style={listCardStyle}>
          <div style={{ padding: "14px 22px", borderBottom: "1px solid #e8e8e8", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#333" }}>
              All Students ({allStudents.length})
            </span>
            <span style={{ fontSize: 12, color: "#888" }}>
              <span style={{ color: "#155724", fontWeight: 700 }}>{registeredCount} Registered</span>
              &nbsp;·&nbsp;
              <span style={{ color: "#856404", fontWeight: 700 }}>{allStudents.length - registeredCount} Not Registered</span>
            </span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, tableLayout: "fixed" }}>
              <colgroup>
                <col style={{ width: 40 }} />
                <col style={{ width: "24%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "24%" }} />
                <col style={{ width: 70 }} />
                <col style={{ width: 150 }} />
                <col style={{ width: 110 }} />
              </colgroup>
              <thead>
                <tr>
                  {["#", "Student Name", "USN", "Department", "CGPA", "Status", "Action"].map((h) => (
                    <th key={h} style={{ ...thStyle, textAlign: h === "CGPA" ? "center" : "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ ...tdStyle, textAlign: "center", color: "#aaa", padding: 32 }}>
                      No students found.
                    </td>
                  </tr>
                ) : (
                  allStudents.map((s, idx) => (
                    <tr key={s.student_id} style={{ background: idx % 2 === 0 ? "#fff" : "#fafafa" }}>
                      <td style={{ ...tdStyle, textAlign: "center", color: "#888" }}>{idx + 1}</td>
                      <td style={{ ...tdStyle, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {s.is_registered ? (
                          <button
                            onClick={() => navigate(`/student/profile?student_id=${s.student_id}`)}
                            style={{ background: "none", border: "none", padding: 0, color: "#17375e", fontWeight: 700, fontSize: 13, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 2, textAlign: "left", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                          >
                            {s.name}
                          </button>
                        ) : (
                          <span style={{ color: "#555", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{s.name}</span>
                        )}
                      </td>
                      <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: 12 }}>{s.usno || "—"}</td>
                      <td style={{ ...tdStyle, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#555" }}>
                        {s.department_name || "—"}
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 700, color: "#17375e", textAlign: "center" }}>
                        {s.cgpa_actual ?? (s.current_cgpa ?? "—")}
                      </td>

                      <td style={tdStyle}>
                        <span style={{
                          display: "inline-block", padding: "3px 10px", borderRadius: 20,
                          fontSize: 11, fontWeight: 700,
                          background: s.is_registered ? "#d4edda" : "#fff3cd",
                          color: s.is_registered ? "#155724" : "#856404",
                        }}>
                          {s.is_registered ? "Registered" : "Not Registered"}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: "center" }}>
                        {s.is_registered ? (
                          <button
                            onClick={() => navigate(`/student/profile?student_id=${s.student_id}`)}
                            style={{ padding: "5px 14px", fontSize: 11, fontWeight: 700, color: "#fff", background: "#17375e", border: "none", borderRadius: 3, cursor: "pointer" }}
                          >
                            Profile
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRegisterClick(s)}
                            style={{ padding: "5px 12px", fontSize: 11, fontWeight: 700, color: "#fff", background: "#d97706", border: "none", borderRadius: 3, cursor: "pointer" }}
                          >
                            Register
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ maxWidth: 520, margin: "40px auto", textAlign: "center", color: "#888", fontSize: 14 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>{"\uD83D\uDD0D"}</div>
        <p style={{ fontWeight: 700, color: "#444", fontSize: 16 }}>Profile not found</p>
        <p style={{ fontSize: 13, marginTop: 6, color: "#bbb" }}>
          No student profile exists for student ID {studentId}.
          <br />Register a student first, then create a profile for them.
        </p>
      </div>
    );
  }

  // ── Styles ─────────────────────────────────────────────────────────────────────

  const cardStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: 4,
    boxShadow: "0 1px 4px rgba(0,0,0,0.10)",
    marginBottom: 20,
    overflow: "hidden",
  };

  const cardHeaderStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 22px",
    borderBottom: "1px solid #e8e8e8",
    background: "#f9f9f9",
  };

  const cardBodyStyle: React.CSSProperties = {
    padding: "20px 22px",
  };

  const tabs: { key: TabKey; label: string }[] = [
    { key: "register", label: "Register" },
    { key: "skills", label: `Skills (${skills.length})` },
    { key: "certifications", label: `Certifications (${certs.length})` },
    { key: "resume", label: `Resume (${resumes.length})` },
    { key: "offers", label: "My Placement Offers" },
  ];

  const tabBtnStyle = (isActive: boolean): React.CSSProperties => ({
    padding: "10px 22px",
    fontSize: 13,
    fontWeight: isActive ? 700 : 500,
    color: isActive ? "#17375e" : "#666",
    background: isActive ? "#fff" : "transparent",
    border: "none",
    borderBottom: isActive ? "2px solid #17375e" : "2px solid transparent",
    cursor: "pointer",
    transition: "color 0.2s, border-color 0.2s",
  });

  const actionBtnStyle: React.CSSProperties = {
    background: "#17375e",
    color: "white",
    border: "none",
    padding: "8px 18px",
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  };

  const thStyle: React.CSSProperties = {
    background: "#17375e",
    color: "#fff",
    padding: "10px 14px",
    textAlign: "left",
    fontWeight: 600,
    fontSize: 12,
    letterSpacing: "0.3px",
    whiteSpace: "nowrap",
  };

  const tdStyle: React.CSSProperties = {
    padding: "10px 14px",
    borderBottom: "1px solid #eee",
    color: "#333",
    verticalAlign: "middle",
    fontSize: 13,
  };

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 980, margin: "0 auto" }}>

      {/* ── Profile Header ── */}
      <div
        style={{
          background: "#fff",
          borderRadius: 4,
          boxShadow: "0 1px 4px rgba(0,0,0,0.10)",
          marginBottom: 20,
          borderLeft: "5px solid #17375e",
          padding: "18px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        {/* Left: Avatar + Name + USN */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #17375e 0%, #274a78 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              fontWeight: 700,
              color: "#fff",
              flexShrink: 0,
              boxShadow: "0 2px 6px rgba(23,55,94,0.3)",
            }}
          >
            {(profile.student_name ?? "S").charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#17375e" }}>
              {profile.student_name || "Student"}
            </h2>
            <p style={{ margin: "3px 0 0", fontSize: 12, color: "#888" }}>
              <span style={{ fontFamily: "monospace", fontWeight: 600, color: "#555" }}>
                {profile.usno || "\u2014"}
              </span>
              {profile.department_name && (
                <span style={{ marginLeft: 8, color: "#aaa" }}>· {profile.department_name}</span>
              )}
            </p>
          </div>
        </div>

        {/* Right: Badges + View Drives Button */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span
            style={{
              padding: "4px 14px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              background: profile.status === 1 ? "#d4edda" : "#f8d7da",
              color: profile.status === 1 ? "#155724" : "#721c24",
            }}
          >
            {profile.status === 1 ? "Active" : "Inactive"}
          </span>
          <button
            onClick={() => navigate(`/drives/available?student_id=${profile.student_id}`)}
            style={{
              padding: "5px 16px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              background: "linear-gradient(135deg, #17375e 0%, #1e4d8c 100%)",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5,
              boxShadow: "0 1px 4px rgba(23,55,94,0.25)",
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            title="View placement drives you are eligible for"
          >
            🚀 View Drives
          </button>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div
        style={{
          background: "#fff",
          borderBottom: "1px solid #e0e0e0",
          marginBottom: 16,
          borderRadius: "4px 4px 0 0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          display: "flex",
        }}
      >
        {tabs.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)} style={tabBtnStyle(tab === key)}>
            {label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: OVERVIEW                                                         */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {tab === "register" && (
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#333" }}>
              Student Details
            </span>
            {!editProfile ? (
              <button onClick={startEditProfile} style={actionBtnStyle}>
                Edit Profile
              </button>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={saveProfile}
                  disabled={savingProfile}
                  style={{
                    ...actionBtnStyle,
                    background: savingProfile ? "#9db8d8" : "#17375e",
                    cursor: savingProfile ? "not-allowed" : "pointer",
                  }}
                >
                  {savingProfile ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => setEditProfile(false)}
                  style={{
                    background: "#fff",
                    color: "#555",
                    border: "1px solid #ccc",
                    padding: "8px 14px",
                    borderRadius: 4,
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div style={cardBodyStyle}>
            {/* ── Personal Information ── */}
            <SectionTitle title="Personal Information" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 32px", marginBottom: 24 }}>
              {editProfile ? (
                <>
                  <div>
                    <label style={labelStyle}>Student Name</label>
                    <input
                      type="text"
                      value={profileDraft.student_name ?? ""}
                      disabled
                      style={{ ...inputStyle, background: "#f5f5f5", color: "#888" }}
                    />
                    <p style={{ fontSize: 11, color: "#999", marginTop: 2 }}>Read-only from student record</p>
                  </div>
                  <div>
                    <label style={labelStyle}>USN</label>
                    <input
                      type="text"
                      value={profileDraft.usno ?? ""}
                      disabled
                      style={{ ...inputStyle, background: "#f5f5f5", color: "#888", fontFamily: "monospace" }}
                    />
                    <p style={{ fontSize: 11, color: "#999", marginTop: 2 }}>Read-only from student record</p>
                  </div>
                  <div>
                    <label style={labelStyle}>Department</label>
                    <input
                      type="text"
                      value={profileDraft.department_name ?? (profileDraft.department_id ? `Dept ID: ${profileDraft.department_id}` : "")}
                      disabled
                      style={{ ...inputStyle, background: "#f5f5f5", color: "#888" }}
                    />
                    <p style={{ fontSize: 11, color: "#999", marginTop: 2 }}>Read-only from student record</p>
                  </div>
                  <div>
                    <label style={labelStyle}>Email</label>
                    <input
                      type="text"
                      value={profileDraft.email ?? ""}
                      disabled
                      style={{ ...inputStyle, background: "#f5f5f5", color: "#888" }}
                    />
                    <p style={{ fontSize: 11, color: "#999", marginTop: 2 }}>Read-only from student record</p>
                  </div>
                </>
              ) : (
                <>
                  <InfoField label="Student Name" value={profile.student_name} />
                  <InfoField label="USN" value={profile.usno} />
                  <InfoField label="Department" value={profile.department_name ?? (profile.department_id ? `Dept ID: ${profile.department_id}` : null)} />
                  <InfoField label="Email" value={profile.email} />
                </>
              )}
            </div>

            {/* ── Academic Information ── */}
            <SectionTitle title="Academic Information" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 32px", marginBottom: 24 }}>
              {/* Current CGPA and Backlogs are always read-only */}
              <InfoField label="Current CGPA" value={profile.current_cgpa ?? "\u2014"} />
              <InfoField label="Backlogs" value={profile.backlogs ?? 0} />
              {editProfile ? (
                <div>
                  <label style={labelStyle}>Preferred Locations</label>
                  <input
                    type="text"
                    value={profileDraft.preferred_locations ?? ""}
                    onChange={(e) => setProfileDraft((p) => ({ ...p, preferred_locations: e.target.value }))}
                    style={inputStyle}
                    placeholder="e.g. Bangalore, Hyderabad"
                  />
                </div>
              ) : (
                <InfoField label="Preferred Locations" value={profile.preferred_locations} />
              )}
            </div>

            {/* ── Career & Links ── */}
            <SectionTitle title="Career & Links" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 32px", marginBottom: 20 }}>
              {editProfile ? (
                <>
                  <div>
                    <label style={labelStyle}>LinkedIn URL</label>
                    <input
                      type="url"
                      value={profileDraft.linkedin_url ?? ""}
                      onChange={(e) => setProfileDraft((p) => ({ ...p, linkedin_url: e.target.value }))}
                      style={inputStyle}
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>GitHub URL</label>
                    <input
                      type="url"
                      value={profileDraft.github_url ?? ""}
                      onChange={(e) => setProfileDraft((p) => ({ ...p, github_url: e.target.value }))}
                      style={inputStyle}
                      placeholder="https://github.com/..."
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Portfolio URL</label>
                    <input
                      type="url"
                      value={profileDraft.portfolio_url ?? ""}
                      onChange={(e) => setProfileDraft((p) => ({ ...p, portfolio_url: e.target.value }))}
                      style={inputStyle}
                      placeholder="https://yoursite.com"
                    />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={labelStyle}>Career Objective</label>
                    <textarea
                      rows={3}
                      value={profileDraft.career_objective ?? ""}
                      onChange={(e) => setProfileDraft((p) => ({ ...p, career_objective: e.target.value }))}
                      style={{ ...inputStyle, resize: "vertical", minHeight: 80 }}
                      placeholder="Career objective..."
                    />
                  </div>
                </>
              ) : (
                <>
                  <InfoField label="LinkedIn" value={profile.linkedin_url} linkHref={profile.linkedin_url || undefined} />
                  <InfoField label="GitHub" value={profile.github_url} linkHref={profile.github_url || undefined} />
                  <InfoField label="Portfolio" value={profile.portfolio_url} linkHref={profile.portfolio_url || undefined} />
                  <div style={{ gridColumn: "1 / -1" }}>
                    <InfoField label="Career Objective" value={profile.career_objective} />
                  </div>
                </>
              )}
            </div>

            {/* ── Quick Stats ── */}
            {!editProfile && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 14,
                  marginTop: 10,
                  padding: "16px 0 0",
                  borderTop: "1px solid #eee",
                }}
              >
                {[
                  { label: "Skills Added", value: skills.length, icon: "\uD83D\uDEE0", color: "#1e40af" },
                  { label: "Certifications", value: certs.filter(c => computeCertStatus(c.expiry_date) === "Active").length, icon: "\uD83C\uDFC5", color: "#065f46" },
                  { label: "CGPA", value: profile.current_cgpa ?? "N/A", icon: "\uD83D\uDCCA", color: "#17375e" },
                ].map(({ label, value, icon, color }) => (
                  <div
                    key={label}
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e8e8e8",
                      borderRadius: 6,
                      padding: "14px 18px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: 22 }}>{icon}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color, marginTop: 4 }}>{value}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.4px", marginTop: 4 }}>
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: SKILLS                                                           */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {tab === "skills" && (
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#333" }}>
              Skills — {profile.student_name}{" "}
              <span style={{ fontSize: 12, fontWeight: 400, color: "#999" }}>({profile.usno})</span>
            </span>
            {!addingSkill && editSkillId === null && (
              <button onClick={() => setAddingSkill(true)} style={actionBtnStyle}>
                + Add Skill
              </button>
            )}
          </div>
          <div style={cardBodyStyle}>
            {addingSkill && (
              <SkillForm
                onSave={handleAddSkill}
                onCancel={() => setAddingSkill(false)}
                saving={skillSaving}
              />
            )}

            {skills.length === 0 && !addingSkill ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#aaa", fontSize: 14 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>{"\uD83D\uDEE0"}</div>
                No skills added yet for {profile.student_name}.
                <br />
                <button
                  onClick={() => setAddingSkill(true)}
                  style={{ ...actionBtnStyle, marginTop: 16, fontSize: 13 }}
                >
                  + Add First Skill
                </button>
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: 10,
                    marginBottom: 18,
                  }}
                >
                  {[
                    { label: "Total", value: skills.length, color: "#17375e" },
                    { label: "Beginner", value: skills.filter(s => s.proficiency_level === "BEGINNER").length, color: "#92400e" },
                    { label: "Intermediate", value: skills.filter(s => s.proficiency_level === "INTERMEDIATE").length, color: "#1e40af" },
                    { label: "Advanced", value: skills.filter(s => s.proficiency_level === "ADVANCED").length, color: "#065f46" },
                  ].map(({ label, value, color }) => (
                    <div
                      key={label}
                      style={{
                        background: "#f8fafc",
                        border: "1px solid #e8e8e8",
                        borderRadius: 5,
                        padding: "10px 14px",
                        textAlign: "center",
                      }}
                    >
                      <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.3px", marginTop: 4 }}>{label}</div>
                    </div>
                  ))}
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr>
                        {["#", "Skill", "Proficiency", "Progress", "Added On", "Actions"].map((h) => (
                          <th key={h} style={thStyle}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {skills.map((skill, idx) => {
                        const level = (skill.proficiency_level as ProficiencyLevel) ?? "BEGINNER";
                        const cfg = PROFICIENCY_CONFIG[level] ?? PROFICIENCY_CONFIG.BEGINNER;
                        if (editSkillId === skill.skill_id) {
                          return (
                            <tr key={skill.skill_id}>
                              <td colSpan={6} style={{ padding: "12px 14px", borderBottom: "1px solid #eee" }}>
                                <SkillForm
                                  initial={{
                                    skill_name: skill.skill_name,
                                    proficiency_level: level,
                                  }}
                                  onSave={(data) => handleEditSkill(skill.skill_id, data)}
                                  onCancel={() => setEditSkillId(null)}
                                  saving={skillSaving}
                                  isEdit
                                />
                              </td>
                            </tr>
                          );
                        }
                        return (
                          <tr key={skill.skill_id} style={{ background: idx % 2 === 0 ? "#fff" : "#fafafa" }}>
                            <td style={tdStyle}>{idx + 1}</td>
                            <td style={{ ...tdStyle, fontWeight: 600, color: "#17375e" }}>
                              {skill.skill_name}
                            </td>
                            <td style={tdStyle}>
                              <ProficiencyBadge level={level} />
                            </td>
                            <td style={{ ...tdStyle, minWidth: 100 }}>
                              <div style={{ height: 6, background: "#f0f0f0", borderRadius: 99, overflow: "hidden" }}>
                                <div style={{ height: "100%", width: cfg.width, background: cfg.bar, borderRadius: 99, transition: "width 0.4s" }} />
                              </div>
                            </td>
                            <td style={{ ...tdStyle, color: "#999", fontSize: 12 }}>{skill.created_date ?? "\u2014"}</td>
                            <td style={tdStyle}>
                              <div style={{ display: "flex", gap: 6 }}>
                                <button
                                  onClick={() => { setAddingSkill(false); setEditSkillId(skill.skill_id); }}
                                  style={{ padding: "4px 12px", fontSize: 11, fontWeight: 600, color: "#17375e", background: "#e8f0fb", border: "1px solid #b5cef5", borderRadius: 3, cursor: "pointer" }}
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteSkill(skill.skill_id, skill.skill_name)}
                                  style={{ padding: "4px 12px", fontSize: 11, fontWeight: 600, color: "#c0392b", background: "#fdf0ef", border: "1px solid #f5c6c2", borderRadius: 3, cursor: "pointer" }}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: CERTIFICATIONS                                                   */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {tab === "certifications" && (
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#333" }}>
              Certifications — {profile.student_name}{" "}
              <span style={{ fontSize: 12, fontWeight: 400, color: "#999" }}>({profile.usno})</span>
            </span>
            {!addingCert && editCertId === null && (
              <button onClick={() => setAddingCert(true)} style={actionBtnStyle}>
                + Add Certification
              </button>
            )}
          </div>
          <div style={cardBodyStyle}>
            {addingCert && (
              <CertForm
                onSave={handleAddCert}
                onCancel={() => setAddingCert(false)}
                saving={certSaving}
              />
            )}

            {certs.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 18 }}>
                {[
                  { label: "Total", value: certs.length, color: "#17375e" },
                  { label: "Active", value: certs.filter(c => computeCertStatus(c.expiry_date) === "Active").length, color: "#065f46" },
                  { label: "Expired", value: certs.filter(c => computeCertStatus(c.expiry_date) === "Expired").length, color: "#721c24" },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background: "#f8fafc", border: "1px solid #e8e8e8", borderRadius: 5, padding: "10px 14px", textAlign: "center" }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.3px", marginTop: 4 }}>{label}</div>
                  </div>
                ))}
              </div>
            )}

            {certs.length === 0 && !addingCert ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#aaa", fontSize: 14 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>{"\uD83C\uDFC5"}</div>
                No certifications added yet for {profile.student_name}.
                <br />
                <button onClick={() => setAddingCert(true)} style={{ ...actionBtnStyle, marginTop: 16, fontSize: 13 }}>
                  + Add First Certification
                </button>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr>
                      {["#", "Certification Name", "Issued By", "Issue Date", "Expiry Date", "Credential ID", "Verify", "Status", "Actions"].map((h) => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {certs.map((cert, idx) => {
                      const certStatus = computeCertStatus(cert.expiry_date);
                      if (editCertId === cert.certification_id) {
                        return (
                          <tr key={cert.certification_id}>
                            <td colSpan={9} style={{ padding: "12px 14px", borderBottom: "1px solid #eee" }}>
                              <CertForm
                                initial={{
                                  certification_name: cert.certification_name,
                                  issuing_organization: cert.issuing_organization ?? "",
                                  issue_date: cert.issue_date ?? "",
                                  expiry_date: cert.expiry_date ?? "",
                                  credential_id: cert.credential_id ?? "",
                                  credential_url: cert.credential_url ?? "",
                                }}
                                onSave={(data) => handleEditCert(cert.certification_id, data)}
                                onCancel={() => setEditCertId(null)}
                                saving={certSaving}
                                isEdit
                              />
                            </td>
                          </tr>
                        );
                      }
                      return (
                        <tr key={cert.certification_id} style={{ background: idx % 2 === 0 ? "#fff" : "#fafafa" }}>
                          <td style={tdStyle}>{idx + 1}</td>
                          <td style={{ ...tdStyle, fontWeight: 600, maxWidth: 200 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ width: 26, height: 26, borderRadius: 6, background: "#e8f0fb", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>{"\uD83C\uDFC5"}</span>
                              <span>{cert.certification_name}</span>
                            </div>
                          </td>
                          <td style={{ ...tdStyle, color: "#555" }}>{cert.issuing_organization || "\u2014"}</td>
                          <td style={tdStyle}>{cert.issue_date || "\u2014"}</td>
                          <td style={{ ...tdStyle, color: certStatus === "Expired" ? "#c0392b" : "#333", fontWeight: certStatus === "Expired" ? 600 : 400 }}>
                            {cert.expiry_date || <span style={{ color: "#888", fontSize: 12 }}>No Expiry</span>}
                          </td>
                          <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: 11, color: "#666" }}>
                            {cert.credential_id || "\u2014"}
                          </td>
                          <td style={tdStyle}>
                            {cert.credential_url ? (
                              <a href={cert.credential_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#1d4ed8", textDecoration: "none" }}>
                                View
                              </a>
                            ) : (
                              <span style={{ color: "#bbb", fontSize: 12 }}>{"\u2014"}</span>
                            )}
                          </td>
                          <td style={tdStyle}>
                            <span style={{
                              display: "inline-block",
                              padding: "3px 10px",
                              borderRadius: 20,
                              fontSize: 11,
                              fontWeight: 700,
                              background: certStatus === "Active" ? "#d1fae5" : "#f8d7da",
                              color: certStatus === "Active" ? "#065f46" : "#721c24",
                            }}>
                              {certStatus === "Active" ? "Active" : "Expired"}
                            </span>
                          </td>
                          <td style={tdStyle}>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button
                                onClick={() => { setAddingCert(false); setEditCertId(cert.certification_id); }}
                                style={{ padding: "4px 12px", fontSize: 11, fontWeight: 600, color: "#17375e", background: "#e8f0fb", border: "1px solid #b5cef5", borderRadius: 3, cursor: "pointer" }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteCert(cert.certification_id, cert.certification_name)}
                                style={{ padding: "4px 12px", fontSize: 11, fontWeight: 600, color: "#c0392b", background: "#fdf0ef", border: "1px solid #f5c6c2", borderRadius: 3, cursor: "pointer" }}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {/* TAB: RESUME                                                            */}
      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {tab === "resume" && (() => {
        const activeResume = resumes.find((r) => r.is_active === 1) ?? null;
        const otherResumes = resumes.filter((r) => r.is_active !== 1);
        return (
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#333" }}>
                Resume &ndash; {profile.student_name}{" "}
                <span style={{ fontSize: 12, fontWeight: 400, color: "#999" }}>({profile.usno})</span>
              </span>
              <span style={{ fontSize: 12, color: "#888" }}>
                {resumes.length} resume{resumes.length !== 1 ? "s" : ""} uploaded
              </span>
            </div>
            <div style={cardBodyStyle}>
              {/* Upload Box */}
              <SectionTitle title="Upload New Resume" />
              <div
                style={{
                  border: "2px dashed #c0cfe4",
                  borderRadius: 8,
                  padding: "28px 20px",
                  textAlign: "center",
                  background: "#f7f9fc",
                  cursor: "pointer",
                  marginBottom: 28,
                  transition: "border-color 0.2s",
                }}
                onClick={() => resumeFileRef.current?.click()}
              >
                <div style={{ fontSize: 36, marginBottom: 8 }}>&#128206;</div>
                <p style={{ fontSize: 14, color: "#555", margin: 0, fontWeight: 600 }}>
                  Click to upload Resume (PDF only)
                </p>
                <p style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>
                  Maximum file size: 5 MB &nbsp;Â·&nbsp; New upload is auto-set as <strong>Active</strong>
                </p>
                <input
                  ref={resumeFileRef}
                  type="file"
                  accept=".pdf"
                  style={{ display: "none" }}
                  onChange={async (e) => {
                    const file = e.target.files?.[0] ?? null;
                    if (!file) return;
                    if (file.type !== "application/pdf") { toast.error("Only PDF files are allowed."); return; }
                    if (!profile) return;
                    setResumeUploading(true);
                    const uploaded = await profileService.uploadResume(profile.profile_id, profile.student_id, file);
                    if (uploaded) {
                      await profileService.setActiveResume(uploaded.resume_id);
                      toast.success("Resume uploaded and set as Active!");
                      await loadAll();
                    } else {
                      toast.error("Failed to upload resume.");
                    }
                    setResumeUploading(false);
                    if (resumeFileRef.current) resumeFileRef.current.value = "";
                  }}
                />
              </div>
              {resumeUploading && (
                <p style={{ textAlign: "center", color: "#17375e", fontSize: 13, marginBottom: 16, fontWeight: 600 }}>
                  Uploading resume...
                </p>
              )}
              {resumes.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px 20px", color: "#aaa", fontSize: 14 }}>
                  <div style={{ fontSize: 40, marginBottom: 10 }}>&#128196;</div>
                  No resumes uploaded yet. Upload your first resume above.
                </div>
              ) : (
                <>
                  <SectionTitle title="Active Resume" />
                  {activeResume ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        border: "2px solid #17375e",
                        borderRadius: 8,
                        background: "linear-gradient(135deg, #eef4ff 0%, #f0f5ff 100%)",
                        marginBottom: 24,
                        boxShadow: "0 2px 8px rgba(23,55,94,0.10)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", flexWrap: "wrap", gap: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                          <div style={{ width: 46, height: 46, borderRadius: 8, background: "#17375e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                            &#128196;
                          </div>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontSize: 14, fontWeight: 700, color: "#17375e" }}>{activeResume.file_name}</span>
                              <span style={{ padding: "2px 10px", background: "#17375e", color: "#fff", fontSize: 11, fontWeight: 700, borderRadius: 20 }}>Active</span>
                            </div>
                            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 3 }}>
                              {activeResume.file_size_kb != null ? `${activeResume.file_size_kb} KB` : ""}
                              {activeResume.created_date ? ` · Uploaded ${activeResume.created_date}` : ""}
                              <span style={{ marginLeft: 6, color: "#17375e", fontWeight: 600 }}>· Shared with companies</span>
                            </div>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={() => openInlinePdf(activeResume.resume_id)}
                            disabled={pdfLoading && pdfViewResumeId === activeResume.resume_id}
                            style={{
                              padding: "7px 16px", fontSize: 12, fontWeight: 700,
                              color: pdfViewResumeId === activeResume.resume_id ? "#fff" : "#17375e",
                              background: pdfViewResumeId === activeResume.resume_id ? "#17375e" : "#fff",
                              border: "1px solid #17375e", borderRadius: 4, cursor: "pointer",
                              display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s",
                            }}
                          >
                            {pdfLoading && pdfViewResumeId === activeResume.resume_id
                              ? "Loading…"
                              : pdfViewResumeId === activeResume.resume_id
                              ? "✕ Close Preview"
                              : "👁 View PDF"}
                          </button>
                          <button
                            onClick={async () => {
                              if (!window.confirm("Delete this active resume?")) return;
                              closeInlinePdf();
                              const ok = await profileService.deleteResume(activeResume.resume_id);
                              if (ok) { toast.success("Resume deleted."); await loadAll(); }
                              else toast.error("Failed to delete.");
                            }}
                            style={{ padding: "7px 16px", fontSize: 12, fontWeight: 600, color: "#c0392b", background: "#fdf0ef", border: "1px solid #f5c6c2", borderRadius: 4, cursor: "pointer" }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* ── Inline PDF Viewer for Active Resume ── */}
                      {pdfViewResumeId === activeResume.resume_id && (
                        <div style={{ borderTop: "1px solid #c8d8f0" }}>
                          <div style={{ background: "linear-gradient(135deg, #17375e 0%, #1e4d8c 100%)", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontSize: 16 }}>📄</span>
                              <span style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>{activeResume.file_name}</span>
                              <span style={{ background: "rgba(255,255,255,0.2)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>Active</span>
                            </div>
                            <button onClick={closeInlinePdf} style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", borderRadius: 4, padding: "4px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>✕ Close</button>
                          </div>
                          {pdfLoading ? (
                            <div style={{ height: 500, display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb", flexDirection: "column", gap: 12 }}>
                              <div style={{ width: 36, height: 36, border: "4px solid #e5e7eb", borderTopColor: "#17375e", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                              <span style={{ fontSize: 13, color: "#6b7280" }}>Loading resume…</span>
                              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                            </div>
                          ) : pdfBlobUrl ? (
                            <iframe src={pdfBlobUrl} title={activeResume.file_name} style={{ width: "100%", height: 680, border: "none", display: "block", background: "#525659" }} />
                          ) : null}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ padding: "14px 16px", background: "#fffbeb", border: "1px dashed #f59e0b", borderRadius: 6, color: "#92400e", fontSize: 13, marginBottom: 24 }}>
                      No active resume set. Click <strong>Set Active</strong> on any resume below to activate it.
                    </div>
                  )}
                  {otherResumes.length > 0 && (
                    <>
                      <SectionTitle title={`Other Resumes (${otherResumes.length})`} />
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {otherResumes.map((r) => (
                          <div key={r.resume_id} style={{ border: "1px solid #e0e0e0", borderRadius: 6, background: "#fafafa", overflow: "hidden" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", flexWrap: "wrap", gap: 8 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <div style={{ width: 34, height: 34, borderRadius: 6, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                                  &#128196;
                                </div>
                                <div>
                                  <div style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{r.file_name}</div>
                                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                                    {r.file_size_kb != null ? `${r.file_size_kb} KB` : ""}
                                    {r.created_date ? ` · Uploaded ${r.created_date}` : ""}
                                  </div>
                                </div>
                              </div>
                              <div style={{ display: "flex", gap: 8 }}>
                                <button
                                  onClick={() => openInlinePdf(r.resume_id)}
                                  disabled={pdfLoading && pdfViewResumeId === r.resume_id}
                                  style={{ padding: "5px 12px", fontSize: 12, fontWeight: 600, color: pdfViewResumeId === r.resume_id ? "#fff" : "#17375e", background: pdfViewResumeId === r.resume_id ? "#17375e" : "#e8f0fb", border: "1px solid #b5cef5", borderRadius: 3, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, transition: "all 0.2s" }}
                                >
                                  {pdfLoading && pdfViewResumeId === r.resume_id ? "Loading…" : pdfViewResumeId === r.resume_id ? "✕ Close" : "👁 View PDF"}
                                </button>
                                <button onClick={async () => { const res = await profileService.setActiveResume(r.resume_id); if (res) { toast.success(`"${r.file_name}" is now the Active resume!`); await loadAll(); } else toast.error("Failed to set active."); }} style={{ padding: "5px 12px", fontSize: 12, fontWeight: 700, color: "#065f46", background: "#d1fae5", border: "1px solid #a7f3d0", borderRadius: 3, cursor: "pointer" }}>Set Active</button>
                                <button onClick={async () => { if (!window.confirm(`Delete "${r.file_name}"?`)) return; if (pdfViewResumeId === r.resume_id) closeInlinePdf(); const ok = await profileService.deleteResume(r.resume_id); if (ok) { toast.success("Resume deleted."); await loadAll(); } else toast.error("Failed to delete."); }} style={{ padding: "5px 12px", fontSize: 12, fontWeight: 600, color: "#c0392b", background: "#fdf0ef", border: "1px solid #f5c6c2", borderRadius: 3, cursor: "pointer" }}>Delete</button>
                              </div>
                            </div>
                            {pdfViewResumeId === r.resume_id && (
                              <div style={{ borderTop: "1px solid #e0e0e0" }}>
                                <div style={{ background: "linear-gradient(135deg, #374151 0%, #4b5563 100%)", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <span style={{ fontSize: 14 }}>📄</span>
                                    <span style={{ color: "#fff", fontWeight: 600, fontSize: 13 }}>{r.file_name}</span>
                                  </div>
                                  <button onClick={closeInlinePdf} style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", borderRadius: 4, padding: "4px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>✕ Close</button>
                                </div>
                                {pdfLoading ? (
                                  <div style={{ height: 460, display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb", flexDirection: "column", gap: 12 }}>
                                    <div style={{ width: 32, height: 32, border: "4px solid #e5e7eb", borderTopColor: "#374151", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                                    <span style={{ fontSize: 13, color: "#6b7280" }}>Loading resume…</span>
                                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                                  </div>
                                ) : pdfBlobUrl ? (
                                  <iframe src={pdfBlobUrl} title={r.file_name} style={{ width: "100%", height: 640, border: "none", display: "block", background: "#525659" }} />
                                ) : null}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })()}
      {tab === "offers" && (
        <div style={{ marginTop: 20 }}>
          <StudentOffersPage studentId={studentId} />
        </div>
      )}
    </div>
  );
};

export default StudentProfilePage;