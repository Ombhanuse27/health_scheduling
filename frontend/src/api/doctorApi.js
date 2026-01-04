import axiosInstance from "./axiosInstance";

export const loginDoctor = (data) =>
  axiosInstance.post("/doctors/login", data);

export const registerDoctor = (data) =>
  axiosInstance.post("/doctors/addDoctors", data);

export const getLoggedInDoctor = () =>
  axiosInstance.get("/doctors/doctorme");

export const updateDoctorInfo = (data) =>
  axiosInstance.put("/doctors/updateProfile", data);

export const getDoctorsData = async () => {
  const response = await axiosInstance.get("/doctors/getDoctors");
  return response.data;
};


export const deleteDoctor = (id) =>
  axiosInstance.delete(`/doctors/deleteDoctor/${id}`);

export const getPrescriptions = () =>
  axiosInstance.get("/doctors/getPrescriptions");
