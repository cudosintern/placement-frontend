/**
 * studentMockStore.ts
 *
 * A shared in-memory "database" for the Student Placement Module (frontend only).
 * All pages (Registration, Profile, Skills, Certifications) read/write from here.
 * Data is keyed by student_id so every record knows which student it belongs to.
 *
 * NOTE: This is a module-level singleton — data persists as long as the browser
 *       tab is open. When the user navigates between pages (SPA), all data stays.
 *       Backend API wiring will replace these functions later.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MockStudent {
  id: number;
  student_name: string;
  usn: string;
  email: string;
  phone: string;
  department: string;
  semester: string;
  cgpa: string;
  passing_year: string;
  technical_skills: string;
  linkedin_url: string;
  github_url: string;
  career_objective: string;
  registered_on: string;
  status: "Active" | "Inactive";
}

export type MockProficiency = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export interface MockSkill {
  skill_id: number;
  student_id: number; // ← links to MockStudent.id
  skill_name: string;
  proficiency_level: MockProficiency;
  years_of_experience: number;
  created_date: string;
}

export interface MockCertification {
  certification_id: number;
  student_id: number; // ← links to MockStudent.id
  certification_name: string;
  issuing_organization: string;
  issue_date: string;
  expiry_date: string;
  credential_id: string;
  credential_url: string;
  cert_status: "Active" | "Expired"; // renamed to avoid clash with numeric status
}

// ─── Initial Dummy Data ───────────────────────────────────────────────────────

let _students: MockStudent[] = [
  {
    id: 1,
    student_name: "Rahul Sharma",
    usn: "1SI20CS101",
    email: "rahul.sharma@example.com",
    phone: "9876543210",
    department: "Computer Science & Engineering",
    semester: "8",
    cgpa: "8.75",
    passing_year: "2024",
    technical_skills: "Java, Python, React, SQL",
    linkedin_url: "https://linkedin.com/in/rahulsharma",
    github_url: "https://github.com/rahulsharma",
    career_objective: "To build scalable software solutions and contribute to impactful products.",
    registered_on: "2024-01-10",
    status: "Active",
  },
  {
    id: 2,
    student_name: "Priya Nair",
    usn: "1SI20CS102",
    email: "priya.nair@example.com",
    phone: "9876500001",
    department: "Information Science & Engineering",
    semester: "7",
    cgpa: "9.10",
    passing_year: "2025",
    technical_skills: "Machine Learning, Python, TensorFlow",
    linkedin_url: "https://linkedin.com/in/priyanair",
    github_url: "https://github.com/priyanair",
    career_objective: "AI/ML engineer passionate about data-driven solutions.",
    registered_on: "2024-02-05",
    status: "Active",
  },
  {
    id: 3,
    student_name: "Arjun Mehta",
    usn: "1SI20EC201",
    email: "arjun.mehta@example.com",
    phone: "9123456789",
    department: "Electronics & Communication Engineering",
    semester: "8",
    cgpa: "7.80",
    passing_year: "2024",
    technical_skills: "Embedded C, VLSI, Arduino",
    linkedin_url: "",
    github_url: "https://github.com/arjunmehta",
    career_objective: "Embedded systems developer focused on IoT solutions.",
    registered_on: "2024-03-15",
    status: "Inactive",
  },
];

let _skills: MockSkill[] = [
  // Rahul's skills (student_id: 1)
  { skill_id: 101, student_id: 1, skill_name: "Python", proficiency_level: "ADVANCED", years_of_experience: 3, created_date: "2024-01-10" },
  { skill_id: 102, student_id: 1, skill_name: "React", proficiency_level: "INTERMEDIATE", years_of_experience: 2, created_date: "2024-01-12" },
  { skill_id: 103, student_id: 1, skill_name: "Java", proficiency_level: "INTERMEDIATE", years_of_experience: 2, created_date: "2024-01-15" },
  { skill_id: 104, student_id: 1, skill_name: "SQL", proficiency_level: "ADVANCED", years_of_experience: 3, created_date: "2024-02-01" },

  // Priya's skills (student_id: 2)
  { skill_id: 201, student_id: 2, skill_name: "Machine Learning", proficiency_level: "ADVANCED", years_of_experience: 2, created_date: "2024-01-05" },
  { skill_id: 202, student_id: 2, skill_name: "Python", proficiency_level: "ADVANCED", years_of_experience: 3, created_date: "2024-01-08" },
  { skill_id: 203, student_id: 2, skill_name: "TensorFlow", proficiency_level: "INTERMEDIATE", years_of_experience: 1, created_date: "2024-02-10" },
  { skill_id: 204, student_id: 2, skill_name: "Data Visualization", proficiency_level: "BEGINNER", years_of_experience: 1, created_date: "2024-03-01" },

  // Arjun's skills (student_id: 3)
  { skill_id: 301, student_id: 3, skill_name: "Embedded C", proficiency_level: "ADVANCED", years_of_experience: 3, created_date: "2024-01-20" },
  { skill_id: 302, student_id: 3, skill_name: "VLSI Design", proficiency_level: "INTERMEDIATE", years_of_experience: 2, created_date: "2024-02-15" },
  { skill_id: 303, student_id: 3, skill_name: "Arduino", proficiency_level: "BEGINNER", years_of_experience: 1, created_date: "2024-03-10" },
];

let _certifications: MockCertification[] = [
  // Rahul's certifications (student_id: 1)
  {
    certification_id: 101,
    student_id: 1,
    certification_name: "AWS Certified Cloud Practitioner",
    issuing_organization: "Amazon Web Services",
    issue_date: "2023-05-15",
    expiry_date: "2026-05-15",
    credential_id: "AWS-CLF-C01-123456",
    credential_url: "https://www.credly.com/badges/aws-clf",
    cert_status: "Active",
  },
  {
    certification_id: 102,
    student_id: 1,
    certification_name: "Meta Front-End Developer Certificate",
    issuing_organization: "Meta / Coursera",
    issue_date: "2024-01-05",
    expiry_date: "",
    credential_id: "META-FE-321654",
    credential_url: "https://www.coursera.org/verify/META-FE",
    cert_status: "Active",
  },

  // Priya's certifications (student_id: 2)
  {
    certification_id: 201,
    student_id: 2,
    certification_name: "Google Data Analytics Certificate",
    issuing_organization: "Google / Coursera",
    issue_date: "2023-08-20",
    expiry_date: "",
    credential_id: "GCC-DA-789012",
    credential_url: "https://www.coursera.org/verify/GCC-DA",
    cert_status: "Active",
  },
  {
    certification_id: 202,
    student_id: 2,
    certification_name: "TensorFlow Developer Certificate",
    issuing_organization: "Google",
    issue_date: "2024-02-10",
    expiry_date: "2027-02-10",
    credential_id: "TF-DEV-445566",
    credential_url: "https://www.tensorflow.org/certificate",
    cert_status: "Active",
  },

  // Arjun's certifications (student_id: 3)
  {
    certification_id: 301,
    student_id: 3,
    certification_name: "Oracle Java SE 11 Developer",
    issuing_organization: "Oracle Corporation",
    issue_date: "2022-03-10",
    expiry_date: "2024-03-10",
    credential_id: "OCP-JAVA11-456789",
    credential_url: "https://catalog-education.oracle.com/ocp-java11",
    cert_status: "Expired",
  },
];

// ─── Helper ───────────────────────────────────────────────────────────────────

const computeCertStatus = (expiry: string): "Active" | "Expired" => {
  if (!expiry) return "Active";
  return new Date(expiry) < new Date() ? "Expired" : "Active";
};

// ─── Store API ────────────────────────────────────────────────────────────────

export const studentStore = {
  // ── Students ────────────────────────────────────────────────────────────────

  getStudents(): MockStudent[] {
    return [..._students];
  },

  getStudent(id: number): MockStudent | null {
    return _students.find((s) => s.id === id) ?? null;
  },

  addStudent(data: Omit<MockStudent, "id">): MockStudent {
    const newStudent: MockStudent = { ...data, id: Date.now() };
    _students = [newStudent, ..._students];
    return newStudent;
  },

  updateStudent(id: number, data: Partial<Omit<MockStudent, "id">>): MockStudent | null {
    _students = _students.map((s) => (s.id === id ? { ...s, ...data } : s));
    return _students.find((s) => s.id === id) ?? null;
  },

  deleteStudent(id: number): void {
    _students = _students.filter((s) => s.id !== id);
    // Cascade delete
    _skills = _skills.filter((s) => s.student_id !== id);
    _certifications = _certifications.filter((c) => c.student_id !== id);
  },

  toggleStudentStatus(id: number): void {
    _students = _students.map((s) =>
      s.id === id
        ? { ...s, status: s.status === "Active" ? "Inactive" : "Active" }
        : s
    );
  },

  // ── Skills ──────────────────────────────────────────────────────────────────

  getSkillsByStudent(studentId: number): MockSkill[] {
    return _skills.filter((s) => s.student_id === studentId);
  },

  addSkill(studentId: number, data: Omit<MockSkill, "skill_id" | "student_id" | "created_date">): MockSkill {
    const newSkill: MockSkill = {
      ...data,
      skill_id: Date.now(),
      student_id: studentId,
      created_date: new Date().toISOString().slice(0, 10),
    };
    _skills = [newSkill, ..._skills];
    return newSkill;
  },

  updateSkill(skillId: number, data: Partial<Pick<MockSkill, "skill_name" | "proficiency_level" | "years_of_experience">>): MockSkill | null {
    _skills = _skills.map((s) => (s.skill_id === skillId ? { ...s, ...data } : s));
    return _skills.find((s) => s.skill_id === skillId) ?? null;
  },

  deleteSkill(skillId: number): void {
    _skills = _skills.filter((s) => s.skill_id !== skillId);
  },

  // ── Certifications ──────────────────────────────────────────────────────────

  getCertsByStudent(studentId: number): MockCertification[] {
    return _certifications.filter((c) => c.student_id === studentId);
  },

  addCert(studentId: number, data: Omit<MockCertification, "certification_id" | "student_id" | "cert_status">): MockCertification {
    const newCert: MockCertification = {
      ...data,
      certification_id: Date.now(),
      student_id: studentId,
      cert_status: computeCertStatus(data.expiry_date),
    };
    _certifications = [newCert, ..._certifications];
    return newCert;
  },

  updateCert(certId: number, data: Partial<Omit<MockCertification, "certification_id" | "student_id" | "cert_status">>): MockCertification | null {
    _certifications = _certifications.map((c) => {
      if (c.certification_id !== certId) return c;
      const updated = { ...c, ...data };
      updated.cert_status = computeCertStatus(updated.expiry_date);
      return updated;
    });
    return _certifications.find((c) => c.certification_id === certId) ?? null;
  },

  deleteCert(certId: number): void {
    _certifications = _certifications.filter((c) => c.certification_id !== certId);
  },
};
