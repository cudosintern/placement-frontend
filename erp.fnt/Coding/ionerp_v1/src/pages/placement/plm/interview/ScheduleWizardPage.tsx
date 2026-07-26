import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { generatePreview } from "./scheduleEngine";
import * as interviewService from "./interviewService";
import type { MetaResponse } from "./interviewService";
import {
  SchedulingMode,
  ScheduleConfig,
  SchedulePreviewResult,
  ConfirmedScheduleRecord,
  RoundScheduleMeta,
  VenueType,
  EligibleStudent,
  OrgHoliday,
} from "./interviewTypes";
import {
  Building2,
  Clock,
  Settings,
  Eye,
  ArrowLeft,
  Calendar,
} from "lucide-react";

interface Props {
  onClose: () => void;
  onConfirm: (record: ConfirmedScheduleRecord) => void;
  initialDriveId?: number;
  initialRoundId?: number;
  existingSchedule?: ConfirmedScheduleRecord | null;
}

const MODE_OPTIONS: Array<{
  mode: SchedulingMode;
  tag: string;
  label: string;
  subLabel: string;
  icon: string;
  bestFor: string;
}> = [
    { mode: "BATCH_SIMULTANEOUS", tag: "A1", label: "Batch · Simultaneous", subLabel: "Entire batch starts together", icon: "🏛", bestFor: "GD, Aptitude, Panel" },
    { mode: "BATCH_SEQUENTIAL", tag: "A2", label: "Batch · Sequential", subLabel: "Individual slots within batch", icon: "📋", bestFor: "1-on-1 Technical" },
    { mode: "ALL_SIMULTANEOUS", tag: "B1", label: "All · Simultaneous", subLabel: "Everyone at the same time", icon: "⚡", bestFor: "Online tests, Written" },
    { mode: "ALL_SEQUENTIAL", tag: "B2", label: "All · Sequential", subLabel: "Unique slot for every student", icon: "⏱", bestFor: "HR, Full-batch 1-on-1" },
  ];

const ROUND_TYPE_COLOR: Record<string, string> = {
  APTITUDE: "bg-purple-100 text-purple-700 border-purple-200",
  TECHNICAL: "bg-blue-100 text-blue-700 border-blue-200",
  HR: "bg-pink-100 text-pink-700 border-pink-200",
  GD: "bg-orange-100 text-orange-700 border-orange-200",
  CODING: "bg-teal-100 text-teal-700 border-teal-200",
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT STYLES
// ─────────────────────────────────────────────────────────────────────────────
const FormField: React.FC<{
  label: string;
  children: React.ReactNode;
  className?: string;
}> = ({ label, children, className = "" }) => (
  <div
    className={`rounded-xl border border-gray-100 bg-white p-3 ${className}`}
    style={{ boxShadow: "0 2px 0 #f3f4f6" }}
  >
    <label className="block text-[11px] font-bold uppercase tracking-wide text-black/45 mb-1">
      {label}
    </label>
    <div className="mt-1">{children}</div>
  </div>
);

const SectionBlock: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ title, icon, children, className = "grid grid-cols-1 gap-3 md:grid-cols-3" }) => (
  <div
    className="rounded-2xl border border-gray-100 bg-gradient-to-b from-white to-slate-50/80 p-4 md:p-5"
    style={{ boxShadow: "0 3px 0 #e5e7eb" }}
  >
    <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-[0_3px_0_rgba(0,0,0,0.2)]">
        {icon}
      </div>
      <h3 className="text-sm font-bold text-black">{title}</h3>
    </div>
    <div className={className}>{children}</div>
  </div>
);

const StatBadge: React.FC<{ value: string | number; label: string; color: string }> = ({ value, label, color }) => (
  <div
    className={`flex-1 rounded-xl border px-4 py-3 text-center ${color}`}
    style={{ boxShadow: "0 2px 0 #f3f4f6" }}
  >
    <div className="text-xl font-black leading-tight">{value}</div>
    <div className="text-[10px] font-semibold uppercase tracking-wider opacity-70 mt-0.5">{label}</div>
  </div>
);

const inputCls = "w-full bg-transparent border-0 p-0 text-sm font-semibold text-black focus:ring-0 outline-none focus:outline-none placeholder:text-gray-300 disabled:text-gray-400";

const ScheduleWizardPage: React.FC<Props> = ({
  onClose,
  onConfirm,
  initialDriveId,
  initialRoundId,
  existingSchedule,
}) => {
  // Determine if this is edit mode
  const isEditMode = Boolean(existingSchedule);
  const navigate = useNavigate();

  // ── Form state ────────────────────────────────────────────────────────────
  const [driveId, setDriveId] = useState<number | "">(existingSchedule?.drive_id ?? initialDriveId ?? "");
  const [roundId, setRoundId] = useState<number | "">(existingSchedule?.round_id ?? initialRoundId ?? "");
  const [mode, setMode] = useState<SchedulingMode>(existingSchedule?.scheduling_mode ?? "ALL_SEQUENTIAL");
  const [batchSize, setBatchSize] = useState<number>(existingSchedule?.batch_size ?? 10);
  const [duration, setDuration] = useState<number>(30);
  const [startDate, setStartDate] = useState<string>(existingSchedule?.start_date ?? "");
  const [dayStartTime, setDayStartTime] = useState<string>(existingSchedule?.day_start_time ?? "09:00");
  const [dayEndTime, setDayEndTime]     = useState<string>(existingSchedule?.day_end_time   ?? "17:00");
  const [venueType, setVenueType] = useState<VenueType>(existingSchedule?.venue_type ?? "PHYSICAL");
  const [venueDetails, setVenueDetails] = useState<string>(existingSchedule?.venue_details ?? "");
  const [meetingLink, setMeetingLink] = useState<string>(existingSchedule?.meeting_link ?? "");
  const [interviewers, setInterviewers] = useState<string>(existingSchedule?.interviewer_names ?? "");
  

  // ── Interviewer selection helpers ─────────────────────────────────────────
  const selectedIvs = useMemo(() => {
    if (!interviewers.trim()) return [];
    return interviewers.split(",").map(s => s.trim()).filter(Boolean);
  }, [interviewers]);

  const handleSelectInterviewer = useCallback((name: string) => {
    if (!name) return;
    if (selectedIvs.includes(name)) return;
    const next = [...selectedIvs, name].join(", ");
    setInterviewers(next);
  }, [selectedIvs]);

  const handleRemoveInterviewer = useCallback((name: string) => {
    const next = selectedIvs.filter(n => n !== name).join(", ");
    setInterviewers(next);
  }, [selectedIvs]);

  // ── API-loaded data ───────────────────────────────────────────────────────
  const [metaDrives, setMetaDrives] = useState<MetaResponse["drives"]>([]);
  const [eligibleStudents, setEligibleStudents] = useState<EligibleStudent[]>([]);
  const [holidays, setHolidays] = useState<OrgHoliday[]>([]);
  const [interviewerList, setInterviewerList] = useState<Array<{ interviewer_id: number; name: string; email: string }>>([]);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // ── Derived / computed state ──────────────────────────────────────────────
  const [roundMeta, setRoundMeta] = useState<RoundScheduleMeta | null>(null);
  const [roundError, setRoundError] = useState<string | null>(null);
  const [preview, setPreview] = useState<SchedulePreviewResult | null>(null);
  const [previewErr, setPreviewErr] = useState<string | null>(null);

  // ── Save state ────────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [countUp, setCountUp] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isBatchMode = mode === "BATCH_SIMULTANEOUS" || mode === "BATCH_SEQUENTIAL";

  const selectedDrive = useMemo(
    () => metaDrives.find(d => d.drive_id === Number(driveId)) ?? null,
    [driveId, metaDrives]
  );

  const availableRounds = useMemo(
    () => selectedDrive?.rounds ?? [],
    [selectedDrive]
  );

  const holidayDates = holidays.map(h => h.holiday_date);

  // ── Load meta + holidays on mount ─────────────────────────────────────────
  useEffect(() => {
    const fetchMeta = async () => {
      setLoadingMeta(true);
      const meta = await interviewService.getMeta();
      setMetaDrives(meta?.drives ?? []);
      setLoadingMeta(false);
    };
    const fetchHolidays = async () => {
      const h = await interviewService.getHolidays();
      setHolidays(h?.holidays ?? []);
    };
    fetchMeta();
    fetchHolidays();
  }, []);

  // Fetch company contacts as interviewers when selectedDrive changes
  useEffect(() => {
    if (!selectedDrive) {
      setInterviewerList([]);
      return;
    }
    const fetchContacts = async () => {
      const res = await interviewService.getCompanyContacts(selectedDrive.company_id);
      if (res) {
        const mapped = res.map(c => ({
          interviewer_id: c.contact_id,
          name: `${c.first_name || ""} ${c.last_name || ""}`.trim(),
          email: c.email || "",
        }));
        setInterviewerList(mapped);
      } else {
        setInterviewerList([]);
      }
    };
    fetchContacts();
  }, [selectedDrive]);

  // Reset round when drive changes if not matching initial
  useEffect(() => {
    if (driveId !== initialDriveId) {
      setRoundId("");
    }
    setRoundMeta(null);
    setRoundError(null);
    setPreview(null);
    setEligibleStudents([]);
  }, [driveId, initialDriveId]);

  // ── Fetch eligible students when round is selected ───────────────────────
  useEffect(() => {
    if (!driveId || !roundId) {
      setRoundMeta(null);
      setRoundError(null);
      setEligibleStudents([]);
      return;
    }

    const fetchStudentsForRound = async () => {
      setLoadingStudents(true);
      setRoundError(null);

      // Find selected round details from metaDrives
      const drive = metaDrives.find(d => d.drive_id === Number(driveId));
      const round = drive?.rounds.find(r => r.round_id === Number(roundId));

      if (!round) {
        setRoundError("Selected round not found in drive.");
        setLoadingStudents(false);
        return;
      }

      // Build roundMeta object
      const meta: RoundScheduleMeta = {
        round_id: round.round_id,
        round_name: round.round_name,
        round_number: round.round_number,
        round_type: round.round_type,
        duration_minutes: round.duration_minutes,
        shortlisted_count: 0, // Will update after fetching students
        interview_mode: "PHYSICAL",
        drive_date: round.round_date ?? new Date().toISOString().slice(0, 10),
      };

      // Pre-fill duration and start date from round metadata
      setDuration(round.duration_minutes);
      if (round.round_date) {
        setStartDate(round.round_date);
      }

      // Fetch eligible students or existing schedule students
      try {
        // In edit mode, fetch the schedule details to get the students already scheduled
        if (isEditMode && existingSchedule) {
          const scheduleDetail = await interviewService.getScheduleDetail(existingSchedule.schedule_id);

          if (scheduleDetail && scheduleDetail.slots) {
            // Convert slots to eligible students format
            const studentsFromSlots: EligibleStudent[] = scheduleDetail.slots.map(slot => ({
              application_id: slot.application_id,
              student_id: slot.student_id,
              student_name: slot.student_name,
              usno: slot.usno,
              email: slot.email ?? "",
              mobile: "",  // Slots don't have mobile, use empty string
              branch: slot.branch ?? "",
              cgpa: slot.cgpa ?? 0,
              backlogs: 0,
            }));
            setEligibleStudents(studentsFromSlots);
            meta.shortlisted_count = studentsFromSlots.length;
            setRoundMeta(meta);
          } else {
            setRoundError("Failed to load existing schedule students.");
            setEligibleStudents([]);
            setRoundMeta(meta);
          }
        } else {
          // Normal create mode - fetch eligible students
          const res = await interviewService.getEligibleStudents(
            Number(driveId),
            Number(roundId)
          );

          if (!res) {
            setRoundError("Failed to fetch eligible students.");
            setEligibleStudents([]);
            setRoundMeta(meta);
            setLoadingStudents(false);
            return;
          }

          const students = res.students ?? [];
          setEligibleStudents(students);

          // Update meta with actual count
          meta.shortlisted_count = res.total ?? students.length;
          setRoundMeta(meta);

          if (students.length === 0) {
            setRoundError(
              round.round_number > 1
                ? `No students passed Round ${round.round_number - 1} yet.`
                : "No shortlisted students found for this round."
            );
          }
        }
      } catch (err) {
        setRoundError("Error fetching students.");
        setEligibleStudents([]);
        setRoundMeta(meta);
      }

      setLoadingStudents(false);
    };

    // Only fetch if metaDrives has loaded
    if (metaDrives.length > 0) {
      fetchStudentsForRound();
    }
  }, [driveId, roundId, metaDrives]);

  // ── Validation ────────────────────────────────────────────────────────────
  const formError = useMemo((): string | null => {
    if (!driveId) return "Select a placement drive.";
    if (!roundId) return "Select a round.";
    if (roundError) return roundError;
    if (duration < 5) return "Duration must be at least 5 minutes.";
    if (isBatchMode && batchSize < 1) return "Batch size must be at least 1.";
    if (!startDate) return "Select a start date.";
    if (venueType === "VIRTUAL" && !meetingLink.trim()) return "Meeting link is required for Virtual.";
    // Validate day hours
    const startMins = parseInt(dayStartTime.replace(":", ""), 10);
    const endMins   = parseInt(dayEndTime.replace(":", ""), 10);
    if (endMins <= startMins) return "Day End Time must be after Day Start Time.";
    const durationInHours = (endMins - startMins) / 100;
    if (durationInHours < 0.5) return "Day window must be at least 30 minutes.";
    return null;
  }, [driveId, roundId, roundError, duration, isBatchMode, batchSize, startDate, venueType, meetingLink, dayStartTime, dayEndTime]);

  // ── Generate Preview ──────────────────────────────────────────────────────
  const handleGeneratePreview = useCallback(() => {
    if (formError || !roundId || !driveId) { setPreviewErr(formError); return; }
    setPreviewErr(null);
    if (eligibleStudents.length === 0) { setPreviewErr("No eligible students for this round."); return; }
    const config: ScheduleConfig = {
      drive_id: Number(driveId),
      round_id: Number(roundId),
      mode,
      batch_size: isBatchMode ? batchSize : undefined,
      duration_minutes: duration,
      start_date: startDate,
      venue_type: venueType,
      venue_details: venueDetails || undefined,
      meeting_link: meetingLink || undefined,
      day_start_time: dayStartTime,
      day_end_time:   dayEndTime,
    };
    const result = generatePreview(config, eligibleStudents, holidays);
    setPreview(result);
  }, [formError, roundId, driveId, mode, isBatchMode, batchSize, duration, startDate, venueType, venueDetails, meetingLink, dayStartTime, dayEndTime, holidays, eligibleStudents]);

  // ── Confirm & Save → calls real backend API ───────────────────────────────
  const handleConfirm = async () => {
    if (!preview || !selectedDrive || !roundMeta) return;
    setSaving(true);
    setCountUp(0);

    // Counting animation while API call runs
    let count = 0;
    timerRef.current = setInterval(() => {
      count += Math.ceil(preview.total_slots / 12);
      if (count >= preview.total_slots) {
        count = preview.total_slots;
        clearInterval(timerRef.current!);
      }
      setCountUp(count);
    }, 45);

    const lastDay = preview.days[preview.days.length - 1];

    // Build slot payload from preview (what scheduleEngine computed)
    const allPreviewSlots = preview.days.flatMap(day =>
      [...day.am_slots, ...day.pm_slots]
    );

    // List of interviewers to assign (either user-selected or full list as fallback)
    const ivsToAssign = selectedIvs.length > 0
      ? selectedIvs.map(name => {
        const found = interviewerList.find(iv => iv.name === name);
        return { name, email: found ? found.email : "", interviewer_id: found ? found.interviewer_id : null };
      })
      : interviewerList.map(iv => ({ name: iv.name, email: iv.email, interviewer_id: iv.interviewer_id }));

    let slotCounter = 0;
    const slotsPayload = allPreviewSlots.flatMap(pSlot =>
      pSlot.students.map(student => {
        const assignedIv = ivsToAssign.length > 0
          ? ivsToAssign[slotCounter % ivsToAssign.length]
          : { name: null, email: null, interviewer_id: null };
        slotCounter++;
        return {
          application_id: student.application_id,
          slot_time: `${pSlot.slot_date} ${pSlot.start_time}`,
          batch_number: pSlot.batch_number ?? null,
          seq_number: student.seq_number ?? null,
          interviewer_name: assignedIv.name,
          interviewer_email: assignedIv.email,
          interviewer_id: assignedIv.interviewer_id,
          student_id: student.student_id ?? null,
          contact_id: assignedIv.interviewer_id,
        };
      })
    );

    const selectedIvEmails = selectedIvs
      .map(name => {
        const found = interviewerList.find(iv => iv.name === name);
        return found ? found.email : "";
      })
      .filter(Boolean)
      .join(", ");

    const payload = {
      schedule_id: isEditMode && existingSchedule ? existingSchedule.schedule_id : undefined,
      drive_id: Number(driveId),
      round_id: Number(roundId),
      venue_type: venueType,
      venue_details: venueDetails || null,
      meeting_link: meetingLink || null,
      scheduling_mode: mode,
      batch_size: isBatchMode ? batchSize : null,
      duration_minutes: duration,
      total_students: preview.total_students,
      total_slots: preview.total_slots,
      days_required: preview.days_required,
      start_date: preview.days[0]?.date ?? startDate,
      end_date: lastDay?.date ?? startDate,
      interviewer_names: interviewers.trim() || null,
      interviewer_email: selectedIvEmails.trim() || null,
      slots: slotsPayload,
    };

    const response = await interviewService.saveSchedule(payload, isEditMode);

    clearInterval(timerRef.current!);
    setCountUp(preview.total_slots);
    setSaving(false);

    if (!response.success || !response.data) {
      const errMsg = response.error ?? "Failed to save schedule. Please try again.";
      toast.error(errMsg);
      setPreviewErr(errMsg);
      return;
    }

    const savedData = response.data;

    // Build ConfirmedScheduleRecord for parent page
    const record: ConfirmedScheduleRecord = {
      schedule_id: savedData.schedule_id,
      drive_id: Number(driveId),
      drive_name: selectedDrive.drive_name,
      company_name: selectedDrive.company_name,
      round_id: Number(roundId),
      round_name: roundMeta.round_name,
      round_number: roundMeta.round_number,
      round_type: roundMeta.round_type,
      scheduling_mode: mode,
      total_students: preview.total_students,
      total_slots: preview.total_slots,
      days_required: preview.days_required,
      start_date: preview.days[0]?.date ?? startDate,
      end_date: lastDay?.date ?? startDate,
      venue_type: venueType,
      venue_details: venueDetails || null,
      meeting_link: meetingLink || null,
      interviewer_names: interviewers.trim() || null,
      created_at: new Date().toISOString(),
      is_active: 1,
      day_start_time: dayStartTime,
      day_end_time:   dayEndTime,
    };

    toast.success(`Schedule ${isEditMode ? "updated" : "saved"}! ${savedData.total_slots_saved} slots ${isEditMode ? "updated" : "created"}.`);
    onConfirm(record);
  };

  return (
    <div className="space-y-5" style={{ fontFamily: "'Roboto', sans-serif" }}>
      <style>{`
        .swp-font, .swp-font * {
          font-family: 'Roboto', sans-serif;
        }
      `}</style>

      {/* Hero Header Card */}
      <div
        className="rounded-2xl border border-white bg-white p-5 shadow-[0_3px_0_#e5e7eb]"
        style={{
          boxShadow:
            "0 1px 0 rgba(255,255,255,0.9) inset, 0 12px 28px -12px rgba(0,0,0,0.12), 0 3px 0 #e5e7eb",
        }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white hover:bg-slate-800 shadow-[0_3px_0_rgba(0,0,0,0.2)] transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h2 className="text-xl font-black tracking-tight text-black">
                {isEditMode ? "Edit Round Schedule" : "Create Round Schedule"}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-black/50">
                <Calendar className="h-3.5 w-3.5" />
                Configure scheduling parameters, auto-allocate slots, and dispatch invites.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {preview ? "Preview Mode" : "Setup Mode"}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4 swp-font">
        {/* SECTION 1: Placement Drive & Round Selection */}
        <SectionBlock title="Drive & Round Details" icon={<Building2 className="h-4 w-4" />}>
          <FormField label="Placement Drive *" className="md:col-span-3">
            <select
              className={inputCls}
              value={driveId}
              onChange={e => setDriveId(Number(e.target.value) || "")}
            >
              <option value="">— Select active drive —</option>
              {loadingMeta ? (
                <option disabled>Loading drives...</option>
              ) : metaDrives.map(d => (
                <option key={d.drive_id} value={d.drive_id}>
                  {d.drive_name} · {d.company_name}
                </option>
              ))}
            </select>
          </FormField>

          {selectedDrive && (
            <div className="md:col-span-3 space-y-2 mt-2">
              <label className="block text-[11px] font-bold uppercase tracking-wide text-black/45">
                Rounds List (Select round)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {availableRounds.map(r => {
                  const isSelected = Number(roundId) === r.round_id;
                  // Show shortlisted count from roundMeta when this round is selected
                  // In edit mode, if the count is 0, show the existing schedule's total_students instead
                  let displayCount = isSelected ? roundMeta?.shortlisted_count : null;
                  if (isEditMode && isSelected && displayCount === 0 && existingSchedule) {
                    displayCount = existingSchedule.total_students;
                  }

                  return (
                    <button
                      key={r.round_id}
                      type="button"
                      onClick={() => setRoundId(r.round_id)}
                      className={`w-full flex flex-col justify-between p-4 rounded-xl border text-left transition-all ${isSelected
                          ? "border-indigo-500 bg-indigo-50/50 shadow-sm"
                          : "border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/20"
                        }`}
                      style={{ boxShadow: isSelected ? "0 2px 0 #c7d2fe" : "0 2px 0 #f3f4f6" }}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${isSelected ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700"
                          }`}>
                          R{r.round_number}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${ROUND_TYPE_COLOR[r.round_type] ?? "bg-gray-50 border-gray-200 text-gray-500"}`}>
                          {r.round_type}
                        </span>
                      </div>
                      <div className="mt-4">
                        <div className={`text-sm font-bold truncate ${isSelected ? "text-indigo-900" : "text-gray-900"}`}>
                          {r.round_name}
                        </div>
                        {isSelected && loadingStudents ? (
                          <div className="text-[10px] text-gray-400 mt-1 animate-pulse">Loading students...</div>
                        ) : displayCount != null ? (
                          <div className="text-[10px] text-indigo-600 font-bold mt-1">
                            {displayCount} students {isEditMode && displayCount === existingSchedule?.total_students ? "scheduled" : "eligible"}
                          </div>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
              {roundError && (
                <div className="md:col-span-3 mt-4 p-4 bg-amber-50 border border-amber-250 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-800 shadow-[0_2px_8px_rgba(245,158,11,0.04)] text-left">
                  <div className="flex items-start gap-2.5">
                    <span className="text-sm">⚠️</span>
                    <div>
                      <strong className="font-bold text-amber-900">Incomplete Previous Round Results</strong>
                      <p className="text-[11px] text-amber-700 mt-1 leading-relaxed">
                        {roundError} To schedule interviews for this round, all student results from the previous round must be fully recorded first.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigate("/placement/plm/round-results");
                    }}
                    className="shrink-0 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-xl text-[11px] font-bold shadow-sm transition cursor-pointer"
                  >
                    Go to Results Page →
                  </button>
                </div>
              )}
            </div>
          )}
        </SectionBlock>

        {/* SECTION 2: Scheduling Parameters */}
        <SectionBlock title="Scheduling Parameters" icon={<Settings className="h-4 w-4" />}>

          {/* Scheduling Mode Options */}
          <div className="md:col-span-3 space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-wide text-black/45">
              Scheduling Mode *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {MODE_OPTIONS.map(opt => {
                const isSelected = mode === opt.mode;
                return (
                  <button
                    key={opt.mode}
                    type="button"
                    onClick={() => { setMode(opt.mode); setPreview(null); }}
                    className={`flex flex-col items-start gap-1 p-3.5 rounded-xl border-2 text-left transition-all ${isSelected
                        ? "border-indigo-500 bg-indigo-50/30"
                        : "border-gray-200 bg-white hover:border-indigo-300"
                      }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-lg leading-none">{opt.icon}</span>
                      <span className={`text-[9px] font-black tracking-wider px-1.5 py-0.5 rounded ${isSelected ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-500"
                        }`}>
                        {opt.tag}
                      </span>
                    </div>
                    <div className={`text-xs font-bold mt-2 ${isSelected ? "text-indigo-800" : "text-gray-800"}`}>
                      {opt.label}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1 leading-snug">{opt.subLabel}</div>
                    <div className="text-[9px] text-gray-400 mt-2 font-medium">
                      Best for: <span className="text-gray-600">{opt.bestFor}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form inputs */}
          <FormField label="Duration / Slot (minutes) *">
            <input
              type="number"
              min={5}
              max={480}
              className={inputCls}
              value={duration}
              onChange={e => { setDuration(Number(e.target.value)); setPreview(null); }}
            />
          </FormField>

          {isBatchMode && (
            <FormField label="Students per Batch *">
              <input
                type="number"
                min={1}
                max={200}
                className={inputCls}
                value={batchSize}
                onChange={e => { setBatchSize(Number(e.target.value)); setPreview(null); }}
              />
            </FormField>
          )}

          {/* Day working hours — Start & End */}
          <FormField label="Day Start Time *">
            <div className="flex flex-col gap-0.5">
              <input
                type="time"
                className={inputCls}
                value={dayStartTime}
                onChange={e => { setDayStartTime(e.target.value); setPreview(null); }}
              />
              <span className="text-[10px] text-gray-400">
                Interviews can't start before this time
              </span>
            </div>
          </FormField>

          <FormField label="Day End Time *">
            <div className="flex flex-col gap-0.5">
              <input
                type="time"
                className={inputCls}
                value={dayEndTime}
                onChange={e => { setDayEndTime(e.target.value); setPreview(null); }}
              />
              <span className="text-[10px] text-gray-400">
                Slots after this time push to next day
              </span>
            </div>
          </FormField>

          {/* Lunch break reminder banner */}
          <div className="md:col-span-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-100 text-[11px] text-amber-700 font-semibold">
            <span>🍽</span>
            <span>Lunch break <strong>13:00–14:00</strong> is automatically excluded from slot allocation.</span>
          </div>

          <FormField label="Start Date *">
            <input
              type="date"
              className={inputCls}
              value={startDate}
              min={new Date().toISOString().slice(0, 10)}
              onChange={e => { setStartDate(e.target.value); setPreview(null); }}
            />
          </FormField>

          <FormField label="Venue Type *">
            <div className="flex gap-2">
              {(["PHYSICAL", "VIRTUAL"] as VenueType[]).map(v => (
                <label
                  key={v}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-all ${venueType === v
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300 bg-white"
                    }`}
                >
                  <input
                    type="radio"
                    name="vt"
                    value={v}
                    checked={venueType === v}
                    onChange={() => setVenueType(v)}
                    className="sr-only"
                  />
                  {v === "PHYSICAL" ? "🏛 Physical" : "🔗 Virtual"}
                </label>
              ))}
            </div>
          </FormField>

          {venueType === "PHYSICAL" ? (
            <>
              <FormField label="Venue Details (Optional)">
                <input
                  type="text"
                  placeholder="e.g. Seminar Hall A, Block 2"
                  className={inputCls}
                  value={venueDetails}
                  onChange={e => setVenueDetails(e.target.value)}
                />
              </FormField>
              <FormField label="Location URL (Optional)" className="md:col-span-2">
                <input
                  type="url"
                  placeholder="https://maps.google.com/..."
                  className={inputCls}
                  value={meetingLink}
                  onChange={e => setMeetingLink(e.target.value)}
                />
              </FormField>
            </>
          ) : (
            <FormField label="Meeting Link *" className="md:col-span-2">
              <input
                type="url"
                placeholder="https://meet.google.com/..."
                className={inputCls}
                value={meetingLink}
                onChange={e => setMeetingLink(e.target.value)}
              />
            </FormField>
          )}

          <FormField label="Interviewers (Select from list)" className="md:col-span-3">
            <div className="flex flex-col gap-2">
              <select
                className={inputCls}
                onChange={e => {
                  handleSelectInterviewer(e.target.value);
                  e.target.value = ""; // Reset
                }}
                defaultValue=""
              >
                <option value="" disabled>— Select interviewer to add —</option>
                {interviewerList.map(iv => (
                  <option key={iv.interviewer_id} value={iv.name}>
                    {iv.name} ({iv.email})
                  </option>
                ))}
              </select>

              {selectedIvs.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2 pt-1.5 border-t border-dashed border-gray-100">
                  {selectedIvs.map(name => (
                    <span
                      key={name}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-50 border border-indigo-100 text-xs font-bold text-indigo-700"
                    >
                      {name}
                      <button
                        type="button"
                        onClick={() => handleRemoveInterviewer(name)}
                        className="w-3.5 h-3.5 rounded-full hover:bg-indigo-100 flex items-center justify-center text-[10px] text-indigo-500 font-extrabold"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </FormField>

          {holidayDates.length > 0 && (
            <div className="md:col-span-3 text-[11px] text-amber-700 font-semibold bg-amber-50 border border-amber-100 p-2.5 rounded-lg flex items-start gap-2">
              <span>⚠</span>
              <span>
                Blocked dates: {holidayDates.join(" · ")} | Weekends are automatically excluded.
              </span>
            </div>
          )}
        </SectionBlock>

        {/* SECTION 3: Preview Details */}
        {preview && (
          <SectionBlock title="Schedule Preview" icon={<Eye className="h-4 w-4" />}>
            <div className="md:col-span-3 flex flex-col sm:flex-row gap-3">
              <StatBadge value={preview.total_students} label="Shortlisted Students" color="border-indigo-100 bg-indigo-50/50 text-indigo-700" />
              <StatBadge value={saving ? countUp : preview.total_slots} label={saving ? "Saving Slots..." : "Generated Slots"} color="border-emerald-100 bg-emerald-50/50 text-emerald-700" />
              <StatBadge value={preview.days_required} label="Days Required" color="border-purple-100 bg-purple-50/50 text-purple-700" />
            </div>

            <div className="md:col-span-3 space-y-4 mt-2">
              <label className="block text-[11px] font-bold uppercase tracking-wide text-black/45">
                Day-by-Day Slot Breakdown Ledger
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {preview.days.map((day, idx) => (
                  <div
                    key={day.date}
                    className="rounded-2xl border border-gray-100 bg-gradient-to-b from-white to-slate-50/60 p-4 shadow-sm"
                    style={{ boxShadow: "0 2px 0 #e5e7eb" }}
                  >
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                      <span className="text-xs font-extrabold text-gray-800 uppercase tracking-wide">
                        {day.day_label}
                      </span>
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                        {day.am_slots.length + day.pm_slots.length} Slots
                      </span>
                    </div>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {[...day.am_slots, ...day.pm_slots].map(slot => (
                        <div
                          key={slot.slot_index}
                          className="flex items-center justify-between p-2 rounded-xl border border-gray-100 bg-white"
                          style={{ boxShadow: "0 1.5px 0 #f3f4f6" }}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${slot.session === "AM" ? "bg-amber-400" : "bg-indigo-400"}`} />
                            <span className="text-[11px] font-bold text-gray-700 tabular-nums">
                              {slot.start_time} – {slot.end_time}
                            </span>
                            {slot.batch_number && (
                              <span className="px-1.5 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded font-bold text-[9px]">
                                Batch {slot.batch_number}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-semibold text-gray-500 truncate max-w-[50%]">
                            {slot.students.length === 1
                              ? slot.students[0].student_name
                              : `${slot.students.length} candidates`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SectionBlock>
        )}

        {previewErr && (
          <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-700 font-semibold shadow-[0_1.5px_0_#fecdd3]">
            <span>⚠</span>
            <span>{previewErr}</span>
          </div>
        )}

        {/* BOTTOM ACTION BAR - registrationDetailModal close-button shadow style */}
        <div className="mt-6 flex justify-between border-t border-gray-100 pt-4">
          <button
            className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-black shadow-[0_3px_0_#d1d5db] transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_0_#9ca3af] active:translate-y-0.5 active:shadow-[0_1px_0_#d1d5db]"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>

          <div className="flex gap-2">
            {!preview ? (
              <button
                className="rounded-xl border border-indigo-700 bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-[0_3px_0_#1d4ed8] transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_0_#1e40af] active:translate-y-0.5 active:shadow-[0_1px_0_#1d4ed8] disabled:opacity-40 disabled:pointer-events-none"
                onClick={handleGeneratePreview}
                disabled={!!formError}
              >
                Generate Preview
              </button>
            ) : (
              <>
                <button
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-black shadow-[0_3px_0_#d1d5db] transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_0_#9ca3af] active:translate-y-0.5 active:shadow-[0_1px_0_#d1d5db]"
                  onClick={() => { setPreview(null); setPreviewErr(null); }}
                  disabled={saving}
                >
                  ← Modify Parameters
                </button>
                <button
                  className="rounded-xl border border-emerald-700 bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-[0_3px_0_#047857] transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_0_#065f46] active:translate-y-0.5 active:shadow-[0_1px_0_#047857] disabled:opacity-50"
                  onClick={handleConfirm}
                  disabled={saving}
                >
                  {saving
                    ? `Saving ${countUp} slots...`
                    : "✓ Confirm & Save Schedule"
                  }
                </button>
              </>
            )}
          </div>
        </div>
      </div>


    </div>
  );
};

export default ScheduleWizardPage;
