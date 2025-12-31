import axios from "axios";
//const BASE_URL = "http://localhost:5000/api"; // Use this for local development
const BASE_URL = "https://health-scheduling.onrender.com/api"; // Use this for local development



export const registerAdmin = (data) => axios.post(`${BASE_URL}/admin/register`, data);
export const loginAdmin = (data) => axios.post(`${BASE_URL}/admin/login`, data);

export const loginDoctor = (data) => axios.post(`${BASE_URL}/doctors/login`, data);
export const submitOpdForm = async (hospitalId, data) => {
  try {
    const response = await axios.post(`${BASE_URL}/opd/${hospitalId}`, data);
    return response.data;
  } catch (error) {
    console.error("Error submitting OPD form:", error.response?.data || error.message);
    throw error;  
  }   
};

// ✅ Delete OPD Record
export const deleteOpdRecord = async (recordId, token) => {
  try {
    const response = await axios.delete(`${BASE_URL}/opd/${recordId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting OPD record:", error.response?.data || error.message);
    throw error;
  }
};

// ✅ Get Logged In Doctor Data
export const getLoggedInDoctor = (token) => {
  return axios.get(`${BASE_URL}/doctors/doctorme`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// ✅ Update Logged In Doctor Data
export const updateDoctorInfo = async (token, data) => {
  try {
    const response = await axios.put(`${BASE_URL}/doctors/updateProfile`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error updating doctor info:", error.response?.data || error.message);
    throw error;
  }
};

export const generateTeleconsultLink = async (appointmentId) =>
  axios.get(`${BASE_URL}/generate-link/${appointmentId}`);

// ✅ Send Teleconsultation Email
export const sendTeleconsultEmail = async (data) =>
  axios.post(`${BASE_URL}/send-teleconsult`, data);


export const registerDoctor = async (data) => {
  try {
    const doctorData = {
      ...data,
      password: data.password, // Assuming you want to keep the password in the request
    };
    const response = await axios.post(`${BASE_URL}/doctors/addDoctors`, doctorData);
    return response.data; // Axios already parses JSON
  } catch (error) { 
    console.error("Error registering doctor:", error.response?.data || error.message);
    throw error;
  }
};


export const getHospitalsData = async (hospitalId) => {
  try {
    const response = await axios.get(`${BASE_URL}/getHospitalsData`);
    return response.data; // Axios already parses JSON
  } catch (error) {
    console.error("Error fetching hospital data:", error.response?.data || error.message);
    throw error;
  }
}

export const checkDuplicate = async (fullName,hospitalId) => {
  try {
    const response = await axios.post(`${BASE_URL}/checkDuplicate`, {
      fullName,hospitalId

    });
    return response.data;
  } catch (error) {
    console.error("Error checking duplicates:", error);
    return { exists: false };
  }
};


export const submitHospitalInfo = async (hospitalId, data) => {
  try {
    const response = await axios.post(`${BASE_URL}/hospitalData/${hospitalId}`, data);
    return response.data;
  } catch (error) {
    console.error("Error submitting hospital info:", error.response?.data || error.message);
    throw error;
  }
}

// export const submitDocForm = (data) => axios.post(`${BASE_URL}/dashboard/add`, data);
export const submitDocForm = async (data) => {
  try {
    const response = await axios.post(`${BASE_URL}/dashboard/add`, data);
    return response.data; // Returning the response data
  } catch (error) {
    console.error("Error submitting doctor form:", error.response?.data || error.message);
    throw error;
  }
};

export const assignDoctors = async (recordId, doctorId, token) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/admin/assignDoctors`,
      { recordId, doctorId },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data; // Axios already parses JSON
  } catch (error) {
    console.error("Error assigning doctor:", error.response?.data || error.message);
    throw error;
  }
}


export const getHospitals = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/admin/getHospitals`);
    return response.data; // Axios already parses JSON
  } catch (error) {
    console.error("Error fetching hospitals:", error.response?.data || error.message);
    throw error;
  }
};

export const getLoggedInHospital = (token) => {
  return axios.get(`${BASE_URL}/admin/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};


export const getDoctorsData = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/doctors/getDoctors`);
    return response.data; // Axios already parses JSON
  } catch (error) {
    console.error("Error fetching doctors data:", error.response?.data || error.message);
    throw error;
  }
};

export const deleteDoctor = async (id) => {
  try {
    const response = await axios.delete(`${BASE_URL}/doctors/deleteDoctor/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting doctor:", error.response?.data || error.message);
    throw error;
  }
};



export const getRecords = (token) =>
  axios.get(`${BASE_URL}/doctor/opd`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  // Save new prescription (if not exists)
// ✅ MODIFIED: Function signature and data payload updated
export const savePrescriptionPdf = async (
  token,
  recordId,
  base64Data, // Renamed from pdfBase64
  contentType, // Added
  diagnosis,
  medication,
  advice
) => {
  return await axios.put(
    `${BASE_URL}/opd/${recordId}/prescription`,
    {
      base64Data, // Send new field name
      contentType, // Send new field
      diagnosis,
      medication,
      advice,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};


export const getPrescriptions = (token) => {
  return axios.get(`${BASE_URL}/doctors/getPrescriptions`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};


// ✅ MODIFIED: Function signature and data payload updated
export const sendPrescriptionEmail = async ({
  email,
  patientName,
  base64Data, // Renamed
  contentType, // Added
  filename, // Added
}) => {
  return await axios.post(`${BASE_URL}/send-prescription`, {
    email,
    patientName,
    base64Data,
    contentType,
    filename,
  });
};

// ✅ Reschedule OPD Appointment
export const rescheduleOpdAppointment = async (recordId, newSlot, token) => {
  try {
    const response = await axios.put(
      `${BASE_URL}/opd/${recordId}/reschedule`,
      { newSlot },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error rescheduling appointment:",
      error.response?.data || error.message
    );
    throw error;
  }
};




export const getOpdRecords = (token) =>
  axios.get(`${BASE_URL}/dashboard`, {
    headers: { Authorization: `Bearer ${token}` },
  });
