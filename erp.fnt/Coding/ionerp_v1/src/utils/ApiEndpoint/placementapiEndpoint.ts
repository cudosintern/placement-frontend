export const ApiEndpoint = {

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

} as const;

