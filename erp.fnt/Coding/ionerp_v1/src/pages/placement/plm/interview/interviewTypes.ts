// ============================================================
// Interview Management — TypeScript Types
// Tables: plm_interview_schedule, plm_interview_slot, plm_round_result
// ============================================================

export type VenueType    = "PHYSICAL" | "VIRTUAL";
export type SlotStatus   = "SCHEDULED" | "COMPLETED" | "NO_SHOW" | "CANCELLED";
export type ResultValue  = "PASS" | "FAIL" | "HOLD" | "ABSENT";

// ------ Metadata (from GET /interview/meta) ------
export interface InterviewRoundMeta {
  round_id:     number;
  round_name:   string;
  round_number: number;
  round_type:   string;
}

export interface InterviewDriveMeta {
  drive_id:      number;
  drive_name:    string;
  company_name:  string;
  status:        number;
  rounds:        InterviewRoundMeta[];
  applied_count?: number; // total students who applied
}

export interface InterviewMeta {
  drives: InterviewDriveMeta[];
}

// ------ Interview Schedule (plm_interview_schedule) ------
export interface InterviewSchedule {
  schedule_id:    number;
  drive_id:       number;
  drive_name:     string;
  company_name:   string;
  round_id:       number;
  round_name:     string;
  round_number:   number;
  round_type:     string;
  venue_type:     VenueType;
  venue_details:  string | null;
  meeting_link:   string | null;
  scheduled_date: string;    // "YYYY-MM-DD"
  start_time:     string;    // "HH:MM"
  end_time:       string | null;
  created_at:     string;
}

// ------ Eligible Students for Slot Assignment ------
export interface EligibleStudent {
  application_id: number;
  student_id?:    number | null;   // F2
  student_name:   string;
  usno:           string;
  email:          string;
  mobile:         string;
  branch:         string;
  cgpa?:          number;    // e.g. 8.74
  skills?:        string[];  // e.g. ["React", "Java"]
}

// ------ Interview Slot (plm_interview_slot) ------
export interface InterviewSlot {
  slot_id:           number | null;
  schedule_id:       number;
  application_id:    number;
  student_name:      string;
  usno:              string;
  email?:            string | null;
  cgpa?:             number | null;
  branch:            string;
  round_name:        string;
  slot_time:         string | null;    // "YYYY-MM-DD HH:MM"
  interviewer_name:  string | null;
  interviewer_email: string | null;
  interviewer_id?:   number | null;    // F2
  student_id?:       number | null;    // F2
  contact_id?:       number | null;
  status:            SlotStatus;
  batch_number?:     number | null;    // Batch number if batch scheduling mode was used
  seq_number?:       number | null;
}

// ------ Round Result (plm_round_result) ------
export interface RoundResult {
  result_id:      number | null;
  application_id: number;
  student_name:   string;
  usno:           string;
  branch:         string;
  cgpa:           number | null;
  round_id:       number;
  round_name:     string;
  result:         ResultValue | null;
  feedback_notes: string | null;
  recorded_at?:   string | null;
}


// ------ Slot Save Payload ------
export interface SlotAssignItem {
  application_id:    number;
  slot_time:         string | null;
  interviewer_name:  string | null;
  interviewer_email: string | null;
}

export interface SlotBulkAssignPayload {
  schedule_id: number;
  slots:       SlotAssignItem[];
}

// ------ Result Save Payload ------
export interface ResultRecordItem {
  application_id: number;
  round_id:       number;
  result:         ResultValue;
  feedback_notes: string | null;
}

export interface ResultBulkSavePayload {
  results: ResultRecordItem[];
}

// ------ Badge / Config ------
export const RESULT_CONFIG: Record<ResultValue, { label: string; badge: string; row: string }> = {
  PASS:   { label: "Pass",   badge: "bg-emerald-100 text-emerald-700 border border-emerald-200", row: "#F0FDF4" },
  FAIL:   { label: "Fail",   badge: "bg-rose-100 text-rose-700 border border-rose-200",           row: "#FEF2F2" },
  HOLD:   { label: "Hold",   badge: "bg-amber-100 text-amber-700 border border-amber-200",        row: "#FFFBEB" },
  ABSENT: { label: "Absent", badge: "bg-gray-100 text-gray-600 border border-gray-200",           row: "#F9FAFB" },
};

export const SLOT_STATUS_CONFIG: Record<SlotStatus, { label: string; badge: string }> = {
  SCHEDULED:  { label: "Scheduled",  badge: "bg-blue-100 text-blue-700 border border-blue-200"      },
  COMPLETED:  { label: "Completed",  badge: "bg-emerald-100 text-emerald-700 border border-emerald-200" },
  NO_SHOW:    { label: "No Show",    badge: "bg-rose-100 text-rose-700 border border-rose-200"      },
  CANCELLED:  { label: "Cancelled",  badge: "bg-gray-100 text-gray-500 border border-gray-200"      },
};

export const ROUND_TYPE_BADGE: Record<string, string> = {
  APTITUDE:   "bg-purple-100 text-purple-700",
  TECHNICAL:  "bg-blue-100 text-blue-700",
  HR:         "bg-pink-100 text-pink-700",
  GD:         "bg-orange-100 text-orange-700",
  CODING:     "bg-teal-100 text-teal-700",
  CASE_STUDY: "bg-indigo-100 text-indigo-700",
};

// ============================================================
// AUTO-GENERATION WIZARD TYPES (Spec §3–9)
// ============================================================

// ─── Scheduling Mode ─────────────────────────────────────────
// 4 strategies: 2 top-level modes × 2 sub-modes
export type SchedulingMode =
  | "BATCH_SIMULTANEOUS"   // A1: All in batch start together
  | "BATCH_SEQUENTIAL"     // A2: Each student in batch gets own slot
  | "ALL_SIMULTANEOUS"     // B1: Every student same time
  | "ALL_SEQUENTIAL";      // B2: Every student unique sequential slot

// ─── Round metadata returned by GET /schedule/meta/{round_id} ─
export interface RoundScheduleMeta {
  round_id:           number;
  round_name:         string;
  round_number:       number;
  round_type:         string;
  duration_minutes:   number;   // Pre-filled from plm_drive_round
  shortlisted_count:  number;   // Total students eligible for this round
  interview_mode:     VenueType; // PHYSICAL or VIRTUAL from round settings
  drive_date:         string;   // Preferred start date "YYYY-MM-DD"
}

// ─── Org Holiday ─────────────────────────────────────────────
export interface OrgHoliday {
  holiday_id:   number;
  holiday_date: string;  // "YYYY-MM-DD"
  holiday_name: string;
  holiday_type: "PUBLIC" | "CUSTOM";
}

// ─── Wizard form state (what the TPO fills in) ───────────────
export interface ScheduleConfig {
  drive_id:         number;
  round_id:         number;
  mode:             SchedulingMode;
  // Batch modes only
  batch_size?:      number;
  // Duration in minutes: per student (sequential) or per batch (simultaneous)
  duration_minutes: number;
  start_date:       string;   // "YYYY-MM-DD"
  venue_type:       VenueType;
  venue_details?:   string;
  meeting_link?:    string;
  // Configurable working-hour window for this schedule
  day_start_time?:  string;   // "HH:MM", default "09:00"
  day_end_time?:    string;   // "HH:MM", default "17:00"
}

// ─── One slot in the preview response ────────────────────────
export interface SchedulePreviewSlot {
  slot_index:   number;         // 1-based for display
  slot_date:    string;         // "YYYY-MM-DD"
  start_time:   string;         // "HH:MM"
  end_time:     string;         // "HH:MM"
  batch_number: number | null;  // null for ALL_* modes
  session:      "AM" | "PM";   // Morning or afternoon
  students:     Array<{
    application_id: number;
    student_id?:    number | null;
    student_name:   string;
    usno:           string;
    seq_number:     number;     // Position in queue
  }>;
}

// ─── Full preview result (what the preview API returns) ──────
export interface SchedulePreviewResult {
  total_students: number;
  days_required:  number;
  total_slots:    number;
  total_batches:  number | null;  // null for non-batch modes
  // Grouped by date for the day-timeline visualization
  days: Array<{
    date:        string;          // "YYYY-MM-DD"
    day_label:   string;          // "Wed, 10 Jul 2025"
    am_slots:    SchedulePreviewSlot[];
    pm_slots:    SchedulePreviewSlot[];
  }>;
}

// ─── Confirmed saved schedule (what appears in the list table) ─
export interface ConfirmedScheduleRecord {
  schedule_id:      number;
  drive_id:         number;
  drive_name:       string;
  company_name:     string;
  round_id:         number;
  round_name:       string;
  round_number:     number;
  round_type:       string;
  scheduling_mode:  SchedulingMode;
  total_students:   number;
  total_slots:      number;
  days_required:    number;
  start_date:       string;
  end_date:         string;
  venue_type:       VenueType;
  venue_details?:   string | null;
  meeting_link?:    string | null;
  interviewer_names?: string | null;  // Comma-separated names from the wizard form
  interviewer_email?: string | null;  // Comma-separated emails from the wizard form
  created_at:       string;
  is_active:        number;  // 1 = active, 0 = cancelled
  status?:          string;  // "DRAFT" | "SCHEDULED"
  batch_size?:      number | null;
  notification_sent_count?:      number;
  all_notified?:                 boolean;
  last_notification_sent_at?:    string | null;   // e.g. "2025-08-10T09:30:00"
  // Configurable working-hour window saved with this schedule
  day_start_time?:  string | null;   // "HH:MM"
  day_end_time?:    string | null;   // "HH:MM"
}
