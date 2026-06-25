import axiosInstance from "../../../../utils/api";
import { PlacementApiEndpoint } from "../../../../utils/ApiEndpoint/placementApiEndpoint";

const getDrives = async () => {
  try {
    const res: any = await axiosInstance.get(PlacementApiEndpoint.drive.list);
    return res.data?.data || [];
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

export default {
  getDrives,
  getDriveRounds,
  getSchedules,
  addSchedule,
  updateSchedule,
  deleteSchedule,
};
