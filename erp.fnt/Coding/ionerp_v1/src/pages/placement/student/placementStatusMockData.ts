/**
 * placementStatusMockData.ts
 * ===========================
 * Dummy in-memory data for Placement Status Management page.
 * Mirrors what the real backend tables will return:
 *   - plm_student_profile  (profile info, offer lock, placement status)
 *   - iems_students        (name, usno, department)
 *   - plm_application      (applications per student)
 *   - plm_drive            (company + role info)
 *
 * TODO: Replace with real API calls after backend is ready.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type PlacementStatus =
  | "OFFER_PENDING"    // got an OFFERED application, awaiting acceptance
  | "PLACED"           // confirmed placed (accepted offer)
  | "OPTED_OUT";       // student voluntarily opted out of placement

export type ApplicationStatus =
  | "APPLIED"
  | "SHORTLISTED"
  | "WAITLISTED"
  | "IN_PROCESS"
  | "OFFERED"
  | "REJECTED"
  | "WITHDRAWN";

export interface MockPlacementApplication {
  application_id: number;
  drive_id: number;
  company_name: string;
  job_role: string;
  ctc_lpa: number | null;
  drive_type: "On-Campus" | "Off-Campus" | "Pool Campus";
  applied_at: string;
  status: ApplicationStatus;
}

export interface MockPlacementStudent {
  // from iems_students
  student_id: number;
  name: string;
  usno: string;
  regno: string;
  department: string;
  department_id: number;
  batch: string;              // e.g. "2020–2024"
  email: string;
  mobile: string;

  // from plm_student_profile
  profile_id: number;
  current_cgpa: number;
  backlogs: number;
  is_placement_eligible: 0 | 1;  // 1=eligible, 0=ineligible (frozen by TPO)
  preferred_locations: string;

  // Placement Status fields (new — to be added to plm_student_profile)
  placement_status: PlacementStatus;
  placed_company: string | null;      // filled when PLACED
  placed_role: string | null;
  offer_ctc_lpa: number | null;
  offer_date: string | null;
  offer_letter_path: string | null;
  opted_out_reason: string | null;    // filled when OPTED_OUT
  is_offer_locked: boolean;           // true = cannot apply to more drives

  // TPO notes
  tpo_remarks: string;
  last_updated: string;

  // applications list
  applications: MockPlacementApplication[];
}

// ─── Dummy Data ───────────────────────────────────────────────────────────────

let _students: MockPlacementStudent[] = [
  // ── 1. Placed student (offer accepted, locked) ────────────────────────────
  {
    student_id: 101,
    name: "Rahul Sharma",
    usno: "1SI21CS101",
    regno: "21CSE101",
    department: "Computer Science & Engineering",
    department_id: 1,
    batch: "2021–2025",
    email: "rahul.sharma@siet.ac.in",
    mobile: "9876543210",
    profile_id: 1,
    current_cgpa: 8.75,
    backlogs: 0,
    is_placement_eligible: 1,
    preferred_locations: "Bengaluru, Hyderabad",
    placement_status: "PLACED",
    placed_company: "Infosys",
    placed_role: "Systems Engineer",
    offer_ctc_lpa: 6.5,
    offer_date: "2025-03-10",
    offer_letter_path: "/resumes/rahul_infosys_offer.pdf",
    opted_out_reason: null,
    is_offer_locked: true,
    tpo_remarks: "Confirmed placed. Offer letter collected.",
    last_updated: "2025-03-12",
    applications: [
      {
        application_id: 1001,
        drive_id: 10,
        company_name: "Infosys",
        job_role: "Systems Engineer",
        ctc_lpa: 6.5,
        drive_type: "On-Campus",
        applied_at: "2025-01-15",
        status: "OFFERED",
      },
      {
        application_id: 1002,
        drive_id: 11,
        company_name: "Wipro",
        job_role: "Project Engineer",
        ctc_lpa: 5.5,
        drive_type: "On-Campus",
        applied_at: "2025-01-20",
        status: "REJECTED",
      },
    ],
  },

  // ── 2. Offer Pending (OFFERED but TPO hasn't confirmed yet) ───────────────
  {
    student_id: 102,
    name: "Priya Nair",
    usno: "1SI21CS102",
    regno: "21CSE102",
    department: "Computer Science & Engineering",
    department_id: 1,
    batch: "2021–2025",
    email: "priya.nair@siet.ac.in",
    mobile: "9123456780",
    profile_id: 2,
    current_cgpa: 9.10,
    backlogs: 0,
    is_placement_eligible: 1,
    preferred_locations: "Bengaluru, Pune",
    placement_status: "OFFER_PENDING",
    placed_company: "TCS",
    placed_role: "Software Developer",
    offer_ctc_lpa: 7.0,
    offer_date: "2025-04-02",
    offer_letter_path: null,
    opted_out_reason: null,
    is_offer_locked: true,
    tpo_remarks: "Offer received. Awaiting student confirmation.",
    last_updated: "2025-04-03",
    applications: [
      {
        application_id: 1003,
        drive_id: 12,
        company_name: "TCS",
        job_role: "Software Developer",
        ctc_lpa: 7.0,
        drive_type: "On-Campus",
        applied_at: "2025-02-01",
        status: "OFFERED",
      },
      {
        application_id: 1004,
        drive_id: 13,
        company_name: "Cognizant",
        job_role: "Programmer Analyst",
        ctc_lpa: 5.0,
        drive_type: "On-Campus",
        applied_at: "2025-02-10",
        status: "SHORTLISTED",
      },
    ],
  },

  // ── 3. Not Placed (applied but no offers yet) ─────────────────────────────
  {
    student_id: 103,
    name: "Arjun Mehta",
    usno: "1SI21EC201",
    regno: "21ECE201",
    department: "Electronics & Communication Engineering",
    department_id: 2,
    batch: "2021–2025",
    email: "arjun.mehta@siet.ac.in",
    mobile: "9988776655",
    profile_id: 3,
    current_cgpa: 7.80,
    backlogs: 1,
    is_placement_eligible: 1,
    preferred_locations: "Bengaluru",
    placement_status: "PLACED",
    placed_company: "Wipro",
    placed_role: "Project Engineer",
    offer_ctc_lpa: 4.5,
    offer_date: "2025-03-25",
    offer_letter_path: null,
    opted_out_reason: null,
    is_offer_locked: false,
    tpo_remarks: "",
    last_updated: "2025-03-20",
    applications: [
      {
        application_id: 1005,
        drive_id: 14,
        company_name: "L&T Technology Services",
        job_role: "Graduate Engineer Trainee",
        ctc_lpa: 5.5,
        drive_type: "Off-Campus",
        applied_at: "2025-02-15",
        status: "REJECTED",
      },
      {
        application_id: 1006,
        drive_id: 15,
        company_name: "Bosch",
        job_role: "Associate Engineer",
        ctc_lpa: 6.0,
        drive_type: "On-Campus",
        applied_at: "2025-03-01",
        status: "IN_PROCESS",
      },
    ],
  },

  // ── 4. Opted Out ──────────────────────────────────────────────────────────
  {
    student_id: 104,
    name: "Sneha Reddy",
    usno: "1SI21IS301",
    regno: "21ISE301",
    department: "Information Science & Engineering",
    department_id: 3,
    batch: "2021–2025",
    email: "sneha.reddy@siet.ac.in",
    mobile: "9001122334",
    profile_id: 4,
    current_cgpa: 8.40,
    backlogs: 0,
    is_placement_eligible: 0,
    preferred_locations: "Bengaluru",
    placement_status: "OPTED_OUT",
    placed_company: null,
    placed_role: null,
    offer_ctc_lpa: null,
    offer_date: null,
    offer_letter_path: null,
    opted_out_reason: "Pursuing higher education (MTech at IIT Bombay).",
    is_offer_locked: false,
    tpo_remarks: "Student opted out for higher studies. Confirmed via email.",
    last_updated: "2025-01-28",
    applications: [],
  },

  // ── 5. Not Placed (fresh, no applications) ────────────────────────────────
  {
    student_id: 105,
    name: "Kiran Patil",
    usno: "1SI21ME401",
    regno: "21MEE401",
    department: "Mechanical Engineering",
    department_id: 4,
    batch: "2021–2025",
    email: "kiran.patil@siet.ac.in",
    mobile: "9876100200",
    profile_id: 5,
    current_cgpa: 7.20,
    backlogs: 2,
    is_placement_eligible: 1,
    preferred_locations: "Pune, Mumbai",
    placement_status: "PLACED",
    placed_company: "TVS Motors",
    placed_role: "Design Engineer",
    offer_ctc_lpa: 5.5,
    offer_date: "2025-03-10",
    offer_letter_path: null,
    opted_out_reason: null,
    is_offer_locked: false,
    tpo_remarks: "Backlog issue. Counselled to clear before next drive.",
    last_updated: "2025-03-05",
    applications: [
      {
        application_id: 1007,
        drive_id: 16,
        company_name: "Mahindra & Mahindra",
        job_role: "Junior Engineer",
        ctc_lpa: 5.0,
        drive_type: "On-Campus",
        applied_at: "2025-03-01",
        status: "APPLIED",
      },
    ],
  },

  // ── 6. Placed (high CTC) ──────────────────────────────────────────────────
  {
    student_id: 106,
    name: "Ananya Iyer",
    usno: "1SI21CS106",
    regno: "21CSE106",
    department: "Computer Science & Engineering",
    department_id: 1,
    batch: "2021–2025",
    email: "ananya.iyer@siet.ac.in",
    mobile: "9820091234",
    profile_id: 6,
    current_cgpa: 9.50,
    backlogs: 0,
    is_placement_eligible: 1,
    preferred_locations: "Bengaluru, Mumbai",
    placement_status: "PLACED",
    placed_company: "Google India",
    placed_role: "Software Engineer (L3)",
    offer_ctc_lpa: 42.0,
    offer_date: "2025-02-20",
    offer_letter_path: "/resumes/ananya_google_offer.pdf",
    opted_out_reason: null,
    is_offer_locked: true,
    tpo_remarks: "Highest package this year. Offer letter verified.",
    last_updated: "2025-02-22",
    applications: [
      {
        application_id: 1008,
        drive_id: 17,
        company_name: "Google India",
        job_role: "Software Engineer (L3)",
        ctc_lpa: 42.0,
        drive_type: "On-Campus",
        applied_at: "2024-11-10",
        status: "OFFERED",
      },
      {
        application_id: 1009,
        drive_id: 18,
        company_name: "Microsoft India",
        job_role: "SDE-I",
        ctc_lpa: 32.0,
        drive_type: "On-Campus",
        applied_at: "2024-11-15",
        status: "WITHDRAWN",
      },
    ],
  },

  // ── 7. Offer Pending (multiple offers) ────────────────────────────────────
  {
    student_id: 107,
    name: "Varun Kumar",
    usno: "1SI21CS107",
    regno: "21CSE107",
    department: "Computer Science & Engineering",
    department_id: 1,
    batch: "2021–2025",
    email: "varun.kumar@siet.ac.in",
    mobile: "9701234560",
    profile_id: 7,
    current_cgpa: 8.90,
    backlogs: 0,
    is_placement_eligible: 1,
    preferred_locations: "Bengaluru, Chennai",
    placement_status: "OFFER_PENDING",
    placed_company: "Accenture",
    placed_role: "Associate Software Engineer",
    offer_ctc_lpa: 8.0,
    offer_date: "2025-04-05",
    offer_letter_path: null,
    opted_out_reason: null,
    is_offer_locked: true,
    tpo_remarks: "Two offers received. Student to choose one by April 15.",
    last_updated: "2025-04-06",
    applications: [
      {
        application_id: 1010,
        drive_id: 19,
        company_name: "Accenture",
        job_role: "Associate Software Engineer",
        ctc_lpa: 8.0,
        drive_type: "On-Campus",
        applied_at: "2025-01-25",
        status: "OFFERED",
      },
      {
        application_id: 1011,
        drive_id: 20,
        company_name: "Capgemini",
        job_role: "Software Analyst",
        ctc_lpa: 7.5,
        drive_type: "Pool Campus",
        applied_at: "2025-02-08",
        status: "OFFERED",
      },
    ],
  },

  // ── 8. Not Placed (eligible, actively applying) ───────────────────────────
  {
    student_id: 108,
    name: "Divya Menon",
    usno: "1SI21CV501",
    regno: "21CVE501",
    department: "Civil Engineering",
    department_id: 5,
    batch: "2021–2025",
    email: "divya.menon@siet.ac.in",
    mobile: "9654321001",
    profile_id: 8,
    current_cgpa: 8.10,
    backlogs: 0,
    is_placement_eligible: 1,
    preferred_locations: "Bengaluru, Delhi",
    placement_status: "PLACED",
    placed_company: "L&T Construction",
    placed_role: "Site Engineer",
    offer_ctc_lpa: 6.0,
    offer_date: "2025-04-02",
    offer_letter_path: null,
    opted_out_reason: null,
    is_offer_locked: false,
    tpo_remarks: "",
    last_updated: "2025-04-01",
    applications: [
      {
        application_id: 1012,
        drive_id: 21,
        company_name: "Larsen & Toubro",
        job_role: "Graduate Engineer Trainee",
        ctc_lpa: 6.5,
        drive_type: "On-Campus",
        applied_at: "2025-03-20",
        status: "SHORTLISTED",
      },
    ],
  },
];

// ─── Store API (mimics service layer) ─────────────────────────────────────────

export const placementStatusStore = {
  getAll(): MockPlacementStudent[] {
    return [..._students];
  },

  getById(student_id: number): MockPlacementStudent | null {
    return _students.find((s) => s.student_id === student_id) ?? null;
  },

  updateStatus(
    student_id: number,
    patch: Partial<
      Pick<
        MockPlacementStudent,
        | "placement_status"
        | "placed_company"
        | "placed_role"
        | "offer_ctc_lpa"
        | "offer_date"
        | "opted_out_reason"
        | "is_offer_locked"
        | "is_placement_eligible"
        | "tpo_remarks"
      >
    >
  ): MockPlacementStudent | null {
    _students = _students.map((s) =>
      s.student_id === student_id
        ? { ...s, ...patch, last_updated: new Date().toISOString().slice(0, 10) }
        : s
    );
    return _students.find((s) => s.student_id === student_id) ?? null;
  },

  toggleOfferLock(student_id: number): MockPlacementStudent | null {
    _students = _students.map((s) =>
      s.student_id === student_id
        ? { ...s, is_offer_locked: !s.is_offer_locked, last_updated: new Date().toISOString().slice(0, 10) }
        : s
    );
    return _students.find((s) => s.student_id === student_id) ?? null;
  },

  toggleEligibility(student_id: number): MockPlacementStudent | null {
    _students = _students.map((s) =>
      s.student_id === student_id
        ? {
            ...s,
            is_placement_eligible: s.is_placement_eligible === 1 ? 0 : 1,
            last_updated: new Date().toISOString().slice(0, 10),
          }
        : s
    );
    return _students.find((s) => s.student_id === student_id) ?? null;
  },
};
