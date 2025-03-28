import React, { useEffect, useState } from "react";
import Links from "../Navbar/NavbarLink.js";
import HospitalCard from "./HospitalCard.js";
import doctorone from "../../images/doctor-6.jpg";
import "./Hospital.css";
import Footer from "../Footer/Footer.js";
import { getHospitalsData } from "../../api/api.js";// Import API function
// Import API function

const Hospital = () => {
  const [HospitalList, setHospitalList] = useState([]);

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const data = await getHospitalsData(); // Fetch hospitals from API
        const formattedHospitals = data.map((hospital) => ({
          hospital_img: hospital.hospitalImage || "https://media.istockphoto.com/id/1524913019/vector/hospital-building-vector-illustration-in-flat-style-design.jpg?s=612x612&w=0&k=20&c=WVl257GwZBvckU_e5SNu0CCG3gL9EbCMZPwINLcxdj4=",
          hospital_name: hospital.hospitalName ||"Hospital Name",
          hospital_location: hospital.address || "Hospital Address",
          hospital_phone_number: hospital.contactNumber ||"8421456630",
          hospital_speciality: hospital.Specialist || "Specialist",

        }));

        setHospitalList(formattedHospitals);
      } catch (error) {
        console.error("Error fetching hospital data:", error);
      }
    };

    fetchHospitals();
  }, []);

  return (
    <div className="hospital-list-container">
      <Links />
      <div className="search-container">
        <div className="search">
          <input type="text" placeholder="Search Hospital here..." id="search-input" />
          <img id="search-icon" src="https://img.icons8.com/ios/452/search--v1.png" alt="search" />
        </div>
      </div>
      <div className="hospital-list">
        {HospitalList.map((hospital, index) => (
          <HospitalCard key={index} {...hospital} />
        ))}
      </div>
      <Footer />
    </div>
  );
};

export default Hospital;
