// ─── IEM Student Info (For Dropdowns) ───────────────────────────────────────────

export interface IEMStudentInfo {
  student_id: number;
  name: string;
  usno: string;
  department_id?: number;
}

// ─── All Students List Row (includes is_registered flag) ─────────────────────

export interface AllStudentRow {
  student_id: number;
  name: string;
  usno: string;
  regno?: string | null;
  department_id?: number | null;
  department_name?: string | null;
  email?: string | null;
  is_registered: boolean;
  // Only filled when is_registered = true
  profile_id?: number | null;
  current_cgpa?: number | null;
  backlogs?: number | null;
  is_placement_eligible?: number | null;
  status?: number | null;
  // Always from iems_cgpa (academic result)
  cgpa_actual?: number | null;
}

// ─── Student Profile ──────────────────────────────────────────────────────────

export interface StudentProfile {
  profile_id: number;
  student_id: number;
  student_name?: string | null;
  usno?: string | null;
  regno?: string | null;
  email?: string | null;
  department_id?: number | null;
  department_name?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  portfolio_url?: string | null;
  resume_path?: string | null;
  current_cgpa?: number | null;
  backlogs?: number | null;
  is_placement_eligible?: number | null; // 1 = yes, 0 = no
  career_objective?: string | null;
  preferred_locations?: string | null;
  status?: number | null;
  created_date?: string | null;
  modified_date?: string | null;
}

export interface StudentProfileCreatePayload {
  student_id: number;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  resume_path?: string;
  current_cgpa?: number;
  backlogs?: number;
  is_placement_eligible?: number;
  career_objective?: string;
  preferred_locations?: string;
  status?: number;
}

export interface StudentProfileUpdatePayload {
  profile_id: number;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  resume_path?: string;
  current_cgpa?: number;
  backlogs?: number;
  is_placement_eligible?: number;
  career_objective?: string;
  preferred_locations?: string;
  status?: number;
}

// ─── Student Skill ────────────────────────────────────────────────────────────

export type ProficiencyLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export interface StudentSkill {
  skill_id: number;
  profile_id: number;
  student_id: number;
  skill_name: string;
  proficiency_level?: ProficiencyLevel | null;
  status?: number | null;
  created_date?: string | null;
  modified_date?: string | null;
}

export interface StudentSkillCreatePayload {
  profile_id: number;
  student_id: number;
  skill_name: string;
  proficiency_level?: ProficiencyLevel;
  status?: number;
}

export interface StudentSkillUpdatePayload {
  skill_id: number;
  skill_name?: string;
  proficiency_level?: ProficiencyLevel;
  status?: number;
}

// ─── Student Certification ────────────────────────────────────────────────────

export interface StudentCertification {
  certification_id: number;
  profile_id: number;
  student_id: number;
  certification_name: string;
  issuing_organization?: string | null;
  issue_date?: string | null;
  expiry_date?: string | null;
  credential_id?: string | null;
  credential_url?: string | null;
  status?: number | null;
  created_date?: string | null;
  modified_date?: string | null;
}

export interface StudentCertificationCreatePayload {
  profile_id: number;
  student_id: number;
  certification_name: string;
  issuing_organization?: string;
  issue_date?: string;
  expiry_date?: string;
  credential_id?: string;
  credential_url?: string;
  status?: number;
}

export interface StudentCertificationUpdatePayload {
  certification_id: number;
  certification_name?: string;
  issuing_organization?: string;
  issue_date?: string;
  expiry_date?: string;
  credential_id?: string;
  credential_url?: string;
  status?: number;
}

// ─── Student Course (Academic Record) ─────────────────────────────────────────

export interface StudentCourse {
  id: number;
  regno: string;
  usno: string;
  attendance_approved?: number | null;
  attendance_eligibility?: string | null;
  cia_approved?: number | null;
  cia_eligibility?: string | null;
  is_evaluated?: number | null;
  org_id: number;
  program_id?: number | null;
  batch_id?: number | null;
  batch_cycle_id?: number | null;
  crs_code: string;
  section?: string | null;
  semester?: number | null;
  result_year?: string | null;
  total_cia?: number | null;
  see1?: number | null;
  see?: number | null;
  see_actual?: number | null;
  cia_see?: number | null;
  credits_earned?: number | null;
  is_see_consolidate?: number | null;
  is_grade_evaluated?: number | null;
  grade?: string | null;
  grade_point?: string | null;
  grade_actual?: string | null;
  updated_at?: string | null;
  updated_by?: number | null;
}

// ─── Student SGPA/CGPA ───────────────────────────────────────────────────────

export interface StudentSgpaCgpa {
  id: number;
  regno: string;
  program_id: number;
  sem?: number | null;
  sgpa?: number | null;
  cgpa?: number | null;
  result_year?: string | null;
  consider?: number | null;
  org_id: number;
}

// ─── Student CGPA ────────────────────────────────────────────────────────────

export interface StudentCgpa {
  id: number;
  regno: string;
  program_id: number;
  cgpa?: number | null;
  result_year?: string | null;
  org_id: number;
}
