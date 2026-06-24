import axiosInstance from "../../../../utils/api";
import { ApiEndpoint } from "../../../../utils/ApiEndpoint/placementApiEndpoint";

const baseUrl = ApiEndpoint.notificationLog;

const getNotificationLogs = async () => {
  try {
    const res = await axiosInstance.get(
      baseUrl.get_logs
    );

    return res.data;
  } catch (err) {
    console.error("notificationLogService.getNotificationLogs", err);
    return [];
  }
};

export default {
  getNotificationLogs,
};