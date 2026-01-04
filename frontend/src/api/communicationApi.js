import axiosInstance from "./axiosInstance";

export const generateTeleconsultLink = (appointmentId) =>
  axiosInstance.get(`/email/generate-link/${appointmentId}`);

export const sendTeleconsultEmail = (data) =>
  axiosInstance.post("/email/send-teleconsult", data);

export const sendPrescriptionEmail = (data) =>
  axiosInstance.post("/email/send-prescription", data);
