/**
 * interviewService.ts
 * ===================
 * All API calls for the Interview module.
 * Uses axiosInstance + PlacementApiEndpoint.
 * Every function returns null on failure (caller shows toast).
 *
 * Backend response wrapper: { status, data: { data: ... }, message }
 * We always extract response.data?.data
 */

import axiosInstance from "../../../../utils/api";
import { PlacementApiEndpoint } from "../../../../utils/ApiEndpoint/placementApiEndpoints";
import type {
  ConfirmedScheduleRecord,
  EligibleStudent,
  InterviewSlot,
  OrgHoliday,
  ResultBulkSavePayload,
  RoundResult,
  ResultValue,
} from "./interviewTypes";

// ─── Response shape from backend ─────────────────────────────────────────────
interface ApiOk<T> {
  data: T;
  message?: string;
}

/** Safely unwrap backend response. Returns null on any error. */
async function call<T>(
  fn: () => PromiseLike<any>
): Promise<T | null> {
  try {
    const res = await fn();
    return (res.data as any)?.data ?? null;
  } catch (err: any) {
    console.error("[interviewService]", err?.response?.data?.message ?? err.message);
    return null;
  }
}

// ─── Meta (drives + rounds for dropdowns) ─────────────────────────────────────

export interface MetaResponse {
  drives: Array<{
    drive_id: number;
    company_id: number;
    drive_name: string;
    company_name: string;
    status: number;
    drive_date: string | null;
    shortlisted_count: number;
    min_cgpa: number;
    max_backlogs: number;
    job_role: string;
    ctc_min: number | null;
    ctc_max: number | null;
    rounds: Array<{
      round_id: number;
      round_name: string;
      round_number: number;
      round_type: string;
      duration_minutes: number;
      round_date: string | null;
    }>;
  }>;
  total: number;
}

export async function getMeta(): Promise<MetaResponse | null> {
  return call(() => axiosInstance.get(PlacementApiEndpoint.interview.meta));
}

// ─── Eligible Students ────────────────────────────────────────────────────────

export interface EligibleStudentsResponse {
  students: EligibleStudent[];
  total: number;
  round_name: string;
  round_number: number;
  duration_minutes: number;
  already_scheduled: number;
}

export async function getEligibleStudents(
  driveId: number,
  roundId: number
): Promise<EligibleStudentsResponse | null> {
  return call(() =>
    axiosInstance.get(PlacementApiEndpoint.interview.slot_eligible, {
      params: { drive_id: driveId, round_id: roundId },
    })
  );
}

// ─── Schedule List ────────────────────────────────────────────────────────────

export interface ScheduleListResponse {
  schedules: ConfirmedScheduleRecord[];
  total: number;
}

export async function getScheduleList(
  driveId: number
): Promise<ScheduleListResponse | null> {
  return call(() =>
    axiosInstance.get(PlacementApiEndpoint.interview.schedule_list, {
      params: { drive_id: driveId },
    })
  );
}

// ─── Schedule Detail ──────────────────────────────────────────────────────────

export interface ScheduleDetailResponse {
  schedule: ConfirmedScheduleRecord;
  slots: InterviewSlot[];
  slots_count: number;
}

export async function getScheduleDetail(
  scheduleId: number
): Promise<ScheduleDetailResponse | null> {
  return call(() =>
    axiosInstance.get(
      `${PlacementApiEndpoint.interview.schedule_detail}/${scheduleId}`
    )
  );
}

// ─── Save Schedule (POST = create, PUT = update) ──────────────────────────────

export interface ScheduleSavePayloadItem {
  application_id: number;
  slot_time: string | null;
  batch_number: number | null;
  seq_number: number | null;
  interviewer_name?: string | null;
  interviewer_email?: string | null;
  interviewer_id?: number | null;
  student_id?: number | null;
  contact_id?: number | null;
}

export interface ScheduleSavePayload {
  schedule_id?: number;           // only for PUT (update)
  drive_id: number;
  round_id: number;
  venue_type: "PHYSICAL" | "VIRTUAL";
  venue_details: string | null;
  meeting_link: string | null;
  scheduling_mode: string;
  batch_size: number | null;
  duration_minutes: number;
  total_students: number;
  total_slots: number;
  days_required: number;
  start_date: string;
  end_date: string;
  interviewer_names: string | null;
  interviewer_email: string | null;
  slots: ScheduleSavePayloadItem[];
}

export interface ScheduleSaveResponse {
  schedule_id: number;
  total_slots_saved: number;
  drive_id: number;
  round_id: number;
}

export async function saveSchedule(
  payload: ScheduleSavePayload,
  isUpdate = false
): Promise<{ success: boolean; data?: ScheduleSaveResponse; error?: string }> {
  try {
    const res: any = isUpdate
      ? await axiosInstance.put(PlacementApiEndpoint.interview.schedule_update, payload)
      : await axiosInstance.post(PlacementApiEndpoint.interview.schedule_save, payload);
    return { success: true, data: res.data?.data };
  } catch (err: any) {
    const errorMsg = err?.response?.data?.message ?? err.message ?? "Failed to save schedule";
    return { success: false, error: errorMsg };
  }
}

// ─── Delete Schedule (soft delete) ───────────────────────────────────────────

export async function deleteSchedule(
  scheduleId: number
): Promise<{ schedule_id: number; is_active: number } | null> {
  return call(() =>
    axiosInstance.delete(
      `${PlacementApiEndpoint.interview.schedule_detail}/${scheduleId}`
    )
  );
}

// ─── Holidays ─────────────────────────────────────────────────────────────────

export interface HolidaysResponse {
  holidays: OrgHoliday[];
}

export async function getHolidays(): Promise<HolidaysResponse | null> {
  return call(() =>
    axiosInstance.get("placement/interview/holidays")
  );
}

// ─── Results ──────────────────────────────────────────────────────────────────

export interface ResultsResponse {
  results: RoundResult[];
  total: number;
  round_name?: string;
  drive_name?: string;
  results_recorded?: number;
  pending_count?: number;
  all_results_complete?: boolean;
}

export async function getResults(
  scheduleId: number
): Promise<ResultsResponse | null> {
  return call(() =>
    axiosInstance.get(PlacementApiEndpoint.interview.result_list, {
      params: { schedule_id: scheduleId },
    })
  );
}

export async function saveResults(
  payload: ResultBulkSavePayload
): Promise<{ success: boolean; data?: { saved_count: number }; error?: string }> {
  try {
    const res: any = await axiosInstance.post(PlacementApiEndpoint.interview.result_save, payload);
    return { success: true, data: res.data?.data };
  } catch (err: any) {
    const errorMsg = err?.response?.data?.message ?? err.message ?? "Failed to save results";
    return { success: false, error: errorMsg };
  }
}

export interface SlotListResponse {
  slots: any[];
  total: number;
  schedule_id: number;
  drive_name: string;
  company_name: string;
  round_name: string;
  round_number: number;
  round_type: string;
  scheduled_date: string | null;
  end_date: string | null;
  venue_type: string;
  venue_details: string | null;
  meeting_link: string | null;
  interviewer_names: string | null;
}

export async function getScheduleSlots(scheduleId: number): Promise<SlotListResponse | null> {
  return call(() =>
    axiosInstance.get(PlacementApiEndpoint.interview.slot_list_by_schedule, {
      params: { schedule_id: scheduleId },
    })
  );
}

export async function dispatchSchedule(scheduleId: number): Promise<any | null> {
  return call(() =>
    axiosInstance.post(PlacementApiEndpoint.interview.schedule_dispatch.replace("{schedule_id}", scheduleId.toString()))
  );
}

export interface ResultOverridePayload {
  result_id: number;
  result: ResultValue;
  feedback_notes: string | null;
}

export async function overrideResult(payload: ResultOverridePayload): Promise<{ saved: boolean } | null> {
  return call(() =>
    axiosInstance.patch(PlacementApiEndpoint.interview.result_override, payload)
  );
}


export interface NotifyResponse {
  status: "success" | "warning";
  message?: string;
  already_notified?: Array<{ student_name: string; sent_at: string }>;
}

export async function notifySchedule(scheduleId: number, force: boolean = false): Promise<NotifyResponse | null> {
  return call(() =>
    axiosInstance.post(PlacementApiEndpoint.interview.schedule_notify, {
      schedule_id: scheduleId,
      force,
    })
  );
}
export interface CompanyContact {
  contact_id: number;
  company_id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  designation_name: string | null;
  is_primary: number;
  is_active: number;
}

export async function getCompanyContacts(
  companyId: number,
  interviewerOnly = true
): Promise<CompanyContact[] | null> {
  return call(() =>
    axiosInstance.get("placement/contact/get_contact_list", {
      params: {
        company_id: companyId,
        ...(interviewerOnly ? { interviewer_only: 1 } : {}),
      },
    })
  );
}

export interface InterviewerConflictResponse {
  conflict: boolean;
  drive_name: string | null;
  interviewer_name: string | null;
}

export async function checkInterviewerConflict(
  contactId: number,
  slotTime: string,
  scheduleId?: number
): Promise<InterviewerConflictResponse | null> {
  return call<InterviewerConflictResponse>(() =>
    axiosInstance.get(PlacementApiEndpoint.interview.check_interviewer_conflict, {
      params: {
        contact_id: contactId,
        slot_time: slotTime,
        ...(scheduleId ? { schedule_id: scheduleId } : {}),
      },
    })
  );
}



