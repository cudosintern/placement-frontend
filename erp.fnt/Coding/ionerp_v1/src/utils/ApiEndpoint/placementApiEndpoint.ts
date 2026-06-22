// placementApiEndpoint.ts
// All API endpoint constants for the Placement Module.

export const PlacementApiEndpoint = {
  // Phase 1: Company Master
  company: {
    list:       "placement/company/list",
    detail:     "placement/company/detail",
    save:       "placement/company/save",
    activate:   "placement/company/activate",
    deactivate: "placement/company/deactivate",
  },

  // Phase 2: Company Self-Registration & Approval
  companyRegistration: {
    submit:  "placement/company-registration/submit",
    list:    "placement/company-registration/list",
    detail:  "placement/company-registration/detail",
    approve: "placement/company-registration/approve",
    reject:  "placement/company-registration/reject",
    countries: "placement/company-registration/countries",
    states:    "placement/company-registration/states",
    cities:    "placement/company-registration/cities",
    checkPincode: "placement/company-registration/check-pincode",
  },

  // Phase 3: Placement Drive
  drive: {
    meta:           "placement/drive/meta",
    list:           "placement/drive/list",
    detail:         "placement/drive/detail",
    save:           "placement/drive/save",
    status:         "placement/drive/status",
    eligibleCount:  "placement/drive/eligible-count",
  },
} as const;
