import React, { useEffect, useState, useCallback } from "react";
import { CompanyResponse } from "./responseInterface";
import axiosInstance from "../../../../utils/api";
import { ApiEndpoint } from "../../../../utils/ApiEndpoint/emsapiEndpoint";
import { toast } from "react-toastify";
import ModalContainer from "../../../../components/Modal/ModalContainer";
import {
  Building,
  Mail,
  Phone,
  Globe,
  MapPin,
  Linkedin,
  Calendar,
  Users,
  Briefcase,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  User,
  Star,
  Info,
} from "lucide-react";

type Props = {
  company: CompanyResponse | null;
};

interface Contact {
  contact_id: number;
  company_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  designation_id: number;
  designation_name?: string;
  is_primary: number;
  status?: number;
  is_active?: number;
}

interface Designation {
  designation_id: number;
  designation_name: string;
}

const CompanyDetails: React.FC<Props> = ({ company }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  // Form states for nested add/edit contact
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [emailVal, setEmailVal] = useState("");
  const [phoneVal, setPhoneVal] = useState("");
  const [designationId, setDesignationId] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);

  const useMock = false;

  const fetchDesignations = useCallback(async () => {
    try {
      const res: any = await axiosInstance.get(ApiEndpoint.placementContact.get_designations);
      setDesignations(res.data?.data || []);
    } catch (err) {
      console.warn("Failed to load designations from DB, using mock designations", err);
      setDesignations([
        { designation_id: 1, designation_name: "HoD" },
        { designation_id: 2, designation_name: "Assistant Professor" },
        { designation_id: 3, designation_name: "Principal" },
        { designation_id: 4, designation_name: "Training & Placement Officer" },
        { designation_id: 5, designation_name: "HR Manager" },
        { designation_id: 6, designation_name: "Talent Acquisition Specialist" },
        { designation_id: 7, designation_name: "Interviewer" },
      ]);
    }
  }, []);

  const fetchContacts = useCallback(async () => {
    if (!company) return;
    const cid = company.company_id ?? (company as any).id;
    setLoading(true);
    const isMockCompany = useMock && !["1", "2", "3"].includes(String(cid));

    if (isMockCompany) {
      const raw = localStorage.getItem("placement_contact_mock");
      let allContacts: Contact[] = [];
      if (raw) {
        allContacts = JSON.parse(raw);
      } else {
        allContacts = [
          {
            contact_id: 1,
            company_id: 1,
            first_name: "Akshata",
            last_name: "S",
            email: "aksh@gmail.com",
            phone: "1234567897",
            designation_id: 1,
            designation_name: "HoD",
            is_primary: 1,
            status: 1,
            is_active: 1,
          },
          {
            contact_id: 2,
            company_id: 2,
            first_name: "Radha",
            last_name: "P",
            email: "radhaaa@gmail.com",
            phone: "1234567844",
            designation_id: 2,
            designation_name: "Assistant Professor",
            is_primary: 1,
            status: 1,
            is_active: 1,
          },
          {
            contact_id: 3,
            company_id: 1,
            first_name: "Govinda",
            last_name: "R",
            email: "govinda@gmail.com",
            phone: "1099454298",
            designation_id: 1,
            designation_name: "HoD",
            is_primary: 0,
            status: 1,
            is_active: 1,
          },
          {
            contact_id: 4,
            company_id: 1,
            first_name: "Vikram",
            last_name: "Sharma",
            email: "vikram.sharma@google.com",
            phone: "9876543211",
            designation_id: 7,
            designation_name: "Interviewer",
            is_primary: 0,
            status: 1,
            is_active: 1,
          }
        ];
        localStorage.setItem("placement_contact_mock", JSON.stringify(allContacts));
      }
      
      // Seed a realistic contact for this mock company if not present
      if (!allContacts.some((c) => c.company_id === Number(cid))) {
        const contactName = company?.contact_person || (company as any)?.contact_person || "Amit Sharma";
        const contactEmail = company?.contact_email || (company as any)?.contact_email || "amit.sharma@tcs.com";
        const contactPhone = company?.contact_phone || (company as any)?.contact_phone || "9876543210";
        const contactDesg = company?.contact_designation || (company as any)?.contact_designation || "HR Manager";
        allContacts.push({
          contact_id: Math.floor(Math.random() * 100000) + 500,
          company_id: Number(cid),
          first_name: contactName.split(" ")[0] || "Amit",
          last_name: contactName.split(" ").slice(1).join(" ") || "Sharma",
          email: contactEmail,
          phone: contactPhone,
          designation_id: 5,
          designation_name: contactDesg,
          is_primary: 1,
          status: 1,
          is_active: 1,
        });
        localStorage.setItem("placement_contact_mock", JSON.stringify(allContacts));
      }
      
      setContacts(allContacts.filter((c) => c.company_id === Number(cid)));
      setLoading(false);
      return;
    }

    try {
      const res: any = await axiosInstance.get(
        `${ApiEndpoint.placementContact.get_contact_list}?company_id=${cid}`
      );
      setContacts(res.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch contacts", err);
      toast.error("Failed to load contacts.");
    } finally {
      setLoading(false);
    }
  }, [company, useMock]);

  const [detailedCompany, setDetailedCompany] = useState<any>(null);

  const fetchDetailedCompany = useCallback(async () => {
    if (!company) return;
    const cid = company.company_id ?? (company as any).id;
    const isMockCompany = useMock && !["1", "2", "3"].includes(String(cid));

    if (isMockCompany) {
      let mockDrives = 0;
      let mockOffers = 0;
      let mockInterviewers = 0;

      const nameLower = (company.company_name || (company as any).name || "").toLowerCase();
      if (nameLower.includes("consultancy") || nameLower.includes("tata") || nameLower.includes("tcs")) {
        mockDrives = 2;
        mockOffers = 4;
        mockInterviewers = 1;
      } else if (nameLower.includes("limited") || nameLower.includes("wipro")) {
        mockDrives = 1;
        mockOffers = 3;
        mockInterviewers = 1;
      } else {
        mockDrives = Math.floor(Math.random() * 3) + 1;
        mockOffers = Math.floor(Math.random() * 8) + 1;
        mockInterviewers = 1;
      }

      setDetailedCompany({
        ...company,
        drives_created: mockDrives,
        offers_given: mockOffers,
        interviewers_count: mockInterviewers,
      });
      return;
    }

    try {
      const res: any = await axiosInstance.get(`/placement/company/detail/${cid}`);
      if (res.data?.status) {
        setDetailedCompany(res.data.data);
      } else {
        setDetailedCompany(company);
      }
    } catch (err) {
      console.error("Failed to fetch detailed company stats", err);
      setDetailedCompany(company);
    }
  }, [company, useMock]);

  useEffect(() => {
    if (company) {
      fetchDesignations();
      fetchContacts();
      fetchDetailedCompany();
    }
  }, [company, fetchDesignations, fetchContacts, fetchDetailedCompany]);

  const openAddForm = () => {
    setEditingContact(null);
    setFirstName("");
    setLastName("");
    setEmailVal("");
    setPhoneVal("");
    setDesignationId(designations[0]?.designation_id.toString() || "");
    setIsPrimary(false);
    setIsFormOpen(true);
  };

  const openEditForm = (contact: Contact) => {
    setEditingContact(contact);
    setFirstName(contact.first_name);
    setLastName(contact.last_name || "");
    setEmailVal(contact.email || "");
    setPhoneVal(contact.phone || "");
    setDesignationId(contact.designation_id.toString());
    setIsPrimary(contact.is_primary === 1);
    setIsFormOpen(true);
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      toast.error("First Name is required");
      return;
    }
    const cid = company?.company_id ?? (company as any).id;
    const payload = {
      company_id: cid,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: emailVal.trim(),
      phone: phoneVal.trim(),
      designation_id: Number(designationId),
      is_primary: isPrimary ? 1 : 0,
      is_active: 1,
    };

    try {
      if (editingContact) {
        await axiosInstance.put(ApiEndpoint.placementContact.update_contact, {
          ...payload,
          contact_id: editingContact.contact_id,
        });
        toast.success("Contact updated successfully!");
      } else {
        await axiosInstance.post(ApiEndpoint.placementContact.add_contact, payload);
        toast.success("Contact added successfully!");
      }
      setIsFormOpen(false);
      fetchContacts();
    } catch (err: any) {
      console.error("Failed to save contact", err);
      toast.error(err.response?.data?.message || "Failed to save contact.");
    }
  };

  const handleMakePrimary = async (contact: Contact) => {
    const cid = company?.company_id ?? (company as any).id;
    try {
      await axiosInstance.put(ApiEndpoint.placementContact.update_contact, {
        contact_id: contact.contact_id,
        company_id: cid,
        is_primary: 1,
      });
      toast.success("Contact marked as primary!");
      fetchContacts();
    } catch (err: any) {
      console.error("Failed to set primary contact", err);
      toast.error(err.response?.data?.message || "Failed to set primary contact.");
    }
  };

  const handleDeleteContact = async (contact: Contact) => {
    if (!window.confirm("Are you sure you want to delete this contact?")) return;
    try {
      // Deactivate contact first
      await axiosInstance.put(ApiEndpoint.placementContact.update_contact, {
        contact_id: contact.contact_id,
        is_active: 0,
      });
      // Perform soft delete/delete API
      await axiosInstance.delete(ApiEndpoint.placementContact.delete_contact, {
        data: { contact_id: contact.contact_id },
      } as any);
      toast.success("Contact deleted successfully!");
      fetchContacts();
    } catch (err: any) {
      console.error("Failed to delete contact", err);
      toast.error(err.response?.data?.message || "Failed to delete contact.");
    }
  };

  if (!company) return <div className="p-4 text-center text-gray-500">No company selected</div>;

  const name = company.company_name ?? (company as any).name ?? "-";
  const compType = company.company_type ?? (company as any).company_type ?? "Private Ltd.";
  const compEmail = company.email ?? (company as any).email ?? "-";
  const compPhone = company.phone ?? (company as any).phone ?? "-";
  const address = company.address ?? (company as any).address ?? "-";
  const website = company.website ?? (company as any).website ?? "";
  const industry = company.industry ?? (company as any).industry ?? "Software";
  const location = [company.city || (company as any).city, company.state || (company as any).state].filter(Boolean).join(", ") || company.country || (company as any).country || "India";
  const pincode = company.pincode ?? (company as any).pincode ?? "-";
  const description = company.description ?? (company as any).description ?? "";
  const linkedin = (company as any).linkedin ?? "";

  const availableRoles = Array.from(
    new Set(
      contacts
        .map((c) => c.designation_name)
        .filter((name): name is string => typeof name === "string" && name.trim() !== "")
    )
  );

  const contactPersonName = company?.contact_person ?? (company as any)?.contact_person;
  let baseContacts = [...contacts];
  if (contacts.length === 0 && contactPersonName && contactPersonName.trim() !== "") {
    baseContacts.push({
      contact_id: -1,
      company_id: company?.company_id ?? (company as any)?.id ?? 0,
      first_name: contactPersonName,
      last_name: "",
      email: company?.contact_email ?? (company as any)?.contact_email ?? "",
      phone: company?.contact_phone ?? (company as any)?.contact_phone ?? "",
      designation_id: 0,
      designation_name: company?.contact_designation ?? (company as any)?.contact_designation ?? "Primary Recruiter",
      is_primary: 1,
      status: 1,
      is_active: 1,
    });
  }

  const displayContacts = baseContacts.filter((c) => {
    // Only active contacts
    if (c.is_active !== undefined && c.is_active !== 1) return false;
    if (c.status !== undefined && c.status !== 1) return false;

    // Filter by selected roles
    if (selectedRoles.length === 0) return true;
    return c.designation_name && selectedRoles.includes(c.designation_name);
  });

  const drivesList = detailedCompany?.drives || [];
  const drivesCreated = drivesList.length || (useMock ? (Number(company?.company_id ?? (company as any).id) === 1 ? 3 : Number(company?.company_id ?? (company as any).id) === 2 ? 2 : 4) : 0);
  const offersGiven = drivesList.reduce((acc: number, d: any) => acc + (d.students_passed?.length ?? 0), 0) || (useMock ? (Number(company?.company_id ?? (company as any).id) === 1 ? 12 : Number(company?.company_id ?? (company as any).id) === 2 ? 8 : 15) : 0);
  const interviewersCount = displayContacts.length;

  const isCompanyInactive = company?.status === 0;

  return (
    <div className="space-y-6 p-1 font-sans text-gray-700 dark:text-gray-200">
      
      {/* ─── STATS BAR ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Drives Stats Card */}
        <div className="bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 dark:from-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 p-5 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.01)] flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Drives Created</p>
            <div className="text-3xl font-black text-indigo-950 dark:text-indigo-200">{drivesCreated}</div>
          </div>
          <div className="h-11 w-11 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Building className="h-5 w-5" />
          </div>
        </div>

        {/* Offers Stats Card */}
        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 dark:from-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60 p-5 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.01)] flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Offers Extended</p>
            <div className="text-3xl font-black text-emerald-950 dark:text-emerald-200">{offersGiven}</div>
          </div>
          <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle className="h-5 w-5" />
          </div>
        </div>

        {/* Interviewers Stats Card */}
        <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 dark:from-amber-950/40 border border-amber-100 dark:border-amber-900/60 p-5 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.01)] flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Active Interviewers</p>
            <div className="text-3xl font-black text-amber-950 dark:text-amber-200">{interviewersCount}</div>
          </div>
          <div className="h-11 w-11 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Users className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ─── LEFT PANE: COMPANY DETAILS ────────────────────────────────────────── */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Profile Card Header */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl border border-slate-800 flex items-center space-x-4 shadow-md relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
            <div className="h-16 w-16 bg-white/10 text-white rounded-2xl flex items-center justify-center text-3xl font-extrabold shadow-inner border border-white/20">
              {name.charAt(0)}
            </div>
            <div>
              <h4 className="text-xl font-bold text-white leading-tight">{name}</h4>
              <span className="inline-block mt-1.5 px-3 py-0.5 rounded-full text-[10px] font-bold bg-white/15 text-indigo-200 border border-white/10">
                {compType}
              </span>
            </div>
          </div>

          {/* Basic Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center space-x-3 hover:border-indigo-100 transition-colors">
              <MapPin className="text-indigo-500 h-5 w-5" />
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400">Location</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{location}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center space-x-3 hover:border-indigo-100 transition-colors">
              <Briefcase className="text-indigo-500 h-5 w-5" />
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400">Postal Code</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{pincode}</p>
              </div>
            </div>
          </div>

          {/* Informational Lists */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-6 space-y-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
            <h5 className="text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 dark:border-slate-800 pb-2">
              Company Info
            </h5>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3 text-sm">
                <Briefcase className="text-gray-400 mt-0.5 h-5 w-5" />
                <div>
                  <p className="text-xs text-gray-400">Industry</p>
                  <p className="font-medium">{industry}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 text-sm">
                <Mail className="text-gray-400 mt-0.5 h-5 w-5" />
                <div>
                  <p className="text-xs text-gray-400">Email Address</p>
                  <p className="font-medium break-all">{compEmail}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 text-sm">
                <Phone className="text-gray-400 mt-0.5 h-5 w-5" />
                <div>
                  <p className="text-xs text-gray-400">Phone</p>
                  <p className="font-medium">{compPhone}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 text-sm">
                <MapPin className="text-gray-400 mt-0.5 h-5 w-5" />
                <div>
                  <p className="text-xs text-gray-400">Address</p>
                  <p className="font-medium whitespace-pre-line leading-relaxed">{address}</p>
                </div>
              </div>
            </div>
          </div>

        {/* About Company / Description */}
        {description && (
          <div className="bg-indigo-50/20 dark:bg-slate-900/30 rounded-3xl border border-indigo-50/50 dark:border-slate-800/80 p-6 space-y-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.01)] relative overflow-hidden">
            <h5 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 pb-1.5 border-b border-indigo-50/30 dark:border-slate-800/60">
              About Company
            </h5>
            <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300 italic">
              "{description}"
            </p>
          </div>
        )}

        {/* Social / Web Links */}
        {(website || linkedin) && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-6 space-y-3.5 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
            {website && (
              <a
                href={website.startsWith("http") ? website : `https://${website}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3 rounded-2xl border border-gray-100 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600 transition-colors"
              >
                <span className="flex items-center space-x-2 text-sm font-semibold">
                  <Globe className="h-5 w-5 text-gray-400" />
                  <span>Official Website</span>
                </span>
                <span className="text-xs underline text-indigo-500 font-bold">Visit Site</span>
              </a>
            )}

            {linkedin && (
              <a
                href={linkedin}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3 rounded-2xl border border-gray-100 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600 transition-colors"
              >
                <span className="flex items-center space-x-2 text-sm font-semibold">
                  <Linkedin className="h-5 w-5 text-gray-400" />
                  <span>LinkedIn Profile</span>
                </span>
                <span className="text-xs underline text-indigo-500 font-bold">View LinkedIn</span>
              </a>
            )}
          </div>
        )}

      </div>

      {/* ─── RIGHT PANE: CONTACT MANAGEMENT ────────────────────────────────────────── */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Contacts Header */}
        <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-5 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <h4 className="text-lg font-bold text-gray-900 dark:text-white flex items-center space-x-2">
            <User className="text-indigo-600 h-5 w-5" />
            <span>Recruiter Contacts</span>
          </h4>
          <button
            disabled={isCompanyInactive}
            onClick={openAddForm}
            className={`flex items-center space-x-1.5 text-sm font-bold px-4 py-2.5 rounded-2xl shadow-sm transition-all duration-150 active:scale-95 ${
              isCompanyInactive
                ? "bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-600 border border-gray-200 dark:border-slate-700 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-[0_8px_25px_-5px_rgba(79,70,229,0.25)]"
            }`}
            title={isCompanyInactive ? "Cannot add recruiter contacts to an inactive company" : "Add Contact"}
          >
            <Plus className="h-4 w-4" />
            <span>Add Contact</span>
          </button>
        </div>

        {isCompanyInactive && (
          <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 p-4 rounded-3xl border border-amber-100 dark:border-amber-900/40 shadow-[0_4px_20px_rgba(0,0,0,0.01)] text-xs font-bold leading-relaxed">
            <Info className="h-4 w-4 shrink-0 text-amber-500" />
            <span>This company is currently INACTIVE. You cannot manage contacts or add recruiter/interviewer details for inactive companies.</span>
          </div>
        )}

        {/* Role Filter Pills */}
        {availableRoles.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
            <span className="text-xs font-bold text-gray-400 uppercase mr-1">Filter by Role:</span>
            <button
              onClick={() => setSelectedRoles([])}
              className={`px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wide uppercase transition-all ${
                selectedRoles.length === 0
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-300 hover:bg-gray-200"
              }`}
            >
              All Roles
            </button>
            {availableRoles.map((role) => {
              const isSelected = selectedRoles.includes(role);
              return (
                <button
                  key={role}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedRoles(selectedRoles.filter((r) => r !== role));
                    } else {
                      setSelectedRoles([...selectedRoles, role]);
                    }
                  }}
                  className={`px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wide uppercase transition-all ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-300 hover:bg-gray-200"
                  }`}
                >
                  {role}
                </button>
              );
            })}
          </div>
        )}

        {/* Contacts Grid/List */}
        {loading ? (
          <div className="flex justify-center items-center h-48 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : displayContacts.length === 0 ? (
          <div className="text-center p-12 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-2">
            <User className="h-12 w-12 text-gray-300 mx-auto" />
            <h5 className="font-bold text-gray-800 dark:text-gray-100 text-base">No Recruiter Contacts</h5>
            <p className="text-xs text-gray-400 max-w-xs mx-auto">
              Please click the Add Contact button above to register recruiter contact details for this company.
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
            {displayContacts.map((contact) => (
              <div
                key={contact.contact_id}
                className={`bg-white dark:bg-slate-900 p-5 rounded-3xl border transition-all shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden group ${
                  contact.is_primary === 1
                    ? "border-emerald-500/80 bg-emerald-50/5 dark:bg-emerald-950/5 shadow-[0_8px_30px_rgb(16,185,129,0.02)]"
                    : "border-gray-100 dark:border-slate-800 hover:border-indigo-200"
                }`}
              >
                <div className="flex items-start space-x-4">
                  {/* Circular Avatar */}
                  <div className="h-10 w-10 bg-indigo-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-extrabold text-sm shadow-inner shrink-0">
                    {contact.first_name.charAt(0).toUpperCase()}
                  </div>
 
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-gray-900 dark:text-white text-base">
                        {contact.first_name} {contact.last_name || ""}
                      </span>
                      {contact.is_primary === 1 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50">
                          <span className="relative flex h-1.5 w-1.5 mr-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                          </span>
                          Primary Contact
                        </span>
                      ) : isCompanyInactive ? (
                        <span className="inline-flex items-center text-[10px] font-bold text-gray-400">
                          Make Primary
                        </span>
                      ) : (
                        <button
                          onClick={() => handleMakePrimary(contact)}
                          className="inline-flex items-center text-[10px] font-bold text-indigo-500 hover:text-indigo-700 underline transition-colors"
                        >
                          Make Primary
                        </button>
                      )}
                    </div>
 
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                      <p className="flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{contact.designation_name || "No Designation"}</span>
                      </p>
                      <p className="flex items-center gap-1.5 break-all">
                        <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{contact.email || "No Email"}</span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        <span>{contact.phone || "No Phone"}</span>
                      </p>
                    </div>
                  </div>
                </div>
 
                {/* Contact Actions */}
                <div className="flex items-center gap-2.5 w-full md:w-auto justify-end border-t md:border-t-0 border-gray-100 dark:border-slate-800/80 pt-3 md:pt-0 shrink-0 z-10">
                  <button
                    disabled={isCompanyInactive}
                    onClick={() => !isCompanyInactive && openEditForm(contact)}
                    className={`flex items-center gap-1 border px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      isCompanyInactive
                        ? "border-gray-200 text-gray-400 cursor-not-allowed opacity-50 dark:border-slate-800"
                        : "border-amber-200 hover:bg-amber-50 dark:hover:bg-amber-950/20 text-amber-600"
                    }`}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </button>
                  {contact.contact_id !== -1 && (
                    <button
                      disabled={isCompanyInactive}
                      onClick={() => !isCompanyInactive && handleDeleteContact(contact)}
                      className={`flex items-center gap-1 border px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                        isCompanyInactive
                          ? "border-gray-200 text-gray-400 cursor-not-allowed opacity-50 dark:border-slate-800"
                          : "border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600"
                      }`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* ─── NESTED MODAL: CONTACT FORM ─────────────────────────────────────────── */}
      <ModalContainer
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingContact ? "Edit Recruiter Contact" : "Add Recruiter Contact"}
        size="md"
      >
        <form onSubmit={handleSaveContact} className="space-y-4 text-sm font-sans">
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 px-3.5 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950 transition text-gray-900 dark:text-gray-100"
                placeholder="e.g. John"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 px-3.5 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950 transition text-gray-900 dark:text-gray-100"
                placeholder="e.g. Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={emailVal}
              onChange={(e) => setEmailVal(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 px-3.5 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950 transition text-gray-900 dark:text-gray-100"
              placeholder="e.g. recruiter@company.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Mobile / Phone Number
            </label>
            <input
              type="tel"
              value={phoneVal}
              onChange={(e) => setPhoneVal(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 px-3.5 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950 transition text-gray-900 dark:text-gray-100"
              placeholder="e.g. +91 98765 43210"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Designation
            </label>
            <select
              value={designationId}
              onChange={(e) => setDesignationId(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 px-3.5 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950 transition cursor-pointer text-gray-900 dark:text-gray-100"
            >
              {designations.map((d) => (
                <option key={d.designation_id} value={d.designation_id}>
                  {d.designation_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="isPrimary"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
            />
            <label htmlFor="isPrimary" className="text-xs font-semibold text-gray-600 dark:text-gray-300 cursor-pointer select-none">
              Mark as Primary Contact for this company
            </label>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-4 border-t border-gray-150 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-900 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-xl text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all duration-150 active:scale-95 shadow-[0_8px_25px_-5px_rgba(79,70,229,0.25)]"
            >
              {editingContact ? "Save Changes" : "Register Contact"}
            </button>
          </div>

        </form>
      </ModalContainer>

      </div>
    </div>
  );
};

export default CompanyDetails;
