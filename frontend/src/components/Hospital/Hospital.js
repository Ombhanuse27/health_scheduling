import React from 'react';
import Links from '../Navbar/NavbarLink.js';
import HospitalCard from './HospitalCard.js';
import doctorone from '../../images/doctor-6.jpg';
import "./Hospital.css"
// import HospitalHeading from './HospitalHeading.jsx';
import Footer from '../Footer/Footer.js';

const HospitalList = [
    { hospital_img: doctorone, hospital_name: "City Hospital", hospital_location: "Kolhapur", hospital_phone_number: "12324211", hospital_speciality: "Dentist" },
    { hospital_img: doctorone, hospital_name: "Metro Hospital", hospital_location: "Pune", hospital_phone_number: "98765432", hospital_speciality: "Cardiology" },
    { hospital_img: doctorone, hospital_name: "Sunrise Hospital", hospital_location: "Mumbai", hospital_phone_number: "45678910", hospital_speciality: "Neurology" }, { hospital_img: doctorone, hospital_name: "City Hospital", hospital_location: "Kolhapur", hospital_phone_number: "12324211", hospital_speciality: "Dentist" },
    { hospital_img: doctorone, hospital_name: "Metro Hospital", hospital_location: "Pune", hospital_phone_number: "98765432", hospital_speciality: "Cardiology" },
    { hospital_img: doctorone, hospital_name: "Sunrise Hospital", hospital_location: "Mumbai", hospital_phone_number: "45678910", hospital_speciality: "Neurology" }
];

const Hospital = () => {
  return (
    <div className='hospital-list-container'>
      <Links />
      {/* <HospitalHeading /> */}
    <div className='search-container'> 
    <div className="search">
        
        <input type="Text" placeholder='Search Hospital here . . . ' id="search-input" />
        <img id="search-icon"src="https://img.icons8.com/ios/452/search--v1.png" alt="search" />
        </div>
    </div>
      <div className="hospital-list">
        
         {HospitalList.map((hospital, index) => {
                    console.log(`Rendering Hospital ${index + 1}:`, hospital);
                    return <HospitalCard key={index} {...hospital} />;
                })}
      </div>
      <Footer />
    </div>
  );
}

export default Hospital;
