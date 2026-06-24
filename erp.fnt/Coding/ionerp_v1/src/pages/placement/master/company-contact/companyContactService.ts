import axiosInstance from "../../../../utils/api";
import { ApiEndpoint } from "../../../../utils/ApiEndpoint/placementApiEndpoint";

const contactUrl = ApiEndpoint.companyContact;
const companyUrl = ApiEndpoint.company;

const getContacts = async () => {
  try {
    const res = await axiosInstance.get(contactUrl.get_contacts);
    return res.data;
  } catch (err) {
    console.error("companyContactService.getContacts", err);
    return [];
  }
};

const addContact = async (payload: any) => {
  try {
    const res = await axiosInstance.post(contactUrl.add_contact, payload);
    return res.data;
  } catch (err) {
    console.error("companyContactService.addContact", err);
    throw err;
  }
};

const updateContact = async (payload: any) => {
  try {
    const res = await axiosInstance.put(contactUrl.update_contact, payload);
    return res.data;
  } catch (err) {
    console.error("companyContactService.updateContact", err);
    throw err;
  }
};

const deleteContact = async (contactId: number) => {
  try {
    const res = await axiosInstance.delete(contactUrl.delete_contact, {
      data: { contact_id: contactId },
    } as any);
    return res.data;
  } catch (err) {
    console.error("companyContactService.deleteContact", err);
    throw err;
  }
};

const getCompanies = async () => {
  try {
    const res = await axiosInstance.get(companyUrl.list);
    return res.data;
  } catch (err) {
    console.error("companyContactService.getCompanies", err);
    return [];
  }
};

const getDesignations = async () => {
  try {
    const res = await axiosInstance.get(contactUrl.get_designations);
    return res.data;
  } catch (err) {
    console.error("companyContactService.getDesignations", err);
    return [];
  }
};

const companyContactService = {
  getContacts,
  addContact,
  updateContact,
  deleteContact,
  getCompanies,
  getDesignations,
};

export default companyContactService;
