// src/components/Doctor/ourDoctors.js

import { Link } from 'react-router-dom';
import React, { useState, useEffect, useMemo } from 'react';
import doctorone from '../../images/doctor-6.jpg';
// import { getDoctorsData, getHospitalsData } from "../../api/api"; 
import { getDoctorsData } from "../../api/doctorApi";
import {getHospitalsData} from "../../api/hospitalApi";

function OurDoctors({ hospitalId }) {
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  
  // ✅ State for interactivity
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("fullName-asc");

  useEffect(() => {
    if (!hospitalId) {
      setLoading(false);
      return;
    }
    const fetchData = async () => {
      setLoading(true);
      try {
        const [doctorsData, hospitalsData] = await Promise.all([
          getDoctorsData(),
          getHospitalsData() 
        ]);
        const currentHospital = hospitalsData.find(h => String(h.hospitalId) === hospitalId);
        
        if (!currentHospital) {
          console.error("Hospital not found with ID:", hospitalId);
          setDoctors([]);
          return;
        }

        const hospitalNameToFilter = currentHospital.username;
        const filteredByHospital = doctorsData.filter(doc => 
          doc.hospital && doc.hospital.toLowerCase() === hospitalNameToFilter.toLowerCase()
        );
        setDoctors(filteredByHospital);
      } catch (error) {
        alert("Error fetching data");
        console.error(error);
      } finally {   
        setLoading(false);
      }
    };
    fetchData();
  }, [hospitalId]);

  // ✅ Memoized derivation of state for performance
  const filteredAndSortedDoctors = useMemo(() => {
    return doctors
      .filter((doc) => {
        const searchLower = searchTerm.toLowerCase();
        return (
          doc.fullName.toLowerCase().includes(searchLower) ||
          doc.specialization.toLowerCase().includes(searchLower)
        );
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "fullName-desc":
            return b.fullName.localeCompare(a.fullName);
          case "specialization-asc":
            return a.specialization.localeCompare(b.specialization);
          case "specialization-desc":
            return b.specialization.localeCompare(a.specialization);
          case "fullName-asc":
          default:
            return a.fullName.localeCompare(b.fullName);
        }
      });
  }, [doctors, searchTerm, sortBy]);

  return (
    <div className="flex flex-1">
      <div className="p-2 md:px-20 py-10 bg-blue-200 flex flex-col gap-2 flex-1 w-full h-full">
        {loading ? (
          <p>Loading doctors...</p>
        ) : (
          <div className="w-full p-6 md:px-20 py-10 flex flex-col gap-4 flex-1 h-full">
            <h2 className="text-5xl font-extrabold mb-6 text-red-500 text-center uppercase tracking-wide">
              Our Doctors
            </h2>
            
            {/* ✅ Interactive Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
              <input
                className="h-12 w-full sm:w-80 rounded-lg bg-white text-gray-700 px-4 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                placeholder="Search by name or specialization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select
                className="h-12 w-full sm:w-60 rounded-lg bg-white px-4 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="fullName-asc">Sort by Name (A-Z)</option>
                <option value="fullName-desc">Sort by Name (Z-A)</option>
                <option value="specialization-asc">Sort by Specialization (A-Z)</option>
                <option value="specialization-desc">Sort by Specialization (Z-A)</option>
              </select>
            </div>

            <div className="flex w-full flex-wrap justify-center gap-8">
              {/* ✅ Map over the new dynamic list */}
              {filteredAndSortedDoctors.length > 0 ? (
                filteredAndSortedDoctors.map((doc, index) => (
                  <div key={doc._id || index} className="w-full sm:w-[calc(50%-20px)] lg:w-[calc(33.333%-20px)] xl:w-[calc(25%-20px)]">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all duration-300 text-center">
                      <div className="relative">
                        <img src={doc.photo || doctorone} alt={doc.fullName} className="w-full h-64 rounded-t-xl object-cover"/>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 rounded-b-xl">
                          <h4 className="text-xl font-bold text-white">{doc.fullName}</h4>
                          <span className="block text-white/80">{doc.specialization}</span>
                        </div>
                      </div>
                      <div className="px-4 py-4 space-y-3">
                        <div className="flex justify-between text-sm"><span className="text-gray-500">Phone No:</span><span className="font-medium">{doc.phone}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-gray-500">Email:</span><span className="font-medium">{doc.email}</span></div>
                        <div className="mt-3">
                          <div className="text-sm font-medium text-gray-700 mb-1">Appointments</div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5"><div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2.5 rounded-full" style={{ width: `${(doc.assignedAppointments?.length || 0) * 10}%` }}></div></div>
                          <div className="flex justify-between text-xs mt-1"><span className="text-blue-600 font-bold">{doc.assignedAppointments?.length || 0}</span><span className="text-gray-500">/ 10 slots</span></div>
                        </div>
                      </div>
                      {/* ✅ Action Button */}
                      <div className="px-4 pb-4 pt-2 border-t mt-2">
                        <Link to="/opdForm" className="block w-full bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition text-center">
                          Book Appointment
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="col-span-full text-center text-gray-700 text-xl">No doctors found matching your criteria.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default OurDoctors;