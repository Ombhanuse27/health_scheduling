import axios from "axios";

const BASE_URL = "https://health-scheduling.onrender.com/api";



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

export const registerDoctor = async (data) => {
  try {
    const doctorData = {
      ...data,
      password: data.password, // Assuming you want to keep the password in the request
    };
    const response = await axios.post(`${BASE_URL}/doctors/AddDoctors`, doctorData);
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

export const checkDuplicate = async (fullName) => {
  try {
    const response = await axios.post(`${BASE_URL}/checkDuplicate`, {
      fullName,

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


export const getDoctorsData = async (token) => {
  const response = await fetch(`${BASE_URL}/doctors/getDoctors`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return await response.json();
};


export const getRecords = (token) =>
  axios.get(`${BASE_URL}/doctor/opd`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  // Save new prescription (if not exists)
export const savePrescriptionPdf = async (token, recordId, pdfBase64, diagnosis, medication, advice) => {
  return await axios.put(
    `${BASE_URL}/opd/${recordId}/prescription`,
    {
      pdfBase64,
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
  return axios.get(`${BASE_URL}/getPrescriptions`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};


export const sendPrescriptionEmail = async ({ email, patientName, pdfBase64 }) => {
  return await axios.post(`${BASE_URL}/send-prescription`, {
    email,
    patientName,
    pdfBase64,
  });
};



export const getOpdRecords = (token) =>
  axios.get(`${BASE_URL}/dashboard`, {
    headers: { Authorization: `Bearer ${token}` },
  });
