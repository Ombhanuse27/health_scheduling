import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./HospitalDetails.css";
import Links from "../Navbar/NavbarLink";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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
  faAward
} from "@fortawesome/free-solid-svg-icons";
import OurDoctors from "../Doctor/ourDoctors";
import { getHospitalsData } from "../../api/api.js";
import doctorone from "../../images/doctor-6.jpg";

const HospitalDetails = () => {
  const { hospitalId } = useParams();
  const [hospital, setHospital] = useState(null);

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
    </div>
  );
};

export default HospitalDetails;

