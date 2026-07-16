import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  Users,
  Building2,
  ShieldCheck,
  ListOrdered,
  CalendarDays,
  Info,
} from "lucide-react";
import { toast } from "react-toastify";
import axiosInstance from "../../../utils/api";
import { PlacementApiEndpoint } from "../../../utils/ApiEndpoint/placementApiEndpoints";
import {
  DriveRecord,
  DriveMeta,
  EligibleBranch,
  DriveRound,
  ROUND_TYPE_CONFIG,
} from "./driveSchema";

// ─── Constants ────────────────────────────────────────────────────────────────
const EMPTY_ROUND: Omit<DriveRound, "round_id" | "drive_id"> = {
  round_number: 1,
  round_name: "",
  round_type: "APTITUDE",
  is_eliminatory: true,
};

const MAX_BATCH_YEARS = 4;

// ─── Shared styles ────────────────────────────────────────────────────────────
// ─── Shared styles ────────────────────────────────────────────────────────────
const inputCls =
  "w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition placeholder:text-gray-400";
const labelCls =
  "block mb-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide";

// ─── Section wrapper ──────────────────────────────────────────────────────────
const Section: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  accent?: string;
}> = ({ icon, title, subtitle, children, accent = "#2563eb" }) => (
  <div className="space-y-4">
    {/* Section header */}
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-b from-white to-slate-50 border border-gray-200 shadow-[0_3px_0_#e5e7eb] mb-2">
      <span
        className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
        style={{ backgroundColor: accent }}
      >
        {icon}
      </span>
      <div>
        <h3 className="text-sm font-bold text-black">{title}</h3>
        {subtitle && <p className="text-[11px] text-gray-400 font-medium mt-0.5">{subtitle}</p>}
      </div>
    </div>
    <div className="p-2 space-y-4">{children}</div>
  </div>
);

// ─── Chip toggle button ────────────────────────────────────────────────────────
const Chip: React.FC<{
  label: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  disabledReason?: string;
}> = ({ label, selected, onClick, disabled, disabledReason }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled && !selected}
    title={disabled && !selected ? disabledReason : undefined}
    className={`rounded-full border px-4 py-1.5 text-xs font-bold transition-all duration-150 select-none
      ${
        selected
          ? "border-indigo-500 bg-indigo-600 text-white shadow-sm shadow-indigo-200"
          : disabled
            ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
            : "border-gray-200 bg-white text-gray-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer"
      }`}
  >
    {label}
  </button>
);

// ─── Main Form Component ───────────────────────────────────────────────────────
const DriveFormPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const editDrive: DriveRecord | null =
    (location.state as any)?.editDrive ?? null;
  const isEdit = Boolean(editDrive?.drive_id);

  // ── Meta ──────────────────────────────────────────────────────────────────
  const [meta, setMeta] = useState<DriveMeta | null>(null);
  const [metaLoading, setMetaLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await axiosInstance.get(PlacementApiEndpoint.drive.meta);
        const body = res.data as any;
        if (body?.status) setMeta(body.data);
      } catch {
        toast.error("Failed to load form options.");
      } finally {
        setMetaLoading(false);
      }
    })();
  }, []);

  // ── Section 1: Company & Role ─────────────────────────────────────────────
  const [companyId, setCompanyId] = useState<number | "">(
    editDrive?.company_id ?? "",
  );
  const [driveName, setDriveName] = useState(editDrive?.drive_name ?? "");
  const [jobRole, setJobRole] = useState(editDrive?.job_role ?? "");
  const [vacancyCount, setVacancyCount] = useState<string>(
    editDrive?.vacancy_count?.toString() ?? "",
  );
  const [driveType, setDriveType] = useState(
    editDrive?.drive_type ?? "On-Campus",
  );
  const [workType, setWorkType] = useState(editDrive?.work_type ?? "Onsite");
  const [location_, setLocation_] = useState(editDrive?.location ?? "");
  const [tier, setTier] = useState<number>(editDrive?.tier ?? 1);
  const [ctcMin, setCtcMin] = useState<string>(
    editDrive?.ctc_min?.toString() ?? "",
  );
  const [ctcMax, setCtcMax] = useState<string>(
    editDrive?.ctc_max?.toString() ?? "",
  );
  const [jobDesc, setJobDesc] = useState(editDrive?.job_description ?? "");

  // ── Section 2: Schedule & Status ─────────────────────────────────────────
  const [appStart, setAppStart] = useState(editDrive?.application_start ?? "");
  const [appDeadline, setAppDeadline] = useState(
    editDrive?.application_deadline ?? "",
  );
  const [driveDate, setDriveDate] = useState(editDrive?.drive_date ?? "");
  const [status, setStatus] = useState<number>(editDrive?.status ?? 0);

  // ── Section 3: Eligibility Criteria ──────────────────────────────────────
  const [minCgpa, setMinCgpa] = useState<string>(
    editDrive?.min_cgpa?.toString() ?? "0",
  );
  const [maxBacklogs, setMaxBacklogs] = useState<string>(
    editDrive?.max_backlogs?.toString() ?? "0",
  );

  // Selected dept_ids (branches) — just the dept_id, not combined with batch_year
  const [selectedDeptIds, setSelectedDeptIds] = useState<Set<number>>(() => {
    const s = new Set<number>();
    editDrive?.eligible_branches?.forEach((b) => s.add(b.dept_id));
    return s;
  });

  // Selected batch years (max MAX_BATCH_YEARS)
  const [selectedBatchYears, setSelectedBatchYears] = useState<Set<number>>(
    () => {
      const s = new Set<number>();
      editDrive?.eligible_branches?.forEach((b) => s.add(b.batch_year));
      return s;
    },
  );

  const [eligibleCount, setEligibleCount] = useState<number>(
    editDrive?.eligible_student_count ?? 0,
  );
  const [countLoading, setCountLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Section 4: Rounds ─────────────────────────────────────────────────────
  const [rounds, setRounds] = useState<
    Omit<DriveRound, "round_id" | "drive_id">[]
  >(
    editDrive?.rounds?.map((r) => ({
      round_number: r.round_number,
      round_name: r.round_name,
      round_type: r.round_type,
      is_eliminatory: r.is_eliminatory,
      round_date: r.round_date,
      duration_minutes: r.duration_minutes,
      description: r.description,
    })) ?? [],
  );

  const [saving, setSaving] = useState(false);

  // ── Live eligible count ───────────────────────────────────────────────────
  const fetchEligibleCount = useCallback(
    async (deptIds: Set<number>, batchYears: Set<number>) => {
      if (deptIds.size === 0 || batchYears.size === 0) {
        setEligibleCount(0);
        return;
      }
      setCountLoading(true);
      try {
        const res = await axiosInstance.get(
          PlacementApiEndpoint.drive.eligibleCount,
          {
            params: {
              dept_ids: Array.from(deptIds).join(","),
              batch_years: Array.from(batchYears).join(","),
            },
          },
        );
        const body = res.data as any;
        if (body?.status) setEligibleCount(body?.data?.eligible_count ?? 0);
      } catch {
        /* silent */
      } finally {
        setCountLoading(false);
      }
    },
    [],
  );

  const triggerCount = useCallback(
    (deptIds: Set<number>, batchYears: Set<number>) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(
        () => fetchEligibleCount(deptIds, batchYears),
        500,
      );
    },
    [fetchEligibleCount],
  );

  // Initial count fetch on edit mode
  useEffect(() => {
    if (selectedDeptIds.size > 0 && selectedBatchYears.size > 0) {
      fetchEligibleCount(selectedDeptIds, selectedBatchYears);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Toggle branch (dept) ──────────────────────────────────────────────────
  const toggleDept = (deptId: number) => {
    setSelectedDeptIds((prev) => {
      const next = new Set(prev);
      next.has(deptId) ? next.delete(deptId) : next.add(deptId);
      triggerCount(next, selectedBatchYears);
      return next;
    });
  };

  // ── Toggle batch year (max 4) ─────────────────────────────────────────────
  const toggleBatchYear = (year: number) => {
    setSelectedBatchYears((prev) => {
      const next = new Set(prev);
      if (next.has(year)) {
        next.delete(year);
      } else {
        if (next.size >= MAX_BATCH_YEARS) {
          toast.warn(`You can select at most ${MAX_BATCH_YEARS} batch years.`);
          return prev;
        }
        next.add(year);
      }
      triggerCount(selectedDeptIds, next);
      return next;
    });
  };

  // ── Round helpers ─────────────────────────────────────────────────────────
  const addRound = () => {
    setRounds((prev) => [
      ...prev,
      { ...EMPTY_ROUND, round_number: prev.length + 1 },
    ]);
  };

  const removeRound = (idx: number) => {
    setRounds((prev) =>
      prev
        .filter((_, i) => i !== idx)
        .map((r, i) => ({ ...r, round_number: i + 1 })),
    );
  };

  const updateRound = (idx: number, field: string, value: any) => {
    setRounds((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)),
    );
  };

  // ── Submit (called from form onSubmit) ──────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyId) {
      toast.error("Please select a company.");
      return;
    }
    if (!driveName.trim()) {
      toast.error("Drive name is required.");
      return;
    }
    if (!jobRole.trim()) {
      toast.error("Job role is required.");
      return;
    }
    if (selectedDeptIds.size === 0) {
      toast.error("Select at least one eligible branch.");
      return;
    }
    if (selectedBatchYears.size === 0) {
      toast.error("Select at least one eligible batch year.");
      return;
    }
    const emptyRound = rounds.findIndex((r) => !r.round_name.trim());
    if (emptyRound !== -1) {
      toast.error(`Round ${emptyRound + 1}: Round name is required.`);
      return;
    }

    // Build eligible_branches: every (dept_id × batch_year) combo
    const eligible_branches: EligibleBranch[] = [];
    selectedDeptIds.forEach((deptId) => {
      selectedBatchYears.forEach((batchYear) => {
        eligible_branches.push({ dept_id: deptId, batch_year: batchYear });
      });
    });

    const payload = {
      drive_id: isEdit ? editDrive!.drive_id : undefined,
      company_id: Number(companyId),
      drive_name: driveName.trim(),
      job_role: jobRole.trim(),
      vacancy_count: vacancyCount ? parseInt(vacancyCount) : null,
      drive_type: driveType,
      work_type: workType,
      location: location_ || null,
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
        ? await axiosInstance.put(PlacementApiEndpoint.drive.save, payload)
        : await axiosInstance.post(PlacementApiEndpoint.drive.save, payload);

      const body = res.data as any;
      if (body?.status) {
        toast.success(
          body.message || (isEdit ? "Drive updated." : "Drive created."),
        );
        navigate("/tpo/placement-drive");
      } else {
        toast.error(body?.message || "Failed to save drive.");
      }
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      if (Array.isArray(detail)) {
        // FastAPI 422: detail is [{loc: [...], msg: "...", type: "..."}]
        const messages = detail
          .map((d: any) => {
            const field = Array.isArray(d.loc)
              ? d.loc.slice(1).join(" → ")
              : "";
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

  // ── Wrapper for non-form submit (sticky header button) ─────────────────
  const submitForm = () => {
    handleSubmit({ preventDefault: () => {} } as React.FormEvent);
  };

  const batchYears = meta?.batch_years ?? [];
  const departments = meta?.departments ?? [];

  // ── Loading state ─────────────────────────────────────────────────────────
  if (metaLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500" size={28} />
      </div>
    );
  }

  return (
    <div className="cr-registration-page mx-auto max-w-5xl px-4 py-6" style={{ fontFamily: "'Roboto', sans-serif" }}>
      <style>{`
        .cr-registration-page, .cr-registration-page * {
          font-family: 'Roboto', sans-serif;
        }
        .cr-form-panel label {
          font-weight: 600 !important;
          color: #111827 !important;
          font-size: 0.75rem !important;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .cr-form-panel input,
        .cr-form-panel select,
        .cr-form-panel textarea {
          border-radius: 0.85rem !important;
          border-color: #e5e7eb !important;
          background-color: #f9fafb !important;
          box-shadow: 0 2px 0 #f3f4f6;
          transition: all 0.2s ease-in-out;
        }
        .cr-form-panel input:focus,
        .cr-form-panel select:focus,
        .cr-form-panel textarea:focus {
          border-color: #2563eb !important;
          background-color: #ffffff !important;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
        }
      `}</style>

      {/* Header */}
      <div
        className="mb-6 rounded-3xl border border-white bg-white p-6"
        style={{
          boxShadow:
            "0 1px 0 rgba(255,255,255,0.9) inset, 0 14px 32px -14px rgba(37,99,235,0.18), 0 4px 0 #1d4ed8",
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-[0_4px_0_#bfdbfe]">
              <Building2 className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-black">
                {isEdit ? "Edit Placement Drive" : "Create Placement Drive"}
              </h1>
              <p className="mt-1 max-w-2xl text-sm font-medium text-black/55">
                {isEdit
                  ? `Editing "${editDrive?.drive_name}". Configure job details, schedule timeline, and eligibility.`
                  : "Fill in the company details, schedule timeline, criteria, and interview rounds to launch a drive."}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate("/tpo/placement-drive")}
              className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-xs font-bold text-black shadow-[0_3px_0_#d1d5db] transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[0_1px_0_#d1d5db]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submitForm}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-[0_4px_0_#1d4ed8] transition-all hover:-translate-y-0.5 hover:bg-blue-500 active:translate-y-0.5 active:shadow-[0_1px_0_#1d4ed8]"
            >
              {saving && <Loader2 size={13} className="animate-spin" />}
              {isEdit ? "Save Changes" : "Create Drive"}
            </button>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Building2, label: "Company & Role", desc: "Job details & role type" },
          { icon: CalendarDays, label: "Schedule & Status", desc: "Dates & publish status" },
          { icon: ShieldCheck, label: "Eligibility Criteria", desc: "CGPA, branch, batch" },
          { icon: ListOrdered, label: "Define Rounds", desc: "Selection stages" },
        ].map((step, index) => {
          const Icon = step.icon;
          return (
            <div
              key={step.label}
              className="rounded-2xl border border-white bg-white p-4"
              style={{
                boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset, 0 8px 24px -10px rgba(0,0,0,0.12), 0 3px 0 #e5e7eb",
              }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-black text-white shadow-[0_3px_0_rgba(0,0,0,0.25)]">
                  {index + 1}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Icon className="h-4 w-4 text-blue-600 shrink-0" />
                    <p className="text-xs font-bold text-black truncate">{step.label}</p>
                  </div>
                  <p className="text-[10px] font-medium text-black/50 truncate mt-0.5">{step.desc}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <form
        onSubmit={handleSubmit}
        className="cr-form-panel rounded-3xl border border-white bg-white p-6 md:p-8 space-y-8"
        style={{
          boxShadow:
            "0 1px 0 rgba(255,255,255,0.9) inset, 0 18px 44px -18px rgba(0,0,0,0.14), 0 4px 0 #e5e7eb",
        }}
      >
        {/* ══════════════════════════════════════════════════════════════════
            SECTION 1 — Company & Role
        ══════════════════════════════════════════════════════════════════ */}
        <Section
          icon={<Building2 size={16} />}
          title="Company & Role"
          subtitle="Basic drive and company information"
          accent="#6366f1"
        >
          {/* Row 1: Company + Drive Name */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Company *</label>
              <select
                value={companyId}
                onChange={(e) => setCompanyId(Number(e.target.value))}
                className={inputCls}
                required
              >
                <option value="">— Select Company —</option>
                {(meta?.companies ?? []).map((c) => (
                  <option key={c.company_id} value={c.company_id}>
                    {c.company_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Drive Name *</label>
              <input
                type="text"
                value={driveName}
                onChange={(e) => setDriveName(e.target.value)}
                placeholder="e.g. Campus Drive — July 2025"
                className={inputCls}
                required
              />
            </div>
          </div>

          {/* Row 2: Job Role + Vacancies + Drive Type */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className={labelCls}>Job Role *</label>
              <input
                type="text"
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                placeholder="e.g. Software Engineer"
                className={inputCls}
                required
              />
            </div>
            <div>
              <label className={labelCls}>Vacancies (Optional)</label>
              <input
                type="number"
                min="1"
                value={vacancyCount}
                onChange={(e) => setVacancyCount(e.target.value)}
                placeholder="e.g. 10 (leave blank if unknown)"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Drive Type *</label>
              <select
                value={driveType}
                onChange={(e) => setDriveType(e.target.value)}
                className={inputCls}
              >
                {(
                  meta?.drive_types ?? [
                    "On-Campus",
                    "Off-Campus",
                    "Pool Campus",
                  ]
                ).map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Work Type + Location + Tier */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className={labelCls}>Work Type</label>
              <select
                value={workType}
                onChange={(e) => setWorkType(e.target.value)}
                className={inputCls}
              >
                {(meta?.work_types ?? ["Onsite", "Remote", "Hybrid"]).map(
                  (t) => (
                    <option key={t}>{t}</option>
                  ),
                )}
              </select>
            </div>
            <div>
              <label className={labelCls}>Location</label>
              <input
                type="text"
                value={location_}
                onChange={(e) => setLocation_(e.target.value)}
                placeholder="e.g. Bangalore, Pune"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Tier *</label>
              <select
                value={tier}
                onChange={(e) => setTier(Number(e.target.value))}
                className={inputCls}
              >
                <option value={1}>Tier 1</option>
                <option value={2}>Tier 2</option>
                <option value={3}>Tier 3</option>
              </select>
            </div>
          </div>

          {/* Row 4: CTC Min + CTC Max */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>CTC Min (LPA)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={ctcMin}
                onChange={(e) => setCtcMin(e.target.value)}
                placeholder="e.g. 4.5"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>CTC Max (LPA)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={ctcMax}
                onChange={(e) => setCtcMax(e.target.value)}
                placeholder="e.g. 6.5"
                className={inputCls}
              />
            </div>
          </div>

          {/* Row 5: Job Description */}
          <div>
            <label className={labelCls}>Job Description (Optional)</label>
            <textarea
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
              rows={3}
              placeholder="Paste JD or describe the role…"
              className={inputCls}
            />
          </div>
        </Section>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 2 — Schedule & Status
        ══════════════════════════════════════════════════════════════════ */}
        <Section
          icon={<CalendarDays size={16} />}
          title="Schedule & Status"
          subtitle="Application window, drive date, and publish status"
          accent="#0ea5e9"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className={labelCls}>Application Opens</label>
              <input
                type="date"
                value={appStart}
                onChange={(e) => setAppStart(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Application Deadline</label>
              <input
                type="date"
                value={appDeadline}
                onChange={(e) => setAppDeadline(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Drive Date</label>
              <input
                type="date"
                value={driveDate}
                onChange={(e) => setDriveDate(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(Number(e.target.value))}
                className={inputCls}
              >
                <option value={0}>Draft</option>
                <option value={1}>Scheduled</option>
                <option value={2}>Active</option>
                <option value={3}>Closed</option>
                <option value={4}>Cancelled</option>
              </select>
            </div>
          </div>
        </Section>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 3 — Eligibility Criteria
        ══════════════════════════════════════════════════════════════════ */}
        <Section
          icon={<ShieldCheck size={16} />}
          title="Eligibility Criteria"
          subtitle="Set CGPA, backlogs, eligible branches and batch years"
          accent="#10b981"
        >
          {/* CGPA + Backlogs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Minimum CGPA *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                value={minCgpa}
                onChange={(e) => setMinCgpa(e.target.value)}
                placeholder="e.g. 6.5"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Max Active Backlogs</label>
              <input
                type="number"
                min="0"
                value={maxBacklogs}
                onChange={(e) => setMaxBacklogs(e.target.value)}
                placeholder="e.g. 0"
                className={inputCls}
              />
            </div>
          </div>

          {/* Eligible Branches */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={labelCls + " mb-0"}>Eligible Branches *</label>
              {selectedDeptIds.size > 0 && (
                <span className="text-xs text-indigo-600 font-semibold">
                  {selectedDeptIds.size}{" "}
                  {selectedDeptIds.size === 1 ? "branch" : "branches"} selected
                </span>
              )}
            </div>
            {departments.length === 0 ? (
              <p className="text-xs italic text-gray-400 py-2">
                No departments loaded from database.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 p-4 rounded-xl bg-gray-50 border border-gray-200">
                {departments.map((dept) => (
                  <Chip
                    key={dept.dept_id}
                    label={dept.dept_acronym || dept.dept_name}
                    selected={selectedDeptIds.has(dept.dept_id)}
                    onClick={() => toggleDept(dept.dept_id)}
                  />
                ))}
              </div>
            )}
            <p className="mt-1.5 text-xs text-gray-400">
              {selectedDeptIds.size > 0
                ? `${selectedDeptIds.size} branch${selectedDeptIds.size > 1 ? "es" : ""} selected — click to toggle`
                : "Click branches to mark them as eligible for this drive"}
            </p>
          </div>

          {/* Eligible Batch Years */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={labelCls + " mb-0"}>
                Eligible Batch Years *
              </label>
              <span className="flex items-center gap-1 text-xs text-amber-600 font-semibold">
                <Info size={11} />
                Max {MAX_BATCH_YEARS} selectable
              </span>
            </div>
            {batchYears.length === 0 ? (
              <p className="text-xs italic text-gray-400 py-2">
                No batch years loaded from database.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 p-4 rounded-xl bg-gray-50 border border-gray-200">
                {batchYears.map((year) => {
                  const isSelected = selectedBatchYears.has(year);
                  const isDisabled =
                    !isSelected && selectedBatchYears.size >= MAX_BATCH_YEARS;
                  return (
                    <Chip
                      key={year}
                      label={String(year)}
                      selected={isSelected}
                      onClick={() => toggleBatchYear(year)}
                      disabled={isDisabled}
                      disabledReason={`Max ${MAX_BATCH_YEARS} batch years allowed`}
                    />
                  );
                })}
              </div>
            )}
            <p className="mt-1.5 text-xs text-gray-400">
              {selectedBatchYears.size > 0
                ? `${selectedBatchYears.size} of ${MAX_BATCH_YEARS} batch years selected — click to toggle`
                : "Select the graduating batch years eligible for this drive"}
            </p>
          </div>

          {/* Live Eligible Count Banner */}
          <div
            className={`flex items-center gap-3 rounded-xl px-5 py-4 border transition-all ${
              eligibleCount > 0
                ? "bg-emerald-50 border-emerald-200"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <Users
              size={20}
              className={`shrink-0 ${eligibleCount > 0 ? "text-emerald-600" : "text-gray-400"}`}
            />
            <div className="flex-1">
              {countLoading ? (
                <span className="flex items-center gap-1.5 text-sm text-indigo-400">
                  <Loader2 size={13} className="animate-spin" />
                  Calculating eligible students…
                </span>
              ) : (
                <span
                  className={`text-sm font-bold ${eligibleCount > 0 ? "text-emerald-700" : "text-gray-500"}`}
                >
                  {selectedDeptIds.size === 0 || selectedBatchYears.size === 0
                    ? "Select branches and batch years to see eligible student count"
                    : `Based on current eligibility settings, ${eligibleCount.toLocaleString()} student${eligibleCount !== 1 ? "s are" : " is"} eligible for this drive.`}
                </span>
              )}
            </div>
          </div>
        </Section>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 4 — Define Rounds
        ══════════════════════════════════════════════════════════════════ */}
        <Section
          icon={<ListOrdered size={16} />}
          title="Define Rounds"
          subtitle="Add selection rounds for this drive (aptitude, technical, HR, etc.)"
          accent="#8b5cf6"
        >
          {/* Add Round button */}
          <div className="flex items-center justify-between -mt-1">
            <p className="text-xs text-gray-400">
              {rounds.length === 0
                ? "No rounds added yet"
                : `${rounds.length} round${rounds.length > 1 ? "s" : ""} defined`}
            </p>
            <button
              type="button"
              onClick={addRound}
              className="flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 transition-colors hover:bg-violet-100"
            >
              <Plus size={13} />
              Add Round
            </button>
          </div>

          {rounds.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-200 py-8 text-center">
              <ListOrdered size={24} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-400">
                No rounds added. Click "+ Add Round" to define selection rounds.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {rounds.map((r, idx) => (
                <div
                  key={idx}
                  className="flex flex-wrap items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-4"
                >
                  {/* Round number badge */}
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-black text-violet-700 mt-0.5">
                    {r.round_number}
                  </span>

                  {/* Round name */}
                  <div className="flex-1 min-w-[160px]">
                     <label className={labelCls}>Round Name</label>
                    <input
                      type="text"
                      value={r.round_name}
                      onChange={(e) =>
                        updateRound(idx, "round_name", e.target.value)
                      }
                      placeholder="e.g. Online Aptitude Test"
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
                    />
                  </div>

                  {/* Round type */}
                  <div className="min-w-[140px]">
                    <label className={labelCls}>Round Type</label>
                    <select
                      value={r.round_type}
                      onChange={(e) =>
                        updateRound(idx, "round_type", e.target.value)
                      }
                      className="w-full rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm font-semibold outline-none focus:border-violet-400 transition"
                    >
                      {(
                        meta?.round_types ?? Object.keys(ROUND_TYPE_CONFIG)
                      ).map((rt) => (
                        <option key={rt} value={rt}>
                          {ROUND_TYPE_CONFIG[rt]?.label ?? rt}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Round date */}
                  <div className="min-w-[150px]">
                    <label className={labelCls}>Round Date</label>
                    <input
                      type="date"
                      value={r.round_date ?? ""}
                      onChange={(e) =>
                        updateRound(idx, "round_date", e.target.value || null)
                      }
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-400 transition"
                    />
                  </div>

                  {/* Duration */}
                  <div className="min-w-[110px]">
                    <label className={labelCls}>Duration (min)</label>
                    <input
                      type="number"
                      min="0"
                      value={r.duration_minutes ?? ""}
                      onChange={(e) =>
                        updateRound(
                          idx,
                          "duration_minutes",
                          e.target.value ? Number(e.target.value) : null,
                        )
                      }
                      placeholder="e.g. 60"
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-400 transition"
                    />
                  </div>

                  {/* Eliminatory & Action */}
                  <div className="flex items-center gap-3 pt-6 min-h-[38px]">
                    <label className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-gray-600 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={r.is_eliminatory}
                        onChange={(e) =>
                          updateRound(idx, "is_eliminatory", e.target.checked)
                        }
                        className="rounded accent-violet-600"
                      />
                      Eliminatory
                    </label>
                    <button
                      type="button"
                      onClick={() => removeRound(idx)}
                      className="rounded-lg p-1.5 text-rose-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                      title="Remove round"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  {/* Description — full width row */}
                  <div className="w-full">
                    <label className={labelCls}>Description (optional)</label>
                    <input
                      type="text"
                      value={r.description ?? ""}
                      onChange={(e) =>
                        updateRound(idx, "description", e.target.value || null)
                      }
                      placeholder="Brief note about this round…"
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-400 transition"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ── Bottom submit bar ───────────────────────────────────────────────── */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={() => navigate("/tpo/placement-drive")}
            className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-xs font-bold text-black shadow-[0_3px_0_#d1d5db] transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[0_1px_0_#d1d5db]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-2.5 text-xs font-bold text-white shadow-[0_4px_0_#1d4ed8] transition-all hover:-translate-y-0.5 hover:bg-blue-500 active:translate-y-0.5 active:shadow-[0_1px_0_#1d4ed8]"
          >
            {saving && <Loader2 size={13} className="animate-spin" />}
            {isEdit ? "Save Changes" : "Create Drive"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DriveFormPage;
