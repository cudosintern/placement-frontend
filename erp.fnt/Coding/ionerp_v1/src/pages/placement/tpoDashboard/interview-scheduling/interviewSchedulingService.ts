import axiosInstance from "../../../../utils/api";
import { PlacementApiEndpoint } from "../../../../utils/ApiEndpoint/placementApiEndpoint";

const getDrives = async () => {
  try {
    const res: any = await axiosInstance.get(PlacementApiEndpoint.drive.list);
    return res.data?.data?.drives || [];
  } catch (err) {
    console.error("interviewSchedulingService.getDrives", err);
    return [];
  }
};

const getDriveRounds = async (driveId: number) => {
  try {
    const res: any = await axiosInstance.get(`${PlacementApiEndpoint.drive.detail}/${driveId}`);
    return res.data?.data?.rounds || [];
  } catch (err) {
    console.error("interviewSchedulingService.getDriveRounds", err);
    return [];
  }
};

const getSchedules = async () => {
  try {
    const res: any = await axiosInstance.get(PlacementApiEndpoint.interview.get_schedules);
    return res.data?.data || [];
  } catch (err) {
    console.error("interviewSchedulingService.getSchedules", err);
    return [];
  }
};

const getSchedule = async (id: number) => {
  try {
    const res: any = await axiosInstance.get(`${PlacementApiEndpoint.interview.get_schedule}/${id}`);
    return res.data?.data || null;
  } catch (err) {
    console.error("interviewSchedulingService.getSchedule", err);
    return null;
  }
};

const addSchedule = async (payload: any) => {
  try {
    const res = await axiosInstance.post(PlacementApiEndpoint.interview.add_schedule, payload);
    return res.data;
  } catch (err) {
    console.error("interviewSchedulingService.addSchedule", err);
    throw err;
  }
};

const updateSchedule = async (id: number, payload: any) => {
  try {
    const res = await axiosInstance.put(`${PlacementApiEndpoint.interview.update_schedule}/${id}`, payload);
    return res.data;
  } catch (err) {
    console.error("interviewSchedulingService.updateSchedule", err);
    throw err;
  }
};

const deleteSchedule = async (id: number) => {
  try {
    const res = await axiosInstance.delete(`${PlacementApiEndpoint.interview.delete_schedule}/${id}`);
    return res.data;
  } catch (err) {
    console.error("interviewSchedulingService.deleteSchedule", err);
    throw err;
  }
};

const getSlots = async (scheduleId: number) => {
  try {
    const res: any = await axiosInstance.get(`${PlacementApiEndpoint.interview.get_slots}/${scheduleId}`);
    return res.data?.data || [];
  } catch (err) {
    console.error("interviewSchedulingService.getSlots", err);
    return [];
  }
};

const assignSlot = async (scheduleId: number, payload: any) => {
  try {
    const res = await axiosInstance.post(`${PlacementApiEndpoint.interview.assign_slot}/${scheduleId}/assign`, payload);
    return res.data;
  } catch (err) {
    console.error("interviewSchedulingService.assignSlot", err);
    throw err;
  }
};

const updateSlot = async (slotId: number, payload: any) => {
  try {
    const res = await axiosInstance.put(`${PlacementApiEndpoint.interview.update_slot}/${slotId}`, payload);
    return res.data;
  } catch (err) {
    console.error("interviewSchedulingService.updateSlot", err);
    throw err;
  }
};

const deleteSlot = async (slotId: number) => {
  try {
    const res = await axiosInstance.delete(`${PlacementApiEndpoint.interview.delete_slot}/${slotId}`);
    return res.data;
  } catch (err) {
    console.error("interviewSchedulingService.deleteSlot", err);
    throw err;
  }
};

const getEligibleStudents = async (scheduleId: number) => {
  try {
    const res: any = await axiosInstance.get(`${PlacementApiEndpoint.interview.eligible_students}/${scheduleId}`);
    return res.data?.data || [];
  } catch (err) {
    console.error("interviewSchedulingService.getEligibleStudents", err);
    return [];
  }
};

const submitResult = async (payload: any) => {
  try {
    const res = await axiosInstance.post(PlacementApiEndpoint.interview.submit_result, payload);
    return res.data;
  } catch (err) {
    console.error("interviewSchedulingService.submitResult", err);
    throw err;
  }
};

export default {
  getDrives,
  getDriveRounds,
  getSchedules,
  getSchedule,
  addSchedule,
  updateSchedule,
  deleteSchedule,
  getSlots,
  assignSlot,
  updateSlot,
  deleteSlot,
  getEligibleStudents,
  submitResult,
};
