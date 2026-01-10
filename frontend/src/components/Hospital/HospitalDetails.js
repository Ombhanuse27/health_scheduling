import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./HospitalDetails.css";
import Links from "../Navbar/NavbarLink";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { registerCallIntent } from "../../api/opdApi.js";
import {
  faMapMarkerAlt,
  faPhoneAlt,
  faHospital,
  faClock,
  faStar,
  faStarHalfAlt,
  faStethoscope,
  faBed,
  faMoneyBillWave,
  faCreditCard,
  faShieldAlt,
  faGlobe,
  faEnvelope,
  faInfoCircle,
  faAward,
  faRobot,
  faTimes

} from "@fortawesome/free-solid-svg-icons";
import OurDoctors from "../Doctor/ourDoctors";
import { getHospitalsData } from "../../api/hospitalApi.js";
import doctorone from "../../images/doctor-6.jpg";


const AI_AGENT_NUMBER = "+1 361-902-9634";

const HospitalDetails = () => {
  const { hospitalId } = useParams();
  const [hospital, setHospital] = useState(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiForm, setAiForm] = useState({ 
    fullName: "", 
    contactNumber: "", 
    age: "", 
    gender: "Male" 
  });
  const [aiStatus, setAiStatus] = useState("idle"); // idle, loading, success, error

  useEffect(() => {
    const fetchHospitalDetails = async () => {
      try {
        const data = await getHospitalsData();
        const selectedHospital = data.find((h) => String(h.hospitalId) === hospitalId);

        if (selectedHospital) {
          // Construct timing string safely
          const startTime = selectedHospital.hospitalStartTime || "9:00 AM";
          const endTime = selectedHospital.hospitalEndTime || "5:00 PM";

          setHospital({
            hospitalImage: selectedHospital.hospitalImage || doctorone,
            hospitalName: selectedHospital.hospitalName || "Unknown Hospital",
            timing: `${startTime} - ${endTime}`,
            address: selectedHospital.address || "Address not available",
            contactNumber: selectedHospital.contactNumber || "Not available",
            rating: selectedHospital.rating || "4.5",
            // New Fields mapped here
            aboutHospital: selectedHospital.aboutHospital,
            specialist: selectedHospital.Specialist,
            numberOfBeds: selectedHospital.numberOfBeds,
            opdFees: selectedHospital.opdFees,
            paymentMode: selectedHospital.paymentMode,
            facilities: selectedHospital.facilities,
            insuranceAccepted: selectedHospital.insuranceAccepted,
            accreditations: selectedHospital.accreditations,
            website: selectedHospital.website,
            email: selectedHospital.email,
            experience: selectedHospital.experience
          });
        }
      } catch (error) {
        console.error("Error fetching hospital details:", error);
      }
    };

    fetchHospitalDetails();
  }, [hospitalId]);

  // --- AI FORM HANDLER ---
  const handleAiRegister = async (e) => {
    e.preventDefault();
    setAiStatus("loading");
    try {
        // ✅ CALLING THE SIMPLIFIED API
        await registerCallIntent({
            fullName: aiForm.fullName,
            contactNumber: aiForm.contactNumber,
            age: aiForm.age,
            gender: aiForm.gender,
            hospitalId: hospitalId,
            hospitalName: hospital.hospitalName
        });
        setAiStatus("success");
    } catch (error) {
        console.error("AI Register Error:", error);
        setAiStatus("error");
    }
  };

  if (!hospital) {
    return (
        <div className="flex justify-center items-center h-screen">
            <div className="animate-spin rounded-full h-24 w-24 border-t-4 border-b-4 border-blue-500"></div>
        </div>
    );
  }

  return (
    <div className="hospital-container2 bg-gray-50 min-h-screen pb-10">
      <Links />
      
      {/* --- Main Header Card --- */}
      <div className="hospital-card2 mb-8">
        <img src={hospital.hospitalImage} id="hospital-card-img2" alt={hospital.hospitalName} />

        <div className="hospital-info2">
          <div className="hospital-header">
            <h3 id="hospital_name2">
              <FontAwesomeIcon icon={faHospital} style={{ color: "#3498DB" }} /> {hospital.hospitalName}
            </h3>
            <p id="hospital-timing2">
              <FontAwesomeIcon icon={faClock} style={{ color: "#34495E" }} /> {hospital.timing}
            </p>
          </div>

          <div className="hospital-contact">
            {/* Fixed Google Maps Link */}
            <a 
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hospital.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              id="location2" 
              className="interactive-link"
            >
              <FontAwesomeIcon icon={faMapMarkerAlt} style={{ color: "#E63946", fontSize: "15px", padding: "5px", marginRight: "5px" }} /> {hospital.address}
            </a>
            
            <a 
              href={`tel:${hospital.contactNumber}`}
              id="ph_number2"
              className="interactive-link"
            >
              <FontAwesomeIcon icon={faPhoneAlt} style={{ color: "#2ECC71", fontSize: "15px", padding: "5px", marginRight: "5px" }} /> {hospital.contactNumber}
            </a>
          </div>

          <button 
            onClick={() => setShowAiModal(true)}
            className="mt-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faRobot} /> Book via AI Agent
          </button>
        </div>

        <p id="rating2">
          {[...Array(4)].map((_, i) => (
            <FontAwesomeIcon key={i} icon={faStar} style={{ color: "#F1C40F" }} />
          ))}
          <FontAwesomeIcon icon={faStarHalfAlt} style={{ color: "#F1C40F" }} /> {hospital.rating}
        </p>
      </div>

      {/* --- NEW DETAIL SECTIONS --- */}
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        
        {/* Section 1: About & Facilities */}
        <div className="bg-white p-6 rounded-xl shadow-md col-span-1 md:col-span-2">
            <h4 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">
                <FontAwesomeIcon icon={faInfoCircle} className="mr-2 text-blue-500"/> About Us
            </h4>
            <p className="text-gray-600 mb-6 leading-relaxed">
                {hospital.aboutHospital || "No description available for this hospital."}
            </p>

            <h4 className="text-xl font-bold text-gray-800 mb-3">
                <FontAwesomeIcon icon={faStethoscope} className="mr-2 text-green-500"/> Facilities & Specialties
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {hospital.specialist && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                        <span className="font-semibold block text-blue-800">Specialist In:</span>
                        <span className="text-gray-700">{hospital.specialist}</span>
                    </div>
                )}
                {hospital.facilities && (
                    <div className="bg-green-50 p-3 rounded-lg">
                        <span className="font-semibold block text-green-800">Facilities:</span>
                        <span className="text-gray-700">{hospital.facilities}</span>
                    </div>
                )}
            </div>
        </div>

        {/* Section 2: Quick Info & Finances */}
        <div className="bg-white p-6 rounded-xl shadow-md h-fit">
            <h4 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Hospital Overview</h4>
            
            <ul className="space-y-4">
                {hospital.opdFees && (
                    <li className="flex items-center justify-between">
                        <span className="text-gray-600"><FontAwesomeIcon icon={faMoneyBillWave} className="mr-2 text-green-600"/> OPD Fee:</span>
                        <span className="font-bold text-gray-800">₹{hospital.opdFees}</span>
                    </li>
                )}
                {hospital.numberOfBeds && (
                    <li className="flex items-center justify-between">
                        <span className="text-gray-600"><FontAwesomeIcon icon={faBed} className="mr-2 text-blue-400"/> Beds:</span>
                        <span className="font-bold text-gray-800">{hospital.numberOfBeds}</span>
                    </li>
                )}
                {hospital.experience && (
                    <li className="flex items-center justify-between">
                        <span className="text-gray-600"><FontAwesomeIcon icon={faAward} className="mr-2 text-yellow-500"/> Experience:</span>
                        <span className="font-bold text-gray-800">{hospital.experience}</span>
                    </li>
                )}
                {hospital.paymentMode && (
                    <li className="flex flex-col">
                        <span className="text-gray-600 mb-1"><FontAwesomeIcon icon={faCreditCard} className="mr-2 text-purple-500"/> Payment Modes:</span>
                        <span className="text-sm text-gray-800 bg-gray-100 p-2 rounded">{hospital.paymentMode}</span>
                    </li>
                )}
                 {hospital.insuranceAccepted && (
                    <li className="flex flex-col">
                        <span className="text-gray-600 mb-1"><FontAwesomeIcon icon={faShieldAlt} className="mr-2 text-red-500"/> Insurance:</span>
                        <span className="text-sm text-gray-800 bg-gray-100 p-2 rounded">{hospital.insuranceAccepted}</span>
                    </li>
                )}
            </ul>

            <div className="mt-6 pt-4 border-t">
                 {hospital.website && (
                    <a href={hospital.website} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 hover:underline mb-2">
                        <FontAwesomeIcon icon={faGlobe} className="mr-2"/> Visit Website
                    </a>
                 )}
                 {hospital.email && (
                    <a href={`mailto:${hospital.email}`} className="flex items-center text-blue-600 hover:underline">
                        <FontAwesomeIcon icon={faEnvelope} className="mr-2"/> {hospital.email}
                    </a>
                 )}
            </div>
        </div>
      </div>
      
      <OurDoctors hospitalId={hospitalId} />
      {/* ✅ AI REGISTRATION MODAL */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
                
                <button 
                    onClick={() => { setShowAiModal(false); setAiStatus("idle"); }} 
                    className="absolute top-4 right-4 text-gray-400 hover:text-red-500"
                >
                    <FontAwesomeIcon icon={faTimes} size="lg" />
                </button>

                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <FontAwesomeIcon icon={faRobot} className="text-blue-600 text-2xl" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">Pre-Book AI Call</h3>
                    <p className="text-gray-500 text-sm">Register your details, then call to choose your slot.</p>
                </div>

                {aiStatus === "success" ? (
                    <div className="text-center animate-fade-in-up">
                        <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-4">
                            <strong>Access Granted!</strong><br/>
                            Our AI now recognizes you.
                        </div>
                        <a href={`tel:${AI_AGENT_NUMBER}`} className="block w-full bg-green-500 text-white py-3 rounded-lg font-bold text-lg hover:bg-green-600 transition shadow-md">
                            <FontAwesomeIcon icon={faPhoneAlt} className="mr-2" /> Call Now
                        </a>
                    </div>
                ) : (
                    <form onSubmit={handleAiRegister} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Full Name</label>
                            <input 
                                type="text" required
                                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={aiForm.fullName}
                                onChange={(e) => setAiForm({...aiForm, fullName: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Phone (Calling From)</label>
                            <input 
                                type="tel" required
                                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="e.g. 9876543210"
                                value={aiForm.contactNumber}
                                onChange={(e) => setAiForm({...aiForm, contactNumber: e.target.value})}
                            />
                        </div>
                        <div className="flex gap-4">
                            <div className="w-1/2">
                                <label className="block text-sm font-medium text-gray-700">Age</label>
                                <input 
                                    type="number" required
                                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={aiForm.age}
                                    onChange={(e) => setAiForm({...aiForm, age: e.target.value})}
                                />
                            </div>
                            <div className="w-1/2">
                                <label className="block text-sm font-medium text-gray-700">Gender</label>
                                <select 
                                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={aiForm.gender}
                                    onChange={(e) => setAiForm({...aiForm, gender: e.target.value})}
                                >
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={aiStatus === "loading"}
                            className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition flex justify-center items-center shadow-md"
                        >
                            {aiStatus === "loading" ? "Registering..." : "Grant Call Access"}
                        </button>
                        
                        {aiStatus === "error" && <p className="text-red-500 text-sm text-center">Registration failed. Please try again.</p>}
                    </form>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default HospitalDetails;

