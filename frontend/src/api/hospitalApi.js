import axiosInstance from "./axiosInstance";
import { handleApiError } from "../utils/handleApiError";

/**
 * Get all hospitals data
 */
export const getHospitalsData = async () => {
  try {
    const response = await axiosInstance.get("/hospital/getHospitalsData");
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Failed to fetch hospital data");
  }
};

/**
 * Update hospital information
 * @param {string} hospitalId
 * @param {object} data
 */
export const submitHospitalInfo = async (hospitalId, data) => {
  try {
    const response = await axiosInstance.post(
      `/hospital/hospitalData/${hospitalId}`,
      data
    );
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Failed to update hospital information");
  }
};
