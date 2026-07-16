export const PlacementApiEndpoint = {

    // ── Student Profile & Academic ────────────────────────────────────────────
    studentProfile: {
        get_students: "placement/student_profile/get_students",
        get_all_students_list: "placement/student_profile/get_all_students_list",
        get_profile: "placement/student_profile/get_profile",
        add_profile: "placement/student_profile/add_profile",
        update_profile: "placement/student_profile/update_profile",
        get_skills: "placement/student_profile/get_skills",
        add_skill: "placement/student_profile/add_skill",
        update_skill: "placement/student_profile/update_skill",
        delete_skill: "placement/student_profile/delete_skill",
        get_certifications: "placement/student_profile/get_certifications",
        add_certification: "placement/student_profile/add_certification",
        update_certification: "placement/student_profile/update_certification",
        delete_certification: "placement/student_profile/delete_certification",
        get_student_courses: "placement/student_academic/get_student_courses",
        get_student_sgpa_cgpa: "placement/student_academic/get_student_sgpa_cgpa",
        get_student_cgpa: "placement/student_academic/get_student_cgpa",
        // Resume (PLM-BE-008)
        upload_resume: "placement/student_resume/upload_resume",
        get_resumes: "placement/student_resume/get_resumes",
        set_active_resume: "placement/student_resume/set_active_resume",
        delete_resume: "placement/student_resume/delete_resume",
        download_resume: "placement/student_resume/download_resume",
    },

    // ── Company Registration (self-registration by company) ───────────────────
    companyRegistration: {
        submit: "placement/company-registration/submit",
        list: "placement/company-registration/list",
        detail: "placement/company-registration/detail",
        approve: "placement/company-registration/approve",
        reject: "placement/company-registration/reject",
        countries: "placement/company-registration/countries",
        states: "placement/company-registration/states",
        cities: "placement/company-registration/cities",
        checkPincode: "placement/company-registration/check-pincode",
    },

    // ── Company (TPO-managed company master) ──────────────────────────────────
    company: {
        list: "placement/company/list",
        detail: "placement/company/detail",
        save: "placement/company/save",
        activate: "placement/company/activate",
        deactivate: "placement/company/deactivate",
    },

    // ── Placement Drive ───────────────────────────────────────────────────────
    drive: {
        meta: "placement/drive/meta",
        list: "placement/drive/list",
        detail: "placement/drive/detail",
        save: "placement/drive/save",
        status: "placement/drive/status",
        eligibleCount: "placement/drive/eligible-count",
    },

    // ── Drive Applications (Officer — Drive Detail & Shortlisting) ────────────
    applications: {
        list:            "placement/drive/applications",              // GET ?drive_id=X
        shortlist:       "placement/drive/applications/shortlist",    // POST {drive_id, application_ids[]}
        auto_shortlist:  "placement/drive/applications/auto-shortlist", // POST {drive_id} — auto by branch+CGPA
        reject:          "placement/drive/applications/reject",       // POST {application_id, reason?}
        waitlist:        "placement/drive/applications/waitlist",     // POST {application_id} — SHORTLISTED → WAITLISTED
        withdraw:        "placement/drive/applications/withdraw",     // POST {application_id}
        override_shortlist: "placement/drive/applications/override-shortlist",
        override_reject: "placement/drive/applications/override-reject",
    },

    // ── Student Drive (Apply / Withdraw / My Applications) ───────────────────
    studentDrive: {
        apply:           "placement/student/apply",
        my_applications: "placement/student/my-applications",
    },

} as const;

// Backward-compat alias — used by studentProfileService.ts and other files
// that still import `ApiEndpoint` from this file.
export const ApiEndpoint = PlacementApiEndpoint;

