import React, { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "react-toastify";
import { MapPin, Chrome, Globe, Phone, Heart, Building, Calendar, Edit2, Bell } from "lucide-react";
import ScheduleWizardPage from "./ScheduleWizardPage";
import * as XLSX from "xlsx";
import {
  ConfirmedScheduleRecord,
  EligibleStudent,
  InterviewSlot,
  OrgHoliday,
} from "./interviewTypes";
import * as interviewService from "./interviewService";
import type { MetaResponse } from "./interviewService";
import DataTable from "../../../../components/Table/DataTable";

// ─── Local types from API response ───────────────────────────────────────────
type ApiDrive = MetaResponse["drives"][number];
type ApiRound = MetaResponse["drives"][number]["rounds"][number];

// Helper: days remaining
const getDaysUntil = (dateStr: string): number => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr); target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

// ─────────────────────────────────────────────────────────────────────────────
// GLOBE ICON COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
interface GlobeIconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}

const GlobeIcon: React.FC<GlobeIconProps> = ({
  size = 64,
  color = "#000000",
  strokeWidth = 1.5,
  className = ""
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Outer Boundary Circle */}
      <circle cx="12" cy="12" r="10" />

      {/* Center Vertical Line (Prime Meridian) */}
      <line x1="12" y1="2" x2="12" y2="22" />

      {/* Center Horizontal Line (Equator) */}
      <line x1="2" y1="12" x2="22" y2="12" />

      {/* Top Horizontal Line (Latitude) */}
      <line x1="4.3" y1="7" x2="19.7" y2="7" />

      {/* Bottom Horizontal Line (Latitude) */}
      <line x1="4.3" y1="17" x2="19.7" y2="17" />

      {/* Right Curved Vertical Line (Longitude) */}
      <path d="M12 2 A 4.5 10 0 0 1 12 22" />

      {/* Left Curved Vertical Line (Longitude) */}
      <path d="M12 2 A 4.5 10 0 0 0 12 22" />
    </svg>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT AVATAR GROUP COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
interface StudentAvatarGroupProps {
  totalStudents: number;
  slotsAvailable: number;
}

const StudentAvatarGroup: React.FC<StudentAvatarGroupProps> = ({ 
  totalStudents, 
  slotsAvailable 
}) => {
  const remainingCount = Math.max(0, totalStudents - 2);

  return (
    <div className="flex items-center gap-3 px-1 flex-shrink-0">
      {/* Avatar Stack */}
      <div className="flex -space-x-2 flex-shrink-0">
        
        {/* Avatar 1: Student with Graduation Cap */}
        <div className="relative inline-flex h-10 w-10 flex-shrink-0 items-end justify-center rounded-full ring-2 ring-white bg-gradient-to-b from-[#87a3c7] to-[#5b789e] overflow-hidden">
          <svg viewBox="0 0 64 64" className="w-full h-full absolute bottom-[-3px]" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Shoulders */}
            <path d="M12 60C12 48 20 42 32 42C44 42 52 48 52 60" fill="#354a69" />
            {/* Blank Face */}
            <path d="M22 30C22 38 26.5 44 32 44C37.5 44 42 38 42 30V24C42 18.5 37.5 16 32 16C26.5 16 22 18.5 22 24V30Z" fill="#e2e8f0" />
            {/* Graduation Cap */}
            <path d="M32 10L14 18L32 26L50 18L32 10Z" fill="#24344d" />
            <path d="M22 21.5V28C22 31 32 34 32 34C32 34 42 31 42 28V21.5" stroke="#24344d" strokeWidth="2.5" />
            {/* Tassel */}
            <path d="M47 19.5V30" stroke="#24344d" strokeWidth="2" />
            <circle cx="47" cy="31" r="1.5" fill="#24344d" />
          </svg>
        </div>

        {/* Avatar 2: Student Reading Book */}
        <div className="relative inline-flex h-10 w-10 flex-shrink-0 items-end justify-center rounded-full ring-2 ring-white bg-gradient-to-b from-[#e2e8f0] to-[#b0b8c4] overflow-hidden">
          <svg viewBox="0 0 64 64" className="w-full h-full absolute bottom-[-3px]" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Shoulders */}
            <path d="M14 60C14 46 22 40 32 40C42 40 50 46 50 60" fill="#8f99a8" />
            {/* Blank Face */}
            <path d="M24 28C24 35 27.5 40 32 40C36.5 40 40 35 40 28V22C40 17 36.5 15 32 15C27.5 15 24 17 24 22V28Z" fill="#ffffff" />
            {/* Book */}
            <path d="M16 54L32 48L48 54V64H16V54Z" fill="#475569" />
            <path d="M32 48V64" stroke="#94a3b8" strokeWidth="1.5" />
            <path d="M18 52L31 49" stroke="#94a3b8" strokeWidth="1.5" />
            <path d="M46 52L33 49" stroke="#94a3b8" strokeWidth="1.5" />
          </svg>
        </div>

        {/* Avatar 3: Remaining Count Bubble */}
        <div className="relative inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#eef2f6] ring-2 ring-white z-10">
          <span className="text-[14px] font-bold text-[#1e293b]">+{remainingCount}</span>
        </div>

      </div>

      {/* Text Data */}
      <div className="flex flex-col justify-center ml-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xl font-extrabold text-[#1e293b] leading-none">{totalStudents}</span>
          <span className="text-[9px] font-bold text-[#64748b] tracking-widest uppercase mt-0.5">Total</span>
        </div>
        <div className="text-[11px] font-bold text-[#059669] mt-0.5">
          {slotsAvailable} Slots Available
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SCHEDULE CARD (zero changes — same as before)
// ─────────────────────────────────────────────────────────────────────────────
const ScheduleCard: React.FC<{
  schedule: ConfirmedScheduleRecord;
  onEdit: () => void;
  onNotify: () => void;
  isNotified: boolean;
  onShowAlreadySent: (sentAt: string | null) => void;
}> = ({ schedule, onEdit, onNotify, isNotified, onShowAlreadySent }) => {
  const formattedDate = useMemo(() => {
    if (!schedule.start_date) return "—";
    return new Date(schedule.start_date).toLocaleDateString("en-IN", {
      weekday: "short", day: "numeric", month: "long", year: "numeric",
    });
  }, [schedule.start_date]);

  const daysUntil = useMemo(() =>
    schedule.start_date ? getDaysUntil(schedule.start_date) : null
    , [schedule.start_date]);

  const countdownLabel = useMemo(() => {
    if (daysUntil === null) return null;
    if (daysUntil < 0) return { text: `${Math.abs(daysUntil)}d ago`, color: "text-gray-400" };
    if (daysUntil === 0) return { text: "Today!", color: "text-emerald-400" };
    if (daysUntil === 1) return { text: "Tomorrow", color: "text-amber-400" };
    return { text: `In ${daysUntil} days`, color: "text-sky-300" };
  }, [daysUntil]);

  const copyLink = () => {
    if (schedule.meeting_link) {
      navigator.clipboard.writeText(schedule.meeting_link);
      toast.success("Meeting link copied!");
    }
  };

  return (
    <div className="max-w-[490px] w-full bg-white rounded-[32px] p-5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.08)] border border-slate-100/80">

      {/* Top Visual Section with Overlays */}
      <div className="relative h-60 w-full rounded-[24px] overflow-hidden bg-[#13153A] shadow-inner">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1e1b4b] via-[#111827] to-[#311042] opacity-90"></div>
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl"></div>
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl"></div>

        {/* Floating Overlay Left: VENUE / HALL */}
        <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10 px-4 py-2.5 rounded-full text-white">
          <MapPin className="text-indigo-400 w-3.5 h-3.5" />
          <div className="flex flex-col text-left">
            <span className="text-[9px] uppercase tracking-wider text-slate-300 font-bold leading-none mb-0.5">
              {schedule.venue_type === "VIRTUAL" ? "Meeting Link" : "Venue / Hall"}
            </span>
            <span className="text-xs font-bold leading-none">
              {schedule.venue_type === "VIRTUAL"
                ? <a href={schedule.meeting_link ?? "#"} target="_blank" rel="noreferrer" className="hover:underline" onClick={e => e.stopPropagation()}>Join Link</a>
                : (schedule.venue_details ?? "TBD")}
            </span>
          </div>
        </div>

        {/* Floating Overlay Right: Functional Icons */}
        <div className="absolute bottom-4 right-4 flex items-center gap-2">
          {schedule.venue_type === "VIRTUAL" ? (
            <button
              title="Join Meeting"
              onClick={(e) => {
                e.stopPropagation();
                if (schedule.meeting_link) {
                  window.open(schedule.meeting_link, "_blank");
                } else {
                  toast.info("No meeting link available");
                }
              }}
              className="text-white hover:text-indigo-300 transition active:scale-95 cursor-pointer focus:outline-none"
            >
              <GlobeIcon size={24} color="#ffffff" strokeWidth={1.8} />
            </button>
          ) : (
            <button
              title="View Location Map"
              onClick={(e) => {
                e.stopPropagation();
                if (schedule.venue_details) {
                  window.open(`https://maps.google.com/?q=${encodeURIComponent(schedule.venue_details)}`, "_blank");
                } else {
                  toast.info("No location details available");
                }
              }}
              className="text-white hover:text-indigo-300 transition active:scale-95 cursor-pointer focus:outline-none"
            >
              <MapPin className="w-6 h-6 text-white" />
            </button>
          )}
        </div>

        {/* Central Content */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <span className="text-xs font-bold text-indigo-300 tracking-wider uppercase bg-indigo-500/20 border border-indigo-400/30 px-2.5 py-1 rounded-md">
            {schedule.company_name} • R{schedule.round_number}
          </span>
          <span className="bg-white/10 backdrop-blur-md border border-white/10 text-white text-[11px] font-bold px-3 py-1 rounded-md uppercase tracking-wider flex items-center gap-1.5">
            {schedule.venue_type === "VIRTUAL" ? <Globe className="w-3 h-3" /> : <Building className="w-3 h-3" />}
            {schedule.venue_type === "VIRTUAL" ? "Virtual" : "Physical"}
          </span>
        </div>

        {/* Date Badge */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none mt-2">
          <div className="bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/10 flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-white">{formattedDate}</p>
              <p className={`text-[11px] font-semibold ${countdownLabel?.color ?? "text-indigo-300"}`}>{countdownLabel?.text ?? ""}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Body */}
      <div className="mt-5 px-1 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">{schedule.round_name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md uppercase tracking-wider border border-indigo-100">
                {schedule.scheduling_mode?.replace("_", " ") ?? "—"}
              </span>
              <span className="text-xs font-medium text-slate-400">Mode</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">{schedule.days_required} day{schedule.days_required !== 1 ? "s" : ""}</span>
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 -mt-0.5">Duration</p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-slate-100 my-5 mx-1"></div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-4 px-1">
        <StudentAvatarGroup 
          totalStudents={schedule.total_students} 
          slotsAvailable={schedule.total_slots} 
        />

        <div className="flex items-center gap-2">
          <button title="Edit Schedule" onClick={(e) => { e.stopPropagation(); onEdit(); }} className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold p-3 rounded-xl transition active:scale-95">
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (isNotified) {
                onShowAlreadySent(schedule.last_notification_sent_at ?? null);
              } else {
                onNotify();
              }
            }}
            className={`flex items-center gap-2 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-md transition-all tracking-wide whitespace-nowrap active:scale-95 ${
              isNotified
                ? "bg-[#0d9488]/60 opacity-60 filter blur-[0.4px] hover:opacity-85 shadow-sm"
                : "bg-[#0d9488] hover:bg-[#0f766e] shadow-teal-600/10 hover:-translate-y-0.5"
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>{isNotified ? "Notification Sent" : "Send Notification"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};


// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
const InterviewSchedulePage: React.FC = () => {
  // ── Selection state ─────────────────────────────────────────────────────────
  const [selectedDrive, setSelectedDrive] = useState<ApiDrive | null>(null);
  const [activeRound, setActiveRound] = useState<ApiRound | null>(null);

  // ── Data state ──────────────────────────────────────────────────────────────
  const [drives, setDrives] = useState<ApiDrive[]>([]);
  const [students, setStudents] = useState<EligibleStudent[]>([]);
  const [confirmedSchedule, setConfirmedSchedule] = useState<ConfirmedScheduleRecord | null>(null);
  const [slots, setSlots] = useState<InterviewSlot[]>([]);
  // scheduleStatus: round_id → "SCHEDULED" | "PENDING"
  const [scheduleStatusMap, setScheduleStatusMap] = useState<Record<number, "SCHEDULED" | "PENDING">>({});
  const [interviewerList, setInterviewerList] = useState<Array<{ interviewer_id: number; name: string; email: string }>>([]);
  const [holidays, setHolidays] = useState<OrgHoliday[]>([]);

  // F4 states
  const [notifiedIds, setNotifiedIds] = useState<Set<number>>(new Set());
  const [alreadySentPopup, setAlreadySentPopup] = useState<{
    visible: boolean;
    sentAt: string | null;
    scheduleName: string;
  } | null>(null);

  const [interviewerConflictPopup, setInterviewerConflictPopup] = useState<{
    interviewerName: string;
    driveName: string;
    slotTime: string;
    onConfirm: () => void;
  } | null>(null);

  // ── UI state ────────────────────────────────────────────────────────────────
  const [showWizard, setShowWizard] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [loadingDrives, setLoadingDrives] = useState(false);
  const [loadingRound, setLoadingRound] = useState(false);
  // Day working-hour boundaries (read from schedule config, editable via wizard)
  const [dayBounds, setDayBounds] = useState<{ start: string; end: string }>({ start: "09:00", end: "17:00" });


  // ── 1. Load drives on mount ──────────────────────────────────────────────────
  useEffect(() => {
    const fetchDrives = async () => {
      setLoadingDrives(true);
      const meta = await interviewService.getMeta();
      if (meta) {
        setDrives(meta.drives);
      } else {
        toast.error("Failed to load placement drives. Please refresh.");
        setDrives([]);
      }
      setLoadingDrives(false);
    };
    const fetchHolidays = async () => {
      const h = await interviewService.getHolidays();
      setHolidays(h?.holidays ?? []);
    };
    fetchDrives();
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

  // ── 2. Load schedule + students when drive/round changes ──────────────────────
  useEffect(() => {
    if (!selectedDrive || !activeRound) {
      setStudents([]);
      setConfirmedSchedule(null);
      setSlots([]);
      return;
    }

    const fetchRoundData = async () => {
      setLoadingRound(true);

      // Load eligible students
      const eligible = await interviewService.getEligibleStudents(
        selectedDrive.drive_id,
        activeRound.round_id
      );
      setStudents(eligible?.students ?? []);

      // Load schedules for this drive → find the one matching this round
      const scheduleList = await interviewService.getScheduleList(selectedDrive.drive_id);
      const allSchedules = scheduleList?.schedules ?? [];

      // Build status map for all rounds (used by round pills)
      const statusMap: Record<number, "SCHEDULED" | "PENDING"> = {};
      allSchedules.forEach(s => {
        statusMap[s.round_id] = "SCHEDULED";
      });
      setScheduleStatusMap(statusMap);

      const matched = allSchedules.find(
        s => s.round_id === activeRound.round_id && s.is_active === 1
      ) ?? null;
      setConfirmedSchedule(matched);

      // Sync day bounds from stored schedule
      if (matched) {
        setDayBounds({
          start: matched.day_start_time ?? "09:00",
          end:   matched.day_end_time   ?? "17:00",
        });
      } else {
        setDayBounds({ start: "09:00", end: "17:00" });
      }

      // Load slots if schedule exists
      if (matched) {
        const detail = await interviewService.getScheduleDetail(matched.schedule_id);
        setSlots(detail?.slots ?? []);
      } else {
        setSlots([]);
      }

      setLoadingRound(false);
    };

    fetchRoundData();
  }, [selectedDrive, activeRound]);

  // ── Select drive → auto-select first round ────────────────────────────────
  const handleSelectDrive = (drive: ApiDrive) => {
    setSelectedDrive(drive);
    setActiveRound(drive.rounds?.[0] ?? null);
  };

  // ── Notify — email integration with confirmation warning ───────────────────
  const handleNotify = async (force: boolean = false) => {
    if (!confirmedSchedule) return;
    setLoadingRound(true);
    try {
      const res = await interviewService.notifySchedule(confirmedSchedule.schedule_id, force);
      if (res) {
        if (res.status === "warning" && res.already_notified && res.already_notified.length > 0) {
          const sample = res.already_notified.slice(0, 3).map(n => `• ${n.student_name} (Sent at: ${n.sent_at})`).join("\n");
          const totalCount = res.already_notified.length;
          const msg = `Notifications have already been sent to ${totalCount} candidate(s) in this round:\n\n${sample}${totalCount > 3 ? "\n...and others" : ""}\n\nDo you want to send notifications again?`;

          if (window.confirm(msg)) {
            // Re-call handleNotify with force=true
            await handleNotify(true);
          }
        } else {
          toast.success(res.message || "Notifications sent successfully!");
          // F4: set notified for this session
          setNotifiedIds(prev => {
            const next = new Set(prev);
            next.add(confirmedSchedule.schedule_id);
            return next;
          });
          // Update local schedule record immediately to show "Sent" status without manual refresh
          setConfirmedSchedule(prev => prev ? {
            ...prev,
            all_notified: true,
            last_notification_sent_at: new Date().toISOString()
          } : null);
        }
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to dispatch notifications.");
    } finally {
      setLoadingRound(false);
    }
  };

  // ── Dispatch Schedule ─────────────────────────────────────────────────────
  const handleDispatchSchedule = async () => {
    if (!confirmedSchedule) return;
    if (window.confirm("Are you sure you want to schedule this round? This will lock the slots and make them available for results.")) {
      const res = await interviewService.dispatchSchedule(confirmedSchedule.schedule_id);
      if (res) {
        toast.success("Round Scheduled Successfully!");
        setConfirmedSchedule(prev => prev ? { ...prev, status: "SCHEDULED" } : prev);
      }
    }
  };

  // ── Save Slots ────────────────────────────────────────────────────────────
  const handleSaveSlots = async () => {
    if (!confirmedSchedule) return;
    setLoadingRound(true);
    try {
      const payload: interviewService.ScheduleSavePayload = {
        schedule_id: confirmedSchedule.schedule_id,
        drive_id: confirmedSchedule.drive_id,
        round_id: confirmedSchedule.round_id,
        venue_type: confirmedSchedule.venue_type,
        venue_details: confirmedSchedule.venue_details ?? null,
        meeting_link: confirmedSchedule.meeting_link ?? null,
        scheduling_mode: confirmedSchedule.scheduling_mode,
        batch_size: confirmedSchedule.batch_size ?? null,
        duration_minutes: activeRound?.duration_minutes ?? 30,
        total_students: confirmedSchedule.total_students,
        total_slots: confirmedSchedule.total_slots,
        days_required: confirmedSchedule.days_required,
        start_date: confirmedSchedule.start_date,
        end_date: confirmedSchedule.end_date,
        interviewer_names: confirmedSchedule.interviewer_names ?? null,
        interviewer_email: confirmedSchedule.interviewer_email ?? null,
        slots: slots.map(sl => ({
          application_id: sl.application_id,
          slot_time: sl.slot_time ?? null,
          batch_number: sl.batch_number ?? null,
          seq_number: sl.seq_number ?? null,
          interviewer_name: sl.interviewer_name ?? null,
          interviewer_email: sl.interviewer_email ?? null,
          student_id: sl.student_id ?? null,
          interviewer_id: sl.interviewer_id ?? null,
          contact_id: sl.contact_id ?? null,
        })),
      };
      const res = await interviewService.saveSchedule(payload, true);
      if (res.success) {
        toast.success("Interview slots and interviewers saved successfully!");
      } else {
        const errMsg = res.error ?? "Failed to save slots.";
        toast.error(errMsg);
      }
    } catch (e: any) {
      toast.error(e.message || "Error saving slots.");
    } finally {
      setLoadingRound(false);
    }
  };
  // ── Inline slot update helpers ─────────────────────────────────────────────
  const timeToMins = (hhmm: string): number => {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
  };

  const minsToTime = (totalMins: number): string => {
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  const parseDate = (s: string): Date => {
    const [y, mo, d] = s.split("-").map(Number);
    return new Date(y, mo - 1, d);
  };

  const fmtDate = (d: Date): string =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const isWeekend = (d: Date): boolean => d.getDay() === 0 || d.getDay() === 6;

  // Skip only holidays — weekends are valid working days
  const getNextWorkingDay = (dateStr: string, blocked: Set<string>): string => {
    const cursor = parseDate(dateStr);
    do {
      cursor.setDate(cursor.getDate() + 1);
    } while (blocked.has(fmtDate(cursor)));
    return fmtDate(cursor);
  };

  // ── Inline slot update (display only — data comes from schedule detail) ───
  // NOTE: Slot updates go through the wizard re-confirm (PUT /schedule/save) or the "Save Slots" button.
  const handleUpdateSlot = useCallback((
    applicationId: number,
    dateStr: string,
    timeStr: string,
    ivName?: string,
    ivEmail?: string,
    ivId?: number | null
  ) => {
    if (!confirmedSchedule) return;

    // Resolve working-hour bounds for this schedule
    const workStart = dayBounds.start; // "HH:MM"
    const workEnd   = dayBounds.end;   // "HH:MM"
    const workStartMins = timeToMins(workStart);
    const workEndMins   = timeToMins(workEnd);
    const slotTimeMins  = timeToMins(timeStr);

    // ── BEFORE START → warn and reject ────────────────────────────────────
    if (slotTimeMins < workStartMins) {
      toast.warn(
        `⚠ Time ${timeStr} is before the scheduled day start (${workStart}). Please choose a time within the working hours.`,
        { autoClose: 4000 }
      );
      return; // Do NOT apply the change
    }

    // ── AFTER OR AT END → push to next working day at workStart ───────────
    let resolvedDate = dateStr;
    let resolvedTime = timeStr;
    if (slotTimeMins >= workEndMins) {
      const holidayDatesForPush = new Set(holidays.map(h => h.holiday_date));
      resolvedDate = getNextWorkingDay(dateStr, holidayDatesForPush);
      resolvedTime = workStart;
      toast.info(
        `⏭ Time ${timeStr} is at or after day end (${workEnd}). Slot moved to ${resolvedDate} at ${resolvedTime}.`,
        { autoClose: 4000 }
      );
    }

    setSlots(prev => {
      const existingIdx = prev.findIndex(
        sl => sl.schedule_id === confirmedSchedule.schedule_id && sl.application_id === applicationId
      );
      if (existingIdx < 0) return prev;

      const duration = activeRound?.duration_minutes ?? 30;
      const holidayDates = new Set(holidays.map(h => h.holiday_date));
      const next = [...prev];
      const originalSlot = prev[existingIdx];

      const originalTime = originalSlot.slot_time || "";
      const newTime = `${resolvedDate} ${resolvedTime}`;
      const isTimeOrDateChanged = originalTime !== newTime;

      // Update the target slot
      next[existingIdx] = {
        ...originalSlot,
        slot_time: newTime,
        interviewer_name:  ivName  !== undefined ? ivName  : originalSlot.interviewer_name,
        interviewer_email: ivEmail !== undefined ? ivEmail : originalSlot.interviewer_email,
        interviewer_id:    ivId    !== undefined ? ivId    : originalSlot.interviewer_id,
        contact_id:        ivId    !== undefined ? ivId    : originalSlot.contact_id,
      };

      // Cascade ripple time updates to all following slots
      if (isTimeOrDateChanged) {
        let currentDate = resolvedDate;
        let currentMins = timeToMins(resolvedTime);

        for (let i = existingIdx + 1; i < next.length; i++) {
          currentMins += duration;

          // Skip lunch hour (13:00–14:00)
          if (currentMins >= 13 * 60 && currentMins < 14 * 60) {
            currentMins = 14 * 60;
          }

          // Roll to next working day (holiday-only block) when past workEnd
          if (currentMins + duration > workEndMins) {
            currentMins = workStartMins;
            currentDate = getNextWorkingDay(currentDate, holidayDates);
          }

          next[i] = {
            ...next[i],
            slot_time: `${currentDate} ${minsToTime(currentMins)}`,
          };
        }
      }

      return next;
    });
  }, [confirmedSchedule, activeRound, holidays, dayBounds]);

  // ── After wizard confirms → refresh from API ──────────────────────────────
  const handleWizardConfirm = async (record: ConfirmedScheduleRecord) => {
    setShowWizard(false);
    const isEditing = Boolean(confirmedSchedule);
    toast.success(isEditing ? "Schedule updated successfully!" : "Schedule created successfully!");
    // Sync day bounds from new record
    setDayBounds({
      start: record.day_start_time ?? "09:00",
      end:   record.day_end_time   ?? "17:00",
    });
    // Reload everything fresh from API
    if (!selectedDrive || !activeRound) return;
    setLoadingRound(true);
    const eligible = await interviewService.getEligibleStudents(selectedDrive.drive_id, activeRound.round_id);
    setStudents(eligible?.students ?? []);
    const detail = await interviewService.getScheduleDetail(record.schedule_id);
    // Use the schedule returned from detail API so we get the real DB status
    const freshSchedule = detail?.schedule
      ? { ...record, ...detail.schedule }
      : { ...record, status: "DRAFT" as const };
    setConfirmedSchedule(freshSchedule);
    setSlots(detail?.slots ?? []);
    setScheduleStatusMap(prev => ({ ...prev, [record.round_id]: "SCHEDULED" }));
    setLoadingRound(false);
  };

  // ── Table data — build rows from slots (if schedule exists) or students (if draft/new) ────────────────
  const candidateRowData = useMemo(() => {
    if (confirmedSchedule) {
      return slots.map((slot, idx) => {
        let slotDateVal = "";
        let slotTimeVal = "";
        if (slot.slot_time) {
          const [dp, tp] = slot.slot_time.split(" ");
          if (dp) slotDateVal = dp;
          if (tp) slotTimeVal = tp;
        }
        return {
          idX: String(slot.application_id),
          sno: idx + 1,
          student_name: slot.student_name,
          usno: slot.usno,
          email: slot.email ?? "—",
          branch: slot.branch,
          cgpa: slot.cgpa ?? "—",
          slot_date: slotDateVal || confirmedSchedule.start_date || "",
          slot_time: slotTimeVal || "09:00",
          interviewer_name: slot.interviewer_name ?? "",
          interviewer_email: slot.interviewer_email ?? "",
          batch_number: slot.batch_number ?? null,
          status: (confirmedSchedule.status === "SCHEDULED" || confirmedSchedule.status === "DISPATCHED") ? "Scheduled" : "Eligible to schedule",
          _application_id: slot.application_id,
          _slotExists: true,
        };
      });
    }

    return students.map((s, idx) => ({
      idX: String(s.application_id),
      sno: idx + 1,
      student_name: s.student_name,
      usno: s.usno,
      email: s.email ?? "—",
      branch: s.branch,
      cgpa: s.cgpa ?? "—",
      slot_date: "",
      slot_time: "",
      interviewer_name: "",
      interviewer_email: "",
      batch_number: null,
      status: "Eligible",
      _application_id: s.application_id,
      _slotExists: false,
    }));
  }, [students, slots, confirmedSchedule]);

  const handleExportXLSX = useCallback(() => {
    if (!candidateRowData.length) { toast.info("No candidates to export"); return; }
    const data = candidateRowData.map((row) => {
      let location = "—";
      if (confirmedSchedule) {
        location = confirmedSchedule.venue_type === "PHYSICAL"
          ? (confirmedSchedule.venue_details || "Physical Venue")
          : (confirmedSchedule.meeting_link || "Virtual Meeting");
      }
      return {
        "Student Name": row.student_name,
        "USN": row.usno,
        "Email": row.email,
        "Branch": row.branch,
        "Date": row.slot_date,
        "Time Slot": row.slot_time,
        "Location": location,
        "Interviewer": row.interviewer_name,
        "Interviewer Email": row.interviewer_email,
      };
    });
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Schedule");
    const maxLens = Object.keys(data[0] || {}).map(key => ({
      wch: Math.max(key.length, ...data.map(r => String((r as any)[key] ?? "").length)) + 3,
    }));
    worksheet["!cols"] = maxLens;
    XLSX.writeFile(workbook, `${confirmedSchedule?.round_name?.replace(/\s+/g, "_") || "Interview"}_Schedule.xlsx`);
    toast.success("Excel sheet downloaded!");
  }, [candidateRowData, confirmedSchedule]);

  const candidateColumnDefs = useMemo(() => [
    { headerName: "#", field: "sno", width: 60, minWidth: 55, filter: false, sortable: false, suppressMovable: true, cellStyle: { color: "#9ca3af", fontWeight: "500", fontSize: "12px" } },
    { headerName: "Name", field: "student_name", filter: true, sortable: true, minWidth: 140, cellStyle: { fontWeight: "600", color: "#1f2937", fontSize: "12px" } },
    { headerName: "USN", field: "usno", filter: true, sortable: true, minWidth: 120, cellStyle: { color: "#6b7280", fontFamily: "monospace", fontSize: "12px" } },
    { headerName: "Branch", field: "branch", filter: true, sortable: true, minWidth: 100, cellStyle: { color: "#374151", fontSize: "12px" } },
    {
      headerName: "Date", field: "slot_date", filter: true, sortable: true, minWidth: 130,
      cellRenderer: (params: any) => {
        const appId = params.data._application_id;
        const timeVal = params.data.slot_time;
        const canEdit = !!confirmedSchedule;
        return (
          <input
            type="date"
            disabled={!canEdit}
            defaultValue={params.value || ""}
            onChange={(e) => handleUpdateSlot(appId, e.target.value, timeVal || "09:00")}
            style={{ background: "transparent", border: "1px solid transparent", borderRadius: "4px", padding: "2px 6px", fontSize: "12px", color: "#374151", fontWeight: "500", cursor: canEdit ? "pointer" : "not-allowed", opacity: canEdit ? 1 : 0.5, width: "112px", outline: "none" }}
            onMouseOver={(e) => { if (canEdit) (e.target as HTMLInputElement).style.borderColor = "#d1d5db"; }}
            onMouseOut={(e) => { (e.target as HTMLInputElement).style.borderColor = "transparent"; }}
            onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "#6366f1"; (e.target as HTMLInputElement).style.background = "white"; }}
            onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "transparent"; (e.target as HTMLInputElement).style.background = "transparent"; }}
          />
        );
      },
    },
    {
      headerName: "Time Slot", field: "slot_time", filter: true, sortable: true, minWidth: 150,
      cellRenderer: (params: any) => {
        const appId = params.data._application_id;
        const dateVal = params.data.slot_date;
        const batchNum = params.data.batch_number;
        const canEdit = !!confirmedSchedule;
        return (
          <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "6px", height: "100%" }}>
            <input
              type="time"
              disabled={!canEdit}
              defaultValue={params.value || "09:00"}
              onChange={(e) => {
                const d = dateVal || confirmedSchedule?.start_date || new Date().toISOString().slice(0, 10);
                handleUpdateSlot(appId, d, e.target.value);
              }}
              style={{ background: "transparent", border: "1px solid transparent", borderRadius: "4px", padding: "2px 6px", fontSize: "12px", color: "#374151", fontWeight: "500", cursor: canEdit ? "pointer" : "not-allowed", opacity: canEdit ? 1 : 0.5, width: "90px", outline: "none" }}
              onMouseOver={(e) => { if (canEdit) (e.target as HTMLInputElement).style.borderColor = "#d1d5db"; }}
              onMouseOut={(e) => { (e.target as HTMLInputElement).style.borderColor = "transparent"; }}
              onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "#6366f1"; (e.target as HTMLInputElement).style.background = "white"; }}
              onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "transparent"; (e.target as HTMLInputElement).style.background = "transparent"; }}
            />
            {batchNum != null && (
              <span style={{
                fontSize: "10px",
                color: "#4f46e5",
                backgroundColor: "#e0e7ff",
                border: "1px solid #c7d2fe",
                padding: "0px 5px",
                borderRadius: "10px",
                fontWeight: "600",
                whiteSpace: "nowrap",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                height: "18px",
                lineHeight: "1"
              }}>
                B{batchNum}
              </span>
            )}
          </div>
        );
      },
    },
    {
      headerName: "Interviewer", field: "interviewer_name", filter: true, sortable: true, minWidth: 150,
      cellRenderer: (params: any) => {
        const appId = params.data._application_id;
        const slotExists = params.data._slotExists;
        const dateVal = params.data.slot_date;
        const timeVal = params.data.slot_time;
        const canEdit = !!slotExists;
        return (
          <select
            disabled={!canEdit}
            value={params.value || ""}
            onChange={(e) => {
              const selectedName = e.target.value;
              const selectedIv = interviewerList.find(iv => iv.name === selectedName);
              const selectedEmail = selectedIv ? selectedIv.email : "";
              const selectedId = selectedIv ? selectedIv.interviewer_id : null;
              const d = dateVal || confirmedSchedule?.start_date || new Date().toISOString().slice(0, 10);
              const t = timeVal || "09:00";
              
              if (selectedId) {
                interviewService.checkInterviewerConflict(
                  selectedId,
                  `${d} ${t}`,
                  confirmedSchedule?.schedule_id
                ).then((res) => {
                  if (res && res.conflict) {
                    setInterviewerConflictPopup({
                      interviewerName: res.interviewer_name || selectedName,
                      driveName: res.drive_name || "another drive",
                      slotTime: t,
                      onConfirm: () => {
                        handleUpdateSlot(appId, d, t, selectedName, selectedEmail, selectedId);
                        setInterviewerConflictPopup(null);
                      }
                    });
                  } else {
                    handleUpdateSlot(appId, d, t, selectedName, selectedEmail, selectedId);
                  }
                });
              } else {
                handleUpdateSlot(appId, d, t, selectedName, selectedEmail, selectedId);
              }
            }}
            style={{ background: "transparent", border: "1px solid transparent", borderRadius: "4px", padding: "2px 6px", fontSize: "12px", color: "#4b5563", fontWeight: "500", cursor: canEdit ? "pointer" : "not-allowed", opacity: canEdit ? 1 : 0.4, width: "140px", outline: "none" }}
            onMouseOver={(e) => { if (canEdit) (e.target as HTMLSelectElement).style.borderColor = "#d1d5db"; }}
            onMouseOut={(e) => { (e.target as HTMLSelectElement).style.borderColor = "transparent"; }}
            onFocus={(e) => { (e.target as HTMLSelectElement).style.borderColor = "#6366f1"; (e.target as HTMLSelectElement).style.background = "white"; }}
            onBlur={(e) => { (e.target as HTMLSelectElement).style.borderColor = "transparent"; (e.target as HTMLSelectElement).style.background = "transparent"; }}
          >
            <option value="">— Select —</option>
            {interviewerList.map(iv => (
              <option key={iv.email} value={iv.name}>{iv.name}</option>
            ))}
          </select>
        );
      },
    },
    {
      headerName: "Interviewer Email", field: "interviewer_email", filter: true, sortable: true, minWidth: 180,
      cellRenderer: (params: any) => {
        return (
          <span style={{ fontSize: "12px", color: "#6366f1", fontWeight: "500", paddingLeft: "6px" }}>
            {params.value || "—"}
          </span>
        );
      },
    },
    {
      headerName: "Status", field: "status", filter: true, sortable: true, minWidth: 110,
      cellRenderer: (params: any) => {
        const val = params.value || "";
        const isScheduled = val === "Scheduled";
        const isEligibleToSchedule = val === "Eligible to schedule";

        let border = "1px solid #fde68a";
        let background = "#fffbeb";
        let color = "#92400e";

        if (isScheduled) {
          border = "1px solid #a7f3d0";
          background = "#ecfdf5";
          color = "#065f46";
        } else if (isEligibleToSchedule) {
          border = "1px solid #bfdbfe";
          background = "#eff6ff";
          color = "#1e40af";
        }

        return (
          <div style={{ display: "flex", alignItems: "center", height: "100%" }}>
            <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 10px", borderRadius: "9999px", fontSize: "10px", fontWeight: "700", lineHeight: "16px", border, background, color }}>
              {val}
            </span>
          </div>
        );
      },
    },
  ], [confirmedSchedule, handleUpdateSlot, interviewerList]);

  // ─────────────────────────────────────────────────────────────────────────
  // SCREEN 1: DRIVES LIST
  // ─────────────────────────────────────────────────────────────────────────
  if (!selectedDrive) {
    return (
      <div>
        <div className="mb-5">
          <h3 className="text-lg font-bold text-gray-800 leading-tight">Interview Scheduling</h3>
          <p className="text-sm text-gray-400 mt-0.5">
            Select a placement drive to configure round-wise interview schedules.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <span className="text-sm font-bold text-gray-700">Active Placement Drives</span>
            <span className="text-xs text-gray-400">
              {loadingDrives ? "Loading..." : `${drives.length} drives`}
            </span>
          </div>

          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 bg-gray-50/20 text-xs">
                <th className="px-5 py-3 font-semibold w-10">#</th>
                <th className="px-5 py-3 font-semibold">Drive Name</th>
                <th className="px-5 py-3 font-semibold">Company</th>
                <th className="px-5 py-3 font-semibold text-center">Shortlisted</th>
                <th className="px-5 py-3 font-semibold text-center">Rounds</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loadingDrives ? (
                // Loading skeleton rows
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4"><div className="h-3 w-4 bg-gray-100 rounded" /></td>
                    <td className="px-5 py-4"><div className="h-3 w-40 bg-gray-100 rounded" /></td>
                    <td className="px-5 py-4"><div className="h-3 w-24 bg-gray-100 rounded" /></td>
                    <td className="px-5 py-4 text-center"><div className="h-3 w-8 bg-gray-100 rounded mx-auto" /></td>
                    <td className="px-5 py-4 text-center"><div className="h-3 w-12 bg-gray-100 rounded mx-auto" /></td>
                    <td className="px-5 py-4"><div className="h-3 w-12 bg-gray-100 rounded" /></td>
                    <td className="px-5 py-4 text-right"><div className="h-6 w-16 bg-gray-100 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : drives.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-gray-400">
                    No active placement drives found.
                  </td>
                </tr>
              ) : drives.map((d, idx) => (
                <tr
                  key={d.drive_id}
                  className="hover:bg-indigo-50/30 transition-colors group cursor-pointer"
                  onClick={() => handleSelectDrive(d)}
                >
                  <td className="px-5 py-4 text-gray-400 text-xs">{idx + 1}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-extrabold flex items-center justify-center uppercase flex-shrink-0">
                        {d.company_name.charAt(0)}
                      </div>
                      <span className="font-semibold text-gray-800 group-hover:text-indigo-700 transition-colors">
                        {d.drive_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-600 font-medium">{d.company_name}</td>
                  <td className="px-5 py-4 text-center">
                    <span className="font-bold text-gray-700">{d.shortlisted_count ?? 0}</span>
                    <span className="text-gray-400 text-xs ml-1">students</span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
                      {d.rounds?.length ?? 0} rounds
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSelectDrive(d); }}
                      className="px-3 py-1.5 text-xs font-bold text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-400 transition"
                    >
                      Manage →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SCREEN 2: WIZARD
  // ─────────────────────────────────────────────────────────────────────────
  if (selectedDrive && showWizard && activeRound) {
    return (
      <div className="p-1">
        <ScheduleWizardPage
          onClose={() => setShowWizard(false)}
          onConfirm={handleWizardConfirm}
          initialDriveId={selectedDrive.drive_id}
          initialRoundId={activeRound.round_id}
          existingSchedule={confirmedSchedule}
        />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SCREEN 3: DRIVE DETAIL (round pills + schedule card + students table)
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="p-1 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setSelectedDrive(null); setActiveRound(null); }}
            className="px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-xs font-bold text-gray-600 hover:bg-gray-50 transition"
          >
            ← Back to Drives
          </button>
          <div>
            <h3 className="text-xl font-bold text-gray-800 leading-tight">
              Interview Schedule — {selectedDrive.drive_name}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Configure parameters, generate time slots, and dispatch calendar invites.
            </p>
          </div>
        </div>
      </div>

      {/* ── ROUND TIMELINE ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
          Select Round Timeline
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          {selectedDrive.rounds.map((r, idx) => {
            const status = scheduleStatusMap[r.round_id] ?? "PENDING";
            const isSelected = activeRound?.round_id === r.round_id;
            const isLocked = false; // Lock logic: implement per-round sequencing if needed

            let pillClass = "px-4 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-2 ";
            if (isSelected) {
              pillClass += "bg-indigo-600 border-indigo-700 text-white shadow-sm scale-105";
            } else if (status === "SCHEDULED") {
              pillClass += "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100/50";
            } else {
              pillClass += "bg-white border-gray-200 text-gray-600 hover:bg-gray-50";
            }

            return (
              <div key={r.round_id} className="flex items-center gap-2">
                {idx > 0 && <span className="text-gray-300">→</span>}
                <button
                  disabled={isLocked}
                  onClick={() => setActiveRound(r)}
                  className={pillClass}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold ${isSelected ? "bg-white text-indigo-700" : "bg-black/5 text-gray-500"
                    }`}>
                    {r.round_number}
                  </span>
                  <span>{r.round_name}</span>
                  {status === "SCHEDULED" && !isSelected && <span>✓</span>}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── CARD + STATS GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left: Schedule Card or Create CTA */}
        <div className="lg:col-span-2">
          {loadingRound ? (
            <div className="border border-gray-200 rounded-2xl p-8 bg-white flex items-center justify-center">
              <div className="text-sm text-gray-400 animate-pulse">Loading schedule...</div>
            </div>
          ) : confirmedSchedule ? (
            <div className="space-y-4">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Active Interview Schedule
              </div>
              <ScheduleCard
                schedule={confirmedSchedule}
                onEdit={() => setShowWizard(true)}
                onNotify={handleNotify}
                isNotified={notifiedIds.has(confirmedSchedule.schedule_id) || Boolean(confirmedSchedule.all_notified)}
                onShowAlreadySent={(sentAt) => setAlreadySentPopup({
                  visible: true,
                  sentAt,
                  scheduleName: confirmedSchedule.round_name || "Current Round"
                })}
              />
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 bg-white flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-2xl mb-4 text-indigo-600">
                📅
              </div>
              <h3 className="text-base font-bold text-gray-800">Interview Schedule not created yet</h3>
              <p className="text-xs text-gray-400 max-w-sm mt-1.5 leading-relaxed">
                Automate timing, slot allocations, and configure online meet details in seconds.
              </p>
              <button
                onClick={() => setShowWizard(true)}
                className="mt-5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
              >
                + Create Schedule for {activeRound?.round_name}
              </button>
            </div>
          )}
        </div>

        {/* Right: Stats panel */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4 lg:mt-[30px]">
          <h4 className="text-xs font-bold text-gray-800 border-b border-gray-100 pb-3">
            Round Eligibility Info
          </h4>
          <div className="space-y-3.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Shortlisted (this round)</span>
              <span className="font-bold text-indigo-600">{students.length} candidates</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Round Duration</span>
              <span className="font-semibold text-gray-700">{activeRound?.duration_minutes ?? "—"} min</span>
            </div>

            {confirmedSchedule && (
              <>
                <div className="flex items-center justify-between text-xs border-t border-gray-50 pt-3">
                  <span className="text-gray-400">Dates</span>
                  <span className="font-semibold text-gray-700 text-right">
                    {new Date(confirmedSchedule.start_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} - {new Date(confirmedSchedule.end_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </span>
                </div>

                {slots.length > 0 && (
                  <div className="flex items-center justify-between text-xs border-t border-gray-50 pt-3">
                    <span className="text-gray-400">Assigned Time</span>
                    <span className="font-semibold text-gray-700 text-right">
                      {(() => {
                        const times = slots.map(s => s.slot_time?.split(" ")[1]).filter(Boolean).sort();
                        if (times.length === 0) return "N/A";
                        if (times.length === 1) return times[0];
                        return `${times[0]} to ${times[times.length - 1]}`;
                      })()}
                    </span>
                  </div>
                )}
              </>
            )}

            <div className="flex items-center justify-between text-xs border-t border-gray-50 pt-3">
              <span className="text-gray-400">Round Type</span>
              <span className="px-2 py-0.5 rounded font-semibold text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100">
                {activeRound?.round_type}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── SCHEDULE ROUND ACTION BANNER — shown when schedule exists and status is DRAFT ── */}
      {confirmedSchedule && confirmedSchedule.status === "DRAFT" && (
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-2xl px-5 py-4 flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-lg flex-shrink-0">
              🚀
            </div>
            <div>
              <h4 className="text-sm font-bold text-indigo-900">Ready to dispatch?</h4>
              <p className="text-xs text-indigo-600 mt-0.5">
                Review the slot list below, then click <strong>Schedule Round</strong> to lock slots and make this round available for results entry.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleSaveSlots}
              disabled={loadingRound}
              className="px-4 py-2 bg-white border border-indigo-300 text-indigo-700 rounded-lg text-xs font-bold hover:bg-indigo-50 transition shadow-sm disabled:opacity-50"
            >
              💾 Save Slots
            </button>
            <button
              onClick={handleDispatchSchedule}
              disabled={loadingRound}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-lg text-sm font-bold shadow-md shadow-indigo-200 transition disabled:opacity-50 flex items-center gap-2"
            >
              <span>Schedule Round</span>
              <span className="text-base">→</span>
            </button>
          </div>
        </div>
      )}

      {(confirmedSchedule?.status === "SCHEDULED" || confirmedSchedule?.status === "DISPATCHED") && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl px-5 py-4 flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white text-lg flex-shrink-0">
              📝
            </div>
            <div>
              <h4 className="text-sm font-bold text-blue-900">Edit Scheduled Slots</h4>
              <p className="text-xs text-blue-600 mt-0.5">
                You can adjust slot dates, times, and interviewers in the list below. Click <strong>Save Updates</strong> to persist your changes.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleSaveSlots}
              disabled={loadingRound}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-lg text-sm font-bold shadow-md shadow-blue-200 transition disabled:opacity-50 flex items-center gap-2"
            >
              💾 Save Updates
            </button>
          </div>
        </div>
      )}

      {/* ── STUDENTS / SLOTS TABLE ── */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap bg-gray-50/50">
          <div>
            <h3 className="text-sm font-bold text-gray-800">
              {confirmedSchedule
                ? `Scheduled Candidates — ${activeRound?.round_name}`
                : `Shortlisted Candidates — ${activeRound?.round_name}`}
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {confirmedSchedule
                ? "Students assigned to interview slots for this round."
                : "List of eligible candidates for this round. Create a schedule to assign slots."}
            </p>
            {/* Working-hours info pill — visible when schedule exists */}
            {confirmedSchedule && (
              <div className="mt-1.5 flex items-center gap-3 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-[10px] font-bold text-indigo-700">
                  🕐 Day: {dayBounds.start} – {dayBounds.end}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-100 text-[10px] font-bold text-amber-700">
                  🍽 Lunch: 13:00–14:00
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-100 text-[10px] font-semibold text-rose-600">
                  ⚠ Times outside window are rejected or auto-pushed
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400 whitespace-nowrap">Show</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="text-xs font-semibold text-gray-700 border border-gray-200 rounded-md px-2 py-1 bg-white hover:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-400 cursor-pointer transition"
              >
                {[10, 15, 20, 50].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <span className="text-xs text-gray-400 whitespace-nowrap">entries</span>
            </div>
            <button
              onClick={handleExportXLSX}
              className="px-3 py-1 bg-white border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/20 text-gray-700 hover:text-indigo-700 rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
            >
              <span>📥</span> Export
            </button>
            <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full text-xs font-bold">
              {confirmedSchedule ? candidateRowData.length : students.length} {confirmedSchedule ? "Scheduled" : "Shortlisted"}
            </span>
          </div>
        </div>

        {loadingRound ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400 animate-pulse">
            Loading candidates...
          </div>
        ) : (
          <div className="px-0 plm-datatable-wrapper">
            <DataTable
              key={pageSize}
              columnDefs={candidateColumnDefs}
              rowData={candidateRowData}
              headerFilter={true}
              pagination={true}
              pageSize={pageSize}
              showSearch={false}
              showAddButton={false}
              showEntries={false}
              autoHeight={true}
              rowHeight={40}
            />
          </div>
        )}
      </div>

      {/* F4: Already Sent Notification Popup Modal */}
      {alreadySentPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 flex flex-col items-center text-center animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 mb-4 text-2xl shadow-inner">
              🔔
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 leading-tight">
              Notification Already Sent
            </h3>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Interview notification alerts have already been dispatched to candidates for the round{" "}
              <strong className="text-slate-800">{alreadySentPopup.scheduleName}</strong>.
            </p>
            {alreadySentPopup.sentAt ? (
              <div className="mt-4 px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-100/80 text-xs text-slate-600 font-bold tracking-wide">
                Sent Date & Time: {new Date(alreadySentPopup.sentAt).toLocaleString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
              </div>
            ) : (
              <div className="mt-4 px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-100/80 text-xs text-slate-600 font-bold tracking-wide">
                Sent recently in this session.
              </div>
            )}
            <div className="mt-6 flex w-full gap-2">
              <button
                onClick={() => setAlreadySentPopup(null)}
                className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-bold text-black shadow-[0_3px_0_#d1d5db] transition hover:-translate-y-0.5 active:translate-y-0.5"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setAlreadySentPopup(null);
                  handleNotify(true); // force re-send
                }}
                className="flex-1 rounded-xl border border-teal-700 bg-teal-600 py-2.5 text-sm font-bold text-white shadow-[0_3px_0_#0f766e] transition hover:-translate-y-0.5 active:translate-y-0.5"
              >
                Resend Again
              </button>
            </div>
          </div>
        </div>
      )}


      {interviewerConflictPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 flex flex-col items-center text-center animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-4 text-2xl shadow-inner animate-bounce">
              ⚠️
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 leading-tight">
              Interviewer Conflict Detected
            </h3>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              <strong>{interviewerConflictPopup.interviewerName}</strong> already has a slot at{" "}
              <strong className="text-slate-800">{interviewerConflictPopup.slotTime}</strong> in{" "}
              <strong className="text-slate-850">{interviewerConflictPopup.driveName}</strong>.
            </p>
            <p className="text-xs text-indigo-650 font-bold mt-3 bg-indigo-50 border border-indigo-100/50 px-3 py-1.5 rounded-xl">
              Do you want to assign him to this student anyway?
            </p>
            <div className="mt-6 flex w-full gap-2.5">
              <button
                type="button"
                onClick={() => setInterviewerConflictPopup(null)}
                className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-bold text-gray-700 shadow-sm transition hover:bg-gray-50 active:scale-95 cursor-pointer"
              >
                No
              </button>
              <button
                type="button"
                onClick={() => {
                  interviewerConflictPopup.onConfirm();
                }}
                className="flex-1 rounded-xl border border-indigo-700 bg-indigo-600 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 active:scale-95 cursor-pointer"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default InterviewSchedulePage;
