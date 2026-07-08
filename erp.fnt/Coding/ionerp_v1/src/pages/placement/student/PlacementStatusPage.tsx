/**
 * PlacementStatusPage.tsx
 * ========================
 * TPO dashboard for managing student Placement Status & Offer Locks.
 *
 * Features:
 *  - Summary stats (Placed / Offer Pending / Not Placed / Opted Out)
 *  - Filterable student table with status badges
 *  - Detail drawer: view applications, update status, lock/unlock offers
 *  - Inline TPO remarks editor
 *
 * DATA: All data is from placementStatusMockData.ts (dummy).
 * TODO: Replace store calls with real API service after backend is merged.
 */

import React, { useState, useMemo, useCallback } from "react";
import {
  placementStatusStore,
  MockPlacementStudent,
  PlacementStatus,
  MockPlacementApplication,
} from "./placementStatusMockData";

// ─── Palette / Constants ──────────────────────────────────────────────────────

const CLR = {
  navy: "#17375e",
  navyLight: "#1e4d8c",
  placed: { bg: "#d1fae5", text: "#065f46", border: "#6ee7b7" },
  pending: { bg: "#fef3c7", text: "#92400e", border: "#fcd34d" },
  not_placed: { bg: "#e0e7ff", text: "#3730a3", border: "#a5b4fc" },
  opted_out: { bg: "#f3f4f6", text: "#374151", border: "#d1d5db" },
  ineligible: { bg: "#fee2e2", text: "#991b1b", border: "#fca5a5" },
} as const;

const STATUS_META: Record<
  PlacementStatus,
  { label: string; icon: string; bg: string; text: string; border: string }
> = {
  PLACED:        { label: "Placed",        icon: "🎉", ...CLR.placed },
  OFFER_PENDING: { label: "Offer Pending", icon: "⏳", ...CLR.pending },
  OPTED_OUT:     { label: "Opted Out",     icon: "🚪", ...CLR.opted_out },
};

const APP_STATUS_CLR: Record<
  MockPlacementApplication["status"],
  { bg: string; text: string }
> = {
  APPLIED:      { bg: "#dbeafe", text: "#1d4ed8" },
  SHORTLISTED:  { bg: "#fef9c3", text: "#854d0e" },
  WAITLISTED:   { bg: "#e0e7ff", text: "#4338ca" },
  IN_PROCESS:   { bg: "#fce7f3", text: "#9d174d" },
  OFFERED:      { bg: "#d1fae5", text: "#065f46" },
  REJECTED:     { bg: "#fee2e2", text: "#991b1b" },
  WITHDRAWN:    { bg: "#f3f4f6", text: "#6b7280" },
};

// ─── Small helpers ────────────────────────────────────────────────────────────

const fmtCTC = (lpa: number | null) =>
  lpa !== null ? `₹${lpa} LPA` : "—";

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCard: React.FC<{
  icon: string;
  label: string;
  value: number;
  bg: string;
  text: string;
  border: string;
  active: boolean;
  onClick: () => void;
}> = ({ icon, label, value, bg, text, border, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      flex: "1 1 160px",
      background: active ? text : bg,
      color: active ? "#fff" : text,
      border: `2px solid ${active ? text : border}`,
      borderRadius: 10,
      padding: "16px 20px",
      cursor: "pointer",
      textAlign: "left",
      transition: "all 0.18s",
      boxShadow: active ? `0 4px 14px ${text}44` : "0 1px 4px rgba(0,0,0,0.08)",
    }}
  >
    <div style={{ fontSize: 26, marginBottom: 4 }}>{icon}</div>
    <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: 12, fontWeight: 600, marginTop: 4, opacity: active ? 0.9 : 0.8 }}>
      {label}
    </div>
  </button>
);

// ─── Badge ────────────────────────────────────────────────────────────────────

const Badge: React.FC<{ bg: string; text: string; children: React.ReactNode }> = ({
  bg, text, children,
}) => (
  <span
    style={{
      padding: "3px 10px",
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 700,
      background: bg,
      color: text,
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </span>
);

// ─── Opted Out Mini Modal ─────────────────────────────────────────────────────

const OptedOutModal: React.FC<{
  studentName: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}> = ({ studentName, onClose, onConfirm }) => {
  const [reason, setReason] = useState("");

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 9999, backdropFilter: "blur(3px)",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 12,
          width: "100%",
          maxWidth: 420,
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{ background: "#374151", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>🚪 Mark as Opted Out</div>
            <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 2 }}>{studentName}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", fontSize: 22, cursor: "pointer" }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
          <p style={{ margin: 0, fontSize: 13, color: "#555", lineHeight: 1.6 }}>
            This student will be <strong>removed from all active drives</strong> and
            marked as opted out of campus placement.
          </p>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
              Reason for Opting Out *
            </label>
            <input
              autoFocus
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Pursuing higher education / Got a job off-campus"
              style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button
              onClick={onClose}
              style={{ padding: "8px 18px", fontSize: 13, fontWeight: 600, color: "#555", background: "#fff", border: "1px solid #d1d5db", borderRadius: 6, cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              onClick={() => { if (reason.trim()) { onConfirm(reason.trim()); onClose(); } }}
              disabled={!reason.trim()}
              style={{
                padding: "8px 20px", fontSize: 13, fontWeight: 700,
                color: "#fff", background: reason.trim() ? "#374151" : "#9ca3af",
                border: "none", borderRadius: 6,
                cursor: reason.trim() ? "pointer" : "not-allowed",
              }}
            >
              Confirm Opted Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Student Detail Drawer ────────────────────────────────────────────────────

const DetailDrawer: React.FC<{
  student: MockPlacementStudent;
  onClose: () => void;
  onUpdate: () => void;
}> = ({ student, onClose, onUpdate }) => {
  const [showOptedOutModal, setShowOptedOutModal] = useState(false);
  const [current, setCurrent] = useState(student);

  const handleToggleLock = () => {
    const updated = placementStatusStore.toggleOfferLock(current.student_id);
    if (updated) setCurrent(updated);
    onUpdate();
  };

  const handleOptedOut = (reason: string) => {
    const updated = placementStatusStore.updateStatus(current.student_id, {
      placement_status: "OPTED_OUT",
      opted_out_reason: reason,
      is_offer_locked: false,
      is_placement_eligible: 0,
    });
    if (updated) setCurrent(updated);
    onUpdate();
  };

  const sm = STATUS_META[current.placement_status];

  return (
    <>
      {/* Overlay */}
      <div
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 1000 }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0,
          width: "100%", maxWidth: 520,
          background: "#fff",
          boxShadow: "-4px 0 40px rgba(0,0,0,0.18)",
          zIndex: 1001,
          overflowY: "auto",
          display: "flex", flexDirection: "column",
        }}
      >
        {/* Header */}
        <div style={{ background: `linear-gradient(135deg, ${CLR.navy} 0%, ${CLR.navyLight} 100%)`, padding: "20px 24px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, border: "2px solid rgba(255,255,255,0.4)" }}>
                👤
              </div>
              <div>
                <div style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>{current.name}</div>
                <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 2 }}>
                  {current.usno} · {current.department}
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.8)", fontSize: 24, cursor: "pointer", lineHeight: 1 }}>×</button>
          </div>

          {/* Status badge */}
          <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={{ padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: sm.bg, color: sm.text, border: `1px solid ${sm.border}` }}>
              {sm.icon} {sm.label}
            </span>
            {current.is_offer_locked && (
              <span style={{ padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5" }}>
                🔒 Offer Locked
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Quick Actions — only Lock/Unlock + Opted Out */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              id="toggle-offer-lock-btn"
              onClick={handleToggleLock}
              style={{
                flex: 1, padding: "10px 16px", fontSize: 13, fontWeight: 700,
                color: current.is_offer_locked ? "#991b1b" : "#065f46",
                background: current.is_offer_locked ? "#fee2e2" : "#d1fae5",
                border: `1.5px solid ${current.is_offer_locked ? "#fca5a5" : "#6ee7b7"}`,
                borderRadius: 7, cursor: "pointer",
              }}
            >
              {current.is_offer_locked ? "🔓 Unlock Offers" : "🔒 Lock Offers"}
            </button>
            {current.placement_status !== "OPTED_OUT" && (
              <button
                id="opted-out-btn"
                onClick={() => setShowOptedOutModal(true)}
                style={{
                  flex: 1, padding: "10px 16px", fontSize: 13, fontWeight: 700,
                  color: "#374151",
                  background: "#f3f4f6",
                  border: "1.5px solid #d1d5db",
                  borderRadius: 7, cursor: "pointer",
                }}
              >
                🚪 Opted Out
              </button>
            )}
          </div>

          {/* Placement Info Card (shown when placed or offer pending) */}
          {(current.placement_status === "PLACED" || current.placement_status === "OFFER_PENDING") && current.placed_company && (
            <div style={{ background: current.placement_status === "PLACED" ? "#f0fdf4" : "#fffbeb", border: `1px solid ${current.placement_status === "PLACED" ? "#86efac" : "#fcd34d"}`, borderRadius: 8, padding: "14px 18px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>
                {current.placement_status === "PLACED" ? "📋 Placement Details" : "⏳ Offer Details"}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px" }}>
                {[
                  { label: "Company", value: current.placed_company },
                  { label: "Role", value: current.placed_role },
                  { label: "CTC", value: fmtCTC(current.offer_ctc_lpa) },
                  { label: "Offer Date", value: fmtDate(current.offer_date) },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" }}>{label}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#111", marginTop: 1 }}>{value ?? "—"}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Opted Out reason */}
          {current.placement_status === "OPTED_OUT" && current.opted_out_reason && (
            <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "12px 16px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", marginBottom: 6 }}>🚪 Opted Out Reason</div>
              <div style={{ fontSize: 13, color: "#374151" }}>{current.opted_out_reason}</div>
            </div>
          )}

          {/* Student Profile Info */}
          <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "14px 18px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>Student Info</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px", fontSize: 13 }}>
              {[
                { label: "Email", value: current.email },
                { label: "Mobile", value: current.mobile },
                { label: "Batch", value: current.batch },
                { label: "Semester", value: "8th" },
                { label: "CGPA", value: current.current_cgpa },
                { label: "Backlogs", value: current.backlogs },
                { label: "Preferred Locations", value: current.preferred_locations || "—" },
                { label: "Last Updated", value: fmtDate(current.last_updated) },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" }}>{label}</div>
                  <div style={{ fontSize: 13, color: "#111", fontWeight: 600, marginTop: 1 }}>{String(value)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* TPO Remarks */}
          {current.tpo_remarks && (
            <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 8, padding: "12px 16px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#92400e", textTransform: "uppercase", marginBottom: 6 }}>📝 TPO Remarks</div>
              <div style={{ fontSize: 13, color: "#374151" }}>{current.tpo_remarks}</div>
            </div>
          )}

          {/* Applications */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>
              Drive Applications ({current.applications.length})
            </div>
            {current.applications.length === 0 ? (
              <div style={{ fontSize: 13, color: "#aaa", textAlign: "center", padding: "20px 0" }}>No applications yet.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {current.applications.map((app) => {
                  const aclr = APP_STATUS_CLR[app.status];
                  return (
                    <div key={app.application_id} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: CLR.navy }}>{app.company_name}</div>
                        <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{app.job_role}</div>
                        <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
                          {app.drive_type} · Applied {fmtDate(app.applied_at)} · {fmtCTC(app.ctc_lpa)}
                        </div>
                      </div>
                      <Badge bg={aclr.bg} text={aclr.text}>{app.status}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {showOptedOutModal && (
        <OptedOutModal
          studentName={current.name}
          onClose={() => setShowOptedOutModal(false)}
          onConfirm={handleOptedOut}
        />
      )}
    </>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const PlacementStatusPage: React.FC = () => {
  const [data, setData] = useState<MockPlacementStudent[]>(placementStatusStore.getAll);
  const [filterStatus, setFilterStatus] = useState<PlacementStatus | "ALL">("ALL");
  const [filterDept, setFilterDept] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<MockPlacementStudent | null>(null);

  const refresh = useCallback(() => {
    setData(placementStatusStore.getAll());
  }, []);

  // Departments list
  const departments = useMemo(() => {
    const set = new Set(data.map((s) => s.department));
    return Array.from(set).sort();
  }, [data]);

  // Filtered students
  const filtered = useMemo(() => {
    return data.filter((s) => {
      if (filterStatus !== "ALL" && s.placement_status !== filterStatus) return false;
      if (filterDept !== "ALL" && s.department !== filterDept) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !s.name.toLowerCase().includes(q) &&
          !s.usno.toLowerCase().includes(q) &&
          !(s.placed_company?.toLowerCase().includes(q) ?? false)
        )
          return false;
      }
      return true;
    });
  }, [data, filterStatus, filterDept, search]);

  // Stats
  const stats = useMemo(
    () => ({
      PLACED:        data.filter((s) => s.placement_status === "PLACED").length,
      OFFER_PENDING: data.filter((s) => s.placement_status === "OFFER_PENDING").length,
      OPTED_OUT:     data.filter((s) => s.placement_status === "OPTED_OUT").length,
    }),
    [data]
  );

  const avgCTC = useMemo(() => {
    const placed = data.filter((s) => s.placement_status === "PLACED" && s.offer_ctc_lpa);
    if (placed.length === 0) return null;
    const avg = placed.reduce((sum, s) => sum + (s.offer_ctc_lpa ?? 0), 0) / placed.length;
    return avg.toFixed(1);
  }, [data]);

  const highestCTC = useMemo(() => {
    const placed = data.filter((s) => s.placement_status === "PLACED" && s.offer_ctc_lpa);
    if (placed.length === 0) return null;
    return Math.max(...placed.map((s) => s.offer_ctc_lpa ?? 0));
  }, [data]);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 4px 32px" }}>

      {/* ── Page Header ── */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: CLR.navy }}>
          Placement Status Management
        </h2>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#888" }}>
          Track student placement outcomes, manage offer locks, and update final placement status.
        </p>
      </div>

      {/* ── Summary Stats — Placed & Offer Pending only ── */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 22 }}>
        <StatCard
          icon="🎉" label="Placed" value={stats.PLACED}
          {...CLR.placed}
          active={filterStatus === "PLACED"}
          onClick={() => setFilterStatus(filterStatus === "PLACED" ? "ALL" : "PLACED")}
        />
        <StatCard
          icon="⏳" label="Offer Pending" value={stats.OFFER_PENDING}
          {...CLR.pending}
          active={filterStatus === "OFFER_PENDING"}
          onClick={() => setFilterStatus(filterStatus === "OFFER_PENDING" ? "ALL" : "OFFER_PENDING")}
        />

        {/* CTC highlights */}
        {avgCTC && (
          <div style={{ flex: "1 1 160px", background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10, padding: "16px 20px" }}>
            <div style={{ fontSize: 26, marginBottom: 4 }}>💰</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#0369a1" }}>₹{avgCTC} LPA</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#0369a1", opacity: 0.8, marginTop: 4 }}>Avg. CTC (Placed)</div>
          </div>
        )}
        {highestCTC && (
          <div style={{ flex: "1 1 160px", background: "#fdf4ff", border: "1px solid #e9d5ff", borderRadius: 10, padding: "16px 20px" }}>
            <div style={{ fontSize: 26, marginBottom: 4 }}>🏆</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#7e22ce" }}>₹{highestCTC} LPA</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#7e22ce", opacity: 0.8, marginTop: 4 }}>Highest CTC</div>
          </div>
        )}
      </div>

      {/* ── Filters ── */}
      <div style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        padding: "14px 18px",
        marginBottom: 16,
        display: "flex",
        flexWrap: "wrap",
        gap: 12,
        alignItems: "center",
      }}>
        <input
          id="placement-status-search"
          type="text"
          placeholder="Search name, USN or company…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, outline: "none", width: 240 }}
        />
        <select
          id="placement-status-filter"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          style={{ padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, background: "#fff", cursor: "pointer" }}
        >
          <option value="ALL">All Statuses</option>
          <option value="PLACED">Placed</option>
          <option value="OFFER_PENDING">Offer Pending</option>
          <option value="OPTED_OUT">Opted Out</option>
        </select>
        <select
          id="placement-dept-filter"
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          style={{ padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, background: "#fff", cursor: "pointer", maxWidth: 250 }}
        >
          <option value="ALL">All Departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <span style={{ fontSize: 12, color: "#888", marginLeft: "auto" }}>
          {filtered.length} student{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Table ── */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
        {/* Table header */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1.2fr 1fr 1fr",
          background: CLR.navy,
          color: "#fff",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.5px",
          textTransform: "uppercase",
          padding: "12px 18px",
          gap: 8,
        }}>
          <span>Student</span>
          <span>Department</span>
          <span>CGPA / Backlogs</span>
          <span>Placement Status</span>
          <span>Placed At / Details</span>
          <span>Offer Lock</span>
          <span style={{ textAlign: "center" }}>Actions</span>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "#aaa" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🔍</div>
            <div style={{ fontWeight: 700, color: "#666" }}>No students match your filters</div>
          </div>
        ) : (
          filtered.map((student, i) => {
            const sm = STATUS_META[student.placement_status];
            return (
              <div
                key={student.student_id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1.2fr 1fr 1fr",
                  padding: "14px 18px",
                  gap: 8,
                  borderTop: i === 0 ? "none" : "1px solid #f3f4f6",
                  alignItems: "center",
                  background: i % 2 === 0 ? "#fff" : "#fafafa",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f4ff")}
                onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#fafafa")}
              >
                {/* Student */}
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: CLR.navy }}>{student.name}</div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 1 }}>{student.usno}</div>
                  <div style={{ fontSize: 11, color: "#aaa" }}>{student.email}</div>
                </div>

                {/* Department */}
                <div style={{ fontSize: 12, color: "#444" }}>{student.department}</div>

                {/* CGPA / Backlogs */}
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#111" }}>{student.current_cgpa}</div>
                  <div style={{ fontSize: 11, color: student.backlogs > 0 ? "#dc2626" : "#888", marginTop: 1 }}>
                    {student.backlogs === 0 ? "No backlogs" : `${student.backlogs} backlog${student.backlogs > 1 ? "s" : ""}`}
                  </div>
                </div>

                {/* Placement Status */}
                <div>
                  <Badge bg={sm.bg} text={sm.text}>{sm.icon} {sm.label}</Badge>
                </div>

                {/* Placed At / Details */}
                <div style={{ fontSize: 12 }}>
                  {student.placed_company ? (
                    <>
                      <div style={{ fontWeight: 700, color: "#111" }}>{student.placed_company}</div>
                      <div style={{ color: "#555", marginTop: 1 }}>{student.placed_role}</div>
                      {student.offer_ctc_lpa && (
                        <div style={{ color: "#065f46", fontWeight: 700, marginTop: 1 }}>{fmtCTC(student.offer_ctc_lpa)}</div>
                      )}
                    </>
                  ) : student.placement_status === "OPTED_OUT" ? (
                    <span style={{ color: "#6b7280", fontStyle: "italic", fontSize: 11 }}>Opted out</span>
                  ) : (
                    <span style={{ color: "#aaa", fontSize: 11 }}>—</span>
                  )}
                </div>

                {/* Offer Lock */}
                <div>
                  <span style={{
                    padding: "3px 10px",
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 700,
                    background: student.is_offer_locked ? "#fee2e2" : "#d1fae5",
                    color: student.is_offer_locked ? "#991b1b" : "#065f46",
                  }}>
                    {student.is_offer_locked ? "🔒 Locked" : "🔓 Open"}
                  </span>
                </div>

                {/* Actions */}
                <div style={{ textAlign: "center" }}>
                  <button
                    id={`view-student-${student.student_id}`}
                    onClick={() => setSelectedStudent(student)}
                    style={{
                      padding: "6px 14px",
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#fff",
                      background: CLR.navy,
                      border: "none",
                      borderRadius: 5,
                      cursor: "pointer",
                    }}
                  >
                    View →
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Detail Drawer ── */}
      {selectedStudent && (
        <DetailDrawer
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
          onUpdate={refresh}
        />
      )}
    </div>
  );
};

export default PlacementStatusPage;
