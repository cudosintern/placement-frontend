import React, { useState, useEffect } from "react";
import axiosInstance from "../../../utils/api";
import { Download, FileSpreadsheet, FileText, Search, RefreshCw, GraduationCap, Briefcase, Award, CheckCircle } from "lucide-react";
import { toast } from "react-toastify";

interface StudentPlacementData {
  usn: string;
  name: string;
  branch: string;
  cgpa: number;
  company: string;
  designation: string;
  ctc: string;
  status: string;
}

interface DropdownOption {
  value: string | number;
  label: string;
}

const StudentPlacementReport: React.FC = () => {
  const [reportData, setReportData] = useState<StudentPlacementData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Filter States
  const [branch, setBranch] = useState<string>("All");
  const [batch, setBatch] = useState<string>("All");
  const [status, setStatus] = useState<string>("All");
  const [company, setCompany] = useState<string>("All");

  // Options States
  const [branches, setBranches] = useState<DropdownOption[]>([
    { value: "All", label: "All Branches" },
    { value: 1, label: "Computer Science & Engineering (CSE)" },
    { value: 2, label: "Information Science & Engineering (ISE)" },
    { value: 3, label: "Electronics & Communication Engineering (ECE)" }
  ]);
  const [batches, setBatches] = useState<DropdownOption[]>([
    { value: "All", label: "All Batches" },
    { value: 1, label: "2025CSE" },
    { value: 2, label: "2025ISE" },
    { value: 3, label: "2025ECE" }
  ]);
  const [companies, setCompanies] = useState<DropdownOption[]>([
    { value: "All", label: "All Companies" }
  ]);

  // Fetch Dropdown Metadata
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const res = await axiosInstance.get("/comman_function/company_list");
        const body = res.data as any;
        if (body?.status && Array.isArray(body.data)) {
          const companyOptions = body.data.map((c: any) => ({
            value: c.company_id,
            label: c.company_name
          }));
          setCompanies([{ value: "All", label: "All Companies" }, ...companyOptions]);
        }
      } catch (err) {
        console.error("Failed to load metadata", err);
      }
    };
    fetchMetadata();
  }, []);

  // Fetch Report Data
  const fetchReport = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (branch !== "All") params.dept_id = branch;
      if (batch !== "All") params.batch_id = batch;
      if (status !== "All") params.placement_status = status;
      if (company !== "All") params.company_id = company;

      const res = await axiosInstance.get("/placement/reports/student-placement", { params });
      const body = res.data as any;
      if (body?.status) {
        setReportData(body.data);
      } else {
        toast.error("Failed to fetch placement report");
      }
    } catch (err) {
      toast.error("Error fetching report data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  // Calculate Metrics
  const totalStudents = reportData.length;
  const placedStudents = reportData.filter(s => s.status === "PLACED").length;
  const unplacedStudents = reportData.filter(s => s.status === "UNPLACED").length;
  const placementRate = totalStudents > 0 ? ((placedStudents / totalStudents) * 100).toFixed(1) : "0.0";

  // Handle Export Excel
  const handleExportExcel = () => {
    const params = new URLSearchParams();
    if (branch !== "All") params.append("dept_id", branch);
    if (batch !== "All") params.append("batch_id", batch);
    if (status !== "All") params.append("placement_status", status);
    if (company !== "All") params.append("company_id", company);

    const base = axiosInstance.defaults.baseURL || "http://localhost:8003/";
    const cleanedBase = base.endsWith("/") ? base.slice(0, -1) : base;
    window.open(`${cleanedBase}/placement/reports/student-placement/export-excel?${params.toString()}`);
  };

  // Handle Export PDF
  const handleExportPdf = () => {
    const params = new URLSearchParams();
    if (branch !== "All") params.append("dept_id", branch);
    if (batch !== "All") params.append("batch_id", batch);
    if (status !== "All") params.append("placement_status", status);
    if (company !== "All") params.append("company_id", company);

    const base = axiosInstance.defaults.baseURL || "http://localhost:8003/";
    const cleanedBase = base.endsWith("/") ? base.slice(0, -1) : base;
    window.open(`${cleanedBase}/placement/reports/student-placement/export-pdf?${params.toString()}`);
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen text-slate-800">
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Placement Status Report</h1>
          <p className="text-slate-500 text-sm mt-1">Monitor, filter, and export student placement recruitment metrics.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm text-sm font-medium transition duration-250 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Excel
          </button>
          <button
            onClick={handleExportPdf}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm text-sm font-medium transition duration-250 cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Metrics Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200/80 flex items-center gap-4 hover:scale-[1.02] transition duration-250">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Evaluated</span>
            <h3 className="text-2xl font-bold text-slate-950 mt-1">{totalStudents}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200/80 flex items-center gap-4 hover:scale-[1.02] transition duration-250">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Placed Students</span>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">{placedStudents}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200/80 flex items-center gap-4 hover:scale-[1.02] transition duration-250">
          <div className="p-3 bg-slate-100 text-slate-600 rounded-lg">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Unplaced Students</span>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{unplacedStudents}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200/80 flex items-center gap-4 hover:scale-[1.02] transition duration-250">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Placement Rate</span>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">{placementRate}%</h3>
          </div>
        </div>
      </div>

      {/* Filter Card */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200/80 mb-6">
        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400" />
          Filter Criteria
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Branch Dropdown */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500">Branch</label>
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150"
            >
              {branches.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Batch Dropdown */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500">Batch</label>
            <select
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150"
            >
              {batches.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500">Placement Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150"
            >
              <option value="All">All Statuses</option>
              <option value="PLACED">PLACED</option>
              <option value="UNPLACED">UNPLACED</option>
            </select>
          </div>

          {/* Company Dropdown */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500">Company</label>
            <select
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150"
            >
              {companies.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-slate-100">
          <button
            onClick={() => {
              setBranch("All");
              setBatch("All");
              setStatus("All");
              setCompany("All");
            }}
            className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-sm font-medium transition duration-200 cursor-pointer"
          >
            Reset Filters
          </button>
          <button
            onClick={fetchReport}
            disabled={loading}
            className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition duration-200 cursor-pointer disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {loading ? "Searching..." : "Apply Filters"}
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col justify-center items-center gap-3">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-slate-400 text-sm">Retrieving real-time reports...</p>
          </div>
        ) : reportData.length === 0 ? (
          <div className="py-20 text-center">
            <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-slate-700 font-semibold text-lg">No Student Records Found</h3>
            <p className="text-slate-400 text-sm mt-1">Try broadening your filter criteria or checking your database seeding.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                  <th className="px-6 py-4">USN</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Branch</th>
                  <th className="px-6 py-4 text-center">CGPA</th>
                  <th className="px-6 py-4">Company</th>
                  <th className="px-6 py-4">Designation</th>
                  <th className="px-6 py-4 text-center">CTC</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {reportData.map((row, idx) => (
                  <tr key={row.usn + idx} className="hover:bg-slate-50/60 transition duration-150">
                    <td className="px-6 py-4 font-mono font-medium text-slate-900">{row.usn}</td>
                    <td className="px-6 py-4 font-medium text-slate-800">{row.name}</td>
                    <td className="px-6 py-4 text-slate-600">{row.branch}</td>
                    <td className="px-6 py-4 text-center font-semibold text-slate-800">{row.cgpa}</td>
                    <td className="px-6 py-4 text-slate-700 font-medium">{row.company}</td>
                    <td className="px-6 py-4 text-slate-600">{row.designation}</td>
                    <td className="px-6 py-4 text-center text-slate-700 font-semibold">{row.ctc}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${
                        row.status === "PLACED"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentPlacementReport;
