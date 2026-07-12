import React, { useEffect } from "react";
import DataTable from "../../../../components/Table/DataTable";
import ModalWithForm from "../../../../components/Modal/ModalWithForm";
import interviewSchedulingService from "./interviewSchedulingService";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

import {
  Schema,
  SchemaFields,
  SchemaColumnDefs,
} from "./interviewSchedulingSchema";

const InterviewSchedulingPage = () => {
  const navigate = useNavigate();
  const [schedules, setSchedules] = React.useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingSchedule, setEditingSchedule] = React.useState<any>(null);

  const loadSchedules = async () => {
    try {
      const response = await interviewSchedulingService.getSchedules();
      setSchedules(response || []);
    } catch (error) {
      console.error("Error loading schedules:", error);
    }
  };

  useEffect(() => {
    loadSchedules();
  }, []);

  const handleFormSubmit = async (data: any) => {
    try {
      const formatDate = (val: any) => {
        if (val instanceof Date) {
          const year = val.getFullYear();
          const month = String(val.getMonth() + 1).padStart(2, "0");
          const day = String(val.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        }
        return String(val);
      };

      const formatTime = (val: any) => {
        if (val instanceof Date) {
          const hours = String(val.getHours()).padStart(2, "0");
          const minutes = String(val.getMinutes()).padStart(2, "0");
          const seconds = String(val.getSeconds()).padStart(2, "0");
          return `${hours}:${minutes}:${seconds}`;
        }
        return String(val);
      };

      // Map form values to payload types expected by backend
      const payload = {
        drive_id: Number(data.drive_id),
        round_id: Number(data.round_id),
        venue_type: data.venue_type,
        venue_details: data.venue_details || null,
        meeting_link: data.venue_type === "Online" ? data.meeting_link : null,
        interview_date: formatDate(data.interview_date),
        start_time: formatTime(data.start_time),
        end_time: formatTime(data.end_time),
      };

      if (editingSchedule) {
        await interviewSchedulingService.updateSchedule(editingSchedule.id, payload);
        toast.success("Interview Schedule updated successfully");
      } else {
        await interviewSchedulingService.addSchedule(payload);
        toast.success("Interview Scheduled successfully");
      }

      await loadSchedules();
      setIsModalOpen(false);
      setEditingSchedule(null);
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || "Operation failed";
      toast.error(msg);
    }
  };

  const editScheduleHandler = (schedule: any) => {
    const parseDateStr = (dateStr: string) => {
      if (!dateStr) return null;
      // Extract parts to avoid timezone offset shifts
      const [year, month, day] = dateStr.split("-");
      return new Date(Number(year), Number(month) - 1, Number(day));
    };

    const parseTimeStr = (timeStr: string) => {
      if (!timeStr) return null;
      const today = new Date();
      const [h, m, s] = timeStr.split(":");
      today.setHours(Number(h) || 0, Number(m) || 0, Number(s) || 0);
      return today;
    };

    setEditingSchedule({
      id: schedule.id,
      drive_id: String(schedule.drive_id),
      round_id: String(schedule.round_id),
      venue_type: schedule.venue_type,
      venue_details: schedule.venue_details || "",
      meeting_link: schedule.meeting_link || "",
      interview_date: parseDateStr(schedule.interview_date),
      start_time: parseTimeStr(schedule.start_time),
      end_time: parseTimeStr(schedule.end_time),
    });
    setIsModalOpen(true);
  };

  const deleteScheduleHandler = async (id: number) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this schedule?");
    if (!confirmDelete) return;

    try {
      await interviewSchedulingService.deleteSchedule(id);
      toast.success("Interview Schedule deleted successfully");
      await loadSchedules();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete interview schedule");
    }
  };

  const columnDefsWithAction = [
    ...SchemaColumnDefs,
    {
      headerName: "Slots",
      cellRenderer: (params: any) => (
        <button
          onClick={() => navigate(`/tpo/interview-slots?schedule_id=${params.data.id}`)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs transition duration-150 ease-in-out"
        >
          Assign Slots
        </button>
      ),
    },
    {
      headerName: "Edit",
      cellRenderer: (params: any) => (
        <button
          onClick={() => editScheduleHandler(params.data)}
          className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs transition duration-150 ease-in-out"
        >
          Edit
        </button>
      ),
    },
    {
      headerName: "Delete",
      cellRenderer: (params: any) => (
        <button
          onClick={() => deleteScheduleHandler(params.data.id)}
          className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs transition duration-150 ease-in-out"
        >
          Delete
        </button>
      ),
    },
  ];

  return (
    <div className="p-6">
      {isModalOpen && (
        <ModalWithForm
          title={editingSchedule ? "Edit Interview Schedule" : "Add Interview Schedule"}
          isOpen={isModalOpen}
          onSubmit={handleFormSubmit}
          onClose={() => {
            setIsModalOpen(false);
            setEditingSchedule(null);
          }}
          formFields={SchemaFields}
          schema={Schema}
          size="lg"
          columnLayout={1}
          initialValues={editingSchedule || {}}
        />
      )}

      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
          Interview Scheduling
        </h3>
      </div>

      <DataTable
        columnDefs={columnDefsWithAction}
        rowData={schedules}
        showAddButton={true}
        showAddButtonName="Schedule Interview"
        addButtonHandler={() => setIsModalOpen(true)}
        showExportButton={false}
        headerFilter={true}
        pageSize={20}
      />
    </div>
  );
};

export default InterviewSchedulingPage;
