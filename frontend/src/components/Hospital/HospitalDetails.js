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
} from "@fortawesome/free-solid-svg-icons";
import MegaDoctors from "../Doctor/MegaDoctors";
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
          setHospital({
            hospitalImage: selectedHospital.hospitalImage || doctorone,
            hospitalName: selectedHospital.hospitalName || "Unknown Hospital",
            timing: selectedHospital.timing || "9:00 AM - 5:00 PM",
            address: selectedHospital.address || "Address not available",
            contactNumber: selectedHospital.contactNumber || "Not available",
            rating: selectedHospital.rating || "4.5",
          });
        }
      } catch (error) {
        console.error("Error fetching hospital details:", error);
      }
    };

    fetchHospitalDetails();
  }, [hospitalId]);

  if (!hospital) {
    return <p>Loading hospital details...</p>;
  }

  return (
    <div className="hospital-container2">
      <Links />
      <div className="hospital-card2">
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
            <p id="location2" style={{ display: "flex" }}>
              <FontAwesomeIcon icon={faMapMarkerAlt} style={{ color: "#E63946", fontSize: "15px", padding: "5px", marginRight: "5px" }} /> {hospital.address}
            </p>
            <p id="ph_number2" style={{ display: "flex" }}>
              <FontAwesomeIcon icon={faPhoneAlt} style={{ color: "#2ECC71", fontSize: "15px", padding: "5px", marginRight: "5px" }} /> {hospital.contactNumber}
            </p>
          </div>

         
        </div>

        <p id="rating2">
          {[...Array(4)].map((_, i) => (
            <FontAwesomeIcon key={i} icon={faStar} style={{ color: "#F1C40F" }} />
          ))}
          <FontAwesomeIcon icon={faStarHalfAlt} style={{ color: "#F1C40F" }} /> {hospital.rating}
        </p>
      </div>

      <MegaDoctors />
    </div>
  );
};

export default HospitalDetails;