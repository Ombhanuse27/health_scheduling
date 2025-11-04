
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
      const duplicateCheck = await checkDuplicate(formData.fullName,formData.hospitalId);
      return duplicateCheck.exists;
    } catch (error) {
      console.error("Error checking duplicates:", error);
      return false;
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();

    const confirmBooking = window.confirm("Do you want to book an appointment?");
    if (!confirmBooking) return;


  
    // Check for duplicate before proceeding
    const isDuplicate = await checkIfDuplicateExists();
    if (isDuplicate) {
      alert("This Full Name already exist. Please use different name.");
      return;
    }
  

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    if (currentMinutes < HOSPITAL_OPEN) {
      alert("Appointments start at 9:00 AM.");
      return;
    } else if (currentMinutes > HOSPITAL_CLOSE) {
      alert("Appointments are closed for today.");
      return;
    }

    const slot = formData.preferredSlot;
    if (slot) {
      const slotEndTime = slot.split(" - ")[1]; // e.g., "12:00 PM"
      const [endHour, endMinutePart] = slotEndTime.split(":");
      const [minuteStr, period] = endMinutePart.split(" ");
      let hour = parseInt(endHour);
      let minute = parseInt(minuteStr);

      if (period === "PM" && hour !== 12) hour += 12;
      if (period === "AM" && hour === 12) hour = 0;

      const slotEndMinutes = hour * 60 + minute;

      if (currentMinutes > slotEndMinutes) {
        alert("The selected time slot has already passed. Please choose a valid slot.");
        return;
      }
    }



    try {
  const response = await submitOpdForm(formData.hospitalId, formData);

  alert(response.message || "OPD Form submitted successfully");
} catch (error) {
  alert(error?.response?.data?.message || "Error submitting OPD Form");
  console.error("Submit error:", error);
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
  <div className="w-full bg-gradient-to-b from-blue-100 to-blue-200 min-h-screen">
    <NavbarLink />
    <div className="appointment bg-blue-100 rounded-[30px] p-[80px_40px_40px_40px] mx-[20px] relative overflow-hidden mt-36 shadow-lg">

      <div className="container mx-auto">
        <div className="flex flex-wrap bg-white rounded-3xl shadow-xl my-[30px] overflow-hidden">
          <div className="w-full lg:w-6/12 p-8">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold text-center text-blue-700 mb-10">
                🩺 Appointment Form
              </h2>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <label htmlFor="hospitalId" className="block text-sm font-medium text-gray-700 mb-2">
                    Select Hospital (Admin Username)
                  </label>
                  <select
                    id="hospitalId"
                    name="hospitalId"
                    value={formData.hospitalId}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                  <label htmlFor="preferredSlot" className="block text-sm font-medium text-gray-700 mb-2">
                    Which slot do you prefer?
                  </label>
                  <select
                    id="preferredSlot"
                    name="preferredSlot"
                    value={formData.preferredSlot}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                      <label htmlFor={key} className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </label>
                      <input
                        type={key === "email" ? "email" : key === "age" ? "number" : "text"}
                        id={key}
                        name={key}
                        value={formData[key]}
                        onChange={handleChange}
                        placeholder={`Enter ${key.replace(/([A-Z])/g, " $1").trim()}`}
className="border border-solid border-gray-400 border-[2px] w-full px-4 py-3  rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"

                        required
                      />
                    </div>
                  )
                )}

                <button
                  type="submit"
                  className="col-span-1 md:col-span-2 bg-blue-600 hover:bg-blue-700 transition duration-200 text-white font-semibold py-3 px-6 rounded-lg shadow-md mt-2"
                >
                  Submit
                </button>
              </form>
            </div>
          </div>

          <div className="w-full lg:w-6/12 bg-blue-50 flex items-center justify-center p-8">
            <div className="img max-w-md w-full" ref={container}></div>
          </div>
        </div>
      </div>
    </div>
    <Footer />
  </div>
);

};

export default OpdForm;