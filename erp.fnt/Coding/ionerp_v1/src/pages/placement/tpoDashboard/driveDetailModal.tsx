import React from "react";
import {
  X,
  Edit2,
  Building2,
  Briefcase,
  Calendar,
  Users,
  Award,
} from "lucide-react";
import {
  DriveRecord,
  DRIVE_STATUS_CONFIG,
  TIER_CONFIG,
  ROUND_TYPE_CONFIG,
} from "./driveSchema";

interface Props {
  drive: DriveRecord;
  onClose: () => void;
  onEdit: (drive: DriveRecord) => void;
  onStatusChange: (
    driveId: number,
    newStatus: number,
    currentLabel: string,
  ) => void;
}

const Field: React.FC<{
  label: string;
  value?: string | number | null;
  em?: boolean;
}> = ({ label, value, em }) => (
  <div className="space-y-0.5">
    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
      {label}
    </p>
    <p
      className={`text-sm ${em ? "font-bold text-gray-900" : "text-gray-700"}`}
    >
      {value ?? "—"}
    </p>
  </div>
);

const DriveDetailModal: React.FC<Props> = ({
  drive,
  onClose,
  onEdit,
  onStatusChange,
}) => {
  const statusCfg = DRIVE_STATUS_CONFIG[drive.status] ?? DRIVE_STATUS_CONFIG[0];
  const tierCfg = TIER_CONFIG[drive.tier] ?? TIER_CONFIG[1];

  const ctcRange =
    drive.ctc_min != null && drive.ctc_max != null
      ? `${drive.ctc_min} – ${drive.ctc_max} LPA`
      : drive.ctc_min != null
        ? `${drive.ctc_min} LPA`
        : drive.ctc_max != null
          ? `${drive.ctc_max} LPA`
          : null;

  const fmt = (d?: string | null) =>
    d
      ? new Date(d).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";

  // Next possible statuses
  const STATUS_TRANSITIONS: Record<number, number[]> = {
    0: [1, 4], // Draft → Scheduled or Cancelled
    1: [2, 4], // Scheduled → Active or Cancelled
    2: [3, 4], // Active → Closed or Cancelled
    3: [], // Closed → terminal
    4: [], // Cancelled → terminal
  };
  const nextStatuses = STATUS_TRANSITIONS[drive.status] ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm overflow-y-auto py-6">
      <div
        className="relative mx-auto w-full max-w-3xl rounded-2xl bg-white shadow-2xl"
        style={{ fontFamily: "'Roboto', sans-serif" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${tierCfg.badge}`}
              >
                {tierCfg.label}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${statusCfg.badge}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                {statusCfg.label}
              </span>
            </div>
            <h2 className="text-xl font-black text-gray-900">
              {drive.drive_name}
            </h2>
            <p className="text-sm text-gray-500 flex items-center gap-1.5">
              <Building2 size={13} className="text-gray-400" />
              {drive.company_name}
              <span className="mx-1 text-gray-300">·</span>
              <Briefcase size={13} className="text-gray-400" />
              {drive.job_role}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 hover:bg-gray-100 transition"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
          {[
            {
              label: "Eligible",
              value: drive.eligible_student_count,
              color: "text-indigo-600",
            },
            {
              label: "Applied",
              value: drive.applied_count,
              color: "text-blue-600",
            },
            {
              label: "Shortlisted",
              value: drive.shortlisted_count,
              color: "text-emerald-600",
            },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center py-4 px-3">
              <span className={`text-2xl font-black ${s.color}`}>
                {s.value.toLocaleString()}
              </span>
              <span className="text-xs text-gray-400 font-semibold mt-0.5">
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Drive details */}
          <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-5">
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Briefcase size={12} /> Drive Details
            </h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Field label="Drive Type" value={drive.drive_type} em />
              <Field label="Work Type" value={drive.work_type} />
              <Field label="Location" value={drive.location} />
              <Field
                label="Vacancies"
                value={
                  drive.vacancy_count != null
                    ? `${drive.vacancy_count} openings`
                    : null
                }
                em
              />
              <Field label="CTC" value={ctcRange} em />
              <Field
                label="Min CGPA"
                value={drive.min_cgpa != null ? `${drive.min_cgpa}` : null}
              />
              <Field
                label="Max Backlogs"
                value={
                  drive.max_backlogs != null ? String(drive.max_backlogs) : null
                }
              />
            </div>
          </div>

          {/* Dates */}
          <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-5">
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Calendar size={12} /> Dates
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <Field
                label="Applications Open"
                value={fmt(drive.application_start)}
              />
              <Field
                label="Application Deadline"
                value={fmt(drive.application_deadline)}
                em
              />
              <Field label="Drive Date" value={fmt(drive.drive_date)} />
            </div>
          </div>

          {/* Eligible Branches */}
          {drive.eligible_branches && drive.eligible_branches.length > 0 && (
            <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-5">
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Users size={12} /> Eligible Branches
              </h3>
              <div className="flex flex-wrap gap-2">
                {drive.eligible_branches.map((b) => (
                  <span
                    key={b.id ?? `${b.dept_id}-${b.batch_year}`}
                    className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700"
                  >
                    {b.dept_acronym || b.dept_name} {b.batch_year}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Rounds */}
          {drive.rounds && drive.rounds.length > 0 && (
            <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-5">
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Award size={12} /> Selection Rounds
              </h3>
              <div className="space-y-2">
                {drive.rounds.map((r) => {
                  const rtCfg =
                    ROUND_TYPE_CONFIG[r.round_type] ??
                    ROUND_TYPE_CONFIG["OTHER"];
                  return (
                    <div
                      key={r.round_id ?? r.round_number}
                      className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3"
                    >
                      <span className="w-7 h-7 flex shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-black text-indigo-700">
                        {r.round_number}
                      </span>
                      <span className="flex-1 text-sm font-semibold text-gray-800">
                        {r.round_name}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${rtCfg.color}`}
                      >
                        {rtCfg.label}
                      </span>
                      {r.is_eliminatory && (
                        <span className="rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-600">
                          Eliminatory
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Job Description */}
          {drive.job_description && (
            <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-5">
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                Job Description
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {drive.job_description}
              </p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4 gap-3 flex-wrap">
          <div className="flex gap-2 flex-wrap">
            {nextStatuses.map((ns) => {
              const nsCfg = DRIVE_STATUS_CONFIG[ns];
              return (
                <button
                  key={ns}
                  onClick={() =>
                    onStatusChange(drive.drive_id, ns, statusCfg.label)
                  }
                  className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition hover:opacity-80 ${nsCfg.badge}`}
                >
                  Mark {nsCfg.label}
                </button>
              );
            })}
          </div>
          <div className="flex gap-3 ml-auto">
            <button
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
            >
              Close
            </button>
            <button
              onClick={() => onEdit(drive)}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition active:scale-95"
            >
              <Edit2 size={13} /> Edit Drive
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriveDetailModal;
