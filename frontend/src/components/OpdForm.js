import { useEffect, useState } from "react";
import { submitOpdForm, getHospitals } from "../api/api"; 
import { Link } from "react-router-dom";

const OpdForm = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    age: "",
    gender: "",
    contactNumber: "",
    email: "",
    address: "",
    symptoms: "",
    hospitalId: "",  
    hospitalName: "", 
  });

  const [hospitals, setHospitals] = useState([]);
  const HOSPITAL_OPEN = 9 * 60;
  const HOSPITAL_CLOSE = 24 * 60;

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const data = await getHospitals();
        if (Array.isArray(data)) {
          setHospitals(data);
          console.log("Hospitals fetched:", data);  
        } else {
          console.error("Unexpected response format:", data);
          alert("Error fetching hospital list");
        }
      } catch (error) {
        console.error("Error fetching hospitals:", error);
        alert("Error fetching hospital list");
      }
    };
    
    fetchHospitals();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "hospitalId") {  // Fix: Ensure we update hospitalId correctly
      const selectedHospital = hospitals.find(hospital => hospital._id === value);
      setFormData({
        ...formData,
        hospitalId: value, 
        hospitalName: selectedHospital ? selectedHospital.username : "", 
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
    if (currentMinutes < HOSPITAL_OPEN) {
      alert("Appointments start at 9:00 AM.");
      return;
    } else if (currentMinutes > HOSPITAL_CLOSE) {
      alert("Appointments are closed for today.");
      return;
    }
  
    try {
      // First, call the API function
      await submitOpdForm(formData.hospitalId, formData);
  
      // Then, make the fetch request to the backend
      const response = await fetch("http://localhost:5000/submitOpdForm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        alert(data.message || "OPD Form submitted successfully");
      } else {
        alert(data.message || "Error submitting OPD Form");
      }
    } catch (error) {
      console.error("Error submitting OPD Form:", error);
      alert("Error submitting OPD Form");
    }
  };
  
  
  return (
    <div className="w-full">
      <div className="h-16 px-5 bg-blue-500 text-white flex items-center justify-between">
        <h1 className="text-xl font-bold">DocTime</h1>
        <div className="flex gap-6">
          <Link to="/login" className="px-6 py-2 rounded hover:bg-blue-600 transition">
            Login
          </Link>
          <Link to="/register" className="px-6 py-2 rounded hover:bg-blue-600 transition">
            Register
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-8 bg-white shadow-2xl rounded-2xl mt-8">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">OPD Form</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Hospital Selection */}
          <div className="flex flex-col">
            <label htmlFor="hospitalId" className="block text-sm font-medium text-gray-700 mb-1">
              Select Hospital (Admin Username)
            </label>
            <select
              id="hospitalId"
              name="hospitalId"  // Fix: Corrected the name attribute
              value={formData.hospitalId}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a hospital</option>
              {hospitals.length > 0 ? (
                hospitals.map((hospital) => (
                  <option key={hospital._id} value={hospital._id}>
                  
                    {hospital.username} 
                  </option>
                ))
              ) : (
                <option disabled>Loading hospitals...</option>
              )}
            </select>
          </div>

          {/* Other Input Fields */}
          {Object.keys(formData).map((key) => (
            key !== "hospitalId" && key !== "hospitalName" && ( 
              <div key={key} className="flex flex-col">
                <label htmlFor={key} className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </label>
                <input
                  type={key === "email" ? "email" : key === "age" ? "number" : "text"}
                  id={key}
                  name={key}
                  value={formData[key]}
                  onChange={handleChange}
                  placeholder={`Enter ${key.replace(/([A-Z])/g, " $1").trim()}`}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            )
          ))}

          <button
            type="submit"
            className="col-span-1 md:col-span-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default OpdForm;
