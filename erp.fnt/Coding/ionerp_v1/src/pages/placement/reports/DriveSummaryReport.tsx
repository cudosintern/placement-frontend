import React, { useState, useEffect } from "react";
import axiosInstance from "../../../utils/api";
import { Search, RefreshCw, BarChart2, Calendar, Layout, ShieldAlert } from "lucide-react";
import { toast } from "react-toastify";

interface DriveSummaryData {
  drive_id: number;
  drive_name: string;
  company_name: string;
  applications: number;
  eligible: number;
  shortlisted: number;
  waitlisted: number;
  rejected: number;
  interviewed: number;
  offers_issued: number;
  offers_accepted: number;
}

interface DropdownOption {
  value: string | number;
  label: string;
}

const DriveSummaryReport: React.FC = () => {
  const [reportData, setReportData] = useState<DriveSummaryData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Filters
  const [company, setCompany] = useState<string>("All");
  const [status, setStatus] = useState<string>("All");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  // Options
  const [companies, setCompanies] = useState<DropdownOption[]>([
    { value: "All", label: "All Companies" }
  ]);
  const statuses = [
    { value: "All", label: "All Statuses" },
    { value: "Ongoing", label: "Ongoing" },
    { value: "Completed", label: "Completed" },
    { value: "Upcoming", label: "Upcoming" }
  ];

  // Fetch Companies Dropdown
  useEffect(() => {
    const fetchCompanies = async () => {
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
        console.error("Failed to load companies", err);
      }
    };
    fetchCompanies();
  }, []);

  // Fetch Report Data
  const fetchReport = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (company !== "All") params.company_id = company;
      if (status !== "All") params.status = status;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const res = await axiosInstance.get("/placement/reports/drive-summary", { params });
      const body = res.data as any;
      if (body?.status) {
        setReportData(body.data);
      } else {
        toast.error("Failed to fetch drive summary report");
      }
    } catch (err) {
      toast.error("Error retrieving drive summary");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  return (
    <div className="p-6 bg-slate-50 min-h-screen text-slate-800">
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Recruiter Drive Summary Report</h1>
        <p className="text-slate-500 text-sm mt-1">Analyse recruiters, candidate progression funnels, and application metrics.</p>
      </div>

      {/* Filter Card */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200/80 mb-6">
        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          Filter Criteria
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Company Filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500">Recruiting Company</label>
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

          {/* Drive Status Filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500">Drive Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150"
            >
              {statuses.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500">Start Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 text-slate-700"
            />
          </div>

          {/* Date To */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500">End Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 text-slate-700"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-slate-100">
          <button
            onClick={() => {
              setCompany("All");
              setStatus("All");
              setDateFrom("");
              setDateTo("");
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
            {loading ? "Filtering..." : "Search Drives"}
          </button>
        </div>
      </div>

      {/* Grid of Results / Drives */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 py-20 flex flex-col justify-center items-center gap-3">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-slate-400 text-sm">Aggregating funnel progression...</p>
        </div>
      ) : reportData.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 py-20 text-center">
          <Layout className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-slate-700 font-semibold text-lg">No Recruitment Drives Found</h3>
          <p className="text-slate-400 text-sm mt-1">Try expanding the date filters or selecting a different company.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {reportData.map((drive) => {
            // Percent calculations for recruiting funnel
            const appCount = drive.applications || 1;
            const interviewPercent = ((drive.interviewed / appCount) * 100).toFixed(0);
            const shortlistPercent = ((drive.shortlisted / appCount) * 100).toFixed(0);
            const offersPercent = ((drive.offers_accepted / appCount) * 100).toFixed(0);

            return (
              <div key={drive.drive_id} className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-6 flex flex-col lg:flex-row gap-6 hover:shadow-md transition duration-250">
                {/* Drive Metadata Card */}
                <div className="lg:w-5/12 border-r border-slate-100 lg:pr-6 flex flex-col justify-between">
                  <div>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-xs font-semibold uppercase tracking-wider">{drive.company_name}</span>
                    <h3 className="text-lg font-bold text-slate-900 mt-2">{drive.drive_name}</h3>
                  </div>

                  <div className="grid grid-cols-4 gap-2 mt-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="text-center">
                      <p className="text-[9px] font-semibold uppercase text-slate-400 tracking-wider">Applied</p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">{drive.applications}</p>
                    </div>
                    <div className="text-center border-l border-slate-200/60">
                      <p className="text-[9px] font-semibold uppercase text-slate-400 tracking-wider">Eligible</p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">{drive.eligible}</p>
                    </div>
                    <div className="text-center border-l border-slate-200/60">
                      <p className="text-[9px] font-semibold uppercase text-slate-400 tracking-wider">Shortlist</p>
                      <p className="text-sm font-bold text-indigo-600 mt-0.5">{drive.shortlisted}</p>
                    </div>
                    <div className="text-center border-l border-slate-200/60">
                      <p className="text-[9px] font-semibold uppercase text-slate-400 tracking-wider">Waitlist</p>
                      <p className="text-sm font-bold text-amber-600 mt-0.5">{drive.waitlisted}</p>
                    </div>

                    <div className="text-center border-t border-slate-200/60 pt-2">
                      <p className="text-[9px] font-semibold uppercase text-slate-400 tracking-wider">Rejected</p>
                      <p className="text-sm font-bold text-rose-600 mt-0.5">{drive.rejected}</p>
                    </div>
                    <div className="text-center border-t border-l border-slate-200/60 pt-2">
                      <p className="text-[9px] font-semibold uppercase text-slate-400 tracking-wider">Interview</p>
                      <p className="text-sm font-bold text-blue-600 mt-0.5">{drive.interviewed}</p>
                    </div>
                    <div className="text-center border-t border-l border-slate-200/60 pt-2">
                      <p className="text-[9px] font-semibold uppercase text-slate-400 tracking-wider">Issued</p>
                      <p className="text-sm font-bold text-teal-600 mt-0.5">{drive.offers_issued}</p>
                    </div>
                    <div className="text-center border-t border-l border-slate-200/60 pt-2">
                      <p className="text-[9px] font-semibold uppercase text-slate-400 tracking-wider">Accepted</p>
                      <p className="text-sm font-bold text-emerald-600 mt-0.5">{drive.offers_accepted}</p>
                    </div>
                  </div>
                </div>

                {/* progression funnel */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                      <BarChart2 className="w-4 h-4 text-blue-500" />
                      Candidate Selection Funnel
                    </h4>

                    {/* Progression stages */}
                    <div className="flex flex-col gap-4">
                      {/* Applications */}
                      <div>
                        <div className="flex justify-between items-center text-xs font-semibold mb-1">
                          <span className="text-slate-600">Applications Received</span>
                          <span className="text-slate-900">{drive.applications} candidates</span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 rounded-full" style={{ width: "100%" }}></div>
                        </div>
                      </div>

                      {/* Interviewed */}
                      <div>
                        <div className="flex justify-between items-center text-xs font-semibold mb-1">
                          <span className="text-slate-600">Interviewed Stage</span>
                          <span className="text-slate-900">{drive.interviewed} candidates ({interviewPercent}%)</span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${interviewPercent}%` }}></div>
                        </div>
                      </div>

                      {/* Shortlisted */}
                      <div>
                        <div className="flex justify-between items-center text-xs font-semibold mb-1">
                          <span className="text-slate-600">Shortlisted Stage</span>
                          <span className="text-slate-900">{drive.shortlisted} candidates ({shortlistPercent}%)</span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${shortlistPercent}%` }}></div>
                        </div>
                      </div>

                      {/* Offers Accepted */}
                      <div>
                        <div className="flex justify-between items-center text-xs font-semibold mb-1">
                          <span className="text-slate-600">Offers Accepted</span>
                          <span className="text-slate-900 font-bold text-emerald-600">{drive.offers_accepted} placements ({offersPercent}%)</span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-600 rounded-full transition-all duration-500" style={{ width: `${offersPercent}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DriveSummaryReport;
