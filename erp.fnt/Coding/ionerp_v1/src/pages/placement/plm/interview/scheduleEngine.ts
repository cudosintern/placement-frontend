// ============================================================
// scheduleEngine.ts — Pure Schedule Auto-Generation Algorithm
// Implements Spec §9 exactly. No React, no side effects.
// Input: ScheduleConfig + students + holidays
// Output: SchedulePreviewResult
//
// WORKING HOURS: driven by config.day_start_time / config.day_end_time
// LUNCH BREAK:   fixed 13:00–14:00
// BLOCKED DAYS:  holidays only (weekends are valid working days)
// ============================================================

import {
  ScheduleConfig,
  SchedulePreviewResult,
  SchedulePreviewSlot,
  EligibleStudent,
  OrgHoliday,
} from "./interviewTypes";

// ─────────────────────────────────────────────────────────────
// LUNCH CONSTANTS (fixed, never configurable)
// ─────────────────────────────────────────────────────────────
const LUNCH_START_H = 13;  // 13:00
const LUNCH_END_H   = 14;  // 14:00

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

/** "HH:MM" → total minutes since midnight */
const timeToMins = (hhmm: string): number => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** total minutes since midnight → "HH:MM" */
const minsToTime = (totalMins: number): string => {
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

/** "YYYY-MM-DD" → Date object */
const parseDate = (s: string): Date => {
  const [y, mo, d] = s.split("-").map(Number);
  return new Date(y, mo - 1, d);
};

/** Date → "YYYY-MM-DD" */
const fmtDate = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Date → "Tue, 10 Jul 2026" */
const fmtDateLabel = (d: Date): string =>
  d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

/** Build a Set of holiday date strings "YYYY-MM-DD" */
const buildBlockedSet = (holidays: OrgHoliday[]): Set<string> =>
  new Set(holidays.map(h => h.holiday_date));

/**
 * Return an ordered list of available (non-holiday) dates starting from startDate.
 * NOTE: Weekends are intentionally NOT blocked — only org holidays are excluded.
 */
const getAvailableDates = (startDate: string, needDays: number, blocked: Set<string>): string[] => {
  const dates: string[] = [];
  const cursor = parseDate(startDate);
  while (dates.length < needDays) {
    const key = fmtDate(cursor);
    if (!blocked.has(key)) dates.push(key);
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
};

// ─────────────────────────────────────────────────────────────
// SLOT BUILDER HELPERS
// ─────────────────────────────────────────────────────────────

/**
 * Advance past the fixed lunch break (13:00–14:00) if the
 * cursor lands anywhere inside it.
 */
const skipLunch = (cursorMins: number): number => {
  const lunchStart = LUNCH_START_H * 60;
  const lunchEnd   = LUNCH_END_H   * 60;
  if (cursorMins >= lunchStart && cursorMins < lunchEnd) return lunchEnd;
  return cursorMins;
};

/**
 * Returns true if a slot of `duration` minutes starting at `cursorMins`
 * can be fully accommodated before `workEndMins`, skipping lunch correctly.
 */
const canFitSlot = (cursorMins: number, duration: number, workEndMins: number): boolean => {
  const adjusted = skipLunch(cursorMins);
  const endMins  = adjusted + duration;
  return endMins <= workEndMins;
};

// ─────────────────────────────────────────────────────────────
// MAIN GENERATOR
// ─────────────────────────────────────────────────────────────

export function generatePreview(
  config: ScheduleConfig,
  students: EligibleStudent[],
  holidays: OrgHoliday[]
): SchedulePreviewResult {
  const N        = students.length;
  const blocked  = buildBlockedSet(holidays);
  const duration = config.duration_minutes;

  // Resolve configurable working hours (fallback to 09:00–17:00)
  const workStartMins = timeToMins(config.day_start_time ?? "09:00");
  const workEndMins   = timeToMins(config.day_end_time   ?? "17:00");

  // Estimate a safe upper bound on days
  const MAX_DAYS = N + 10;

  let slots: SchedulePreviewSlot[] = [];

  // ── Mode dispatching ──────────────────────────────────────

  if (config.mode === "ALL_SIMULTANEOUS") {
    // B1: Everyone gets the same single slot at workStart on start_date
    const dates    = getAvailableDates(config.start_date, 1, blocked);
    const slotDate = dates[0];
    slots.push({
      slot_index:   1,
      slot_date:    slotDate,
      start_time:   minsToTime(workStartMins),
      end_time:     minsToTime(workStartMins + duration),
      batch_number: null,
      session:      workStartMins < LUNCH_START_H * 60 ? "AM" : "PM",
      students:     students.map((s, i) => ({
        application_id: s.application_id,
        student_id:     s.student_id ?? null,
        student_name:   s.student_name,
        usno:           s.usno,
        seq_number:     i + 1,
      })),
    });
  }

  else if (config.mode === "ALL_SEQUENTIAL") {
    // B2: Each student gets own slot; roll over days automatically
    let slotIndex   = 1;
    let remaining   = [...students];
    let daysBudget  = MAX_DAYS;
    let datesCursor = config.start_date;

    while (remaining.length > 0 && daysBudget > 0) {
      const dates = getAvailableDates(datesCursor, 1, blocked);
      const day   = dates[0];
      let cursorMins = workStartMins;
      const daySlots: SchedulePreviewSlot[] = [];

      while (remaining.length > 0 && canFitSlot(cursorMins, duration, workEndMins)) {
        cursorMins = skipLunch(cursorMins);
        if (!canFitSlot(cursorMins, duration, workEndMins)) break;
        const student   = remaining.shift()!;
        const startMins = cursorMins;
        const endMins   = startMins + duration;
        daySlots.push({
          slot_index:   slotIndex++,
          slot_date:    day,
          start_time:   minsToTime(startMins),
          end_time:     minsToTime(endMins),
          batch_number: null,
          session:      startMins < LUNCH_START_H * 60 ? "AM" : "PM",
          students:     [{
            application_id: student.application_id,
            student_id:     student.student_id ?? null,
            student_name:   student.student_name,
            usno:           student.usno,
            seq_number:     slotIndex - 1,
          }],
        });
        cursorMins = endMins;
      }
      slots.push(...daySlots);

      // Advance to next available date
      const nextDay = parseDate(day);
      nextDay.setDate(nextDay.getDate() + 1);
      datesCursor = fmtDate(nextDay);
      daysBudget--;
    }
  }

  else if (config.mode === "BATCH_SIMULTANEOUS") {
    // A1: Students divided into batches; whole batch shares one time slot
    const batchSize = config.batch_size ?? 10;
    const batches: EligibleStudent[][] = [];
    for (let i = 0; i < students.length; i += batchSize) {
      batches.push(students.slice(i, i + batchSize));
    }

    let slotIndex   = 1;
    let remaining   = [...batches];
    let daysBudget  = MAX_DAYS;
    let datesCursor = config.start_date;

    while (remaining.length > 0 && daysBudget > 0) {
      const dates = getAvailableDates(datesCursor, 1, blocked);
      const day   = dates[0];
      let cursorMins = workStartMins;

      while (remaining.length > 0 && canFitSlot(cursorMins, duration, workEndMins)) {
        cursorMins = skipLunch(cursorMins);
        if (!canFitSlot(cursorMins, duration, workEndMins)) break;
        const batch     = remaining.shift()!;
        const batchNo   = slotIndex;
        const startMins = cursorMins;
        const endMins   = startMins + duration;
        slots.push({
          slot_index:   slotIndex++,
          slot_date:    day,
          start_time:   minsToTime(startMins),
          end_time:     minsToTime(endMins),
          batch_number: batchNo,
          session:      startMins < LUNCH_START_H * 60 ? "AM" : "PM",
          students:     batch.map((s, i) => ({
            application_id: s.application_id,
            student_id:     s.student_id ?? null,
            student_name:   s.student_name,
            usno:           s.usno,
            seq_number:     i + 1,
          })),
        });
        cursorMins = endMins;
      }

      const nextDay = parseDate(day);
      nextDay.setDate(nextDay.getDate() + 1);
      datesCursor = fmtDate(nextDay);
      daysBudget--;
    }
  }

  else {
    // BATCH_SEQUENTIAL: A2
    // Students grouped into batches; each student within gets their own slot.
    const batchSize = config.batch_size ?? 10;
    let slotIndex   = 1;
    let batchNo     = 1;
    let remaining   = [...students];
    let daysBudget  = MAX_DAYS;
    let datesCursor = config.start_date;
    let cursorMins  = workStartMins;
    let currentDay  = "";

    const advanceDay = () => {
      const dates = getAvailableDates(datesCursor, 1, blocked);
      currentDay  = dates[0];
      const nextDay = parseDate(currentDay);
      nextDay.setDate(nextDay.getDate() + 1);
      datesCursor = fmtDate(nextDay);
      cursorMins  = workStartMins;
      daysBudget--;
    };

    advanceDay(); // Initialize first day

    while (remaining.length > 0 && daysBudget > 0) {
      const batchStudents = remaining.splice(0, batchSize);
      for (const student of batchStudents) {
        cursorMins = skipLunch(cursorMins);
        if (!canFitSlot(cursorMins, duration, workEndMins)) {
          advanceDay();
          cursorMins = skipLunch(workStartMins);
        }
        const startMins = cursorMins;
        const endMins   = startMins + duration;
        slots.push({
          slot_index:   slotIndex,
          slot_date:    currentDay,
          start_time:   minsToTime(startMins),
          end_time:     minsToTime(endMins),
          batch_number: batchNo,
          session:      startMins < LUNCH_START_H * 60 ? "AM" : "PM",
          students:     [{
            application_id: student.application_id,
            student_id:     student.student_id ?? null,
            student_name:   student.student_name,
            usno:           student.usno,
            seq_number:     slotIndex,
          }],
        });
        cursorMins = endMins;
        slotIndex++;
      }
      batchNo++;
    }
  }

  // ── Aggregate into day groups for the timeline view ───────
  const dayMap = new Map<string, { am: SchedulePreviewSlot[]; pm: SchedulePreviewSlot[] }>();
  for (const slot of slots) {
    if (!dayMap.has(slot.slot_date)) dayMap.set(slot.slot_date, { am: [], pm: [] });
    const group = dayMap.get(slot.slot_date)!;
    if (slot.session === "AM") group.am.push(slot);
    else                       group.pm.push(slot);
  }

  const days = Array.from(dayMap.entries()).map(([date, { am, pm }]) => ({
    date,
    day_label: fmtDateLabel(parseDate(date)),
    am_slots:  am,
    pm_slots:  pm,
  }));

  // ── Derive batch count for batch modes ────────────────────
  let totalBatches: number | null = null;
  if (config.mode === "BATCH_SIMULTANEOUS" || config.mode === "BATCH_SEQUENTIAL") {
    const batchSize = config.batch_size ?? 10;
    totalBatches = Math.ceil(N / batchSize);
  }

  return {
    total_students: N,
    days_required:  days.length,
    total_slots:    slots.length,
    total_batches:  totalBatches,
    days,
  };
}
