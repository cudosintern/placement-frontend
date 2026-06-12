import axios from "axios";
import { CompanyResponse } from "./responseInterface";

const baseUrl = "/api/companies"; // adjust to your backend route

const list = async (): Promise<CompanyResponse[]> => {
  try {
    const res = await axios.get(baseUrl);
    return res.data as CompanyResponse[];
  } catch (err) {
    console.error("companyService.list", err);
    return [];
  }
};

const get = async (id: number): Promise<CompanyResponse | null> => {
  try {
    const res = await axios.get(`${baseUrl}/${id}`);
    return res.data as CompanyResponse;
  } catch (err) {
    console.error("companyService.get", err);
    return null;
  }
};

const create = async (payload: Partial<CompanyResponse>) => {
  return axios.post(baseUrl, payload);
};

const update = async (id: number, payload: Partial<CompanyResponse>) => {
  return axios.put(`${baseUrl}/${id}`, payload);
};

const toggleActive = async (id: number) => {
  return axios.post(`${baseUrl}/${id}/toggle`);
};

export default {
  list,
  get,
  create,
  update,
  toggleActive,
};
