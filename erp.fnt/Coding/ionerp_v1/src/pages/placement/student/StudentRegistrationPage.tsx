import React, { useRef, useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import * as profileService from "./studentProfileService";
import { IEMStudentInfo } from "./studentProfileTypes";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StudentRegistrationForm {
  student_id: string;
  linkedin_url: string;
  github_url: string;
  portfolio_url: string;
  current_cgpa: string;
  backlogs: string;
  is_placement_eligible: string;
  career_objective: string;
  preferred_locations: string;
  resume_file: File | null;
}

const INITIAL_FORM: StudentRegistrationForm = {
  student_id: "",
  linkedin_url: "",
  github_url: "",
  portfolio_url: "",
  current_cgpa: "",
  backlogs: "0",
  is_placement_eligible: "1",
  career_objective: "",
  preferred_locations: "",
  resume_file: null,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

const SectionTitle: React.FC<{ title: string; icon: string }> = ({
  title,
  icon,
}) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      fontSize: 13,
      fontWeight: 700,
      color: "#17375e",
      borderBottom: "2px solid #17375e",
      paddingBottom: 8,
      marginBottom: 18,
      marginTop: 8,
      letterSpacing: "0.4px",
      textTransform: "uppercase",
    }}
  >
    <span style={{ fontSize: 16 }}>{icon}</span>
    {title}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const StudentRegistrationPage: React.FC = () => {
  const [form, setForm] = useState<StudentRegistrationForm>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof StudentRegistrationForm, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  
  const [students, setStudents] = useState<IEMStudentInfo[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);

  const loadStudents = useCallback(async () => {
    setLoadingStudents(true);
    const data = await profileService.getStudents();
    setStudents(data);
    setLoadingStudents(false);
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const set = (key: keyof StudentRegistrationForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    };

  const validate = (): boolean => {
    const errs: Partial<Record<keyof StudentRegistrationForm, string>> = {};
    if (!form.student_id.trim()) errs.student_id = "Student ID is required";
    else if (isNaN(Number(form.student_id))) errs.student_id = "Student ID must be a number";
    if (form.current_cgpa && (parseFloat(form.current_cgpa) < 0 || parseFloat(form.current_cgpa) > 10))
      errs.current_cgpa = "CGPA must be between 0 and 10";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file && file.type !== "application/pdf") {
      toast.error("Only PDF files are allowed.");
      return;
    }
    setForm((prev) => ({ ...prev, resume_file: file }));
  };

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setErrors({});
    setEditId(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);

    if (editId !== null) {
      const updated = await profileService.updateProfile({
        profile_id: editId,
        linkedin_url: form.linkedin_url || undefined,
        github_url: form.github_url || undefined,
        portfolio_url: form.portfolio_url || undefined,
        current_cgpa: form.current_cgpa ? parseFloat(form.current_cgpa) : undefined,
        backlogs: form.backlogs ? parseInt(form.backlogs) : undefined,
        is_placement_eligible: parseInt(form.is_placement_eligible),
        career_objective: form.career_objective || undefined,
        preferred_locations: form.preferred_locations || undefined,
      });
      if (updated) {
        // Upload resume if a new file was selected
        if (form.resume_file && updated.profile_id) {
          const uploaded = await profileService.uploadResume(
            updated.profile_id,
            parseInt(form.student_id),
            form.resume_file
          );
          if (uploaded) {
            toast.success("Student profile and resume updated successfully!");
          } else {
            toast.warning("Profile updated, but resume upload failed.");
          }
        } else {
          toast.success("Student profile updated successfully!");
        }
        setEditId(null);
      } else {
        toast.error("Failed to update student profile.");
      }
    } else {
      const created = await profileService.addProfile({
        student_id: parseInt(form.student_id),
        linkedin_url: form.linkedin_url || undefined,
        github_url: form.github_url || undefined,
        portfolio_url: form.portfolio_url || undefined,
        current_cgpa: form.current_cgpa ? parseFloat(form.current_cgpa) : undefined,
        backlogs: form.backlogs ? parseInt(form.backlogs) : undefined,
        is_placement_eligible: parseInt(form.is_placement_eligible),
        career_objective: form.career_objective || undefined,
        preferred_locations: form.preferred_locations || undefined,
      });
      if (created) {
        // Upload resume if a PDF was selected
        if (form.resume_file && created.profile_id) {
          const uploaded = await profileService.uploadResume(
            created.profile_id,
            parseInt(form.student_id),
            form.resume_file
          );
          if (uploaded) {
            toast.success("Student profile and resume created successfully!");
          } else {
            toast.warning("Profile created, but resume upload failed.");
          }
        } else {
          toast.success("Student profile created successfully!");
        }
      } else {
        toast.error("Failed to create student profile.");
      }
    }

    resetForm();
    setSubmitting(false);
  };


  const fieldError = (key: keyof StudentRegistrationForm) =>
    errors[key] ? (
      <p style={{ color: "#c0392b", fontSize: 11, marginTop: 4 }}>{errors[key]}</p>
    ) : null;

  // ─── Styles ──────────────────────────────────────────────────────────────────

  const cardStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: 4,
    boxShadow: "0 1px 4px rgba(0,0,0,0.10)",
    overflow: "hidden",
    marginBottom: 20,
  };

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      {/* Page Header */}
      <div style={{ marginBottom: 20 }}>
        <h3
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 700,
            color: "#17375e",
            letterSpacing: "0.3px",
          }}
        >
          Student Profile Registration
        </h3>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#888" }}>
          Create a placement profile for an existing student. All mandatory fields are marked with{" "}
          <span style={{ color: "#c0392b" }}>*</span>
        </p>
      </div>

      {/* ── FORM ── */}
      <form onSubmit={handleSubmit} noValidate>
        <div style={{ ...cardStyle, borderRadius: "0 4px 4px 4px" }}>
          <div style={{ padding: "22px 28px" }}>
            {/* ── SECTION 1: Student Information ── */}
            <SectionTitle title="Student Information" icon="👤" />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px 28px",
                marginBottom: 28,
              }}
            >
              {/* Student ID */}
              <div>
                <label style={labelStyle}>
                  Select Student <span style={{ color: "#c0392b" }}>*</span>
                </label>
                <select
                  value={form.student_id}
                  onChange={set("student_id")}
                  style={{
                    ...selectStyle,
                    borderColor: errors.student_id ? "#c0392b" : "#d8d8d8",
                  }}
                  disabled={loadingStudents || editId !== null}
                >
                  <option value="">
                    {loadingStudents ? "Loading students..." : "— Select a Student —"}
                  </option>
                  {students.map((s) => (
                    <option key={s.student_id} value={s.student_id}>
                      {s.name} ({s.usno})
                    </option>
                  ))}
                </select>
                {fieldError("student_id")}
              </div>
            </div>

            {/* ── SECTION 2: Academic Information ── */}
            <SectionTitle title="Academic Information" icon="🎓" />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px 28px",
                marginBottom: 28,
              }}
            >
              {/* Current CGPA */}
              <div>
                <label style={labelStyle}>Current CGPA (0 – 10)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={form.current_cgpa}
                  onChange={set("current_cgpa")}
                  placeholder="e.g. 8.75"
                  style={{
                    ...inputStyle,
                    borderColor: errors.current_cgpa ? "#c0392b" : "#d8d8d8",
                  }}
                />
                {fieldError("current_cgpa")}
              </div>

              {/* Backlogs */}
              <div>
                <label style={labelStyle}>Backlogs</label>
                <input
                  type="number"
                  min="0"
                  value={form.backlogs}
                  onChange={set("backlogs")}
                  placeholder="0"
                  style={inputStyle}
                />
              </div>

              {/* Placement Eligible */}
              <div>
                <label style={labelStyle}>Placement Eligible</label>
                <select
                  value={form.is_placement_eligible}
                  onChange={set("is_placement_eligible")}
                  style={selectStyle}
                >
                  <option value="1">Yes</option>
                  <option value="0">No</option>
                </select>
              </div>

              {/* Preferred Locations */}
              <div>
                <label style={labelStyle}>Preferred Locations</label>
                <input
                  type="text"
                  value={form.preferred_locations}
                  onChange={set("preferred_locations")}
                  placeholder="e.g. Bangalore, Hyderabad"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* ── SECTION 3: Links & Career ── */}
            <SectionTitle title="Links & Career" icon="💼" />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px 28px",
                marginBottom: 16,
              }}
            >
              {/* LinkedIn */}
              <div>
                <label style={labelStyle}>LinkedIn Profile URL</label>
                <input
                  type="url"
                  value={form.linkedin_url}
                  onChange={set("linkedin_url")}
                  placeholder="https://linkedin.com/in/yourname"
                  style={inputStyle}
                />
              </div>

              {/* GitHub */}
              <div>
                <label style={labelStyle}>GitHub Profile URL</label>
                <input
                  type="url"
                  value={form.github_url}
                  onChange={set("github_url")}
                  placeholder="https://github.com/yourname"
                  style={inputStyle}
                />
              </div>

              {/* Portfolio */}
              <div>
                <label style={labelStyle}>Portfolio URL</label>
                <input
                  type="url"
                  value={form.portfolio_url}
                  onChange={set("portfolio_url")}
                  placeholder="https://yoursite.com"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Career Objective — full width */}
            <div style={{ marginBottom: 28 }}>
              <label style={labelStyle}>Career Objective</label>
              <textarea
                value={form.career_objective}
                onChange={set("career_objective")}
                rows={4}
                placeholder="Brief summary of your career goals and aspirations..."
                style={{
                  ...inputStyle,
                  resize: "vertical",
                  minHeight: 90,
                }}
              />
            </div>

            {/* ── SECTION 4: Resume Upload ── */}
            <SectionTitle title="Resume Upload" icon="📄" />
            <div
              style={{
                border: "2px dashed #c0cfe4",
                borderRadius: 6,
                padding: "24px 20px",
                textAlign: "center",
                background: "#f7f9fc",
                cursor: "pointer",
                marginBottom: 28,
                transition: "border-color 0.2s",
              }}
              onClick={() => fileRef.current?.click()}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>📎</div>
              {form.resume_file ? (
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#17375e", margin: 0 }}>
                    {form.resume_file.name}
                  </p>
                  <p style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
                    {(form.resume_file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: 14, color: "#555", margin: 0 }}>
                    Click to upload Resume (PDF only)
                  </p>
                  <p style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>
                    Maximum file size: 5 MB
                  </p>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept=".pdf"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div
            style={{
              padding: "14px 28px",
              background: "#f5f7fa",
              borderTop: "1px solid #e8e8e8",
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
            }}
          >
            <button
              type="button"
              onClick={resetForm}
              style={{
                padding: "9px 20px",
                fontSize: 13,
                fontWeight: 600,
                color: "#555",
                background: "#fff",
                border: "1px solid #ccc",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "9px 24px",
                fontSize: 13,
                fontWeight: 700,
                color: "#fff",
                background: submitting ? "#9db8d8" : "#17375e",
                border: "none",
                borderRadius: 4,
                cursor: submitting ? "not-allowed" : "pointer",
                transition: "background 0.2s",
              }}
            >
              {submitting
                ? "Saving..."
                : editId
                ? "Update Profile"
                : "Create Profile"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default StudentRegistrationPage;
