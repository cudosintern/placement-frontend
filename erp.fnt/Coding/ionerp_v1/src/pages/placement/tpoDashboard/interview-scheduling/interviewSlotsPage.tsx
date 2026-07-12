import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import interviewSchedulingService from "./interviewSchedulingService";

interface Schedule {
  id: number;
  drive_id: number;
  drive_name: string;
  round_id: number;
  round_name: string;
  venue_type: string;
  venue_details: string;
  meeting_link: string;
  interview_date: string;
  start_time: string;
  end_time: string;
  status: number;
}

interface Slot {
  slot_id: number;
  schedule_id: number;
  application_id: number;
  student_name: string;
  usn: string;
  slot_time: string;
  interviewer_name: string;
  interviewer_email: string;
  status: "SCHEDULED" | "COMPLETED" | "NO_SHOW" | "CANCELLED";
  round_result?: "PASS" | "FAIL" | "HOLD" | "ABSENT" | null;
  feedback_notes?: string | null;
}

interface EligibleStudent {
  application_id: number;
  student_name: string;
  usn: string;
  cgpa: number;
}

const InterviewSlotsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const scheduleIdStr = searchParams.get("schedule_id");

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(
    scheduleIdStr ? Number(scheduleIdStr) : null
  );

  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [eligibleStudents, setEligibleStudents] = useState<EligibleStudent[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);

  // Form states for assigning
  const [selectedAppId, setSelectedAppId] = useState("");
  const [assignSlotTime, setAssignSlotTime] = useState("");
  const [assignInterviewerName, setAssignInterviewerName] = useState("");
  const [assignInterviewerEmail, setAssignInterviewerEmail] = useState("");

  // Form states for editing
  const [editingSlot, setEditingSlot] = useState<Slot | null>(null);
  const [editSlotTime, setEditSlotTime] = useState("");
  const [editInterviewerName, setEditInterviewerName] = useState("");
  const [editInterviewerEmail, setEditInterviewerEmail] = useState("");
  const [editStatus, setEditStatus] = useState<any>("SCHEDULED");

  // Result recording states
  const [resultSlot, setResultSlot] = useState<Slot | null>(null);
  const [roundResult, setRoundResult] = useState<"PASS" | "FAIL" | "HOLD" | "ABSENT">("PASS");
  const [feedbackNotes, setFeedbackNotes] = useState("");

  // 1. Load the list of schedules
  const loadSchedulesList = async () => {
    try {
      const data = await interviewSchedulingService.getSchedules();
      setSchedules(data || []);
    } catch (err) {
      console.error("Failed to load schedules list", err);
      toast.error("Failed to load interview schedules");
    }
  };

  useEffect(() => {
    loadSchedulesList();
  }, []);

  // 2. Load schedule-specific details, slots, and eligible students
  const loadScheduleDetails = async (id: number) => {
    setIsLoading(true);
    try {
      const scheduleData = await interviewSchedulingService.getSchedule(id);
      if (!scheduleData) {
        toast.error("Selected Interview Schedule not found");
        setSchedule(null);
        return;
      }
      setSchedule(scheduleData);

      // Set default assignment date to schedule's interview date
      if (scheduleData.interview_date) {
        setAssignSlotTime(`${scheduleData.interview_date}T10:00`);
      }

      const slotsData = await interviewSchedulingService.getSlots(id);
      setSlots(slotsData);

      const eligibleData = await interviewSchedulingService.getEligibleStudents(id);
      setEligibleStudents(eligibleData);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load interview slots details");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedScheduleId) {
      loadScheduleDetails(selectedScheduleId);
    } else {
      setSchedule(null);
      setSlots([]);
      setEligibleStudents([]);
      setIsLoading(false);
    }
  }, [selectedScheduleId]);

  // 3. Sync selectedScheduleId when query param changes
  useEffect(() => {
    if (scheduleIdStr) {
      const num = Number(scheduleIdStr);
      if (num !== selectedScheduleId) {
        setSelectedScheduleId(num);
      }
    } else {
      setSelectedScheduleId(null);
    }
  }, [scheduleIdStr]);

  const handleScheduleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val) {
      const numId = Number(val);
      setSelectedScheduleId(numId);
      setSearchParams({ schedule_id: String(numId) });
    } else {
      setSelectedScheduleId(null);
      setSearchParams({});
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScheduleId || !selectedAppId) {
      toast.error("Please select a student");
      return;
    }

    try {
      const payload = {
        application_ids: [Number(selectedAppId)],
        slot_time: assignSlotTime ? new Date(assignSlotTime).toISOString() : null,
        interviewer_name: assignInterviewerName || null,
        interviewer_email: assignInterviewerEmail || null,
      };

      await interviewSchedulingService.assignSlot(selectedScheduleId, payload);
      toast.success("Student assigned to slot successfully");
      
      // Reset form & reload
      setSelectedAppId("");
      setAssignInterviewerName("");
      setAssignInterviewerEmail("");
      setIsAssignModalOpen(false);
      await loadScheduleDetails(selectedScheduleId);
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || "Failed to assign student";
      toast.error(msg);
    }
  };

  const handleEditClick = (slot: Slot) => {
    setEditingSlot(slot);
    if (slot.slot_time) {
      const dt = new Date(slot.slot_time);
      const tzOffset = dt.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(dt.getTime() - tzOffset)).toISOString().slice(0, 16);
      setEditSlotTime(localISOTime);
    } else {
      setEditSlotTime("");
    }
    setEditInterviewerName(slot.interviewer_name || "");
    setEditInterviewerEmail(slot.interviewer_email || "");
    setEditStatus(slot.status);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlot || !selectedScheduleId) return;

    try {
      const payload = {
        slot_time: editSlotTime ? new Date(editSlotTime).toISOString() : null,
        interviewer_name: editInterviewerName || null,
        interviewer_email: editInterviewerEmail || null,
        status: editStatus,
      };

      await interviewSchedulingService.updateSlot(editingSlot.slot_id, payload);
      toast.success("Slot updated successfully");
      setIsEditModalOpen(false);
      setEditingSlot(null);
      await loadScheduleDetails(selectedScheduleId);
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || "Failed to update slot";
      toast.error(msg);
    }
  };

  const handleDeleteClick = async (slotId: number) => {
    if (!selectedScheduleId) return;
    const ok = window.confirm("Are you sure you want to delete this slot assignment?");
    if (!ok) return;

    try {
      await interviewSchedulingService.deleteSlot(slotId);
      toast.success("Slot assignment deleted");
      await loadScheduleDetails(selectedScheduleId);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete slot assignment");
    }
  };

  const handleQuickStatusChange = async (slot: Slot, newStatus: Slot["status"]) => {
    if (!selectedScheduleId) return;
    try {
      const payload = { status: newStatus };
      await interviewSchedulingService.updateSlot(slot.slot_id, payload);
      toast.success(`Status updated to ${newStatus}`);
      await loadScheduleDetails(selectedScheduleId);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    }
  };

  const handleRecordResultClick = (slot: Slot) => {
    setResultSlot(slot);
    setRoundResult((slot.round_result as any) || "PASS");
    setFeedbackNotes(slot.feedback_notes || "");
    setIsResultModalOpen(true);
  };

  const handleResultSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resultSlot || !schedule) return;

    try {
      const payload = {
        application_id: resultSlot.application_id,
        round_id: schedule.round_id,
        result: roundResult,
        feedback_notes: feedbackNotes || null,
      };

      await interviewSchedulingService.submitResult(payload);
      toast.success("Round result recorded successfully");
      setIsResultModalOpen(false);
      setResultSlot(null);
      await loadScheduleDetails(schedule.id);
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || "Failed to record round result";
      toast.error(msg);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header with Navigation */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center pb-4 border-b border-gray-200 dark:border-gray-700 gap-4">
        <div>
          <button
            onClick={() => navigate("/tpo/interview-scheduling")}
            className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-2 transition"
          >
            &larr; Back to Interview Scheduling
          </button>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Interview Slot Assignment
          </h1>
        </div>
        
        {/* Schedule Selector Dropdown */}
        <div className="flex items-center space-x-3">
          <label className="text-sm font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">
            Select Schedule:
          </label>
          <select
            value={selectedScheduleId ? String(selectedScheduleId) : ""}
            onChange={handleScheduleDropdownChange}
            className="border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-sm bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none min-w-[280px] max-w-md shadow-sm"
          >
            <option value="">-- Choose Schedule --</option>
            {schedules.map((s) => (
              <option key={s.id} value={String(s.id)}>
                {s.drive_name} - {s.round_name} ({s.interview_date})
              </option>
            ))}
          </select>
          {selectedScheduleId && (
            <button
              onClick={() => setIsAssignModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg shadow transition duration-150 ease-in-out text-sm whitespace-nowrap"
            >
              Assign Student
            </button>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      )}

      {!isLoading && !selectedScheduleId && (
        <div className="bg-blue-50 dark:bg-blue-900 border-l-4 border-blue-500 text-blue-700 dark:text-blue-200 p-6 rounded-lg shadow-sm text-center">
          <h3 className="font-bold text-lg mb-1">No Schedule Selected</h3>
          <p className="text-sm">
            Please choose an active interview schedule from the dropdown at the top right to assign and manage student interview slots.
          </p>
        </div>
      )}

      {!isLoading && selectedScheduleId && schedule && (
        <>
          {/* Schedule Detail Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-150 dark:border-gray-700 p-6">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center">
              <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full mr-2"></span>
              Interview Schedule Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Drive Name</div>
                <div className="text-sm font-medium text-gray-800 dark:text-gray-200 mt-1">{schedule.drive_name}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Round Name</div>
                <div className="text-sm font-medium text-gray-800 dark:text-gray-200 mt-1">{schedule.round_name}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Interview Date</div>
                <div className="text-sm font-medium text-gray-800 dark:text-gray-200 mt-1">{schedule.interview_date}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Start Time & End Time</div>
                <div className="text-sm font-medium text-gray-800 dark:text-gray-200 mt-1">{schedule.start_time} - {schedule.end_time}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Venue Type</div>
                <div className="text-sm font-medium text-gray-800 dark:text-gray-200 mt-1">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${schedule.venue_type === "Online" ? "bg-blue-100 text-blue-800" : "bg-orange-100 text-orange-800"}`}>
                    {schedule.venue_type}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Venue Details / Meeting Link</div>
                <div className="text-sm font-medium text-gray-800 dark:text-gray-200 mt-1 break-all">
                  {schedule.venue_type === "Online" && schedule.meeting_link ? (
                    <a href={schedule.meeting_link} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                      {schedule.meeting_link}
                    </a>
                  ) : (
                    schedule.venue_details || "-"
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Slots List Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-150 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-150 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center">
                Assigned Student Slots
                <span className="ml-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs py-0.5 px-2 rounded-full font-bold">
                  {slots.length}
                </span>
              </h2>
            </div>

            {slots.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                No students assigned to slots for this schedule yet. Click "Assign Student" to get started.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Student</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">USN</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time Slot</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Interviewer</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Round Result</th>
                      <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {slots.map((slot) => (
                      <tr key={slot.slot_id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition duration-150">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                          {slot.student_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {slot.usn}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {slot.slot_time ? new Date(slot.slot_time).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">
                          <div>{slot.interviewer_name || "-"}</div>
                          <div className="text-xs text-gray-400">{slot.interviewer_email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <select
                            value={slot.status}
                            onChange={(e) => handleQuickStatusChange(slot, e.target.value as any)}
                            className={`text-xs font-semibold rounded px-2.5 py-1 focus:outline-none cursor-pointer border ${
                              slot.status === "COMPLETED"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : slot.status === "NO_SHOW"
                                ? "bg-red-50 text-red-700 border-red-200"
                                : slot.status === "CANCELLED"
                                ? "bg-gray-100 text-gray-700 border-gray-200"
                                : "bg-indigo-50 text-indigo-700 border-indigo-200"
                            }`}
                          >
                            <option value="SCHEDULED">SCHEDULED</option>
                            <option value="COMPLETED">COMPLETED</option>
                            <option value="NO_SHOW">NO SHOW</option>
                            <option value="CANCELLED">CANCELLED</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {slot.round_result ? (
                            <div className="flex items-center space-x-1.5">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                  slot.round_result === "PASS"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                    : slot.round_result === "FAIL"
                                    ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                    : slot.round_result === "HOLD"
                                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                    : "bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-400"
                                }`}
                              >
                                {slot.round_result}
                              </span>
                              <button
                                onClick={() => handleRecordResultClick(slot)}
                                className="text-gray-400 hover:text-indigo-650 dark:hover:text-indigo-400 transition"
                                title="Edit Result"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.83 21.75a0.75 0 0 1-0.343.203l-3.85 1.1a0.75 0 0 1-0.933-0.933l1.1-3.85a0.75 0 0 1 .203-0.343L16.863 4.487Zm0 0L19.5 7.125" />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleRecordResultClick(slot)}
                              className="text-gray-400 hover:text-indigo-600 border border-dashed border-gray-300 dark:border-gray-700 rounded px-2 py-0.5 text-xs transition duration-150 font-medium"
                            >
                              Record Result
                            </button>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEditClick(slot)}
                            className="text-indigo-600 hover:text-indigo-900 mr-4 font-semibold text-xs"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteClick(slot.slot_id)}
                            className="text-red-600 hover:text-red-900 font-semibold text-xs"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal: Assign Student */}
      {isAssignModalOpen && selectedScheduleId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 max-w-md w-full mx-4 overflow-hidden transform transition-all duration-300">
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-250 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-base font-bold text-gray-800 dark:text-white">Assign Student Slot</h3>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 font-bold text-lg">&times;</button>
            </div>
            <form onSubmit={handleAssignSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Student</label>
                {eligibleStudents.length === 0 ? (
                  <div className="text-xs text-red-500 mt-1">No eligible students available. All shortlisted candidates have been assigned or none exist.</div>
                ) : (
                  <select
                    required
                    value={selectedAppId}
                    onChange={(e) => setSelectedAppId(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm bg-white dark:bg-gray-850 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">Select Student</option>
                    {eligibleStudents.map((stud) => (
                      <option key={stud.application_id} value={String(stud.application_id)}>
                        {stud.student_name} ({stud.usn}) - CGPA: {stud.cgpa}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Slot Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={assignSlotTime}
                  onChange={(e) => setAssignSlotTime(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm bg-white dark:bg-gray-850 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Interviewer Name</label>
                <input
                  type="text"
                  placeholder="Enter Interviewer Name"
                  value={assignInterviewerName}
                  onChange={(e) => setAssignInterviewerName(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm bg-white dark:bg-gray-850 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Interviewer Email</label>
                <input
                  type="email"
                  placeholder="Enter Interviewer Email"
                  value={assignInterviewerEmail}
                  onChange={(e) => setAssignInterviewerEmail(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm bg-white dark:bg-gray-850 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="pt-4 flex justify-end space-x-2 border-t border-gray-150 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={eligibleStudents.length === 0}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white text-sm font-semibold rounded-lg shadow-sm transition"
                >
                  Assign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Slot */}
      {isEditModalOpen && editingSlot && selectedScheduleId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 max-w-md w-full mx-4 overflow-hidden transform transition-all duration-300">
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-250 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-base font-bold text-gray-800 dark:text-white">Edit Interview Slot</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 font-bold text-lg">&times;</button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Student</label>
                <input
                  type="text"
                  disabled
                  value={`${editingSlot.student_name} (${editingSlot.usn})`}
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm bg-gray-100 dark:bg-gray-700 dark:text-gray-300 outline-none cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Slot Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={editSlotTime}
                  onChange={(e) => setEditSlotTime(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm bg-white dark:bg-gray-850 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Interviewer Name</label>
                <input
                  type="text"
                  placeholder="Enter Interviewer Name"
                  value={editInterviewerName}
                  onChange={(e) => setEditInterviewerName(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm bg-white dark:bg-gray-850 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Interviewer Email</label>
                <input
                  type="email"
                  placeholder="Enter Interviewer Email"
                  value={editInterviewerEmail}
                  onChange={(e) => setEditInterviewerEmail(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm bg-white dark:bg-gray-850 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm bg-white dark:bg-gray-850 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="SCHEDULED">SCHEDULED</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="NO_SHOW">NO SHOW</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
              <div className="pt-4 flex justify-end space-x-2 border-t border-gray-150 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record Round Result */}
      {isResultModalOpen && resultSlot && schedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-150 dark:border-gray-700 max-w-md w-full mx-4 overflow-hidden transform transition-all duration-300 scale-100 animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-150 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-base font-bold text-gray-800 dark:text-white flex items-center">
                <span className="w-2.5 h-2.5 bg-green-500 rounded-full mr-2"></span>
                Record Round Result
              </h3>
              <button
                onClick={() => setIsResultModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 font-semibold text-xl transition"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleResultSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Student Details</label>
                <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                  <div className="text-sm font-bold text-gray-800 dark:text-white">{resultSlot.student_name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">USN: {resultSlot.usn} | Round: {schedule.round_name}</div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Round Result</label>
                <div className="grid grid-cols-2 gap-3">
                  {(["PASS", "FAIL", "HOLD", "ABSENT"] as const).map((opt) => (
                    <label
                      key={opt}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition select-none ${
                        roundResult === opt
                          ? opt === "PASS"
                            ? "border-green-500 bg-green-50/50 dark:bg-green-950/20 text-green-700 dark:text-green-400 font-semibold"
                            : opt === "FAIL"
                            ? "border-red-500 bg-red-50/50 dark:bg-red-950/20 text-red-700 dark:text-red-400 font-semibold"
                            : opt === "HOLD"
                            ? "border-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-400 font-semibold"
                            : "border-gray-500 bg-gray-50/50 dark:bg-gray-850/50 text-gray-700 dark:text-gray-300 font-semibold"
                          : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 text-gray-600 dark:text-gray-300"
                      }`}
                    >
                      <span className="text-xs uppercase tracking-wider">{opt}</span>
                      <input
                        type="radio"
                        name="roundResult"
                        value={opt}
                        checked={roundResult === opt}
                        onChange={() => setRoundResult(opt)}
                        className="sr-only"
                      />
                      <span
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                          roundResult === opt
                            ? opt === "PASS"
                              ? "border-green-500"
                              : opt === "FAIL"
                              ? "border-red-500"
                              : opt === "HOLD"
                              ? "border-yellow-500"
                              : "border-gray-500"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                      >
                        {roundResult === opt && (
                          <span
                            className={`w-2 h-2 rounded-full ${
                              opt === "PASS"
                                ? "bg-green-500"
                                : opt === "FAIL"
                                ? "bg-red-500"
                                : opt === "HOLD"
                                ? "bg-yellow-500"
                                : "bg-gray-500"
                            }`}
                          ></span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Feedback / Notes</label>
                <textarea
                  placeholder="Enter feedback or notes regarding the student's performance..."
                  value={feedbackNotes}
                  onChange={(e) => setFeedbackNotes(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-xl p-3 text-sm bg-white dark:bg-gray-850 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none shadow-sm transition"
                />
              </div>

              <div className="pt-4 flex justify-end space-x-2 border-t border-gray-150 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setIsResultModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
                >
                  Save Result
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewSlotsPage;
