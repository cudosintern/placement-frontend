import React, { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "react-toastify";
import axiosInstance from "../../../../utils/api";
import { PlacementApiEndpoint } from "../../../../utils/ApiEndpoint/placementapiEndpoint";
import DataTable from "../../../../components/Table/DataTable";
import {
  ConfirmedScheduleRecord,
  RoundResult,
  ResultValue,
  RESULT_CONFIG,
  ROUND_TYPE_BADGE,
} from "./interviewTypes";

import * as XLSX from "xlsx";

import {
  Users,
  CheckCircle,
  XCircle,
  PauseCircle,
  Ban,
  Calendar,
  Globe,
  Building,
  Edit3,
  FileText,
  Save
} from "lucide-react";

import * as interviewService from "./interviewService";
import type { MetaResponse } from "./interviewService";

// ─────────────────────────────────────────────
// MOCK MODE — flip to false when backend ready
// ─────────────────────────────────────────────
const MOCK_MODE = false;

// Helper: days remaining
const getDaysUntil = (dateStr: string): number => {
  const diffTime = new Date(dateStr).getTime() - new Date().setHours(0, 0, 0, 0);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Company Logo Resolver
const getCompanyLogo = (companyName: string) => {
  const normalized = companyName.toLowerCase();
  
  if (normalized.includes("google")) {
    return (
      <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center p-2 shadow-inner">
        <svg viewBox="0 0 24 24" className="w-7 h-7">
          <path
            fill="#EA4335"
            d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.227-3.1C18.281 1.05 15.45 0 12.24 0 5.58 0 0 5.37 0 12s5.58 12 12.24 12c6.96 0 11.57-4.89 11.57-11.79 0-.795-.085-1.4-.195-1.925H12.24z"
          />
        </svg>
      </div>
    );
  }

  if (normalized.includes("microsoft")) {
    return (
      <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center p-2 shadow-inner">
        <svg viewBox="0 0 23 23" className="w-7 h-7">
          <path fill="#F25022" d="M0 0h11v11H0z" />
          <path fill="#7FBA00" d="M12 0h11v11H12z" />
          <path fill="#00A4EF" d="M0 12h11v11H0z" />
          <path fill="#FFB900" d="M12 12h11v11H12z" />
        </svg>
      </div>
    );
  }

  if (normalized.includes("amazon")) {
    return (
      <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center p-2.5 shadow-inner">
        <svg viewBox="0 0 256 79" className="w-8 h-8">
          <path fill="#232F3E" d="M22.9 59.8c-2.3-1.6-4.6-3.8-6.1-6.1-2.9-4.2-3.3-8.8-3.3-19.1 0-14.7 6.1-20.8 17.6-20.8 12.1 0 16.2 7.7 16.2 19.3V44c0 11.7-4.1 19.4-16.2 19.4-3.3.1-6.1-.9-8.2-3.6zm8.2-35.8c-5.3 0-6.1 4-6.1 10.9v8.3c0 6.9.8 10.9 6.1 10.9s6.1-4 6.1-10.9v-8.3c0-6.9-.8-10.9-6.1-10.9z" />
          <path fill="#FF9900" d="M3.7 65.6c43.6 30 109 41.7 167 41.7 34.3 0 69.1-4.7 99.4-14.8 5-1.7 4.1-8.5-1.2-7.5-29 5.8-60.8 9.2-92.4 9.2-53.7 0-112.5-11.4-152-37-3.9-2.5-7.9 2-4.1 5.9l3.3 2.5z" />
        </svg>
      </div>
    );
  }

  // Fallback to stylized letters
  const firstLetter = companyName.charAt(0).toUpperCase();
  const gradients = [
    "from-indigo-600 to-blue-600 text-white",
    "from-emerald-600 to-teal-600 text-white",
    "from-violet-600 to-purple-600 text-white",
    "from-rose-600 to-pink-600 text-white",
    "from-amber-600 to-orange-600 text-white"
  ];
  const charCodeSum = companyName.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const selectedGradient = gradients[charCodeSum % gradients.length];

  return (
    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${selectedGradient} flex items-center justify-center text-lg font-bold shadow-[0_4px_12px_rgba(0,0,0,0.08)]`}>
      {firstLetter}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const RoundResultPage: React.FC = () => {
  const [drives, setDrives]                     = useState<MetaResponse["drives"]>([]);
  const [selectedDriveId, setSelectedDriveId]   = useState<number | "">("");
  const [schedules, setSchedules]               = useState<ConfirmedScheduleRecord[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | "">("");
  const [results, setResults]                   = useState<RoundResult[]>([]);
  const [editedCells, setEditedCells]           = useState<Record<number, Partial<RoundResult>>>({});
  const [loading, setLoading]                   = useState(false);
  const [saving, setSaving]                     = useState(false);

  // Override State
  const [overrideRow, setOverrideRow]           = useState<RoundResult | null>(null);
  const [overrideStatus, setOverrideStatus]     = useState<ResultValue>("PASS");
  const [overrideNotes, setOverrideNotes]       = useState<string>("");
  const [isOverriding, setIsOverriding]         = useState(false);

  // Bulk Selection State
  const [selectedIds, setSelectedIds]           = useState<Set<number>>(new Set());
  const [topNInput, setTopNInput]               = useState<string>("");
  const [showOnlySelected, setShowOnlySelected] = useState<boolean>(false);
  const [showOnlyUnselected, setShowOnlyUnselected] = useState<boolean>(false);

  // ── Selected schedule ─────────────────────────────────────────────────────
  const selectedSchedule = useMemo(
    () => schedules.find(s => s.schedule_id === Number(selectedScheduleId)),
    [schedules, selectedScheduleId],
  );

  // ── Load drives on mount ───────────────────────────────────────────────────
  useEffect(() => {
    interviewService.getMeta().then(data => {
      if (data?.drives) setDrives(data.drives);
    });
  }, []);

  // ── Load schedules when drive changes ──────────────────────────────────────
  useEffect(() => {
    if (!selectedDriveId) {
      setSchedules([]);
      setSelectedScheduleId("");
      return;
    }
    setLoading(true);
    interviewService.getScheduleList(Number(selectedDriveId))
      .then(data => {
        setSchedules(data?.schedules?.filter(s => s.is_active === 1 && (s.status === "SCHEDULED" || s.status === "DISPATCHED")) ?? []);
        setSelectedScheduleId("");
      })
      .finally(() => setLoading(false));
  }, [selectedDriveId]);

  // ── Load results when schedule changes ────────────────────────────────────
  useEffect(() => {
    if (!selectedScheduleId) { 
      setResults([]); 
      setEditedCells({});
      setSelectedIds(new Set());
      setTopNInput("");
      setShowOnlySelected(false);
      setShowOnlyUnselected(false);
      return; 
    }
    loadResults(Number(selectedScheduleId));
  }, [selectedScheduleId]);

  const loadResults = async (scheduleId: number) => {
    setLoading(true);
    const schedule = schedules.find(s => s.schedule_id === scheduleId);
    if (!schedule) { setLoading(false); return; }

    try {
      const data = await interviewService.getResults(scheduleId);
      setResults(data?.results ?? []);
      setEditedCells({});
      setSelectedIds(new Set());
    } catch {
      toast.error("Failed to load results.");
    } finally {
      setLoading(false);
    }
  };

  // ── Merge edits onto results and apply filters ─────────────────────────────
  const tableRows = useMemo(() =>
    results
      .map(r => ({
        ...r,
        ...(editedCells[r.application_id] ?? {}),
        _selected: selectedIds.has(r.application_id)
      }))
      .filter(r => {
        if (showOnlySelected && !r._selected) return false;
        if (showOnlyUnselected && r._selected) return false;
        return true;
      }),
    [results, editedCells, selectedIds, showOnlySelected, showOnlyUnselected],
  );

  // ── Bulk Assignment Handlers ────────────────────────────────────────────────
  const handleToggleOne = useCallback((appId: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(appId)) next.delete(appId);
      else next.add(appId);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    const allIds = results.map(r => r.application_id);
    setSelectedIds(new Set(allIds));
  }, [results]);

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleSelectTopN = useCallback(() => {
    const n = parseInt(topNInput, 10);
    if (isNaN(n) || n <= 0) return;
    const topIds = results.slice(0, n).map(r => r.application_id);
    setSelectedIds(new Set(topIds));
  }, [topNInput, results]);

  const handleBulkAssign = useCallback((status: ResultValue) => {
    if (selectedIds.size === 0) return;
    setEditedCells(prev => {
      const next = { ...prev };
      selectedIds.forEach(id => {
        next[id] = { ...next[id], result: status };
      });
      return next;
    });
    setSelectedIds(new Set());
    toast.success(`Marked ${selectedIds.size} candidates as ${status}`);
  }, [selectedIds]);

  // ── Track cell edits ──────────────────────────────────────────────────────
  const onResultChanged = useCallback((params: any) => {
    const appId = params.data.application_id;
    setEditedCells(prev => ({
      ...prev,
      [appId]: { ...prev[appId], result: params.newValue as ResultValue },
    }));
  }, []);

  const onFeedbackChanged = useCallback((params: any) => {
    const appId = params.data.application_id;
    setEditedCells(prev => ({
      ...prev,
      [appId]: { ...prev[appId], feedback_notes: params.newValue ?? null },
    }));
  }, []);

  // ── Summary counts ────────────────────────────────────────────────────────
  const summary = useMemo(() => {
    const counts = { PASS: 0, FAIL: 0, HOLD: 0, ABSENT: 0, notSet: 0, total: tableRows.length };
    tableRows.forEach(r => {
      if (r.result && counts[r.result] !== undefined) counts[r.result]++;
      else counts.notSet++;
    });
    return counts;
  }, [tableRows]);

  // ── Save results ──────────────────────────────────────────────────────────
  const handleSaveResults = async () => {
    const schedule = schedules.find(s => s.schedule_id === Number(selectedScheduleId));
    if (!schedule) { toast.error("Select a schedule first."); return; }

    const toSave = tableRows.filter(r => r.result !== null && r.result !== undefined);
    if (toSave.length === 0) {
      toast.warning("No results set. Use the Result dropdown to mark each student.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        results: toSave.map(r => ({
          application_id: r.application_id,
          round_id:       schedule.round_id,
          result:         r.result!,
          feedback_notes: r.feedback_notes || null,
        })),
      };
      const response = await interviewService.saveResults(payload);
      if (response.success && response.data) {
        toast.success("Results saved successfully.");
        setEditedCells({});
        loadResults(Number(selectedScheduleId));
      } else {
        toast.error(response.error ?? "Failed to save results.");
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed to save results.");
    } finally { window.dispatchEvent(new Event("results-saved")); setSaving(false); }
  };

  // ── Override result ───────────────────────────────────────────────────────
  const handleOverrideSubmit = async () => {
    if (!overrideRow || !overrideRow.result_id) return;
    setIsOverriding(true);
    try {
      const res = await interviewService.overrideResult({
        result_id: overrideRow.result_id,
        result: overrideStatus,
        feedback_notes: overrideNotes || null,
      });
      if (res) {
        toast.success("Result overridden successfully.");
        setOverrideRow(null);
        loadResults(Number(selectedScheduleId));
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed to override result.");
    } finally {
      setIsOverriding(false);
    }
  };

  const handleExportXLSX = useCallback(() => {
    if (!tableRows.length) { toast.info("No candidates to export"); return; }
    const data = tableRows.map((row) => ({
      "Student Name": row.student_name,
      "USN": row.usno,
      "Branch": row.branch,
      "CGPA": row.cgpa ?? "—",
      "Round": selectedSchedule ? `R${selectedSchedule.round_number} ${selectedSchedule.round_name}` : "—",
      "Interview Date": selectedSchedule?.start_date || "—",
      "Result": row.result || "Not Set",
      "Feedback / Notes": row.feedback_notes || "—",
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Round Results");
    const maxLens = Object.keys(data[0] || {}).map(key => ({
      wch: Math.max(key.length, ...data.map(r => String((r as any)[key] ?? "").length)) + 3,
    }));
    worksheet["!cols"] = maxLens;
    const fileName = `${selectedSchedule?.company_name?.replace(/\s+/g, "_") || "Drive"}_R${selectedSchedule?.round_number || ""}_Results.xlsx`;
    XLSX.writeFile(workbook, fileName);
    toast.success("Excel sheet downloaded!");
  }, [tableRows, selectedSchedule]);

  // ── Row style (colour coding by result — disabled per request) ───────────
  const getRowStyle = useCallback((params: any) => {
    return {};
  }, []);

  // ── Column definitions ────────────────────────────────────────────────────
  const columns = useMemo(() => [
    {
      headerName: "",
      field: "_selected",
      width: 48,
      minWidth: 48,
      filter: false,
      sortable: false,
      suppressMovable: true,
      cellRenderer: (p: any) => (
        <div className="flex items-center justify-center h-full">
          <input 
            type="checkbox" 
            checked={p.value} 
            onChange={() => handleToggleOne(p.data.application_id)}
            className="w-4 h-4 cursor-pointer accent-indigo-600 rounded-md border-gray-300 focus:ring-indigo-500 transition"
          />
        </div>
      ),
    },
    {
      headerName: "#",
      valueGetter: "node.rowIndex + 1",
      width: 55,
      filter: false,
      sortable: false,
      cellStyle: { color: "#94a3b8", fontWeight: "600", fontSize: "12px", display: "flex", alignItems: "center" },
    },
    {
      headerName: "Student",
      field: "student_name",
      sortable: true,
      filter: true,
      flex: 1.2,
      cellRenderer: (p: any) => {
        return (
          <div className="flex flex-col justify-center py-1 text-left leading-normal">
            <span className="font-semibold text-slate-800 text-sm">{p.value}</span>
            <span className="text-[11px] text-slate-400 font-medium">
              {p.data.usno} <span className="text-slate-300 mx-1">•</span> {p.data.branch}
            </span>
          </div>
        );
      },
    },
    {
      headerName: "CGPA",
      field: "cgpa",
      width: 90,
      cellRenderer: (p: any) => p.value != null ? (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100/50">
          {p.value.toFixed(2)}
        </span>
      ) : "—",
      cellStyle: { display: "flex", alignItems: "center" },
    },
    {
      headerName: "Result",
      field: "result",
      width: 175,
      cellRenderer: (p: any) => {
        const value = p.value || "";
        
        let selectCls = "w-full border rounded-xl px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-indigo-400 transition-colors bg-white border-slate-200 text-slate-700 cursor-pointer shadow-sm hover:border-slate-300";
        if (value === "PASS") selectCls = "w-full border rounded-xl px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-indigo-400 transition bg-emerald-50 border-emerald-200 text-emerald-700 cursor-pointer shadow-sm hover:bg-emerald-100/40";
        else if (value === "FAIL") selectCls = "w-full border rounded-xl px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-indigo-400 transition bg-rose-50 border-rose-200 text-rose-700 cursor-pointer shadow-sm hover:bg-rose-100/40";
        else if (value === "HOLD") selectCls = "w-full border rounded-xl px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-indigo-400 transition bg-amber-50 border-amber-200 text-amber-700 cursor-pointer shadow-sm hover:bg-amber-100/40";
        else if (value === "ABSENT") selectCls = "w-full border rounded-xl px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-indigo-400 transition bg-slate-50 border-slate-200 text-slate-600 cursor-pointer shadow-sm hover:bg-slate-100/40";

        const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
          const newVal = e.target.value || null;
          onResultChanged({ data: p.data, newValue: newVal });
        };

        return (
          <select
            className={selectCls}
            value={value}
            onChange={handleChange}
          >
            <option value="">— Set Result —</option>
            <option value="PASS">✅ Pass</option>
            <option value="FAIL">❌ Fail</option>
            <option value="HOLD">⏸ Hold</option>
            <option value="ABSENT">🚫 Absent</option>
          </select>
        );
      },
      cellStyle: { display: "flex", alignItems: "center" },
    },
    {
      headerName: "Feedback / Notes",
      field: "feedback_notes",
      flex: 2,
      cellRenderer: (p: any) => {
        const currentVal = p.value || "";
        return (
          <div className="flex items-center w-full h-full pr-2">
            <input
              type="text"
              defaultValue={currentVal}
              placeholder="Click to add feedback notes..."
              onBlur={(e) => {
                const newVal = e.target.value;
                if (newVal !== currentVal) {
                  onFeedbackChanged({ data: p.data, newValue: newVal });
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  (e.target as HTMLInputElement).blur();
                }
              }}
              className="w-full bg-transparent hover:bg-slate-50/80 focus:bg-white border border-transparent hover:border-slate-200 focus:border-indigo-400 rounded-lg px-2.5 py-1 text-xs text-slate-700 placeholder-slate-300 transition outline-none font-medium"
            />
          </div>
        );
      },
      cellStyle: { display: "flex", alignItems: "center" },
    },
    {
      headerName: "Actions",
      field: "result_id",
      width: 90,
      cellRenderer: (p: any) => {
        const hasSavedResult = !!p.data.result_id;
        return (
          <div className="flex items-center justify-center h-full">
            {hasSavedResult ? (
              <button
                onClick={() => {
                  setOverrideRow(p.data);
                  setOverrideStatus(p.data.result || "PASS");
                  setOverrideNotes(p.data.feedback_notes || "");
                }}
                className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg transition border border-amber-200/50 hover:scale-105 active:scale-95"
                title="Override saved result"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="text-[10px] text-slate-300 font-bold">—</span>
            )}
          </div>
        );
      },
      cellStyle: { display: "flex", alignItems: "center", justifyContent: "center" },
    }
  ], [onResultChanged, onFeedbackChanged, handleToggleOne]);

  const hasEdits = Object.keys(editedCells).length > 0;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="pb-8">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="text-left">
          <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Round Results
          </h3>
          <p className="text-sm text-slate-400 mt-1 font-medium">
            Record interview results. PASS moves students to next round · FAIL / ABSENT rejects.
          </p>
        </div>
        
        {selectedScheduleId && (
          <button
            onClick={handleSaveResults}
            disabled={saving || loading || summary.notSet > 0}
            title={summary.notSet > 0
              ? `Cannot save: ${summary.notSet} candidate(s) still have no results assigned.`
              : "Save results"
            }
            className={`flex items-center gap-2 px-5 py-2.5 text-white text-sm font-bold rounded-xl transition duration-150 active:scale-95 shadow-md w-full sm:w-auto justify-center cursor-pointer ${
              summary.notSet > 0
                ? "bg-slate-300 border border-slate-350 cursor-not-allowed text-slate-500 shadow-none"
                : "bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 shadow-indigo-600/10"
            }`}
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Results{hasEdits ? " *" : ""}</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* ── Mock Mode Banner ── */}
      {MOCK_MODE && (
        <div className="mb-6 flex items-center gap-2.5 px-4 py-3 bg-amber-50 border border-amber-200/60 rounded-2xl text-xs text-amber-700 font-semibold shadow-sm text-left">
          <span>⚙️</span>
          <span>
            <strong>Mock Mode ON</strong> — Showing demo students & results. Set{" "}
            <code className="bg-amber-100/80 px-1.5 py-0.5 rounded">MOCK_MODE = false</code> to connect real API.
          </span>
        </div>
      )}

      {/* ── Drive and Schedule Selectors ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        
        {/* Select Drive Card */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-4 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.02)]">
          <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 flex-shrink-0">
            <Building className="w-5 h-5" />
          </div>
          <div className="flex-grow text-left">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Select Drive
            </label>
            <select
              className="w-full bg-transparent text-sm font-semibold text-slate-700 outline-none cursor-pointer focus:text-indigo-600 transition"
              value={selectedDriveId}
              onChange={e => setSelectedDriveId(Number(e.target.value) || "")}
            >
              <option value="">Choose a Placement Drive...</option>
              {drives.map(d => (
                <option key={d.drive_id} value={d.drive_id}>
                  {d.company_name} — {d.drive_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Select Schedule Card */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-4 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.02)]">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 flex-shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="flex-grow text-left">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Select Schedule
            </label>
            <select
              className="w-full bg-transparent text-sm font-semibold text-slate-700 outline-none cursor-pointer focus:text-indigo-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              value={selectedScheduleId}
              onChange={e => setSelectedScheduleId(Number(e.target.value) || "")}
              disabled={!selectedDriveId}
            >
              <option value="">
                {!selectedDriveId
                  ? "Select a Drive first..."
                  : schedules.length === 0
                  ? "No active schedules for this drive"
                  : "Choose an Interview Schedule..."}
              </option>
              {schedules.map(s => (
                <option key={s.schedule_id} value={s.schedule_id}>
                  R{s.round_number} {s.round_name} · {s.start_date}
                </option>
              ))}
            </select>
          </div>
        </div>

      </div>

      {/* ── Progress & Warning Bar (F7) ── */}
      {selectedScheduleId && !loading && results.length > 0 && (
        <div className="mb-6 bg-white border border-slate-100/90 p-5 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.01)] text-left space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
                Results Recording Progress
              </h4>
              <p className="text-xs text-slate-450 mt-0.5 font-medium">
                {summary.total - summary.notSet} of {summary.total} candidates have results assigned.
              </p>
            </div>
            <span className={`text-[10px] px-2.5 py-1 rounded-xl font-bold border tracking-wider uppercase ${
              summary.notSet === 0
                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                : "bg-amber-50 text-amber-700 border-amber-100 animate-pulse"
            }`}>
              {summary.notSet === 0 ? "Complete" : "Incomplete"}
            </span>
          </div>

          {/* Progress bar line */}
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                summary.notSet === 0 ? "bg-emerald-500" : "bg-indigo-600"
              }`}
              style={{ width: `${((summary.total - summary.notSet) / (summary.total || 1)) * 100}%` }}
            />
          </div>

          {/* Warning Message */}
          {summary.notSet > 0 && (
            <div className="flex items-start gap-3 bg-amber-50/70 border border-amber-100/80 rounded-2xl px-4 py-3 text-xs text-amber-800">
              <span className="text-sm flex-shrink-0">⚠️</span>
              <div>
                <strong className="font-bold text-amber-900">Warning: Pending Results!</strong>
                <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                  There are still <strong className="font-extrabold">{summary.notSet} candidate(s)</strong> without a result. You must assign a status (PASS / FAIL / HOLD / ABSENT) to all candidates before saving changes and advancing candidates.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Schedule info card ── */}
      {selectedSchedule && (
        <div className="mb-6 bg-white border border-slate-100/85 p-4 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.01)] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Dynamic Company Logo */}
            {getCompanyLogo(selectedSchedule.company_name)}
            
            <div className="text-left">
              <h4 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
                {selectedSchedule.company_name} <span className="text-xs font-medium text-slate-400">— {selectedSchedule.drive_name}</span>
              </h4>
              <div className="flex items-center flex-wrap gap-2 mt-1.5">
                <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${ROUND_TYPE_BADGE[selectedSchedule.round_type] ?? "bg-gray-100 text-gray-600"}`}>
                  {selectedSchedule.round_type}
                </span>
                <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                  R{selectedSchedule.round_number} — {selectedSchedule.round_name}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-bold text-slate-500 flex-wrap">
            <span className="flex items-center gap-1.5 bg-indigo-50/50 text-indigo-700 border border-indigo-100/50 px-3 py-1.5 rounded-xl">
              <Calendar className="w-3.5 h-3.5" />
              {selectedSchedule.start_date}
            </span>
            <span className="flex items-center gap-1.5 bg-sky-50/50 text-sky-700 border border-sky-100/50 px-3 py-1.5 rounded-xl">
              {selectedSchedule.venue_type === "VIRTUAL" ? (
                <>
                  <Globe className="w-3.5 h-3.5" />
                  Virtual
                </>
              ) : (
                <>
                  <Building className="w-3.5 h-3.5" />
                  Physical
                </>
              )}
            </span>
          </div>
        </div>
      )}

      {/* ── Summary Stats Grid ── */}
      {selectedScheduleId && !loading && results.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          
          {/* Card 1: Total Candidates */}
          <div className="bg-white border border-slate-100/80 rounded-[20px] p-4 flex items-center gap-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-md transition duration-200">
            <div className="w-11 h-11 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 flex-shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Total Candidates</p>
              <p className="text-2xl font-extrabold text-slate-800 leading-tight mt-0.5">{summary.total}</p>
            </div>
          </div>

          {/* Card 2: Passed */}
          <div className="bg-white border border-slate-100/80 rounded-[20px] p-4 flex items-center gap-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-md transition duration-200">
            <div className="w-11 h-11 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 flex-shrink-0">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-bold tracking-wider text-emerald-600 uppercase">Passed</p>
              <p className="text-2xl font-extrabold text-emerald-700 leading-tight mt-0.5">{summary.PASS}</p>
            </div>
          </div>

          {/* Card 3: Failed */}
          <div className="bg-white border border-slate-100/80 rounded-[20px] p-4 flex items-center gap-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-md transition duration-200">
            <div className="w-11 h-11 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 flex-shrink-0">
              <XCircle className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-bold tracking-wider text-rose-500 uppercase">Failed</p>
              <p className="text-2xl font-extrabold text-rose-600 leading-tight mt-0.5">{summary.FAIL}</p>
            </div>
          </div>

          {/* Card 4: Hold */}
          <div className="bg-white border border-slate-100/80 rounded-[20px] p-4 flex items-center gap-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-md transition duration-200">
            <div className="w-11 h-11 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 flex-shrink-0">
              <PauseCircle className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-bold tracking-wider text-amber-600 uppercase">Hold</p>
              <p className="text-2xl font-extrabold text-amber-700 leading-tight mt-0.5">{summary.HOLD}</p>
            </div>
          </div>

          {/* Card 5: Absent */}
          <div className="bg-white border border-slate-100/80 rounded-[20px] p-4 flex items-center gap-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-md transition duration-200">
            <div className="w-11 h-11 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 flex-shrink-0">
              <Ban className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Absent</p>
              <p className="text-2xl font-extrabold text-slate-700 leading-tight mt-0.5">{summary.ABSENT}</p>
            </div>
          </div>

        </div>
      )}

      {/* ── Next Round Eligibility Banner ── */}
      {selectedScheduleId && !loading && summary.PASS > 0 && (
        <div className="mb-6 px-5 py-4 bg-emerald-50/80 border border-emerald-100 rounded-[24px] flex items-center justify-between shadow-[0_2px_12px_rgba(16,185,129,0.04)]">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center text-white text-lg font-bold shadow-md shadow-emerald-500/10">
              🎉
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">Next Round Ready!</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                <strong>{summary.PASS} candidates</strong> have successfully passed this round and are eligible to move to the next stage.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk Assignment Toolbar ── */}
      {selectedScheduleId && !loading && results.length > 0 && (
        <div className="bg-white border border-slate-100 rounded-[24px] p-5 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.02)] mb-6 text-left">
          
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-slate-100 pb-3.5 mb-3.5">
            <h5 className="text-[11px] font-extrabold text-slate-400 tracking-wider uppercase">Bulk Actions</h5>
            <span className="text-xs text-slate-400">Select candidates and assign results in bulk.</span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Left side actions: status selection & actions */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100 shadow-sm mr-1">
                {selectedIds.size} selected
              </span>
              
              <button
                onClick={() => handleBulkAssign("PASS")}
                disabled={selectedIds.size === 0}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-700 text-xs font-bold rounded-xl transition duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Pass</span>
              </button>
              
              <button
                onClick={() => handleBulkAssign("FAIL")}
                disabled={selectedIds.size === 0}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-700 text-xs font-bold rounded-xl transition duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Fail</span>
              </button>
              
              <button
                onClick={() => handleBulkAssign("HOLD")}
                disabled={selectedIds.size === 0}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-100 text-amber-700 text-xs font-bold rounded-xl transition duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <PauseCircle className="w-3.5 h-3.5" />
                <span>Hold</span>
              </button>
              
              <button
                onClick={() => handleBulkAssign("ABSENT")}
                disabled={selectedIds.size === 0}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl transition duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Absent</span>
              </button>
            </div>

            {/* Right side options: selectors & filtering */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-500">
              <button
                onClick={handleSelectAll}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition px-3 py-1.5 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100/50 rounded-xl shadow-sm"
              >
                Select All ({results.length})
              </button>

              <div className="h-6 w-px bg-slate-100"></div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Top N:</span>
                <input
                  type="number"
                  min="1"
                  max={results.length}
                  value={topNInput}
                  onChange={(e) => setTopNInput(e.target.value)}
                  className="w-14 text-center border border-slate-200 rounded-xl px-2 py-1 font-bold outline-none focus:border-indigo-400 transition"
                  placeholder="e.g. 5"
                />
                <button
                  onClick={handleSelectTopN}
                  className="text-indigo-600 hover:text-indigo-800 transition bg-indigo-50/20 px-2 py-1 rounded-lg"
                >
                  Select
                </button>
              </div>

              <div className="h-6 w-px bg-slate-100"></div>

              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={showOnlySelected}
                  onChange={(e) => {
                    setShowOnlySelected(e.target.checked);
                    if (e.target.checked) setShowOnlyUnselected(false);
                  }}
                  className="w-4 h-4 accent-indigo-600 cursor-pointer rounded border-slate-350"
                />
                <span className="text-slate-600 group-hover:text-slate-800 transition">Show selected only</span>
              </label>

              <div className="h-6 w-px bg-slate-100"></div>

              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={showOnlyUnselected}
                  onChange={(e) => {
                    setShowOnlyUnselected(e.target.checked);
                    if (e.target.checked) setShowOnlySelected(false);
                  }}
                  className="w-4 h-4 accent-indigo-600 cursor-pointer rounded border-slate-350"
                />
                <span className="text-slate-600 group-hover:text-slate-800 transition">Not selected only</span>
              </label>

              <div className="h-6 w-px bg-slate-100"></div>

              <button
                onClick={handleClearSelection}
                disabled={selectedIds.size === 0}
                className="text-slate-400 hover:text-rose-600 transition disabled:opacity-30 disabled:cursor-not-allowed font-bold"
              >
                Clear
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ── Empty state ── */}
      {!selectedScheduleId && (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400 bg-white border border-slate-100 rounded-[28px] shadow-[0_8px_40px_-10px_rgba(0,0,0,0.01)]">
          <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-inner">
            📊
          </div>
          <h4 className="text-base font-bold text-slate-700">No Schedule Selected</h4>
          <p className="text-sm text-slate-400 mt-1 max-w-sm">Select an interview drive and round schedule above to record and manage candidate results.</p>
        </div>
      )}

      {/* ── Table ── */}
      {selectedScheduleId && (
        loading ? (
          <div className="flex items-center justify-center py-20 text-indigo-600 font-semibold bg-white border border-slate-100 rounded-[28px]">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-600 border-t-transparent mr-2.5" />
            Loading candidates...
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white border border-slate-100 rounded-[28px]">
            <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-inner">
              🔍
            </div>
            <h4 className="text-base font-bold text-slate-700 font-semibold">No Candidates Found</h4>
            <p className="text-sm text-slate-400 mt-1 max-w-sm">No scheduled students found for this round. Make sure slots are created and assigned first.</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-[28px] overflow-hidden shadow-[0_8px_40px_-10px_rgba(0,0,0,0.02)]">
            {/* Table header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap bg-slate-50/10">
              <div className="text-left">
                <h3 className="text-base font-extrabold text-slate-800 tracking-tight">
                  Candidate Results List
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">
                  List of scheduled candidates. Assign PASS/FAIL/HOLD/ABSENT and enter feedback.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleExportXLSX}
                  className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-800 rounded-2xl text-xs font-bold shadow-sm transition duration-150 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>📥</span> Export Results
                </button>
                <span className="px-3.5 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-2xl text-xs font-bold shadow-sm">
                  {tableRows.length} Candidates
                </span>
              </div>
            </div>

            {/* DataTable */}
            <div className="px-0 plm-datatable-wrapper">
              <DataTable
                columnDefs={columns}
                rowData={tableRows}
                pageSize={20}
                headerFilter={false}
                singleClickEdit={true}
                getRowStyle={getRowStyle}
                rowHeight={56}
                autoHeight
              />
            </div>
          </div>
        )
      )}

      {/* ── Result Legend ── */}
      {selectedScheduleId && !loading && results.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400 bg-slate-50/50 border border-slate-100/60 p-4 rounded-2xl text-left">
          <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Legend:</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block"/> PASS (Moves to next round)</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block"/> FAIL (Candidate rejected)</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block"/> HOLD (Decision pending)</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-slate-400 inline-block"/> ABSENT (Marked absent)</span>
        </div>
      )}

      {/* ── Override Modal ── */}
      {overrideRow && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-amber-50/50">
              <div className="flex items-center gap-2 text-amber-800">
                <span className="text-lg">✏️</span>
                <h3 className="text-sm font-bold uppercase tracking-wider">Override Result</h3>
              </div>
              <button onClick={() => setOverrideRow(null)} className="text-slate-400 hover:text-slate-600 text-sm font-bold font-mono">✕</button>
            </div>
            
            <div className="p-6 space-y-4 text-left">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Student Candidate</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{overrideRow.student_name} <span className="text-slate-400 font-semibold">({overrideRow.usno})</span></p>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">New Result Status</label>
                <select
                  value={overrideStatus}
                  onChange={e => setOverrideStatus(e.target.value as ResultValue)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition font-semibold text-slate-700"
                >
                  <option value="PASS">PASS</option>
                  <option value="FAIL">FAIL</option>
                  <option value="HOLD">HOLD</option>
                  <option value="ABSENT">ABSENT</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Feedback / Reason for Override</label>
                <textarea
                  value={overrideNotes}
                  onChange={e => setOverrideNotes(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition font-medium text-slate-700 placeholder-slate-300"
                  rows={3}
                  placeholder="Explain why this result is being changed..."
                />
              </div>
            </div>
            
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setOverrideRow(null)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition duration-150"
              >
                Cancel
              </button>
              <button
                onClick={handleOverrideSubmit}
                disabled={isOverriding}
                className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition duration-150 disabled:opacity-50 hover:scale-105 active:scale-95"
              >
                {isOverriding ? "Saving..." : "Confirm Override"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default RoundResultPage;
