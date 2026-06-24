import React, { useState, useEffect, useCallback, useRef } from "react";
import { X, Plus, Trash2, Loader2, Users } from "lucide-react";
import { toast } from "react-toastify";
import axiosInstance from "../../../utils/api";
import { ApiEndpoint } from "../../../utils/ApiEndpoint/placementApiEndpoint";
import { DriveRecord, DriveMeta, EligibleBranch, DriveRound, ROUND_TYPE_CONFIG } from "./driveSchema";

interface Props {
  meta: DriveMeta | null;
  editDrive: DriveRecord | null;   // null → create mode
  onClose: () => void;
  onSaved: () => void;
}

const EMPTY_ROUND: Omit<DriveRound, "round_id" | "drive_id"> = {
  round_number: 1,
  round_name: "",
  round_type: "APTITUDE",
  is_eliminatory: true,
};

const DriveFormModal: React.FC<Props> = ({ meta, editDrive, onClose, onSaved }) => {
  const isEdit = Boolean(editDrive?.drive_id);

  // ── Form fields ──────────────────────────────────────────────────────────
  const [companyId, setCompanyId]     = useState<number | "">(editDrive?.company_id ?? "");
  const [driveName, setDriveName]     = useState(editDrive?.drive_name ?? "");
  const [jobRole, setJobRole]         = useState(editDrive?.job_role ?? "");
  const [driveType, setDriveType]     = useState(editDrive?.drive_type ?? "On-Campus");
  const [workType, setWorkType]       = useState(editDrive?.work_type ?? "Onsite");
  const [location, setLocation]       = useState(editDrive?.location ?? "");
  const [ctcMin, setCtcMin]           = useState<string>(editDrive?.ctc_min?.toString() ?? "");
  const [ctcMax, setCtcMax]           = useState<string>(editDrive?.ctc_max?.toString() ?? "");
  const [jobDesc, setJobDesc]         = useState(editDrive?.job_description ?? "");
  const [minCgpa, setMinCgpa]         = useState<string>(editDrive?.min_cgpa?.toString() ?? "0");
  const [maxBacklogs, setMaxBacklogs] = useState<string>(editDrive?.max_backlogs?.toString() ?? "0");
  const [appStart, setAppStart]       = useState(editDrive?.application_start ?? "");
  const [appDeadline, setAppDeadline] = useState(editDrive?.application_deadline ?? "");
  const [driveDate, setDriveDate]     = useState(editDrive?.drive_date ?? "");
  const [tier, setTier]               = useState<number>(editDrive?.tier ?? 1);
  const [status, setStatus]           = useState<number>(editDrive?.status ?? 0);
  const [rounds, setRounds]           = useState<Omit<DriveRound, "round_id" | "drive_id">[]>(
    editDrive?.rounds?.map((r) => ({
      round_number: r.round_number,
      round_name: r.round_name,
      round_type: r.round_type,
      is_eliminatory: r.is_eliminatory,
      round_date: r.round_date,
      duration_minutes: r.duration_minutes,
      description: r.description,
    })) ?? []
  );

  // Eligible branches — stored as Set of "dept_id:batch_year" strings
  const [selectedBranches, setSelectedBranches] = useState<Set<string>>(() => {
    const s = new Set<string>();
    editDrive?.eligible_branches?.forEach((b) => s.add(`${b.dept_id}:${b.batch_year}`));
    return s;
  });

  const [eligibleCount, setEligibleCount] = useState<number>(editDrive?.eligible_student_count ?? 0);
  const [countLoading, setCountLoading]   = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [saving, setSaving] = useState(false);

  // ── Live eligible count ────────────────────────────────────────────────
  const fetchEligibleCount = useCallback(async (branches: Set<string>) => {
    if (branches.size === 0) { setEligibleCount(0); return; }
    const allKeys    = Array.from(branches);
    const deptIds    = Array.from(new Set(allKeys.map((k) => k.split(":")[0])));
    const batchYears = Array.from(new Set(allKeys.map((k) => k.split(":")[1])));
    setCountLoading(true);
    try {
      const res = await axiosInstance.get(ApiEndpoint.drive.eligibleCount, {
        params: { dept_ids: deptIds.join(","), batch_years: batchYears.join(",") },
      });
      const body = res.data as any;
      if (body?.status) setEligibleCount(body?.data?.eligible_count ?? 0);
    } catch { /* silent */ } finally { setCountLoading(false); }
  }, []);

  // Debounce eligible count calls
  const triggerCount = useCallback((branches: Set<string>) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchEligibleCount(branches), 500);
  }, [fetchEligibleCount]);

  // ── Toggle branch (dept + batch_year) ────────────────────────────────────
  const toggleBranch = (deptId: number, batchYear: number) => {
    const key = `${deptId}:${batchYear}`;
    setSelectedBranches((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      triggerCount(next);
      return next;
    });
  };

  // Initial count for edit mode
  useEffect(() => {
    if (selectedBranches.size > 0) fetchEligibleCount(selectedBranches);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Round helpers ─────────────────────────────────────────────────────────
  const addRound = () => {
    setRounds((prev) => [
      ...prev,
      { ...EMPTY_ROUND, round_number: prev.length + 1 },
    ]);
  };

  const removeRound = (idx: number) => {
    setRounds((prev) =>
      prev.filter((_, i) => i !== idx).map((r, i) => ({ ...r, round_number: i + 1 }))
    );
  };

  const updateRound = (idx: number, field: string, value: any) => {
    setRounds((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) { toast.error("Please select a company."); return; }
    if (!driveName.trim()) { toast.error("Drive name is required."); return; }
    if (!jobRole.trim()) { toast.error("Job role is required."); return; }
    if (selectedBranches.size === 0) { toast.error("Select at least one eligible branch + batch year."); return; }

    const emptyRound = rounds.findIndex((r) => !r.round_name.trim());
    if (emptyRound !== -1) {
      toast.error(`Round ${emptyRound + 1}: Round name is required.`);
      return;
    }

    const eligible_branches: EligibleBranch[] = Array.from(selectedBranches).map((key) => {
      const [dept_id, batch_year] = key.split(":").map(Number);
      return { dept_id, batch_year };
    });

    const payload = {
      drive_id: isEdit ? editDrive!.drive_id : undefined,
      company_id: Number(companyId),
      drive_name: driveName.trim(),
      job_role: jobRole.trim(),
      drive_type: driveType,
      work_type: workType,
      location: location || null,
      ctc_min: ctcMin ? parseFloat(ctcMin) : null,
      ctc_max: ctcMax ? parseFloat(ctcMax) : null,
      job_description: jobDesc || null,
      min_cgpa: parseFloat(minCgpa) || 0,
      max_backlogs: parseInt(maxBacklogs) || 0,
      application_start: appStart || null,
      application_deadline: appDeadline || null,
      drive_date: driveDate || null,
      tier,
      status,
      eligible_branches,
      rounds,
    };

    setSaving(true);
    try {
      const res = isEdit
        ? await axiosInstance.put(ApiEndpoint.drive.save, payload)
        : await axiosInstance.post(ApiEndpoint.drive.save, payload);

      const body = res.data as any;
      if (body?.status) {
        toast.success(body.message || (isEdit ? "Drive updated." : "Drive created."));
        onSaved();
      } else {
        toast.error(body?.message || "Failed to save drive.");
      }
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      if (Array.isArray(detail)) {
        const messages = detail
          .map((d: any) => {
            const field = Array.isArray(d.loc) ? d.loc.slice(1).join(" → ") : "";
            return field ? `${field}: ${d.msg}` : d.msg;
          })
          .join("\n");
        toast.error(messages || "Validation failed. Please check your input.");
      } else {
        toast.error(typeof detail === "string" ? detail : "An error occurred.");
      }
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition";
  const labelCls = "block mb-1 text-xs font-semibold text-gray-600 uppercase tracking-wide";

  const batchYears = meta?.batch_years ?? [];
  const departments = meta?.departments ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm overflow-y-auto py-6">
      <div
        className="relative mx-auto w-full max-w-5xl rounded-2xl bg-white shadow-2xl"
        style={{ fontFamily: "'Roboto', sans-serif" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-xl font-black text-gray-900">
            {isEdit ? "Edit Placement Drive" : "Create Placement Drive"}
          </h2>
          <button onClick={onClose} className="rounded-xl p-2 hover:bg-gray-100 transition">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* ── Two column layout ───────────────────────────────────────── */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

            {/* ── LEFT: Company & Role ──────────────────────────────────── */}
            <div className="space-y-4 rounded-2xl border border-gray-100 bg-gray-50/40 p-5">
              <h3 className="text-sm font-black text-gray-700 uppercase tracking-widest">Company & Role</h3>

              {/* Company */}
              <div>
                <label className={labelCls}>Company *</label>
                <select value={companyId} onChange={(e) => setCompanyId(Number(e.target.value))} className={inputCls} required>
                  <option value="">Select company…</option>
                  {(meta?.companies ?? []).map((c) => (
                    <option key={c.company_id} value={c.company_id}>{c.company_name}</option>
                  ))}
                </select>
              </div>

              {/* Drive Name */}
              <div>
                <label className={labelCls}>Drive Name *</label>
                <input type="text" value={driveName} onChange={(e) => setDriveName(e.target.value)}
                  placeholder="e.g. Campus Drive July 2025" className={inputCls} required />
              </div>

              {/* Job Role */}
              <div>
                <label className={labelCls}>Job Role *</label>
                <input type="text" value={jobRole} onChange={(e) => setJobRole(e.target.value)}
                  placeholder="e.g. Software Engineer" className={inputCls} required />
              </div>

              {/* Drive Type + Work Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Drive Type *</label>
                  <select value={driveType} onChange={(e) => setDriveType(e.target.value)} className={inputCls}>
                    {(meta?.drive_types ?? ["On-Campus", "Off-Campus", "Pool Campus"]).map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Work Type</label>
                  <select value={workType} onChange={(e) => setWorkType(e.target.value)} className={inputCls}>
                    {(meta?.work_types ?? ["Onsite", "Remote", "Hybrid"]).map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Location + Tier */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Location</label>
                  <input type="text" value={location} onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Bangalore" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Tier *</label>
                  <select value={tier} onChange={(e) => setTier(Number(e.target.value))} className={inputCls}>
                    <option value={1}>Tier 1</option>
                    <option value={2}>Tier 2</option>
                    <option value={3}>Tier 3</option>
                  </select>
                </div>
              </div>

              {/* CTC */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>CTC Min (LPA)</label>
                  <input type="number" step="0.1" min="0" value={ctcMin} onChange={(e) => setCtcMin(e.target.value)}
                    placeholder="0.0" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>CTC Max (LPA)</label>
                  <input type="number" step="0.1" min="0" value={ctcMax} onChange={(e) => setCtcMax(e.target.value)}
                    placeholder="0.0" className={inputCls} />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>App. Open</label>
                  <input type="date" value={appStart} onChange={(e) => setAppStart(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>App. Deadline</label>
                  <input type="date" value={appDeadline} onChange={(e) => setAppDeadline(e.target.value)} className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Drive Date</label>
                  <input type="date" value={driveDate} onChange={(e) => setDriveDate(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Status</label>
                  <select value={status} onChange={(e) => setStatus(Number(e.target.value))} className={inputCls}>
                    <option value={0}>Draft</option>
                    <option value={1}>Scheduled</option>
                    <option value={2}>Active</option>
                    <option value={3}>Closed</option>
                    <option value={4}>Cancelled</option>
                  </select>
                </div>
              </div>

              {/* JD */}
              <div>
                <label className={labelCls}>Job Description (optional)</label>
                <textarea value={jobDesc} onChange={(e) => setJobDesc(e.target.value)}
                  rows={3} placeholder="Role overview, responsibilities, requirements…" className={inputCls} />
              </div>
            </div>

            {/* ── RIGHT: Eligibility Criteria ─────────────────────────── */}
            <div className="space-y-4 rounded-2xl border border-gray-100 bg-gray-50/40 p-5">
              <h3 className="text-sm font-black text-gray-700 uppercase tracking-widest">Eligibility Criteria</h3>

              {/* CGPA + Backlogs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Min CGPA *</label>
                  <input type="number" step="0.01" min="0" max="10" value={minCgpa}
                    onChange={(e) => setMinCgpa(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Max Active Backlogs</label>
                  <input type="number" min="0" value={maxBacklogs}
                    onChange={(e) => setMaxBacklogs(e.target.value)} className={inputCls} />
                </div>
              </div>

              {/* Eligible Branches (dept × batch_year chips) */}
              <div>
                <label className={labelCls}>Eligible Branches *</label>
                {departments.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No departments loaded.</p>
                ) : (
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {departments.map((dept) => (
                      <div key={dept.dept_id} className="space-y-1">
                        <p className="text-xs font-semibold text-gray-500">{dept.dept_name}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {batchYears.map((year) => {
                            const key = `${dept.dept_id}:${year}`;
                            const selected = selectedBranches.has(key);
                            return (
                              <button
                                key={key}
                                type="button"
                                onClick={() => toggleBranch(dept.dept_id, year)}
                                className={`rounded-full px-3 py-0.5 text-xs font-bold border transition-all duration-150 ${
                                  selected
                                    ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                                    : "bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600"
                                }`}
                              >
                                {dept.dept_acronym} {year}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <p className="mt-1.5 text-xs text-gray-400">
                  {selectedBranches.size > 0
                    ? `${selectedBranches.size} combination(s) selected — click to toggle`
                    : "Click dept+year combos to mark as eligible"}
                </p>
              </div>

              {/* Live eligible count */}
              <div className="flex items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
                <Users size={18} className="text-indigo-500 shrink-0" />
                <div>
                  {countLoading ? (
                    <span className="text-sm text-indigo-400 flex items-center gap-1.5">
                      <Loader2 size={13} className="animate-spin" /> Calculating…
                    </span>
                  ) : (
                    <span className="text-sm font-bold text-indigo-700">
                      {eligibleCount.toLocaleString()} student{eligibleCount !== 1 ? "s" : ""} eligible based on current settings.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Rounds section ───────────────────────────────────────────────── */}
          <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50/40 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-gray-700 uppercase tracking-widest">Define Rounds</h3>
              <button
                type="button"
                onClick={addRound}
                className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-white px-3 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition"
              >
                <Plus size={13} /> Add Round
              </button>
            </div>

            {rounds.length === 0 && (
              <p className="text-center text-sm text-gray-400 italic py-4">No rounds added. Click "+ Add Round" to define selection rounds.</p>
            )}

            <div className="space-y-3">
              {rounds.map((r, idx) => (
                <div key={idx} className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
                  <span className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-indigo-100 text-xs font-black text-indigo-700">
                    {r.round_number}
                  </span>

                  <input
                    type="text"
                    value={r.round_name}
                    onChange={(e) => updateRound(idx, "round_name", e.target.value)}
                    placeholder="Round name…"
                    className="flex-1 min-w-[160px] rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm outline-none focus:border-indigo-400 transition"
                  />

                  <select
                    value={r.round_type}
                    onChange={(e) => updateRound(idx, "round_type", e.target.value)}
                    className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs font-semibold outline-none focus:border-indigo-400 transition"
                  >
                    {(meta?.round_types ?? Object.keys(ROUND_TYPE_CONFIG)).map((rt) => (
                      <option key={rt} value={rt}>{ROUND_TYPE_CONFIG[rt]?.label ?? rt}</option>
                    ))}
                  </select>

                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={r.is_eliminatory}
                      onChange={(e) => updateRound(idx, "is_eliminatory", e.target.checked)}
                      className="rounded accent-indigo-600"
                    />
                    Eliminatory
                  </label>

                  <button
                    type="button"
                    onClick={() => removeRound(idx)}
                    className="ml-auto rounded-lg p-1.5 text-rose-400 hover:bg-rose-50 transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ── Footer actions ───────────────────────────────────────────────── */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-60 active:scale-95"
            >
              {saving && <Loader2 size={15} className="animate-spin" />}
              {isEdit ? "Save Changes" : "Create Drive"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DriveFormModal;
