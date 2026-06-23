import axiosInstance from "../../../../utils/api";

const baseUrl = "/placement/notification-log";

const getNotificationLogs = async () => {
  try {
    const res = await axiosInstance.get(
      `${baseUrl}/get_notification_logs`
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