import React from 'react';
import { Link } from 'react-router-dom';
import './HospitalCard.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt, faPhoneAlt, faHospital, faHeart, faClock ,faStar, faStarHalfAlt } from '@fortawesome/free-solid-svg-icons';


const HospitalCard = ({ hospital_img, hospital_name, hospital_location, hospital_phone_number, hospital_speciality }) => {
  console.log("HospitalCard ca:", {
    hospital_img,
    hospital_name,
    hospital_location,
    hospital_phone_number,
    hospital_speciality
  });
  return (
    
  
<div className="hospital-container1">

  <Link to={`/hospital/hospital-details`} className="hospital-link">
    <div className='hospital-card1'>
      <img id='hospital-card-img1' src='https://media.istockphoto.com/id/1524913019/vector/hospital-building-vector-illustration-in-flat-style-design.jpg?s=612x612&w=0&k=20&c=WVl257GwZBvckU_e5SNu0CCG3gL9EbCMZPwINLcxdj4=' alt={hospital_name} />
      <div className="hospital-info1">
        <h3 id='hospital_name1'>
          <FontAwesomeIcon icon={faHospital} style={{ color: '#3498DB' }} /> {hospital_name}
        </h3>
        <p id='location1'>
          <FontAwesomeIcon icon={faMapMarkerAlt} style={{ color: '#E63946' }} /> {hospital_location}
        </p>
        <p id='ph_number1'>
          <FontAwesomeIcon icon={faPhoneAlt} style={{ color: '#2ECC71' }} /> {hospital_phone_number}
        </p>
        <p id='rating1'>
          <FontAwesomeIcon icon={faStar} style={{ color: '#F1C40F' }} />
          <FontAwesomeIcon icon={faStar} style={{ color: '#F1C40F' }} />
          <FontAwesomeIcon icon={faStar} style={{ color: '#F1C40F' }} />
          <FontAwesomeIcon icon={faStar} style={{ color: '#F1C40F' }} />
          <FontAwesomeIcon icon={faStarHalfAlt} style={{ color: '#F1C40F' }} />  4.5
        </p>
        <p id='timing1'>
          <FontAwesomeIcon icon={faClock} style={{ color: '#34495E' }} /> 9.00 AM to 5.00 PM
        </p>
      </div>
    </div>
  </Link>
</div>

  );
}

export default HospitalCard;
