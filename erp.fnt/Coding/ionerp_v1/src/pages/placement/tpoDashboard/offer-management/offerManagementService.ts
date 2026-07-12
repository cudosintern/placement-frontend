import axiosInstance from "../../../../utils/api";
import { PlacementApiEndpoint, ApiEndpoint as PlmApiEndpoint } from "../../../../utils/ApiEndpoint/placementApiEndpoint";
import { ApiEndpoint as EmsApiEndpoint } from "../../../../utils/ApiEndpoint/emsapiEndpoint";

const STORAGE_KEY = "plm_offers_mock";

// Helper to seed and retrieve mock data from localStorage
const getLocalOffers = (): any[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    const seed = [
      {
        id: 101,
        company_id: "1",
        company_name: "Infosys",
        drive_id: "1",
        drive_name: "Infosys System Engineer Drive",
        student_id: "1",
        student_name: "Soundarya S",
        usn: "1MS21CS001",
        designation: "Associate Software Engineer",
        package_ctc: "4.5",
        location: "Bangalore",
        offer_date: "2026-06-15",
        joining_date: "2026-08-01",
        status: "Accepted",
        remarks: "Accepted on spot with excellent performance",
        created_by_name: "System Admin"
      },
      {
        id: 102,
        company_id: "2",
        company_name: "TCS",
        drive_id: "2",
        drive_name: "TCS Ninja Hiring",
        student_id: "2",
        student_name: "Neha B",
        usn: "1MS21CS002",
        designation: "Ninja Developer",
        package_ctc: "3.6",
        location: "Pune",
        offer_date: "2026-06-20",
        joining_date: "2026-09-01",
        status: "Sent",
        remarks: "Offer letter sent to candidate; awaiting reply",
        created_by_name: "TPO Coordinator"
      }
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
  return JSON.parse(data);
};

const saveLocalOffers = (offers: any[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(offers));
};

// ─── Dropdown APIs ──────────────────────────────────────────────────────────

const getCompanies = async (): Promise<any[]> => {
  try {
    const res: any = await axiosInstance.get(EmsApiEndpoint.company.company_list);
    return Array.isArray(res.data) ? res.data : res.data?.data || [];
  } catch (err) {
    console.error("offerManagementService.getCompanies failed:", err);
    // Return standard mock companies if API fails
    return [
      { company_id: 1, company_name: "Infosys" },
      { company_id: 2, company_name: "TCS" },
      { company_id: 3, company_name: "Wipro" }
    ];
  }
};

const getDrives = async (): Promise<any[]> => {
  try {
    const res: any = await axiosInstance.get(PlacementApiEndpoint.drive.list);
    return res.data?.data?.drives || [];
  } catch (err) {
    console.error("offerManagementService.getDrives failed:", err);
    // Return mock drives if API fails
    return [
      { drive_id: 1, drive_name: "Infosys System Engineer Drive", company_id: 1 },
      { drive_id: 2, drive_name: "TCS Ninja Hiring", company_id: 2 },
      { drive_id: 3, drive_name: "Wipro Turbo Recruitment", company_id: 3 }
    ];
  }
};

const getStudents = async (): Promise<any[]> => {
  try {
    const res: any = await axiosInstance.get(PlmApiEndpoint.studentProfile.get_all_students_list);
    return res.data?.data || [];
  } catch (err) {
    console.error("offerManagementService.getStudents failed:", err);
    // Return mock students if API fails
    return [
      { student_id: 1, name: "Soundarya S", usno: "1MS21CS001", regno: "1MS21CS001" },
      { student_id: 2, name: "Neha B", usno: "1MS21CS002", regno: "1MS21CS002" },
      { student_id: 3, name: "Vikram R", usno: "1MS21CS003", regno: "1MS21CS003" }
    ];
  }
};

// ─── CRUD Operations ─────────────────────────────────────────────────────────

const getOffers = async (): Promise<any[]> => {
  const res: any = await axiosInstance.get(PlacementApiEndpoint.offer.list);
  return res.data?.data || [];
};

const addOffer = async (payload: any): Promise<any> => {
  const res: any = await axiosInstance.post(PlacementApiEndpoint.offer.save, payload);
  if (res.data?.status === false) {
    throw new Error(res.data?.message || "Failed to create offer.");
  }
  return res.data;
};

const updateOffer = async (id: number | string, payload: any): Promise<any> => {
  const res: any = await axiosInstance.put(`${PlacementApiEndpoint.offer.update}/${id}`, payload);
  if (res.data?.status === false) {
    throw new Error(res.data?.message || "Failed to update offer.");
  }
  return res.data;
};

const deleteOffer = async (id: number | string): Promise<any> => {
  const res: any = await axiosInstance.delete(`${PlacementApiEndpoint.offer.delete}/${id}`);
  if (res.data?.status === false) {
    throw new Error(res.data?.message || "Failed to delete offer.");
  }
  return res.data;
};

const downloadOfferLetter = async (id: number | string, studentName: string): Promise<void> => {
  try {
    const res: any = await axiosInstance.get(`placement/offer/generate-letter/${id}`, {
      responseType: 'blob'
    });
    const blob = new Blob([res.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Offer_Letter_${studentName.replace(/\s+/g, '_')}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("offerManagementService.downloadOfferLetter failed:", err);
    throw err;
  }
};

const getPostPlacementRecords = async (): Promise<any[]> => {
  try {
    const res: any = await axiosInstance.get("placement/offer/post-placement/list");
    return res.data?.data || [];
  } catch (err) {
    console.error("offerManagementService.getPostPlacementRecords failed:", err);
    return [];
  }
};

const savePostPlacementRecord = async (payload: any): Promise<any> => {
  const res: any = await axiosInstance.post("placement/offer/post-placement/save", payload);
  if (res.data?.status === false) {
    throw new Error(res.data?.message || "Failed to update onboarding record.");
  }
  return res.data;
};

const getInterviewPassedStudents = async (driveId: number | string): Promise<any[]> => {
  try {
    const res: any = await axiosInstance.get(`placement/offer/passed-students/${driveId}`);
    return res.data?.data || [];
  } catch (err) {
    console.error("offerManagementService.getInterviewPassedStudents failed:", err);
    return [
      { student_id: 1, name: "Soundarya S", usno: "1MS21CS001", regno: "1MS21CS001" },
      { student_id: 2, name: "Neha B", usno: "1MS21CS002", regno: "1MS21CS002" },
      { student_id: 3, name: "Vikram R", usno: "1MS21CS003", regno: "1MS21CS003" }
    ];
  }
};

const offerManagementService = {
  getCompanies,
  getDrives,
  getStudents,
  getOffers,
  addOffer,
  updateOffer,
  deleteOffer,
  downloadOfferLetter,
  getPostPlacementRecords,
  savePostPlacementRecord,
  getInterviewPassedStudents
};

export default offerManagementService;
