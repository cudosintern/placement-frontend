import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import * as profileService from "./studentProfileService";
import { StudentSkill, ProficiencyLevel } from "./studentProfileTypes";

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
  BEGINNER: { label: "Beginner", color: "#92400e", bg: "#fef3c7", bar: "#f59e0b", width: "30%" },
  INTERMEDIATE: { label: "Intermediate", color: "#1e40af", bg: "#dbeafe", bar: "#3b82f6", width: "65%" },
  ADVANCED: { label: "Advanced", color: "#065f46", bg: "#d1fae5", bar: "#10b981", width: "100%" },
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

// ─── Proficiency Badge ─────────────────────────────────────────────────────────

const ProficiencyBadge: React.FC<{ level: ProficiencyLevel }> = ({ level }) => {
  const cfg = PROFICIENCY_CONFIG[level];
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

// ─── Skill Grid Card ───────────────────────────────────────────────────────────

const SkillCard: React.FC<{
  skill: StudentSkill;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ skill, onEdit, onDelete }) => {
  const cfg = PROFICIENCY_CONFIG[skill.proficiency_level ?? "BEGINNER"];
  const initials = skill.skill_name.slice(0, 2).toUpperCase();
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e8e8e8",
        borderRadius: 6,
        padding: "16px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
        transition: "box-shadow 0.2s",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            background: cfg.bg,
            color: cfg.color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 800,
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#17375e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {skill.skill_name}
          </div>
          <div style={{ marginTop: 4 }}>
            <ProficiencyBadge level={skill.proficiency_level ?? "BEGINNER"} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button
            onClick={onEdit}
            title="Edit"
            style={{ width: 28, height: 28, borderRadius: 4, border: "1px solid #b5cef5", background: "#e8f0fb", color: "#17375e", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            ✏
          </button>
          <button
            onClick={onDelete}
            title="Delete"
            style={{ width: 28, height: 28, borderRadius: 4, border: "1px solid #f5c6c2", background: "#fdf0ef", color: "#c0392b", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            🗑
          </button>
        </div>
      </div>
      <div>
        <div style={{ height: 5, background: "#f0f0f0", borderRadius: 99, overflow: "hidden" }}>
          <div style={{ height: "100%", width: cfg.width, background: cfg.bar, borderRadius: 99, transition: "width 0.4s ease" }} />
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, color: "#888" }}>
        <span style={{ fontSize: 11, color: "#bbb" }}>Added {skill.created_date}</span>
      </div>
    </div>
  );
};

// ─── Skill Add / Edit Form ─────────────────────────────────────────────────────

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
  const [level, setLevel] = useState<ProficiencyLevel>(initial?.proficiency_level ?? "BEGINNER");
  const [nameErr, setNameErr] = useState("");

  const handleSave = () => {
    if (!name.trim()) { setNameErr("Skill name is required"); return; }
    onSave({ skill_name: name.trim(), proficiency_level: level });
  };

  return (
    <div style={{ background: "#f0f5ff", border: "1px solid #c8d8f0", borderRadius: 6, padding: "18px 20px", marginBottom: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#17375e", marginBottom: 14 }}>
        {isEdit ? "✏ Edit Skill" : "＋ Add New Skill"}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 16px", alignItems: "flex-end" }}>
        <div>
          <label style={labelStyle}>Skill Name <span style={{ color: "#c0392b" }}>*</span></label>
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
          <select value={level} onChange={(e) => setLevel(e.target.value as ProficiencyLevel)} style={selectStyle}>
            {PROFICIENCY_OPTIONS.map((o) => (
              <option key={o} value={o}>{PROFICIENCY_CONFIG[o].label}</option>
            ))}
          </select>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ padding: "8px 20px", fontSize: 13, fontWeight: 700, color: "#fff", background: saving ? "#9db8d8" : "#17375e", border: "none", borderRadius: 4, cursor: saving ? "not-allowed" : "pointer" }}
        >
          {saving ? "Saving..." : isEdit ? "Update Skill" : "Add Skill"}
        </button>
        <button
          onClick={onCancel}
          style={{ padding: "8px 16px", fontSize: 13, color: "#555", background: "#fff", border: "1px solid #ccc", borderRadius: 4, cursor: "pointer" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────

const StudentSkillPage: React.FC = () => {
  const navigate = useNavigate();

  const [allProfiles, setAllProfiles] = useState<{ profile_id: number; student_id: number; student_name: string; usno: string; current_cgpa: number | null }[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [skills, setSkills] = useState<StudentSkill[]>([]);
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState<ProficiencyLevel | "ALL">("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
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

  const loadSkills = useCallback(async (studentId: number) => {
    try {
      const data = await profileService.getSkills(studentId);
      setSkills(data);
    } catch (err) {
      console.error("loadSkills error:", err);
    }
  }, []);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  useEffect(() => {
    if (selectedStudentId !== null) {
      loadSkills(selectedStudentId);
    }
  }, [selectedStudentId, loadSkills]);

  const selectedProfile = allProfiles.find(p => p.student_id === selectedStudentId) ?? null;

  const handleSelectStudent = (id: number) => {
    setSelectedStudentId(id);
    setAdding(false);
    setEditId(null);
    setSearch("");
    setFilterLevel("ALL");
  };

  const filtered = skills.filter((s) => {
    const matchSearch = s.skill_name.toLowerCase().includes(search.toLowerCase());
    const matchLevel = filterLevel === "ALL" || s.proficiency_level === filterLevel;
    return matchSearch && matchLevel;
  });

  const stats = {
    total: skills.length,
    beginner: skills.filter((s) => s.proficiency_level === "BEGINNER").length,
    intermediate: skills.filter((s) => s.proficiency_level === "INTERMEDIATE").length,
    advanced: skills.filter((s) => s.proficiency_level === "ADVANCED").length,
  };

  const handleAdd = async (data: SkillFormData) => {
    if (selectedStudentId === null || !selectedProfile) return;
    setSaving(true);
    const created = await profileService.addSkill({
      profile_id: selectedProfile.profile_id,
      student_id: selectedStudentId,
      skill_name: data.skill_name,
      proficiency_level: data.proficiency_level,
    });
    if (created) {
      await loadSkills(selectedStudentId);
      setAdding(false);
      toast.success(`"${data.skill_name}" added!`);
    } else {
      toast.error("Failed to add skill.");
    }
    setSaving(false);
  };

  const handleEdit = async (data: SkillFormData) => {
    if (editId === null) return;
    setSaving(true);
    const updated = await profileService.updateSkill({
      skill_id: editId,
      skill_name: data.skill_name,
      proficiency_level: data.proficiency_level,
    });
    if (updated && selectedStudentId !== null) {
      await loadSkills(selectedStudentId);
      setEditId(null);
      toast.success(`"${data.skill_name}" updated!`);
    } else {
      toast.error("Failed to update skill.");
    }
    setSaving(false);
  };

  const handleDelete = async (skillId: number, skillName: string) => {
    if (!window.confirm(`Remove skill "${skillName}"?`)) return;
    const ok = await profileService.deleteSkill(skillId);
    if (ok && selectedStudentId !== null) {
      await loadSkills(selectedStudentId);
      toast.success(`"${skillName}" removed.`);
    } else {
      toast.error("Failed to delete skill.");
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
    padding: "10px 14px",
    borderBottom: "1px solid #eee",
    color: "#333",
    fontSize: 13,
    verticalAlign: "middle",
  };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      {/* Loading State */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: "#888", fontSize: 14 }}>
          Loading skills...
        </div>
      )}

      {!loading && (
      <>
      {/* Page Header */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#17375e" }}>
          Student Skills
        </h3>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#888" }}>
          Select a student to view and manage their skills by proficiency.
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
            {[
              { label: "Total Skills", value: stats.total, color: "#17375e", bg: "#e8f0fb" },
              { label: "Beginner", value: stats.beginner, color: "#92400e", bg: "#fef3c7" },
              { label: "Intermediate", value: stats.intermediate, color: "#1e40af", bg: "#dbeafe" },
              { label: "Advanced", value: stats.advanced, color: "#065f46", bg: "#d1fae5" },
            ].map(({ label, value, color, bg }) => (
              <div key={label} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 6, padding: "14px 16px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.4px", marginTop: 4 }}>{label}</div>
                <div style={{ height: 3, background: bg, borderRadius: 99, marginTop: 10 }} />
              </div>
            ))}
          </div>

          {/* ── Main Card ── */}
          <div style={{ background: "#fff", borderRadius: 6, boxShadow: "0 1px 4px rgba(0,0,0,0.10)", overflow: "hidden" }}>
            {/* Toolbar */}
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #e8e8e8", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="🔍  Search skills..."
                style={{ ...inputStyle, width: 200, fontSize: 12 }}
              />
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value as ProficiencyLevel | "ALL")}
                style={{ ...selectStyle, width: 150, fontSize: 12 }}
              >
                <option value="ALL">All Levels</option>
                {PROFICIENCY_OPTIONS.map((o) => (
                  <option key={o} value={o}>{PROFICIENCY_CONFIG[o].label}</option>
                ))}
              </select>
              <div style={{ flex: 1 }} />
              <div style={{ display: "flex", border: "1px solid #d8d8d8", borderRadius: 4, overflow: "hidden" }}>
                {(["grid", "table"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    style={{
                      padding: "6px 14px",
                      fontSize: 12,
                      fontWeight: 600,
                      border: "none",
                      cursor: "pointer",
                      background: viewMode === mode ? "#17375e" : "#fff",
                      color: viewMode === mode ? "#fff" : "#555",
                      transition: "all 0.2s",
                    }}
                  >
                    {mode === "grid" ? "⊞ Grid" : "☰ Table"}
                  </button>
                ))}
              </div>
              {!adding && editId === null && (
                <button
                  onClick={() => setAdding(true)}
                  style={{ padding: "7px 18px", fontSize: 12, fontWeight: 700, color: "#fff", background: "#17375e", border: "none", borderRadius: 4, cursor: "pointer" }}
                >
                  + Add Skill
                </button>
              )}
            </div>

            <div style={{ padding: "18px 20px" }}>
              {/* Add Form */}
              {adding && (
                <SkillForm onSave={handleAdd} onCancel={() => setAdding(false)} saving={saving} />
              )}

              {/* ── GRID VIEW ── */}
              {viewMode === "grid" && (
                <>
                  {filtered.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 20px", color: "#aaa", fontSize: 14 }}>
                      {skills.length === 0
                        ? `No skills added yet for ${selectedProfile?.student_name ?? "this student"}.`
                        : "No skills match your search/filter."}
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
                      {filtered.map((skill) =>
                        editId === skill.skill_id ? (
                          <div key={skill.skill_id} style={{ gridColumn: "1 / -1" }}>
                            <SkillForm
                              initial={{ skill_name: skill.skill_name, proficiency_level: skill.proficiency_level ?? "BEGINNER" }}
                              onSave={handleEdit}
                              onCancel={() => setEditId(null)}
                              saving={saving}
                              isEdit
                            />
                          </div>
                        ) : (
                          <SkillCard
                            key={skill.skill_id}
                            skill={skill}
                            onEdit={() => { setAdding(false); setEditId(skill.skill_id); }}
                            onDelete={() => handleDelete(skill.skill_id, skill.skill_name)}
                          />
                        )
                      )}
                    </div>
                  )}
                </>
              )}

              {/* ── TABLE VIEW ── */}
              {viewMode === "table" && (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr>
                        {["#", "Skill Name", "Proficiency", "Progress", "Added On", "Actions"].map((h) => (
                          <th key={h} style={thStyle}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ ...tdStyle, textAlign: "center", color: "#aaa", padding: 32 }}>
                            No skills match your search/filter.
                          </td>
                        </tr>
                      ) : (
                        filtered.map((skill, idx) => {
                          const cfg = PROFICIENCY_CONFIG[skill.proficiency_level ?? "BEGINNER"];
                          if (editId === skill.skill_id) {
                            return (
                              <tr key={skill.skill_id}>
                                <td colSpan={6} style={{ padding: "12px 14px", borderBottom: "1px solid #eee" }}>
                                  <SkillForm
                                    initial={{ skill_name: skill.skill_name, proficiency_level: skill.proficiency_level ?? "BEGINNER" }}
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
                            <tr key={skill.skill_id} style={{ background: idx % 2 === 0 ? "#fff" : "#fafafa" }}>
                              <td style={tdStyle}>{idx + 1}</td>
                              <td style={{ ...tdStyle, fontWeight: 600, color: "#17375e" }}>{skill.skill_name}</td>
                              <td style={tdStyle}><ProficiencyBadge level={skill.proficiency_level ?? "BEGINNER"} /></td>
                              <td style={{ ...tdStyle, minWidth: 100 }}>
                                <div style={{ height: 6, background: "#f0f0f0", borderRadius: 99, overflow: "hidden" }}>
                                  <div style={{ height: "100%", width: cfg.width, background: cfg.bar, borderRadius: 99 }} />
                                </div>
                              </td>
                              <td style={{ ...tdStyle, color: "#999", fontSize: 12 }}>{skill.created_date}</td>
                              <td style={tdStyle}>
                                <div style={{ display: "flex", gap: 6 }}>
                                  <button
                                    onClick={() => { setAdding(false); setEditId(skill.skill_id); }}
                                    style={{ padding: "4px 12px", fontSize: 11, fontWeight: 600, color: "#17375e", background: "#e8f0fb", border: "1px solid #b5cef5", borderRadius: 3, cursor: "pointer" }}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDelete(skill.skill_id, skill.skill_name)}
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

export default StudentSkillPage;
