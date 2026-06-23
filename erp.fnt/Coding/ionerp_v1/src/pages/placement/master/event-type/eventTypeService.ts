import axiosInstance from "../../../../utils/api";

const baseUrl = "/placement/event-type";

const getEventTypes = async () => {
  try {
    const res = await axiosInstance.get(
      `${baseUrl}/get_event_types`
    );

    return res.data;
  } catch (err) {
    console.error("eventTypeService.getEventTypes", err);
    return [];
  }
};

const addEventType = async (payload: any) => {
  try {
    const res = await axiosInstance.post(
      `${baseUrl}/add_event_type`,
      payload
    );

    return res.data;
  } catch (err) {
    console.error("eventTypeService.addEventType", err);
    throw err;
  }
};

const updateEventType = async (id: number, payload: any) => {
  try {
    const res = await axiosInstance.put(
      `${baseUrl}/update_event_type/${id}`,
      payload
    );

    return res.data;
  } catch (err) {
    console.error("eventTypeService.updateEventType", err);
    throw err;
  }
};

export default {
  getEventTypes,
  addEventType,
  updateEventType,
};