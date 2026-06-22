// driveSchema.ts
// TypeScript interfaces for the Placement Drive module.

export interface EligibleBranch {
  id?: number;
  drive_id?: number;
  dept_id: number;
  dept_name?: string;
  dept_acronym?: string;
  batch_year: number;
}

export interface DriveRound {
  round_id?: number;
  drive_id?: number;
  round_number: number;
  round_name: string;
  round_type: string;
  is_eliminatory: boolean;
  round_date?: string | null;
  duration_minutes?: number | null;
  description?: string | null;
}

export interface DriveRecord {
  drive_id: number;
  drive_name: string;
  company_id: number;
  company_name: string;
  job_role: string;
  vacancy_count: number | null;
  drive_type: string;
  work_type: string;
  location: string | null;
  ctc_min: number | null;
  ctc_max: number | null;
  job_description?: string | null;
  min_cgpa: number;
  max_backlogs: number;
  application_start: string | null;
  application_deadline: string | null;
  drive_date: string | null;
  tier: number;
  status: number;
  status_label: string;
  eligible_student_count: number;
  applied_count: number;
  shortlisted_count: number;
  org_id: number;
  create_date?: string | null;
  modify_date?: string | null;
  eligible_branches?: EligibleBranch[];
  rounds?: DriveRound[];
}

export interface DriveSummary {
  total: number;
  active: number;
  scheduled: number;
  draft: number;
  closed: number;
  cancelled: number;
}

export interface DriveMeta {
  companies: { company_id: number; company_name: string; industry: string }[];
  departments: { dept_id: number; dept_name: string; dept_acronym: string }[];
  batch_years: number[];
  drive_types: string[];
  work_types: string[];
  round_types: string[];
}

// Status config for badge rendering
export const DRIVE_STATUS_CONFIG: Record<
  number,
  { label: string; badge: string; dot: string }
> = {
  0: {
    label: "Draft",
    badge: "bg-slate-100 text-slate-700 border border-slate-200",
    dot: "bg-slate-400",
  },
  1: {
    label: "Scheduled",
    badge: "bg-blue-50 text-blue-700 border border-blue-200",
    dot: "bg-blue-500",
  },
  2: {
    label: "Active",
    badge: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    dot: "bg-emerald-500",
  },
  3: {
    label: "Closed",
    badge: "bg-rose-50 text-rose-700 border border-rose-200",
    dot: "bg-rose-500",
  },
  4: {
    label: "Cancelled",
    badge: "bg-gray-100 text-gray-500 border border-gray-200",
    dot: "bg-gray-400",
  },
};

export const TIER_CONFIG: Record<number, { label: string; badge: string }> = {
  1: {
    label: "Tier 1",
    badge: "bg-amber-100 text-amber-800 border border-amber-300",
  },
  2: {
    label: "Tier 2",
    badge: "bg-indigo-100 text-indigo-800 border border-indigo-300",
  },
  3: {
    label: "Tier 3",
    badge: "bg-slate-100 text-slate-600 border border-slate-300",
  },
};

export const ROUND_TYPE_CONFIG: Record<
  string,
  { label: string; color: string }
> = {
  APTITUDE: { label: "Aptitude", color: "bg-purple-100 text-purple-700" },
  TECHNICAL: { label: "Technical", color: "bg-blue-100 text-blue-700" },
  HR: { label: "HR", color: "bg-pink-100 text-pink-700" },
  GD: { label: "GD", color: "bg-orange-100 text-orange-700" },
  ASSIGNMENT: { label: "Assignment", color: "bg-teal-100 text-teal-700" },
  OTHER: { label: "Other", color: "bg-gray-100 text-gray-600" },
};
