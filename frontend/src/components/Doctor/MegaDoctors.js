import './MegaDoctors.css';
import { Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import doctorone from '../../images/doctor-6.jpg';
import doctortwo from '../../images/doctor-3.jpg';
import doctorthree from '../../images/doctor-1.jpg';
import doctorfour from '../../images/doctor-4.jpg';
import doctorfive from '../../images/doctor-2.jpg';
import doctorsix from '../../images/doctor-5.jpg';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInstagram, faLinkedin, faTwitter } from '@fortawesome/free-brands-svg-icons';
import imgone from '../../images/download (4).png';
import imgtwo from '../../images/download (13).png';
import imgthree from '../../images/download (10).png';
import { getOpdRecords } from "../../api/api";

function MegaDoctors() {
  const [opdRecords, setOpdRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const { data } = await getOpdRecords(token);
        setOpdRecords(data);
      } catch (error) {
        alert("Error fetching OPD records");
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, []);

  return (
    <>
      <div className="flex flex-1">
        <div className="p-2 md:px-20 py-10 border border-neutral-200 dark:border-neutral-700 bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 dark:bg-neutral-900 flex flex-col gap-2 flex-1 w-full h-full">
          {loading ? (
          <>

            <input className="h-10 text-sm  w-60 bg-gray-100 dark:bg-neutral-800 animate-pulse ml-auto" />
            <div className="flex gap-8 md:mt-10 flex-wrap justify-center items-center h-full">
              {[...new Array(6)].map((_, i) => (
                <div
                  key={"first-array" + i}
                  className="h-80 w-80 rounded-lg flex flex-col gap-4 justify-center items-center bg-white"
                >
                  <img className="h-40 w-[90%] rounded px-4 bg-gray-300 dark:bg-neutral-600 animate-pulse" />
                  <p className="h-8 w-[80%] rounded px-4 bg-gray-300 dark:bg-neutral-600 animate-pulse"></p>
                  <p className="h-8 w-[50%] rounded px-4 bg-gray-300 dark:bg-neutral-600 animate-pulse"></p>
                
                  <button className="h-8 w-[60%] rounded bg-gray-300 dark:bg-neutral-600 animate-pulse"></button>
                </div>
              ))}
            </div>


          </>
            ) : (
              <div className="mega-doctors p-6 md:px-20 py-10 flex flex-col gap-4 flex-1 w-full h-full">
                <h2 className="text-5xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-500 text-center uppercase tracking-wide">
              Our Valueable Doctors
            </h2>

           
            <input
              className="h-12 w-80 rounded-lg bg-white text-gray-700 px-4 ml-auto border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-shadow shadow-md hover:shadow-lg"
              placeholder="Search doctors..."
            />


              <div className="row">
                <div className="col-lg-4 col-md-6 col-sm-12 mb-5">
                  <div className="doctor-box">
                    <div className="image">
                      <img src={doctorone} alt="Dr. Pruthvi Sawant" />
                    </div>
                    <h4 className="doctor-name">Dr. John David</h4>
                    <span className="speciality">Cardiologist</span>
                    <div className="doctor-info">
                      <p className="experience"><strong>Experience:</strong> 15 Years</p>
                      <p className="qualification"><strong>Qualification:</strong> MD, PhD</p>
                    </div>
                    <Link to={`/hospital/hospital-details/Doctors/appointments`} className="bookedAppointments">
                      <button className="appointment-btn">See Appointment</button>
                    </Link>
                  </div>
                </div>

                <div className="col-lg-4 col-md-6 col-sm-12 mb-5">
                  <div className="doctor-box">
                    <div className="image">
                      <img src={doctortwo} alt="Dr. Marcel Koller" />
                    </div>
                    <h4 className="doctor-name">Dr. John David</h4>
                    <span className="speciality">Cardiologist</span>
                    <div className="doctor-info">
                      <p className="experience"><strong>Experience:</strong> 15 Years</p>
                      <p className="qualification"><strong>Qualification:</strong> MD, PhD</p>
                    </div>
                    <Link to={`/hospital/hospital-details/Doctors/appointments`} className="bookedAppointments">
                      <button className="appointment-btn">See Appointment</button>
                    </Link>
                  </div>
                </div>

                <div className="col-lg-4 col-md-6 col-sm-12 mb-5">
                  <div className="doctor-box">
                    <div className="image">
                      <img src={doctorthree} alt="Dr. Yara Benjamin" />
                    </div>
                    <h4 className="doctor-name">Dr. John David</h4>
                    <span className="speciality">Cardiologist</span>
                    <div className="doctor-info">
                      <p className="experience"><strong>Experience:</strong> 15 Years</p>
                      <p className="qualification"><strong>Qualification:</strong> MD, PhD</p>
                    </div>
                    <Link to={`/hospital/hospital-details/Doctors/appointments`} className="bookedAppointments">
                      <button className="appointment-btn">See Appointment</button>
                    </Link>
                  </div>
                </div>

                <div className="col-lg-4 col-md-6 col-sm-12 mb-5">
                  <div className="doctor-box">
                    <div className="image">
                      <img src={doctorsix} alt="Dr. Marcel Koller" />
                    </div>
                    <h4 className="doctor-name">Dr. John David</h4>
                    <span className="speciality">Cardiologist</span>
                    <div className="doctor-info">
                      <p className="experience"><strong>Experience:</strong> 15 Years</p>
                      <p className="qualification"><strong>Qualification:</strong> MD, PhD</p>
                    </div>
                    <Link to={`/hospital/hospital-details/Doctors/appointments`} className="bookedAppointments">
                      <button className="appointment-btn">See Appointment</button>
                    </Link>
                  </div>
                </div>

                <div className="col-lg-4 col-md-6 col-sm-12 mb-5">
                  <div className="doctor-box">
                    <div className="image">
                      <img src={doctorfive} alt="Dr. Enas Benjamin" />
                    </div>
                    <h4 className="doctor-name">Dr. John David</h4>
                    <span className="speciality">Cardiologist</span>
                    <div className="doctor-info">
                      <p className="experience"><strong>Experience:</strong> 15 Years</p>
                      <p className="qualification"><strong>Qualification:</strong> MD, PhD</p>
                    </div>
                    <Link to={`/hospital/hospital-details/Doctors/appointments`} className="bookedAppointments">
                      <button className="appointment-btn">See Appointment</button>
                    </Link>
                  </div>
                </div>

                <div className="col-lg-4 col-md-6 col-sm-12 mb-5">
                  <div className="doctor-box">
                    <div className="image">
                      <img src={doctorfour} alt="Dr. John David" />
                    </div>
                    <h4 className="doctor-name">Dr. John David</h4>
                    <span className="speciality">Cardiologist</span>
                    <div className="doctor-info">
                      <p className="experience"><strong>Experience:</strong> 15 Years</p>
                      <p className="qualification"><strong>Qualification:</strong> MD, PhD</p>
                    </div>
                    <Link to={`/hospital/hospital-details/Doctors/appointments`} className="bookedAppointments">
                      <button className="appointment-btn">See Appointment</button>
                   </Link>
              </div>
              </div>
            </div>
            </div>
           )} 
        </div>
      </div>
    </>
  );
}

export default MegaDoctors;