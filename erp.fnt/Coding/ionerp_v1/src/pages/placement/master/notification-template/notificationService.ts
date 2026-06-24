import axiosInstance from "../../../../utils/api";
import { ApiEndpoint } from "../../../../utils/ApiEndpoint/placementapiEndpoint";

const baseUrl = ApiEndpoint.notification;

const getTemplates = async () => {
  try {
    const res = await axiosInstance.get(
      baseUrl.get_templates,
    );

    return res.data;
  } catch (err) {
    console.error("notificationService.getTemplates", err);
    return [];
  }
};

const addTemplate = async (payload: any) => {
  try {
    const res = await axiosInstance.post(
      baseUrl.add_template,
      payload
    );

    return res.data;
  } catch (err) {
    console.error("notificationService.addTemplate", err);
    throw err;
  }
};

const updateTemplate = async (id: number, payload: any) => {
  try {
    const res = await axiosInstance.put(
      `${baseUrl.update_template}/${id}`,
      payload
    );

    return res.data;
  } catch (err) {
    console.error("notificationService.updateTemplate", err);
    throw err;
  }
};

const deleteTemplate = async (id: number) => {
  try {
    const res = await axiosInstance.delete(
      `${baseUrl.delete_template}/${id}`
    );

    return res.data;
  } catch (err) {
    console.error("notificationService.deleteTemplate", err);
    throw err;
  }
};
export default {
  getTemplates,
  addTemplate,
  updateTemplate,
  deleteTemplate,
};