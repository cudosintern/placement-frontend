import React, { useEffect, useState, useMemo, useRef } from "react";
import { Plus, Search, Calendar, RefreshCw, Award, CheckCircle2, TrendingUp, Briefcase, Edit, Trash2, Download } from "lucide-react";
import { toast } from "react-toastify";
import DataTable from "../../../../components/Table/DataTable";
import ModalWithForm from "../../../../components/Modal/ModalWithForm";
import ConfirmDialog from "../../../../components/Dialog/ConfirmDialog";
import offerManagementService from "./offerManagementService";
import { Schema, SchemaFields, SchemaColumnDefs } from "./offerManagementSchema";

// Badge styling mapping for offer status
const OFFER_STATUS_CONFIG: Record<
  string,
  { label: string; badge: string; dot: string }
> = {
  Generated: {
    label: "Generated",
    badge: "bg-slate-100 text-slate-700 border border-slate-200",
    dot: "bg-slate-400",
  },
  Sent: {
    label: "Sent",
    badge: "bg-blue-50 text-blue-700 border border-blue-200",
    dot: "bg-blue-500",
  },
  Accepted: {
    label: "Accepted",
    badge: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    dot: "bg-emerald-500",
  },
  Rejected: {
    label: "Rejected",
    badge: "bg-rose-50 text-rose-700 border border-rose-200",
    dot: "bg-rose-500",
  },
  Revoked: {
    label: "Revoked",
    badge: "bg-amber-50 text-amber-700 border border-amber-200",
    dot: "bg-amber-500",
  },
  Expired: {
    label: "Expired",
    badge: "bg-zinc-100 text-zinc-500 border border-zinc-200",
    dot: "bg-zinc-400",
  },
};

const OfferManagementPage: React.FC = () => {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter States
  const [selectedCompany, setSelectedCompany] = useState("All");
  const [selectedDrive, setSelectedDrive] = useState("All");
  const [selectedStudent, setSelectedStudent] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedDate, setSelectedDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Filter Options
  const [companies, setCompanies] = useState<any[]>([]);
  const [drives, setDrives] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);

  // Modal / Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<any>(null);

  // Confirm Delete States
  const [deleteOfferId, setDeleteOfferId] = useState<number | string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<"offers" | "onboarding">("offers");

  const lastSelectedDriveIdRef = useRef<string | null>(null);

  // Reset tracked drive when modal opens/closes or when editingOffer changes
  useEffect(() => {
    lastSelectedDriveIdRef.current = null;
  }, [isModalOpen, editingOffer]);

  const handleValidDataChange = (dataStr: string, setValue: (name: string, value: any) => void) => {
    try {
      const data = JSON.parse(dataStr);
      const driveId = data.drive_id;
      if (driveId && String(driveId) !== lastSelectedDriveIdRef.current) {
        // If editing, skip autofill on the initial load when selected drive matches the editingOffer's drive
        const isInitialEditLoad = editingOffer && String(editingOffer.drive_id) === String(driveId) && lastSelectedDriveIdRef.current === null;
        
        lastSelectedDriveIdRef.current = String(driveId);
        
        if (!isInitialEditLoad) {
          const selectedDriveObj = drives.find((d: any) => String(d.drive_id) === String(driveId));
          if (selectedDriveObj) {
            if (selectedDriveObj.job_role) {
              setValue("designation", selectedDriveObj.job_role);
            }
            if (selectedDriveObj.ctc_max !== undefined && selectedDriveObj.ctc_max !== null) {
              setValue("package_ctc", String(selectedDriveObj.ctc_max));
            } else if (selectedDriveObj.ctc_min !== undefined && selectedDriveObj.ctc_min !== null) {
              setValue("package_ctc", String(selectedDriveObj.ctc_min));
            }
            if (selectedDriveObj.location) {
              setValue("location", selectedDriveObj.location);
            }
          }
        }
      } else if (!driveId) {
        lastSelectedDriveIdRef.current = null;
      }
    } catch (e) {
      console.error("Error in handleValidDataChange:", e);
    }
  };
  const [onboardingRecords, setOnboardingRecords] = useState<any[]>([]);
  const [onboardingLoading, setOnboardingLoading] = useState(false);
  const [selectedOnboardingRecord, setSelectedOnboardingRecord] = useState<any>(null);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);

  // Form states for onboarding modal
  const [onboardingStatus, setOnboardingStatus] = useState("CONFIRMED");
  const [joiningConfirmationDate, setJoiningConfirmationDate] = useState("");
  const [actualJoiningDate, setActualJoiningDate] = useState("");
  const [deferralDate, setDeferralDate] = useState("");
  const [onboardingRemarks, setOnboardingRemarks] = useState("");

  // Fetch all offers
  const loadOffers = async () => {
    setLoading(true);
    try {
      const data = await offerManagementService.getOffers();
      setOffers(data || []);
    } catch (error) {
      toast.error("Failed to load offers.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch onboarding records
  const loadOnboardingRecords = async () => {
    setOnboardingLoading(true);
    try {
      const data = await offerManagementService.getPostPlacementRecords();
      setOnboardingRecords(data || []);
    } catch (error) {
      toast.error("Failed to load onboarding records.");
      console.error(error);
    } finally {
      setOnboardingLoading(false);
    }
  };

  // Fetch options for the filters
  const loadFilterOptions = async () => {
    try {
      const compList = await offerManagementService.getCompanies();
      const driveList = await offerManagementService.getDrives();
      const studList = await offerManagementService.getStudents();
      setCompanies(compList || []);
      setDrives(driveList || []);
      setStudents(studList || []);
    } catch (error) {
      console.error("Error loading filter options:", error);
    }
  };

  useEffect(() => {
    loadOffers();
    loadFilterOptions();
  }, []);

  useEffect(() => {
    if (activeTab === "onboarding") {
      loadOnboardingRecords();
    }
  }, [activeTab]);

  // Form Submission
  const handleFormSubmit = async (data: any) => {
    try {
      // Date utility to format to YYYY-MM-DD
      const formatDate = (val: any) => {
        if (!val) return "";
        if (val instanceof Date) {
          const year = val.getFullYear();
          const month = String(val.getMonth() + 1).padStart(2, "0");
          const day = String(val.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        }
        return String(val);
      };

      const payload = {
        company_id: data.company_id,
        drive_id: data.drive_id,
        student_id: data.student_id,
        designation: data.designation,
        package_ctc: data.package_ctc,
        location: data.location,
        offer_date: formatDate(data.offer_date),
        joining_date: formatDate(data.joining_date),
        status: data.status,
        remarks: data.remarks || "",
        offer_letter_path: data.offer_letter ? data.offer_letter.name || "" : null,
      };

      if (editingOffer) {
        const originalJDateStr = formatDate(editingOffer.joining_date);
        const newJDateStr = formatDate(data.joining_date);
        if (originalJDateStr !== newJDateStr) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const newJDate = new Date(data.joining_date);
          if (newJDate <= today) {
            toast.error("Joining Date must be a future date.");
            return;
          }
        }
        await offerManagementService.updateOffer(editingOffer.id, payload);
        toast.success("Offer updated successfully.");
      } else {
        await offerManagementService.addOffer(payload);
        toast.success("Offer created successfully.");
      }

      await loadOffers();
      setIsModalOpen(false);
      setEditingOffer(null);
    } catch (error: any) {
      const msg = error.response?.data?.message || "Operation failed.";
      toast.error(msg);
      console.error(error);
    }
  };

  const handleEditClick = (record: any) => {
    // Convert date strings back to Date objects for the singledate picker compatibility
    const parseDateStr = (dateStr: string) => {
      if (!dateStr) return null;
      const [year, month, day] = dateStr.split("-");
      return new Date(Number(year), Number(month) - 1, Number(day));
    };

    setEditingOffer({
      ...record,
      company_id: String(record.company_id),
      drive_id: String(record.drive_id),
      student_id: String(record.student_id),
      offer_date: parseDateStr(record.offer_date),
      joining_date: parseDateStr(record.joining_date),
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: number | string) => {
    setDeleteOfferId(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteOfferId) return;
    try {
      await offerManagementService.deleteOffer(deleteOfferId);
      toast.success("Offer deleted successfully.");
      await loadOffers();
    } catch (error) {
      toast.error("Failed to delete offer.");
      console.error(error);
    } finally {
      setIsConfirmOpen(false);
      setDeleteOfferId(null);
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSelectedCompany("All");
    setSelectedDrive("All");
    setSelectedStudent("All");
    setSelectedStatus("All");
    setSelectedDate("");
    setSearchTerm("");
    toast.info("Filters reset.");
  };

  // Client Side Filtering and Search
  const filteredOffers = useMemo(() => {
    return offers.filter((offer) => {
      if (selectedCompany !== "All" && String(offer.company_id) !== selectedCompany) {
        return false;
      }
      if (selectedDrive !== "All" && String(offer.drive_id) !== selectedDrive) {
        return false;
      }
      if (selectedStudent !== "All" && String(offer.student_id) !== selectedStudent) {
        return false;
      }
      if (selectedStatus !== "All" && offer.status !== selectedStatus) {
        return false;
      }
      if (selectedDate) {
        const offD = new Date(offer.offer_date).toDateString();
        const selD = new Date(selectedDate).toDateString();
        if (offD !== selD) return false;
      }
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const companyName = (offer.company_name || "").toLowerCase();
        const studentName = (offer.student_name || "").toLowerCase();
        const driveName = (offer.drive_name || "").toLowerCase();
        const roleName = (offer.designation || "").toLowerCase();
        const usnValue = (offer.usn || "").toLowerCase();

        return (
          companyName.includes(term) ||
          studentName.includes(term) ||
          driveName.includes(term) ||
          roleName.includes(term) ||
          usnValue.includes(term)
        );
      }
      return true;
    });
  }, [offers, selectedCompany, selectedDrive, selectedStudent, selectedStatus, selectedDate, searchTerm]);

  // Dynamically filter drive options inside filter bar based on selected company
  const filteredDrivesForFilterBar = useMemo(() => {
    if (selectedCompany === "All") return drives;
    return drives.filter((d: any) => String(d.company_id) === selectedCompany);
  }, [selectedCompany, drives]);

  // Dynamically filter student options inside filter bar based on selected company / drive
  const filteredStudentsForFilterBar = useMemo(() => {
    if (selectedCompany === "All" && selectedDrive === "All") return students;
    
    const studentIds = new Set(
      offers
        .filter((o) => {
          if (selectedCompany !== "All" && String(o.company_id) !== selectedCompany) return false;
          if (selectedDrive !== "All" && String(o.drive_id) !== selectedDrive) return false;
          return true;
        })
        .map((o) => String(o.student_id))
    );
    
    return students.filter((s) => studentIds.has(String(s.student_id)));
  }, [selectedCompany, selectedDrive, students, offers]);

  // Append actions and status column renderer
  const columnsWithActions = useMemo(() => {
    return [
      ...SchemaColumnDefs,
      {
        headerName: "Status",
        field: "status",
        width: 120,
        sortable: true,
        filter: true,
        cellRenderer: (params: any) => {
          const val = params.value || "Generated";
          const cfg = OFFER_STATUS_CONFIG[val] || OFFER_STATUS_CONFIG["Generated"];
          return (
            <div className="flex items-center h-full">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${cfg.badge}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </span>
            </div>
          );
        },
      },
      {
        headerName: "Actions",
        field: "actions",
        width: 150,
        sortable: false,
        filter: false,
        cellClass: "flex items-center justify-center",
        cellRenderer: (params: any) => (
          <div className="flex items-center gap-1.5 h-full py-1 justify-center">
            <button
              onClick={() => handleEditClick(params.data)}
              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors shadow-sm"
              title="Edit"
            >
              <Edit size={14} />
            </button>
            <button
              onClick={() => handleDeleteClick(params.data.id)}
              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors shadow-sm"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
            <button
              onClick={async () => {
                if (params.data.status !== "Accepted") {
                  toast.error("Offer letter can only be downloaded after the student has accepted the offer.");
                  return;
                }
                try {
                  await offerManagementService.downloadOfferLetter(params.data.id, params.data.student_name);
                  toast.success("Offer letter downloaded successfully.");
                } catch (err) {
                  toast.error("Failed to download offer letter.");
                }
              }}
              className={`p-1.5 rounded-lg transition-colors shadow-sm ${
                params.data.status === "Accepted"
                  ? "bg-indigo-50 hover:bg-indigo-100 text-indigo-600"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed opacity-60"
              }`}
              title="Download Offer Letter"
            >
              <Download size={14} />
            </button>
          </div>
        ),
      },
    ];
  }, []);

  const handleUpdateOnboardingClick = (record: any) => {
    setSelectedOnboardingRecord(record);
    setOnboardingStatus(record.status || "CONFIRMED");
    setJoiningConfirmationDate(record.joining_confirmation_date || "");
    setActualJoiningDate(record.actual_joining_date || "");
    setDeferralDate(record.deferral_date || "");
    setOnboardingRemarks(record.no_show_reason || "");
    setIsOnboardingModalOpen(true);
  };

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOnboardingRecord) return;

    try {
      const payload = {
        offer_id: selectedOnboardingRecord.offer_id,
        joining_confirmation_date: joiningConfirmationDate || null,
        actual_joining_date: actualJoiningDate || null,
        status: onboardingStatus,
        no_show_reason: onboardingRemarks || null,
        deferral_date: deferralDate || null,
      };

      await offerManagementService.savePostPlacementRecord(payload);
      toast.success("Onboarding status updated successfully.");
      setIsOnboardingModalOpen(false);
      await loadOnboardingRecords();
      if (onboardingStatus === "REVOKED") {
        await loadOffers();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update onboarding status.");
    }
  };

  const onboardingColumns = useMemo(() => {
    return [
      { headerName: "Offer ID", field: "offer_id", width: 100, sortable: true, filter: true },
      { headerName: "Student", field: "student_name", sortable: true, filter: true,
        cellRenderer: (params: any): string => {
          const name = params.data.student_name || "";
          const usn = params.data.usn || "";
          return usn ? `${name} (${usn})` : name;
        }
      },
      { headerName: "Company", field: "company_name", sortable: true, filter: true },
      { headerName: "Designation", field: "designation", sortable: true, filter: true },
      { headerName: "Proposed Joining", field: "proposed_joining_date", width: 150, sortable: true, filter: true,
        valueFormatter: (params: any) => {
          if (!params.value) return "-";
          try {
            return new Date(params.value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
          } catch { return params.value; }
        }
      },
      { headerName: "Confirmation Date", field: "joining_confirmation_date", width: 150, sortable: true, filter: true,
        valueFormatter: (params: any) => {
          if (!params.value) return "-";
          try {
            return new Date(params.value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
          } catch { return params.value; }
        }
      },
      { headerName: "Actual Joining", field: "actual_joining_date", width: 130, sortable: true, filter: true,
        valueFormatter: (params: any) => {
          if (!params.value) return "-";
          try {
            return new Date(params.value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
          } catch { return params.value; }
        }
      },
      {
        headerName: "Status",
        field: "status",
        width: 130,
        sortable: true,
        filter: true,
        cellRenderer: (params: any): JSX.Element => {
          const val = params.value || "CONFIRMED";
          let badge = "bg-emerald-50 text-emerald-700 border border-emerald-200";
          let dot = "bg-emerald-500";
          if (val === "NO_SHOW") {
            badge = "bg-rose-50 text-rose-700 border border-rose-200";
            dot = "bg-rose-500";
          } else if (val === "DEFERRED") {
            badge = "bg-amber-50 text-amber-700 border border-amber-200";
            dot = "bg-amber-500";
          } else if (val === "REVOKED") {
            badge = "bg-zinc-100 text-zinc-500 border border-zinc-200";
            dot = "bg-zinc-400";
          }
          return (
            <div className="flex items-center h-full">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                {val}
              </span>
            </div>
          );
        }
      },
      {
        headerName: "Actions",
        field: "actions",
        width: 150,
        sortable: false,
        filter: false,
        cellClass: "flex items-center justify-center",
        cellRenderer: (params: any): JSX.Element => (
          <div className="flex items-center gap-2 h-full py-1">
            <button
              onClick={() => handleUpdateOnboardingClick(params.data)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded text-xs transition-colors font-bold shadow-sm"
            >
              Update
            </button>
          </div>
        )
      }
    ];
  }, []);

  return (
    <div className="p-6 max-w-[1600px] mx-auto" style={{ fontFamily: "'Roboto', sans-serif" }}>
      {/* Scope Styles identical to DrivePage and other modern modules */}
      <style>{`
        .offer-page-panel {
          border-radius: 12px;
          overflow: hidden;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
        }
        .offer-page-panel .ag-theme-alpine {
          --ag-background-color: transparent;
          --ag-header-background-color: #f8fafc;
          --ag-header-foreground-color: #111827;
          --ag-odd-row-background-color: #ffffff;
          --ag-row-hover-color: #f8fafc;
          --ag-border-color: #e5e7eb;
          --ag-font-family: 'Roboto', sans-serif;
          --ag-font-size: 12px;
          --ag-row-border-color: #f1f5f9;
          --ag-cell-horizontal-padding: 8px;
          --ag-header-height: 32px;
        }
        .offer-page-panel .ag-header-cell {
          font-weight: 700 !important;
          color: #111827 !important;
          font-size: 11px !important;
        }
        .offer-page-panel .ag-row {
          border-bottom: 1px solid #f1f5f9 !important;
        }
        .offer-page-panel .ag-row-hover {
          background: linear-gradient(90deg, #f8fafc 0%, #ffffff 100%) !important;
        }
        .offer-page-panel .ag-cell {
          display: flex;
          align-items: center;
        }
        .grid-row-even {
          background: #fcfcfd !important;
        }
      `}</style>

      {/* Page Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-gray-900">
            Offer Management
          </h2>
          <p className="mt-1 text-sm font-medium text-gray-500">
            Generate, track, and manage student placement offers
          </p>
        </div>
        <button
          onClick={() => {
            setEditingOffer(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all active:scale-95"
        >
          <Plus size={16} />
          Add Offer
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Card 1: Total Offers */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow duration-300">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Award size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Offers Issued</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">{offers.length}</h3>
          </div>
        </div>

        {/* Card 2: Acceptance Rate */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow duration-300">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Acceptance Rate</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">
              {offers.length > 0
                ? ((offers.filter((o) => o.status === "Accepted").length / offers.length) * 100).toFixed(1)
                : "0.0"}%
            </h3>
          </div>
        </div>

        {/* Card 3: Avg CTC */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow duration-300">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Average CTC Package</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">
              {offers.map((o) => parseFloat(o.package_ctc)).filter((p) => !isNaN(p)).length > 0
                ? (
                    offers.map((o) => parseFloat(o.package_ctc)).filter((p) => !isNaN(p)).reduce((a, b) => a + b, 0) /
                    offers.map((o) => parseFloat(o.package_ctc)).filter((p) => !isNaN(p)).length
                  ).toFixed(2)
                : "0.00"}{" "}
              LPA
            </h3>
          </div>
        </div>

        {/* Card 4: Total Placed */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow duration-300">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <Briefcase size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Placed Students</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">
              {new Set(offers.filter((o) => o.status === "Accepted").map((o) => o.student_id)).size}
            </h3>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab("offers")}
          className={`py-2.5 px-5 text-sm font-bold border-b-2 transition-all ${
            activeTab === "offers"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          Active Offers
        </button>
        <button
          onClick={() => setActiveTab("onboarding")}
          className={`py-2.5 px-5 text-sm font-bold border-b-2 transition-all ${
            activeTab === "onboarding"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          Onboarding & Post-Placement
        </button>
      </div>

      {activeTab === "offers" ? (
        <>
          {/* Filter and Search Bar */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
              {/* Company Filter */}
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-gray-600 mb-1.5">Company</label>
                <select
                  value={selectedCompany}
                  onChange={(e) => {
                    setSelectedCompany(e.target.value);
                    setSelectedDrive("All"); // Reset drive filter when company changes
                  }}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                >
                  <option value="All">All Companies</option>
                  {companies.map((c) => (
                    <option key={c.company_id} value={String(c.company_id)}>
                      {c.company_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Drive Filter */}
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-gray-600 mb-1.5">Placement Drive</label>
                <select
                  value={selectedDrive}
                  onChange={(e) => setSelectedDrive(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                >
                  <option value="All">All Drives</option>
                  {filteredDrivesForFilterBar.map((d) => (
                    <option key={d.drive_id} value={String(d.drive_id)}>
                      {d.drive_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Student Filter */}
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-gray-600 mb-1.5">Student</label>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                >
                  <option value="All">All Students</option>
                  {filteredStudentsForFilterBar.map((s) => (
                    <option key={s.student_id} value={String(s.student_id)}>
                      {s.name} ({s.usno || s.regno})
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-gray-600 mb-1.5">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                >
                  <option value="All">All Statuses</option>
                  {Object.keys(OFFER_STATUS_CONFIG).map((statusKey) => (
                    <option key={statusKey} value={statusKey}>
                      {statusKey}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Filter */}
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-gray-600 mb-1.5">Offer Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                  />
                  <Calendar size={15} className="absolute left-3 top-2.5 text-gray-400" />
                </div>
              </div>

              {/* Reset button */}
              <div className="flex gap-2">
                <button
                  onClick={handleResetFilters}
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
                  title="Reset all filters"
                >
                  <RefreshCw size={14} />
                  Reset
                </button>
              </div>
            </div>

            <div className="border-t border-gray-100 my-4"></div>

            {/* Search bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search by Company, Student Name, USN, Drive Name, or Job Role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400"
              />
              <Search size={16} className="absolute left-3.5 top-3 text-gray-400" />
            </div>
          </div>

          {/* Main Table Panel */}
          <div className="offer-page-panel">
            <div className="bg-slate-50 border-b border-gray-200 px-6 py-3.5 flex items-center justify-between">
              <h4 className="text-sm font-bold text-gray-800">
                Offer Records ({filteredOffers.length} of {offers.length})
              </h4>
            </div>
            <DataTable
              columnDefs={columnsWithActions}
              rowData={filteredOffers}
              showAddButton={false}
              showExportButton={false}
              headerFilter={true}
              pageSize={10}
              loading={loading}
              rowHeight={40}
              getRowClass={(params: any) =>
                (params.node.rowIndex ?? 0) % 2 === 0 ? "grid-row-even" : ""
              }
            />
          </div>
        </>
      ) : (
        <>
          {/* Post-Placement Onboarding Panel */}
          <div className="offer-page-panel">
            <div className="bg-slate-50 border-b border-gray-200 px-6 py-3.5 flex items-center justify-between">
              <h4 className="text-sm font-bold text-gray-800">
                Onboarding & Joining Records ({onboardingRecords.length} records)
              </h4>
            </div>
            <DataTable
              columnDefs={onboardingColumns}
              rowData={onboardingRecords}
              showAddButton={false}
              showExportButton={false}
              headerFilter={true}
              pageSize={10}
              loading={onboardingLoading}
              rowHeight={40}
              getRowClass={(params: any) =>
                (params.node.rowIndex ?? 0) % 2 === 0 ? "grid-row-even" : ""
              }
            />
          </div>
        </>
      )}

      {/* Add/Edit Offer Modal */}
      {isModalOpen && (
        <ModalWithForm
          title={editingOffer ? "Edit Student Offer" : "Add Student Offer"}
          isOpen={isModalOpen}
          onSubmit={handleFormSubmit}
          onClose={() => {
            setIsModalOpen(false);
            setEditingOffer(null);
          }}
          formFields={SchemaFields}
          schema={Schema}
          size="4xl"
          columnLayout={2}
          initialValues={editingOffer || { status: "Generated" }}
          onValidDataChange={handleValidDataChange}
        />
      )}

      {/* Onboarding Update Modal */}
      {isOnboardingModalOpen && selectedOnboardingRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full overflow-hidden shadow-2xl animate-fade-in border border-gray-100" style={{ fontFamily: "'Roboto', sans-serif" }}>
            <div className="bg-slate-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-gray-800 text-lg">Update Onboarding Status</h3>
              <button
                onClick={() => setIsOnboardingModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors font-bold text-xl"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleOnboardingSubmit} className="p-6 flex flex-col gap-4">
              <div className="text-sm bg-indigo-50 text-indigo-700 p-3.5 rounded-lg border border-indigo-100 mb-2">
                <p><strong>Student:</strong> {selectedOnboardingRecord.student_name} ({selectedOnboardingRecord.usn})</p>
                <p><strong>Company:</strong> {selectedOnboardingRecord.company_name}</p>
                <p><strong>Proposed Joining:</strong> {selectedOnboardingRecord.proposed_joining_date || "Not Set"}</p>
              </div>

              {/* Status Select */}
              <div className="flex flex-col">
                <label className="text-xs font-bold text-gray-600 mb-1.5">Onboarding Status</label>
                <select
                  value={onboardingStatus}
                  onChange={(e) => setOnboardingStatus(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 font-medium"
                >
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="NO_SHOW">No Show</option>
                  <option value="DEFERRED">Deferred</option>
                  <option value="REVOKED">Revoked / Terminated</option>
                </select>
              </div>

              {/* Joining Confirmation Date */}
              <div className="flex flex-col">
                <label className="text-xs font-bold text-gray-600 mb-1.5">Confirmation Date</label>
                <input
                  type="date"
                  value={joiningConfirmationDate}
                  onChange={(e) => setJoiningConfirmationDate(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                />
              </div>

              {/* Actual Joining Date (for Confirmed) */}
              {onboardingStatus === "CONFIRMED" && (
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-600 mb-1.5">Actual Joining Date</label>
                  <input
                    type="date"
                    value={actualJoiningDate}
                    onChange={(e) => setActualJoiningDate(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                  />
                </div>
              )}

              {/* Deferral Date (for Deferred) */}
              {onboardingStatus === "DEFERRED" && (
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-600 mb-1.5">Deferred Date</label>
                  <input
                    type="date"
                    value={deferralDate}
                    onChange={(e) => setDeferralDate(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                  />
                </div>
              )}

              {/* Remarks / Reasons */}
              {(onboardingStatus === "NO_SHOW" || onboardingStatus === "REVOKED" || onboardingStatus === "DEFERRED") && (
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-600 mb-1.5">
                    {onboardingStatus === "NO_SHOW" ? "No Show Reason" : onboardingStatus === "DEFERRED" ? "Deferral Reason" : "Revoke Reason"}
                  </label>
                  <textarea
                    value={onboardingRemarks}
                    onChange={(e) => setOnboardingRemarks(e.target.value)}
                    placeholder="Enter details..."
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 h-20 resize-none"
                    required
                  />
                </div>
              )}

              {/* Action buttons */}
              <div className="flex justify-end gap-3 mt-4 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOnboardingModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-bold text-white shadow-md transition-all active:scale-95"
                >
                  Save Onboarding
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false);
          setDeleteOfferId(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Offer Record"
        message="Are you sure you want to delete this student placement offer? This action is permanent and cannot be undone."
      />
    </div>
  );
};

export default OfferManagementPage;
