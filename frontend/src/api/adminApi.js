import axiosInstance from "./axiosInstance";
import { handleApiError } from "../utils/handleApiError";

export const registerAdmin = (data) =>
  axiosInstance.post("/admin/register", data);

export const loginAdmin = (data) =>
  axiosInstance.post("/admin/login", data);

export const getLoggedInHospital = () =>
  axiosInstance.get("/admin/me");

export const getHospitals = async () => {
  const response = await axiosInstance.get("/admin/getHospitals");
  return response.data;
};


export const assignDoctors = (recordId, doctorId) =>
  axiosInstance.post("/admin/assignDoctors", { recordId, doctorId });
