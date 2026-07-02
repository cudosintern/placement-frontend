import axiosInstance from "../../../utils/api";
import { PlacementApiEndpoint as ApiEndpoint, PlacementApiEndpoint } from "../../../utils/ApiEndpoint/placementApiEndpoint";
import {
  IEMStudentInfo,
  AllStudentRow,
  StudentProfile,
  StudentProfileCreatePayload,
  StudentProfileUpdatePayload,
  StudentSkill,
  StudentSkillCreatePayload,
  StudentSkillUpdatePayload,
  StudentCertification,
  StudentCertificationCreatePayload,
  StudentCertificationUpdatePayload,
  StudentCourse,
  StudentSgpaCgpa,
  StudentCgpa,
} from "./studentProfileTypes";

// ─── Helper ───────────────────────────────────────────────────────────────────

const unwrap = <T>(res: any): T => {
  // Backend returns { status: true/false, message: "...", data: ... }
  const response = res?.data;
  if (response && typeof response === "object" && "status" in response) {
    if (response.status === false) {
      throw new Error(response.message || "Request failed");
    }
    return response.data as T;
  }
  if (res?.data !== undefined) return res.data as T;
  return res as T;
};

// ═══════════════════════════════════════════════════════════════════════════════
//  STUDENTS (For dropdowns)
// ═══════════════════════════════════════════════════════════════════════════════

export const getStudents = async (): Promise<IEMStudentInfo[]> => {
  try {
    const res = await axiosInstance.get(
      ApiEndpoint.studentProfile.get_students
    );
    const data = unwrap<IEMStudentInfo[]>(res);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("studentProfileService.getStudents", err);
    return [];
  }
};

/**
 * Returns ALL students in iems_students with is_registered flag.
 * Used for the main student list page.
 */
export const getAllStudentsList = async (): Promise<AllStudentRow[]> => {
  try {
    const res = await axiosInstance.get(
      ApiEndpoint.studentProfile.get_all_students_list
    );
    const data = unwrap<AllStudentRow[]>(res);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("studentProfileService.getAllStudentsList", err);
    return [];
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
//  PROFILE
// ═══════════════════════════════════════════════════════════════════════════════

export const getProfiles = async (): Promise<StudentProfile[]> => {
  try {
    const res = await axiosInstance.get(
      ApiEndpoint.studentProfile.get_profile
    );
    const data = unwrap<StudentProfile[]>(res);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("studentProfileService.getProfiles", err);
    return [];
  }
};

export const getProfile = async (
  studentId: number
): Promise<StudentProfile | null> => {
  try {
    const res = await axiosInstance.get(
      `${ApiEndpoint.studentProfile.get_profile}?student_id=${studentId}`
    );
    const data = unwrap<StudentProfile[]>(res);
    return Array.isArray(data) ? (data[0] ?? null) : (data as any) ?? null;
  } catch (err) {
    console.error("studentProfileService.getProfile", err);
    return null;
  }
};

export const addProfile = async (
  payload: StudentProfileCreatePayload
): Promise<StudentProfile | null> => {
  try {
    const res = await axiosInstance.post(
      ApiEndpoint.studentProfile.add_profile,
      payload
    );
    return unwrap<StudentProfile>(res);
  } catch (err) {
    console.error("studentProfileService.addProfile", err);
    return null;
  }
};

export const updateProfile = async (
  payload: StudentProfileUpdatePayload
): Promise<StudentProfile | null> => {
  try {
    const res = await axiosInstance.put(
      ApiEndpoint.studentProfile.update_profile,
      payload
    );
    return unwrap<StudentProfile>(res);
  } catch (err) {
    console.error("studentProfileService.updateProfile", err);
    return null;
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
//  SKILLS
// ═══════════════════════════════════════════════════════════════════════════════

export const getSkills = async (
  studentId: number
): Promise<StudentSkill[]> => {
  try {
    const res = await axiosInstance.get(
      `${ApiEndpoint.studentProfile.get_skills}?student_id=${studentId}`
    );
    const data = unwrap<StudentSkill[]>(res);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("studentProfileService.getSkills", err);
    return [];
  }
};

export const addSkill = async (
  payload: StudentSkillCreatePayload
): Promise<StudentSkill | null> => {
  try {
    const res = await axiosInstance.post(
      ApiEndpoint.studentProfile.add_skill,
      payload
    );
    return unwrap<StudentSkill>(res);
  } catch (err) {
    console.error("studentProfileService.addSkill", err);
    return null;
  }
};

export const updateSkill = async (
  payload: StudentSkillUpdatePayload
): Promise<StudentSkill | null> => {
  try {
    const res = await axiosInstance.put(
      ApiEndpoint.studentProfile.update_skill,
      payload
    );
    return unwrap<StudentSkill>(res);
  } catch (err) {
    console.error("studentProfileService.updateSkill", err);
    return null;
  }
};

export const deleteSkill = async (skillId: number): Promise<boolean> => {
  try {
    await axiosInstance.delete(
      `${ApiEndpoint.studentProfile.delete_skill}?skill_id=${skillId}`
    );
    return true;
  } catch (err) {
    console.error("studentProfileService.deleteSkill", err);
    return false;
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
//  CERTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const getCertifications = async (
  studentId: number
): Promise<StudentCertification[]> => {
  try {
    const res = await axiosInstance.get(
      `${ApiEndpoint.studentProfile.get_certifications}?student_id=${studentId}`
    );
    const data = unwrap<StudentCertification[]>(res);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("studentProfileService.getCertifications", err);
    return [];
  }
};

export const addCertification = async (
  payload: StudentCertificationCreatePayload
): Promise<StudentCertification | null> => {
  try {
    const res = await axiosInstance.post(
      ApiEndpoint.studentProfile.add_certification,
      payload
    );
    return unwrap<StudentCertification>(res);
  } catch (err) {
    console.error("studentProfileService.addCertification", err);
    return null;
  }
};

export const updateCertification = async (
  payload: StudentCertificationUpdatePayload
): Promise<StudentCertification | null> => {
  try {
    const res = await axiosInstance.put(
      ApiEndpoint.studentProfile.update_certification,
      payload
    );
    return unwrap<StudentCertification>(res);
  } catch (err) {
    console.error("studentProfileService.updateCertification", err);
    return null;
  }
};

export const deleteCertification = async (
  certificationId: number
): Promise<boolean> => {
  try {
    await axiosInstance.delete(
      `${ApiEndpoint.studentProfile.delete_certification}?certification_id=${certificationId}`
    );
    return true;
  } catch (err) {
    console.error("studentProfileService.deleteCertification", err);
    return false;
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
//  STUDENT ACADEMIC DATA
// ═══════════════════════════════════════════════════════════════════════════════

export const getStudentCourses = async (
  regno: string
): Promise<StudentCourse[]> => {
  try {
    const res = await axiosInstance.get(
      `${ApiEndpoint.studentProfile.get_student_courses}?regno=${regno}`
    );
    const data = unwrap<StudentCourse[]>(res);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("studentProfileService.getStudentCourses", err);
    return [];
  }
};

export const getStudentSgpaCgpa = async (
  regno: string
): Promise<StudentSgpaCgpa[]> => {
  try {
    const res = await axiosInstance.get(
      `${ApiEndpoint.studentProfile.get_student_sgpa_cgpa}?regno=${regno}`
    );
    const data = unwrap<StudentSgpaCgpa[]>(res);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("studentProfileService.getStudentSgpaCgpa", err);
    return [];
  }
};

export const getStudentCgpa = async (
  regno: string
): Promise<StudentCgpa | null> => {
  try {
    const res = await axiosInstance.get(
      `${ApiEndpoint.studentProfile.get_student_cgpa}?regno=${regno}`
    );
    const data = unwrap<StudentCgpa | null>(res);
    return data ?? null;
  } catch (err) {
    console.error("studentProfileService.getStudentCgpa", err);
    return null;
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
//  RESUME (PLM-BE-008)
// ═══════════════════════════════════════════════════════════════════════════════

export interface StudentResume {
  resume_id: number;
  profile_id: number;
  student_id: number;
  file_name: string;
  stored_name: string;
  file_path: string;
  file_size_kb: number | null;
  is_active: number;
  status: number;
  created_date: string | null;
  modified_date: string | null;
}

/**
 * Upload a PDF resume for a student profile.
 * Uses multipart/form-data so the binary file is sent correctly.
 */
export const uploadResume = async (
  profileId: number,
  studentId: number,
  file: File
): Promise<StudentResume | null> => {
  try {
    const formData = new FormData();
    formData.append("profile_id", String(profileId));
    formData.append("student_id", String(studentId));
    formData.append("file", file);

    const res = await axiosInstance.post(
      ApiEndpoint.studentProfile.upload_resume,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return unwrap<StudentResume>(res);
  } catch (err) {
    console.error("studentProfileService.uploadResume", err);
    return null;
  }
};

/** Fetch all resumes for a student (latest first). */
export const getResumes = async (
  studentId: number
): Promise<StudentResume[]> => {
  try {
    const res = await axiosInstance.get(
      `${ApiEndpoint.studentProfile.get_resumes}?student_id=${studentId}`
    );
    const data = unwrap<StudentResume[]>(res);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("studentProfileService.getResumes", err);
    return [];
  }
};

/** Mark a specific resume as active (deactivates others). */
export const setActiveResume = async (
  resumeId: number
): Promise<StudentResume | null> => {
  try {
    const res = await axiosInstance.put(
      `${ApiEndpoint.studentProfile.set_active_resume}?resume_id=${resumeId}`
    );
    return unwrap<StudentResume>(res);
  } catch (err) {
    console.error("studentProfileService.setActiveResume", err);
    return null;
  }
};

/** Soft-delete a resume. */
export const deleteResume = async (resumeId: number): Promise<boolean> => {
  try {
    await axiosInstance.delete(
      `${ApiEndpoint.studentProfile.delete_resume}?resume_id=${resumeId}`
    );
    return true;
  } catch (err) {
    console.error("studentProfileService.deleteResume", err);
    return false;
  }
};

/**
 * Open a resume PDF in a new browser tab using authenticated fetch.
 * The download_resume endpoint requires auth headers, so a plain <a href>
 * won't work — we must fetch it via axiosInstance and create a blob URL.
 */
export const openResumePdf = async (resumeId: number): Promise<void> => {
  try {
    const res = await axiosInstance.get(
      `${ApiEndpoint.studentProfile.download_resume}?resume_id=${resumeId}`,
      { responseType: "blob" }
    );
    const blob = new Blob([res.data as BlobPart], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    // Revoke the object URL after the window has loaded to free memory
    if (win) {
      win.onload = () => URL.revokeObjectURL(url);
    } else {
      // Popup was blocked — create a temp link and click it
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.download = `resume_${resumeId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    }
  } catch (err) {
    console.error("openResumePdf error:", err);
    throw err;
  }
};

/**
 * Fetch a resume PDF and return a blob URL suitable for use in an <iframe>.
 * Caller is responsible for calling URL.revokeObjectURL(url) when done.
 */
export const getResumeBlobUrl = async (resumeId: number): Promise<string> => {
  const res = await axiosInstance.get(
    `${ApiEndpoint.studentProfile.download_resume}?resume_id=${resumeId}`,
    { responseType: "blob" }
  );
  const blob = new Blob([res.data as BlobPart], { type: "application/pdf" });
  return URL.createObjectURL(blob);
};

/** @deprecated Use openResumePdf instead */
export const getResumeDownloadUrl = (_resumeId: number): string => "";

// ═══════════════════════════════════════════════════════════════════════════════
//  PLACEMENT DRIVES (for AvailableDrivesPage)
// ═══════════════════════════════════════════════════════════════════════════════

export interface DriveEligibleBranch {
  id: number;
  drive_id: number;
  dept_id: number;
  dept_name: string;
  dept_acronym: string;
  batch_year: number;
}

export interface DriveRound {
  round_id: number;
  round_number: number;
  round_name: string;
  round_type: string;
  is_eliminatory: boolean;
  round_date: string | null;
  duration_minutes: number | null;
  description: string | null;
}

export interface DriveListItem {
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
  // Populated by detail endpoint
  job_description?: string;
  eligible_branches?: DriveEligibleBranch[];
  rounds?: DriveRound[];
}

/** Fetch active drives (status=2) for the Available Drives page. */
export const getActiveDrives = async (): Promise<DriveListItem[]> => {
  try {
    const res = await axiosInstance.get(
      `${PlacementApiEndpoint.drive.list}?status=2`
    );
    const raw = unwrap<{ drives: DriveListItem[] }>(res);
    return Array.isArray(raw?.drives) ? raw.drives : [];
  } catch (err) {
    console.error("studentProfileService.getActiveDrives", err);
    return [];
  }
};

/** Fetch full drive detail including eligible_branches and rounds. */
export const getDriveDetail = async (driveId: number): Promise<DriveListItem | null> => {
  try {
    const res = await axiosInstance.get(
      `${PlacementApiEndpoint.drive.detail}/${driveId}`
    );
    return unwrap<DriveListItem>(res);
  } catch (err) {
    console.error("studentProfileService.getDriveDetail", err);
    return null;
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
//  STUDENT DRIVE APPLICATIONS  (plm_application)
// ═══════════════════════════════════════════════════════════════════════════════

export interface StudentApplication {
  application_id: number;
  drive_id:       number;
  profile_id:     number;
  resume_id:      number | null;
  status:         "APPLIED" | "SHORTLISTED" | "WAITLISTED" | "IN_PROCESS" | "OFFERED" | "REJECTED" | "WITHDRAWN";
  is_eligible:    number;
  applied_at:     string | null;
}

/** Map a backend status string → frontend ApplyStatus used in AvailableDrivesPage */
export const mapAppStatus = (
  s: StudentApplication["status"]
): "not_applied" | "applied" | "shortlisted" | "rejected" => {
  if (s === "APPLIED" || s === "WAITLISTED" || s === "IN_PROCESS") return "applied";
  if (s === "SHORTLISTED" || s === "OFFERED") return "shortlisted";
  if (s === "REJECTED") return "rejected";
  return "not_applied"; // WITHDRAWN
};

/**
 * Apply to a drive.
 * profile_id comes from plm_student_profile.profile_id (NOT iems_students.student_id).
 * resume_id is optional — pass the student's active resume_id from plm_student_resume.
 */
export const applyToDrive = async (
  driveId:   number,
  profileId: number,
  resumeId?: number | null,
): Promise<StudentApplication | null> => {
  try {
    const res = await axiosInstance.post(PlacementApiEndpoint.studentDrive.apply, {
      drive_id:   driveId,
      profile_id: profileId,
      resume_id:  resumeId ?? null,
    });
    return unwrap<StudentApplication>(res);
  } catch (err) {
    console.error("studentProfileService.applyToDrive", err);
    return null;
  }
};

/**
 * Withdraw an application from a drive.
 */
export const withdrawFromDrive = async (
  driveId:   number,
  profileId: number,
): Promise<StudentApplication | null> => {
  try {
    const res = await axiosInstance.delete(
      `${PlacementApiEndpoint.studentDrive.apply}?drive_id=${driveId}&profile_id=${profileId}`
    );
    return unwrap<StudentApplication>(res);
  } catch (err) {
    console.error("studentProfileService.withdrawFromDrive", err);
    return null;
  }
};

/**
 * Fetch all applications for a student profile.
 * Used on page load to pre-populate Apply/Applied/Shortlisted badges.
 */
export const getMyApplications = async (
  profileId: number,
): Promise<StudentApplication[]> => {
  try {
    const res = await axiosInstance.get(
      `${PlacementApiEndpoint.studentDrive.my_applications}?profile_id=${profileId}`
    );
    const data = unwrap<StudentApplication[]>(res);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("studentProfileService.getMyApplications", err);
    return [];
  }
};
