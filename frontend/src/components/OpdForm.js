

import { useEffect, useState, useRef } from "react";
import { submitOpdForm, getHospitals,checkDuplicate  } from "../api/api"; 
import NavbarLink from "./Navbar/NavbarLink";
import lottie from 'lottie-web';
import Footer from "./Footer/Footer";

const OpdForm = () => {
  const container = useRef(null);

  useEffect(() => {
    const animationInstance = lottie.loadAnimation({
      container: container.current,
      renderer: "svg",
      loop: true,
      autoplay: true,
      animationData: require("../animations/appointment.json"),
    });

    return () => {
      animationInstance.destroy();
    };
  }, []);

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
    preferredSlot: "" // New field for preferred slot
  });

  const [hospitals, setHospitals] = useState([]);
  const HOSPITAL_OPEN = 1 * 60;
  const HOSPITAL_CLOSE = 24 * 60;

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const data = await getHospitals();
        if (Array.isArray(data)) {
          setHospitals(data);
        } else {
          alert("Error fetching hospital list");
        }
      } catch (error) {
        alert("Error fetching hospital list");
      }
    };
    fetchHospitals();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "hospitalId") {
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

  const checkIfDuplicateExists = async () => {
    try {
      const duplicateCheck = await checkDuplicate(formData.fullName, formData.contactNumber);
      return duplicateCheck.exists;
    } catch (error) {
      console.error("Error checking duplicates:", error);
      return false;
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // Check for duplicate before proceeding
    const isDuplicate = await checkIfDuplicateExists();
    if (isDuplicate) {
      alert("This Full Name and Contact Number already exist. Please use different values.");
      return;
    }
  
    // Confirm booking and proceed with form submission
    const confirmBooking = window.confirm("Do you want to book an appointment?");
    if (!confirmBooking) return;
  
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
      await submitOpdForm(formData.hospitalId, formData);
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
      alert("Error submitting OPD Form");
    }
  };

  // Generate time slots from 9 AM to 10 PM (3-hour slots)
  const timeSlots = Array.from({ length: 5 }, (_, i) => {
    let startHour = 9 + i * 3;
    let endHour = startHour + 3;
    let startPeriod = startHour >= 12 ? "PM" : "AM";
    let endPeriod = endHour >= 12 ? "PM" : "AM";
    
    return `${startHour > 12 ? startHour - 12 : startHour}:00 ${startPeriod} - ${endHour > 12 ? endHour - 12 : endHour}:00 ${endPeriod}`;
  });

  return (
    <div className="w-full bg-blue-200">
      <NavbarLink />
      <div className="appointment bg-blue-200 rounded-[30px] p-[100px_60px_0px_60px] mx-[30px] relative overflow-hidden mt-36">
        <div className="container mx-auto">
          <div className="flex flex-wrap bg-white my-[30px]">
            <div className="max-w-4xl mx-auto p-8 border-1 rounded-2xl mt-8">
              <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Appointment Form</h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <label htmlFor="hospitalId" className="block text-sm font-medium text-gray-700 mb-1">
                    Select Hospital (Admin Username)
                  </label>
                  <select
                    id="hospitalId"
                    name="hospitalId"
                    value={formData.hospitalId}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a hospital</option>
                    {hospitals.map(hospital => (
                      <option key={hospital._id} value={hospital._id}>
                        {hospital.username}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col">
                  <label htmlFor="preferredSlot" className="block text-sm font-medium text-gray-700 mb-1">
                    Which slot do you prefer?
                  </label>
                  <select
                    id="preferredSlot"
                    name="preferredSlot"
                    value={formData.preferredSlot}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a time slot</option>
                    {timeSlots.map((slot, index) => (
                      <option key={index} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>

                {Object.keys(formData).map((key) =>
                  key !== "hospitalId" && key !== "hospitalName" && key !== "preferredSlot" && (
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
                )}

                <button
                  type="submit"
                  className="col-span-1 md:col-span-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md"
                >
                  Submit
                </button>
              </form>
            </div>

            <div className="w-full lg:w-7/12 md:w-6/12 sm:w-full mb-5 app-image flex items-center justify-center">
              <div className="img" ref={container}></div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default OpdForm;