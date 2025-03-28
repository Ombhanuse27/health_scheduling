import React from 'react';
import './HospitalDetails.css';
import Links from '../Navbar/NavbarLink'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt, faPhoneAlt, faHospital, faClock, faStar, faStarHalfAlt, faAmbulance, faUserMd, faStethoscope, faProcedures, faCapsules } from '@fortawesome/free-solid-svg-icons';
import MegaDoctors from '../Doctor/MegaDoctors';


const HospitalDetails = () => {
  return (

    

    <div className='hospital-container2'>
  <Links />

      <div className='hospital-card2'>
        <img src="https://doctorlistingingestionpr.blob.core.windows.net/doctorprofilepic/1670829108248_HospitalProfileImage_Profile1.jpg" 
        id="hospital-card-img2" alt="hospital_name" />
        
        <div className="hospital-info2">
        
          <div className="hospital-header">
            <h3 id='hospital_name2'>
              <FontAwesomeIcon icon={faHospital} style={{ color: '#3498DB' }} /> hospital_name
            </h3>
            <p id='hospital-timing2'>
              <FontAwesomeIcon icon={faClock} style={{ color: '#34495E' }} /> 9.00 AM to 5.00 PM
            </p>
          </div>

  
          <div className="hospital-contact">
            <p id='location2' style={{display:'flex'}}>
              <FontAwesomeIcon icon={faMapMarkerAlt} style={{ color: '#E63946', fontSize:'15px' , borderRadius:'50%', border:'1px solid black', padding:'5px', marginRight:'5px' }} />   hospital_location
            </p>
            <p id='ph_number2' style={{display:'flex'}}>
              <FontAwesomeIcon icon={faPhoneAlt} style={{ color: '#2ECC71', 
                fontSize:'15px' , borderRadius:'50%', border:'1px solid black', padding:'5px', marginRight:'5px'
              }} />   hospital_phone_number
            </p>

         
        <div className="search-bar">
          <input type="text" placeholder='find doctor . . . ' id="search-input" />
          <img id="search-icon" src="https://img.icons8.com/ios/452/search--v1.png" alt="search" />
        </div>
     
          </div>

        </div>

        <p id='rating2'>
          <FontAwesomeIcon icon={faStar} style={{ color: '#F1C40F' }} />
          <FontAwesomeIcon icon={faStar} style={{ color: '#F1C40F' }} />
          <FontAwesomeIcon icon={faStar} style={{ color: '#F1C40F' }} />
          <FontAwesomeIcon icon={faStar} style={{ color: '#F1C40F' }} />
          <FontAwesomeIcon icon={faStarHalfAlt} style={{ color: '#F1C40F' }} />  4.5
        </p>
      </div>

      <MegaDoctors  />
      
     


      
    </div>
  );
}

export default HospitalDetails;
