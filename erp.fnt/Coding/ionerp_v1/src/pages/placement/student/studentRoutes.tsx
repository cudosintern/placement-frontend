/**
 * studentRoutes.tsx
 *
 * Route wrapper components for the Student section of the Placement Module.
 *
 * - StudentRegistrationWrapper   →  /student/register
 * - StudentProfileWrapper        →  /student/profile?student_id=<id>
 * - StudentSkillWrapper          →  /student/skills
 * - StudentCertificationWrapper  →  /student/certifications
 */

import React from "react";
import { useSearchParams } from "react-router-dom";
import StudentRegistrationPage from "./StudentRegistrationPage";
import StudentProfilePage from "./StudentProfilePage";
import StudentSkillPage from "./StudentSkillPage";
import StudentCertificationPage from "./StudentCertificationPage";
import PlacementStatusPage from "./PlacementStatusPage";

// ─── Registration Page Wrapper ─────────────────────────────────────────────────

export const StudentRegistrationWrapper: React.FC = () => {
  return <StudentRegistrationPage />;
};

// ─── Profile Page Wrapper ──────────────────────────────────────────────────────

export const StudentProfileWrapper: React.FC = () => {
  const [searchParams] = useSearchParams();
  const studentId = Number(searchParams.get("student_id")) || 0;

  return <StudentProfilePage studentId={studentId} />;
};

// ─── Skills Page Wrapper ───────────────────────────────────────────────────────

export const StudentSkillWrapper: React.FC = () => {
  return <StudentSkillPage />;
};

// ─── Certification Page Wrapper ────────────────────────────────────────────────

export const StudentCertificationWrapper: React.FC = () => {
  return <StudentCertificationPage />;
};

// ─── Placement Status Page Wrapper ─────────────────────────────────────────────

export const PlacementStatusWrapper: React.FC = () => {
  return <PlacementStatusPage />;
};
