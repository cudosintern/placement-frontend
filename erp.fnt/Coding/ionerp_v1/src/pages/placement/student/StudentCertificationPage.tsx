import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import * as profileService from "./studentProfileService";
import { StudentCertification } from "./studentProfileTypes";

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

// ─── Status Badge ─────────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: "Active" | "Expired" }> = ({ status }) => (
  <span
    style={{
      display: "inline-block",
      padding: "3px 10px",
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 700,
      background: status === "Active" ? "#d1fae5" : "#f8d7da",
      color: status === "Active" ? "#065f46" : "#721c24",
      letterSpacing: "0.3px",
    }}
  >
    {status === "Active" ? "✓ Active" : "✗ Expired"}
  </span>
);

// ─── Cert Form ─────────────────────────────────────────────────────────────────

type CertFormData = {
  certification_name: string;
  issuing_organization: string;
  issue_date: string;
  expiry_date: string;
  credential_id: string;
  credential_url: string;
};

const EMPTY_FORM: CertFormData = {
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
  const [form, setForm] = useState<CertFormData>(initial ?? EMPTY_FORM);
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
    { key: "certification_name", label: "Certification Name", type: "text", placeholder: "e.g. AWS Cloud Practitioner", required: true },
    { key: "issuing_organization", label: "Issuing Organization", type: "text", placeholder: "e.g. Amazon Web Services", required: true },
    { key: "issue_date", label: "Issue Date", type: "date", placeholder: "", required: true },
    { key: "expiry_date", label: "Expiry Date (Optional)", type: "date", placeholder: "" },
    { key: "credential_id", label: "Credential ID", type: "text", placeholder: "e.g. ABC-123-XYZ" },
    { key: "credential_url", label: "Credential URL", type: "url", placeholder: "https://credential.link/..." },
  ];

  return (
    <div
      style={{
        background: "#f0f5ff",
        border: "1px solid #c8d8f0",
        borderRadius: 6,
        padding: "18px 20px",
        marginBottom: 16,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, color: "#17375e", marginBottom: 14 }}>
        {isEdit ? "✏ Edit Certification" : "＋ Add New Certification"}
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
            {errors[key] && (
              <p style={{ color: "#c0392b", fontSize: 11, marginTop: 4 }}>{errors[key]}</p>
            )}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: "8px 20px",
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
            padding: "8px 16px",
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

// ─── Main Page ─────────────────────────────────────────────────────────────────

const StudentCertificationPage: React.FC = () => {
  const navigate = useNavigate();

  const [allProfiles, setAllProfiles] = useState<{ profile_id: number; student_id: number; student_name: string; usno: string; current_cgpa: number | null }[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [certs, setCerts] = useState<StudentCertification[]>([]);
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "Active" | "Expired">("ALL");
  const [loading, setLoading] = useState(true);

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const profiles = await profileService.getProfiles();
      setAllProfiles(profiles.map(p => ({
        profile_id: p.profile_id,
        student_id: p.student_id,
        student_name: p.student_name ?? "",
        usno: p.usno ?? "",
        current_cgpa: p.current_cgpa ?? null,
      })));
      if (profiles.length > 0 && selectedStudentId === null) {
        setSelectedStudentId(profiles[0].student_id);
      }
    } catch (err) {
      console.error("loadProfiles error:", err);
    }
    setLoading(false);
  }, []);

  const loadCerts = useCallback(async (studentId: number) => {
    try {
      const data = await profileService.getCertifications(studentId);
      setCerts(data);
    } catch (err) {
      console.error("loadCerts error:", err);
    }
  }, []);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  useEffect(() => {
    if (selectedStudentId !== null) {
      loadCerts(selectedStudentId);
    }
  }, [selectedStudentId, loadCerts]);

  const selectedProfile = allProfiles.find(p => p.student_id === selectedStudentId) ?? null;

  const handleSelectStudent = (id: number) => {
    setSelectedStudentId(id);
    setAdding(false);
    setEditId(null);
    setSearch("");
    setFilterStatus("ALL");
  };

  const computeCertStatus = (expiryDate?: string | null): "Active" | "Expired" => {
    if (!expiryDate) return "Active";
    return new Date(expiryDate) < new Date() ? "Expired" : "Active";
  };

  const filtered = certs.filter((c) => {
    const matchSearch =
      c.certification_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.issuing_organization ?? "").toLowerCase().includes(search.toLowerCase());
    const certStatus = computeCertStatus(c.expiry_date);
    const matchStatus = filterStatus === "ALL" || certStatus === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: certs.length,
    active: certs.filter((c) => computeCertStatus(c.expiry_date) === "Active").length,
    expired: certs.filter((c) => computeCertStatus(c.expiry_date) === "Expired").length,
  };

  const handleAdd = async (data: CertFormData) => {
    if (selectedStudentId === null || !selectedProfile) return;
    setSaving(true);
    const created = await profileService.addCertification({
      profile_id: selectedProfile.profile_id,
      student_id: selectedStudentId,
      certification_name: data.certification_name,
      issuing_organization: data.issuing_organization || undefined,
      issue_date: data.issue_date || undefined,
      expiry_date: data.expiry_date || undefined,
      credential_id: data.credential_id || undefined,
      credential_url: data.credential_url || undefined,
    });
    if (created) {
      await loadCerts(selectedStudentId);
      setAdding(false);
      toast.success(`"${data.certification_name}" added!`);
    } else {
      toast.error("Failed to add certification.");
    }
    setSaving(false);
  };

  const handleEdit = async (data: CertFormData) => {
    if (editId === null) return;
    setSaving(true);
    const updated = await profileService.updateCertification({
      certification_id: editId,
      certification_name: data.certification_name,
      issuing_organization: data.issuing_organization || undefined,
      issue_date: data.issue_date || undefined,
      expiry_date: data.expiry_date || undefined,
      credential_id: data.credential_id || undefined,
      credential_url: data.credential_url || undefined,
    });
    if (updated && selectedStudentId !== null) {
      await loadCerts(selectedStudentId);
      setEditId(null);
      toast.success(`"${data.certification_name}" updated!`);
    } else {
      toast.error("Failed to update certification.");
    }
    setSaving(false);
  };

  const handleDelete = async (certId: number, certName: string) => {
    if (!window.confirm(`Remove certification "${certName}"?`)) return;
    const ok = await profileService.deleteCertification(certId);
    if (ok && selectedStudentId !== null) {
      await loadCerts(selectedStudentId);
      toast.success(`"${certName}" removed.`);
    } else {
      toast.error("Failed to delete certification.");
    }
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
    padding: "11px 14px",
    borderBottom: "1px solid #eee",
    color: "#333",
    fontSize: 13,
    verticalAlign: "middle",
  };

  return (
    <div style={{ maxWidth: 1050, margin: "0 auto" }}>
      {/* Loading State */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: "#888", fontSize: 14 }}>
          Loading certifications...
        </div>
      )}

      {!loading && (
      <>
      {/* Page Header */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#17375e" }}>
          Student Certifications
        </h3>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#888" }}>
          Select a student to view and manage their professional certifications and credentials.
        </p>
      </div>

      {/* ── Student Selector Banner ── */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e0e0e0",
          borderRadius: 6,
          padding: "16px 20px",
          marginBottom: 20,
          boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
          display: "flex",
          alignItems: "center",
          gap: 20,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 260 }}>
          <span style={{ fontSize: 22 }}>👤</span>
          <div style={{ flex: 1 }}>
            <label style={{ ...labelStyle, marginBottom: 6 }}>Select Student</label>
            <select
              value={selectedStudentId ?? ""}
              onChange={(e) => handleSelectStudent(Number(e.target.value))}
              style={{ ...selectStyle, fontWeight: 600 }}
            >
              {allProfiles.length === 0 && (
                <option value="">No students registered</option>
              )}
              {allProfiles.map((s) => (
                <option key={s.student_id} value={s.student_id}>
                  {s.student_name} — {s.usno}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedProfile && (
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.4px" }}>USN</div>
              <div style={{ fontFamily: "monospace", fontWeight: 700, color: "#17375e", fontSize: 14 }}>{selectedProfile.usno}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.4px" }}>CGPA</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#17375e" }}>{selectedProfile.current_cgpa ?? "—"}</div>
            </div>
            <button
              onClick={() => navigate(`/student/profile?student_id=${selectedProfile.student_id}`)}
              style={{
                padding: "7px 16px",
                fontSize: 12,
                fontWeight: 700,
                color: "#fff",
                background: "#17375e",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              View Full Profile →
            </button>
          </div>
        )}
      </div>

      {/* No student fallback */}
      {allProfiles.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#aaa", fontSize: 14 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
          No students registered yet.
          <br />
          <button
            onClick={() => navigate("/student/register")}
            style={{ marginTop: 16, padding: "8px 20px", fontSize: 13, fontWeight: 700, color: "#fff", background: "#17375e", border: "none", borderRadius: 4, cursor: "pointer" }}
          >
            Go to Register Student
          </button>
        </div>
      )}

      {selectedProfile && (
        <>
          {/* ── Stat Cards ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
            {[
              { label: "Total Certifications", value: stats.total, color: "#17375e", bg: "#e8f0fb", icon: "🏅" },
              { label: "Active", value: stats.active, color: "#065f46", bg: "#d1fae5", icon: "✓" },
              { label: "Expired", value: stats.expired, color: "#721c24", bg: "#f8d7da", icon: "✗" },
            ].map(({ label, value, color, bg, icon }) => (
              <div
                key={label}
                style={{
                  background: "#fff",
                  border: "1px solid #e8e8e8",
                  borderRadius: 6,
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                  {icon}
                </div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.4px", marginTop: 4 }}>{label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Main Card ── */}
          <div style={{ background: "#fff", borderRadius: 6, boxShadow: "0 1px 4px rgba(0,0,0,0.10)", overflow: "hidden" }}>
            {/* Toolbar */}
            <div
              style={{
                padding: "14px 20px",
                borderBottom: "1px solid #e8e8e8",
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: "#333" }}>
                {selectedProfile.student_name}'s Certifications
                <span style={{ fontSize: 12, fontWeight: 400, color: "#999", marginLeft: 8 }}>({selectedProfile.usno})</span>
              </span>
              <div style={{ flex: 1 }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="🔍  Search..."
                style={{ ...inputStyle, width: 220, fontSize: 12 }}
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as "ALL" | "Active" | "Expired")}
                style={{ ...selectStyle, width: 130, fontSize: 12 }}
              >
                <option value="ALL">All Status</option>
                <option value="Active">Active</option>
                <option value="Expired">Expired</option>
              </select>
              {!adding && editId === null && (
                <button
                  onClick={() => setAdding(true)}
                  style={{
                    padding: "7px 18px",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#fff",
                    background: "#17375e",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                >
                  + Add Certification
                </button>
              )}
            </div>

            <div style={{ padding: "18px 20px" }}>
              {/* Add / Edit Form */}
              {adding && (
                <CertForm
                  onSave={handleAdd}
                  onCancel={() => setAdding(false)}
                  saving={saving}
                />
              )}

              {/* No certs empty state */}
              {certs.length === 0 && !adding ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "#aaa", fontSize: 14 }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🏅</div>
                  No certifications added yet for {selectedProfile?.student_name ?? "this student"}.
                  <br />
                  <button
                    onClick={() => setAdding(true)}
                    style={{ marginTop: 16, padding: "8px 20px", fontSize: 13, fontWeight: 700, color: "#fff", background: "#17375e", border: "none", borderRadius: 4, cursor: "pointer" }}
                  >
                    + Add First Certification
                  </button>
                </div>
              ) : (
                <>
                  {/* Table */}
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
                        {filtered.length === 0 ? (
                          <tr>
                            <td colSpan={9} style={{ ...tdStyle, textAlign: "center", color: "#aaa", padding: 40 }}>
                              No certifications match your search/filter.
                            </td>
                          </tr>
                        ) : (
                          filtered.map((cert, idx) => {
                            if (editId === cert.certification_id) {
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
                                      onSave={handleEdit}
                                      onCancel={() => setEditId(null)}
                                      saving={saving}
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
                                    <span style={{ width: 28, height: 28, borderRadius: 6, background: "#e8f0fb", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>
                                      🏅
                                    </span>
                                    <span>{cert.certification_name}</span>
                                  </div>
                                </td>
                                <td style={{ ...tdStyle, color: "#555" }}>{cert.issuing_organization || "—"}</td>
                                <td style={tdStyle}>{cert.issue_date || "—"}</td>
                                <td style={{ ...tdStyle, color: computeCertStatus(cert.expiry_date) === "Expired" ? "#c0392b" : "#333", fontWeight: computeCertStatus(cert.expiry_date) === "Expired" ? 600 : 400 }}>
                                  {cert.expiry_date || <span style={{ color: "#888", fontSize: 12 }}>No Expiry</span>}
                                </td>
                                <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: 11, color: "#666" }}>
                                  {cert.credential_id || "—"}
                                </td>
                                <td style={tdStyle}>
                                  {cert.credential_url ? (
                                    <a
                                      href={cert.credential_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{ fontSize: 12, color: "#1d4ed8", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}
                                    >
                                      🔗 View
                                    </a>
                                  ) : (
                                    <span style={{ color: "#bbb", fontSize: 12 }}>—</span>
                                  )}
                                </td>
                                <td style={tdStyle}>
                                  <StatusBadge status={computeCertStatus(cert.expiry_date)} />
                                </td>
                                <td style={tdStyle}>
                                  <div style={{ display: "flex", gap: 6 }}>
                                    <button
                                      onClick={() => { setAdding(false); setEditId(cert.certification_id); }}
                                      style={{ padding: "4px 12px", fontSize: 11, fontWeight: 600, color: "#17375e", background: "#e8f0fb", border: "1px solid #b5cef5", borderRadius: 3, cursor: "pointer" }}
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDelete(cert.certification_id, cert.certification_name)}
                                      style={{ padding: "4px 12px", fontSize: 11, fontWeight: 600, color: "#c0392b", background: "#fdf0ef", border: "1px solid #f5c6c2", borderRadius: 3, cursor: "pointer" }}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {filtered.length > 0 && (
                    <div style={{ marginTop: 12, fontSize: 11, color: "#aaa", textAlign: "right" }}>
                      Showing {filtered.length} of {certs.length} certification{certs.length !== 1 ? "s" : ""}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
      </>
      )}
    </div>
  );
};

export default StudentCertificationPage;
