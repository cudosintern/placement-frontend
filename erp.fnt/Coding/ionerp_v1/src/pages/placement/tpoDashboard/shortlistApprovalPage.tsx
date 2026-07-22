import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Loader2, ArrowLeft, ChevronDown } from "lucide-react";
import axiosInstance from "../../../utils/api";
import { PlacementApiEndpoint } from "../../../utils/ApiEndpoint/placementApiEndpoints";
import { DriveRecord } from "./driveSchema";
import { DriveApplicant } from "./driveDetailPage";

const CLR = {
  navy: "#17375e",
  navyLight: "#1e4d8c",
};

const ShortlistApprovalPage: React.FC = () => {
  const navigate = useNavigate();

  const [drives, setDrives] = useState<DriveRecord[]>([]);
  const [drivesLoading, setDrivesLoading] = useState(true);

  const [selectedCompanyId, setSelectedCompanyId] = useState<number | "">("");
  const [selectedDriveId, setSelectedDriveId] = useState<number | "">("");

  const [applicants, setApplicants] = useState<DriveApplicant[]>([]);
  const [appLoading, setAppLoading] = useState(false);

  // State to hold reason per application
  const [reasons, setReasons] = useState<Record<number, string>>({});
  const [processing, setProcessing] = useState<number | null>(null);

  // 1. Fetch active drives
  useEffect(() => {
    const fetchDrives = async () => {
      setDrivesLoading(true);
      try {
        const res = await axiosInstance.get(PlacementApiEndpoint.drive.list);
        const body = res.data as any;
        if (body?.status) {
          const allDrives: DriveRecord[] = Array.isArray(body.data?.drives) ? body.data.drives : [];
          // Filter to active drives (status === 2)
          setDrives(allDrives.filter(d => d.status === 2));
        }
      } catch {
        toast.error("Failed to load active drives.");
      } finally {
        setDrivesLoading(false);
      }
    };
    fetchDrives();
  }, []);

  // Compute unique companies from active drives
  const companies = useMemo(() => {
    const map = new Map<number, string>();
    drives.forEach((d) => map.set(d.company_id, d.company_name));
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [drives]);

  // Compute drives for selected company
  const companyDrives = useMemo(() => {
    if (selectedCompanyId === "") return [];
    return drives.filter((d) => d.company_id === selectedCompanyId);
  }, [drives, selectedCompanyId]);

  // 2. Fetch applications when a drive is selected
  const fetchApplications = useCallback(async (driveId: number) => {
    setAppLoading(true);
    try {
      const res = await axiosInstance.get(PlacementApiEndpoint.applications.list, {
        params: { drive_id: driveId },
      });
      const body = res.data as any;
      if (body?.status) {
        const allApps: DriveApplicant[] = Array.isArray(body.data?.applicants)
          ? body.data.applicants
          : [];
        // Filter to waitlisted with override reason only
        const filtered = allApps.filter(a => a.status === "WAITLISTED" && a.override_reason);
        setApplicants(filtered);
      }
    } catch {
      toast.error("Failed to load applications.");
      setApplicants([]);
    } finally {
      setAppLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedDriveId !== "") {
      fetchApplications(selectedDriveId);
    } else {
      setApplicants([]);
      setReasons({});
    }
  }, [selectedDriveId, fetchApplications]);

  // Handle Approve
  const handleApprove = async (appId: number) => {
    const reason = reasons[appId] || "";
    setProcessing(appId);
    try {
      const res = await axiosInstance.post(PlacementApiEndpoint.applications.override_shortlist, {
        application_id: appId,
        reason: reason.trim(),
      });
      if ((res.data as any)?.status) {
        toast.success("Student successfully shortlisted.");
        setApplicants((prev) => prev.filter(a => a.application_id !== appId));
      } else {
        toast.error((res.data as any)?.message || "Action failed.");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Action failed.");
    } finally {
      setProcessing(null);
    }
  };

  // Handle Reject Override
  const handleReject = async (appId: number) => {
    const reason = reasons[appId] || "";
    if (!window.confirm("Are you sure you want to permanently reject this waitlisted student?")) {
      return;
    }
    setProcessing(appId);
    try {
      const res = await axiosInstance.post(PlacementApiEndpoint.applications.override_reject, {
        application_id: appId,
        reason: reason.trim(),
      });
      if ((res.data as any)?.status) {
        toast.success("Override request rejected. Student remains waitlisted.");
        setApplicants((prev) => prev.filter(a => a.application_id !== appId));
      } else {
        toast.error((res.data as any)?.message || "Action failed.");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Action failed.");
    } finally {
      setProcessing(null);
    }
  };

  // Helper to compute rejection reason based on drive criteria
  const getWhyWaitlisted = (app: DriveApplicant) => {
    const drive = companyDrives.find(d => d.drive_id === selectedDriveId);
    if (!drive) return "Drive info unavailable";

    const reasonsList: string[] = [];
    if (drive.min_cgpa !== null && app.cgpa < drive.min_cgpa) {
      reasonsList.push(`CGPA ${app.cgpa} < minimum required ${drive.min_cgpa}`);
    }
    if (drive.max_backlogs !== null && app.backlogs > drive.max_backlogs) {
      reasonsList.push(`${app.backlogs} backlog(s) — max: ${drive.max_backlogs}`);
    }
    
    // If no direct criteria violation, assume vacancy cap
    if (reasonsList.length === 0) {
      const remaining = (drive.vacancy_count ?? 0) - (drive.shortlisted_count ?? 0);
      if (remaining <= 0 && drive.vacancy_count !== null && drive.vacancy_count > 0) {
        return `Vacancy cap reached (${drive.shortlisted_count}/${drive.vacancy_count} filled)`;
      } else {
        return "Not selected in initial phases or branch not eligible";
      }
    }

    return reasonsList.join(" · ");
  };


  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto", fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: CLR.navy, margin: "0 0 6px 0" }}>
            Shortlist Approvals (Override)
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
            Review waitlisted students and override shortlisting bypass restrictions (e.g. vacancy limits).
          </p>
        </div>
        <button
          onClick={() => navigate("/tpo/placement-drive")}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 16px", fontSize: 13, fontWeight: 600,
            background: "#fff", border: "1px solid #d1d5db", borderRadius: 8,
            color: "#374151", cursor: "pointer", boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
          }}
        >
          <ArrowLeft size={16} /> Back to Drives
        </button>
      </div>

      {/* Selectors */}
      <div style={{ display: "flex", gap: 16, marginBottom: 32, background: "#fff", padding: 20, borderRadius: 12, border: "1px solid #e5e7eb", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#4b5563", marginBottom: 6 }}>
            Select Company
          </label>
          <div style={{ position: "relative" }}>
            <select
              value={selectedCompanyId}
              onChange={(e) => {
                setSelectedCompanyId(e.target.value === "" ? "" : Number(e.target.value));
                setSelectedDriveId(""); // reset drive
              }}
              style={{
                width: "100%", padding: "10px 14px", fontSize: 14,
                border: "1px solid #d1d5db", borderRadius: 8, appearance: "none",
                background: "#f9fafb", cursor: "pointer", color: "#111827"
              }}
              disabled={drivesLoading}
            >
              <option value="">-- Choose a Company --</option>
              {companies.map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
            <ChevronDown size={16} color="#6b7280" style={{ position: "absolute", right: 14, top: 12, pointerEvents: "none" }} />
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#4b5563", marginBottom: 6 }}>
            Select Drive
          </label>
          <div style={{ position: "relative" }}>
            <select
              value={selectedDriveId}
              onChange={(e) => setSelectedDriveId(e.target.value === "" ? "" : Number(e.target.value))}
              disabled={selectedCompanyId === ""}
              style={{
                width: "100%", padding: "10px 14px", fontSize: 14,
                border: "1px solid #d1d5db", borderRadius: 8, appearance: "none",
                background: selectedCompanyId === "" ? "#e5e7eb" : "#f9fafb", cursor: "pointer", color: "#111827"
              }}
            >
              <option value="">-- Choose a Drive --</option>
              {companyDrives.map(d => (
                <option key={d.drive_id} value={d.drive_id}>
                  {d.drive_name}
                </option>
              ))}
            </select>
            <ChevronDown size={16} color="#6b7280" style={{ position: "absolute", right: 14, top: 12, pointerEvents: "none" }} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div>
        {appLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 60, color: "#6b7280" }}>
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : selectedDriveId === "" ? (
          <div style={{ textAlign: "center", padding: 60, color: "#9ca3af", background: "#f9fafb", borderRadius: 12, border: "2px dashed #e5e7eb" }}>
            Please select a company and drive to view waitlisted students.
          </div>
        ) : applicants.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#9ca3af", background: "#f9fafb", borderRadius: 12, border: "2px dashed #e5e7eb" }}>
            No waitlisted students found for this drive.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#374151" }}>
              Waitlisted Students ({applicants.length})
            </div>
            {applicants.map(app => (
              <div
                key={app.application_id}
                style={{
                  background: "#fff", border: "1px solid #e5e7eb", borderLeft: "4px solid #f59e0b",
                  borderRadius: 12, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
                }}
              >
                {/* Header row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: "#111827" }}>
                      {app.name} — {app.usno}
                    </h3>
                    <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
                      {app.department} · CGPA {app.cgpa.toFixed(2)} · {app.backlogs} backlogs · Applied {new Date(app.applied_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <span style={{ background: "#fef3c7", color: "#d97706", padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                    Pending Approval
                  </span>
                </div>

                {/* Why waitlisted */}
                <div style={{ background: "#fafafa", border: "1px solid #f3f4f6", padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af", marginBottom: 4 }}>Why waitlisted by system</div>
                  <div style={{ fontSize: 13, color: "#dc2626", fontWeight: 500 }}>
                    {getWhyWaitlisted(app)}
                  </div>
                </div>

                {/* Officer's override remarks */}
                {app.override_reason && (
                  <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", padding: 12, borderRadius: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#0369a1", marginBottom: 4 }}>Officer Override Justification</div>
                    <div style={{ fontSize: 13, color: "#0c4a6e", fontWeight: 500, whiteSpace: "pre-wrap" }}>
                      {app.override_reason}
                    </div>
                  </div>
                )}

                {/* Input & Actions */}
                <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                  <textarea
                    placeholder="Add comments/remarks (optional)..."
                    value={reasons[app.application_id] || ""}
                    onChange={(e) => setReasons({ ...reasons, [app.application_id]: e.target.value })}
                    style={{
                      flex: 1, padding: "12px 14px", fontSize: 13, minHeight: 60,
                      border: "1px solid #d1d5db", borderRadius: 8, resize: "vertical", fontFamily: "inherit"
                    }}
                  />
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 160 }}>
                    <button
                      onClick={() => handleApprove(app.application_id)}
                      disabled={processing === app.application_id}
                      style={{
                        padding: "10px 16px", background: CLR.navy, color: "#fff",
                        border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600,
                        cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center"
                      }}
                    >
                      {processing === app.application_id ? <Loader2 size={16} className="animate-spin" /> : "Approve & Shortlist"}
                    </button>
                    <button
                      onClick={() => handleReject(app.application_id)}
                      disabled={processing === app.application_id}
                      style={{
                        padding: "8px 16px", background: "#fef2f2", color: "#dc2626",
                        border: "1px solid #fecaca", borderRadius: 8, fontSize: 13, fontWeight: 600,
                        cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center"
                      }}
                    >
                      {processing === app.application_id ? <Loader2 size={16} className="animate-spin" /> : "Reject Override"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShortlistApprovalPage;
