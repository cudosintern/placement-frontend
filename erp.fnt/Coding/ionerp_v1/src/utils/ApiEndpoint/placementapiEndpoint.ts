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

    eventType: {
        get_event_types: "placement/event-type/get_event_types",
        add_event_type: "placement/event-type/add_event_type",
        update_event_type: "placement/event-type/update_event_type",
    },

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

    drive: {
        meta: "placement/drive/meta",
        list: "placement/drive/list",
        detail: "placement/drive/detail",
        save: "placement/drive/save",
        status: "placement/drive/status",
        eligibleCount: "placement/drive/eligible-count",
    },

    notification: {
        get_templates: "placement/notification/get_notification_templates",
        add_template: "placement/notification/add_notification_template",
        update_template: "placement/notification/update_notification_template",
        delete_template: "placement/notification/delete_notification_template",
    },

    notificationLog: {
        get_logs: "placement/notification-log/get_notification_logs",
    },

    company: {
        list: "placement/company/list",
        save: "placement/company/save",
        detail: "placement/company/detail",
    },

    companyContact: {
        get_contacts: "placement/contact/get_contact_list",
        add_contact: "placement/contact/add_contact",
        update_contact: "placement/contact/update_contact",
        delete_contact: "placement/contact/delete_contact",
        get_designations: "placement/contact/get_designations",
    },

} as const;



