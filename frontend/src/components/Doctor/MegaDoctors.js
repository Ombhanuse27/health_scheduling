import { Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import doctorone from '../../images/doctor-6.jpg';
import doctortwo from '../../images/doctor-3.jpg';
import doctorthree from '../../images/doctor-1.jpg';
import doctorfour from '../../images/doctor-4.jpg';
import doctorfive from '../../images/doctor-2.jpg';
import doctorsix from '../../images/doctor-5.jpg';
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
    <div className="flex flex-1">
      <div className="p-2 md:px-20 py-10 bg-blue-200 flex flex-col gap-2 flex-1 w-full h-full">
        {loading ? (
          <>
            <input className="h-10 text-sm w-60 bg-gray-100 dark:bg-neutral-800 animate-pulse ml-auto" />
            <div className="flex gap-8 md:mt-10 flex-wrap justify-center items-center h-full">
              {[...new Array(6)].map((_, i) => (
                <div
                  key={"first-array" + i}
                  className="h-80 w-64 rounded-lg flex flex-col gap-4 justify-center items-center bg-white"
                >
                  <img className="h-40 w-[90%] rounded px-4 bg-gray-300 dark:bg-neutral-600 animate-pulse" />
                  <p className="h-8 w-[80%] rounded px-4 bg-gray-300 dark:bg-neutral-600 animate-pulse"></p>
                  <p className="h-8 w-[50%] rounded px-4 bg-gray-300 dark:bg-neutral-600 animate-pulse"></p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="w-full p-6 md:px-20 py-10 flex flex-col gap-4 flex-1 h-full">
            <h2 className="text-5xl font-extrabold mb-6 text-red-500 text-center uppercase tracking-wide">
              Our  Doctors
            </h2>

            <input
              className="h-12 w-80 rounded-lg bg-white text-gray-700 px-4 ml-auto border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow shadow-md hover:shadow-lg"
              placeholder="Search doctors..."
            />

            <div className="flex w-full flex-wrap justify-center gap-8">
              {/* Doctor 1 */}
              <div className="w-full sm:w-[calc(50%-20px)] lg:w-[calc(33.333%-20px)] xl:w-[calc(25%-20px)] mb-5">
                <div className="bg-white rounded-xl border border-gray-200 shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all duration-300 text-center  p-4 w-80">
                  <div className="relative">
                    <img 
                      src={doctorone} 
                      alt="Dr. Pruthvi Sawant" 
                      className="w-full h-64 rounded-xl object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 rounded-b-xl">
                      <h4 className="text-xl font-bold text-white">Dr. John David</h4>
                      <span className="block text-white/80">Cardiologist</span>
                    </div>
                  </div>
                  <div className="px-2 py-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Experience</span>
                      <span className="font-medium">15 Years</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Qualification</span>
                      <span className="font-medium">MD, PhD</span>
                    </div>
                    <div className="mt-3">
                      <div className="text-sm font-medium text-gray-700 mb-1">Appointments</div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-600 h-2.5 rounded-full" 
                          style={{ width: '70%' }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs mt-1">
                        <span className="text-blue-600 font-bold">11</span>
                        <span className="text-gray-500">/ 50 slots</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Doctor 2 */}
              <div className="w-full sm:w-[calc(50%-20px)] lg:w-[calc(33.333%-20px)] xl:w-[calc(25%-20px)] mb-5">
                <div className="bg-white rounded-xl border border-gray-200 shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all duration-300 text-center  p-4 w-80">
                  <div className="relative">
                    <img 
                      src={doctortwo} 
                      alt="Dr. Marcel Koller" 
                      className="w-full h-64 rounded-xl object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 rounded-b-xl">
                      <h4 className="text-xl font-bold text-white">Dr. Sarah Smith</h4>
                      <span className="block text-white/80">Neurologist</span>
                    </div>
                  </div>
                  <div className="px-2 py-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Experience</span>
                      <span className="font-medium">12 Years</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Qualification</span>
                      <span className="font-medium">MD, DM</span>
                    </div>
                    <div className="mt-3">
                      <div className="text-sm font-medium text-gray-700 mb-1">Appointments</div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-teal-600 h-2.5 rounded-full" 
                          style={{ width: '90%' }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs mt-1">
                        <span className="text-green-600 font-bold">45</span>
                        <span className="text-gray-500">/ 50 slots</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Doctor 3 */}
              <div className="w-full sm:w-[calc(50%-20px)] lg:w-[calc(33.333%-20px)] xl:w-[calc(25%-20px)] mb-5">
                <div className="bg-white rounded-xl border border-gray-200 shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all duration-300 text-center  p-4 w-80">
                  <div className="relative">
                    <img 
                      src={doctorthree} 
                      alt="Dr. Yara Benjamin" 
                      className="w-full h-64 rounded-xl object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 rounded-b-xl">
                      <h4 className="text-xl font-bold text-white">Dr. Michael Johnson</h4>
                      <span className="block text-white/80">Pediatrician</span>
                    </div>
                  </div>
                  <div className="px-2 py-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Experience</span>
                      <span className="font-medium">8 Years</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Qualification</span>
                      <span className="font-medium">MD, DCH</span>
                    </div>
                    <div className="mt-3">
                      <div className="text-sm font-medium text-gray-700 mb-1">Appointments</div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-gradient-to-r from-yellow-500 to-orange-600 h-2.5 rounded-full" 
                          style={{ width: '50%' }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs mt-1">
                        <span className="text-yellow-600 font-bold">25</span>
                        <span className="text-gray-500">/ 50 slots</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Doctor 4 */}
              <div className="w-full sm:w-[calc(50%-20px)] lg:w-[calc(33.333%-20px)] xl:w-[calc(25%-20px)] mb-5">
                <div className="bg-white rounded-xl border border-gray-200 shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all duration-300 text-center  p-4 w-80">
                  <div className="relative">
                    <img 
                      src={doctorsix} 
                      alt="Dr. Marcel Koller" 
                      className="w-full h-64 rounded-xl object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 rounded-b-xl">
                      <h4 className="text-xl font-bold text-white">Dr. Emily Wilson</h4>
                      <span className="block text-white/80">Dermatologist</span>
                    </div>
                  </div>
                  <div className="px-2 py-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Experience</span>
                      <span className="font-medium">10 Years</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Qualification</span>
                      <span className="font-medium">MD, DVD</span>
                    </div>
                    <div className="mt-3">
                      <div className="text-sm font-medium text-gray-700 mb-1">Appointments</div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-gradient-to-r from-pink-500 to-rose-600 h-2.5 rounded-full" 
                          style={{ width: '30%' }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs mt-1">
                        <span className="text-pink-600 font-bold">15</span>
                        <span className="text-gray-500">/ 50 slots</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Doctor 5 */}
              <div className="w-full sm:w-[calc(50%-20px)] lg:w-[calc(33.333%-20px)] xl:w-[calc(25%-20px)] mb-5">
                <div className="bg-white rounded-xl border border-gray-200 shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all duration-300 text-center  p-4 w-80">
                  <div className="relative">
                    <img 
                      src={doctorfive} 
                      alt="Dr. Enas Benjamin" 
                      className="w-full h-64 rounded-xl object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 rounded-b-xl">
                      <h4 className="text-xl font-bold text-white">Dr. Robert Chen</h4>
                      <span className="block text-white/80">Orthopedic</span>
                    </div>
                  </div>
                  <div className="px-2 py-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Experience</span>
                      <span className="font-medium">18 Years</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Qualification</span>
                      <span className="font-medium">MS, MCh</span>
                    </div>
                    <div className="mt-3">
                      <div className="text-sm font-medium text-gray-700 mb-1">Appointments</div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-indigo-600 h-2.5 rounded-full" 
                          style={{ width: '80%' }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs mt-1">
                        <span className="text-purple-600 font-bold">40</span>
                        <span className="text-gray-500">/ 50 slots</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Doctor 6 */}
              <div className="w-full sm:w-[calc(50%-20px)] lg:w-[calc(33.333%-20px)] xl:w-[calc(25%-20px)] mb-5">
                <div className="bg-white rounded-xl border border-gray-200 shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all duration-300 text-center p-4 w-80">
                  <div className="relative">
                    <img 
                      src={doctorfour} 
                      alt="Dr. John David" 
                      className="w-full h-64 rounded-xl object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 rounded-b-xl">
                      <h4 className="text-xl font-bold text-white">Dr. Lisa Ray</h4>
                      <span className="block text-white/80">Gynecologist</span>
                    </div>
                  </div>
                  <div className="px-2 py-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Experience</span>
                      <span className="font-medium">14 Years</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Qualification</span>
                      <span className="font-medium">MD, DGO</span>
                    </div>
                    <div className="mt-3">
                      <div className="text-sm font-medium text-gray-700 mb-1">Appointments</div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-gradient-to-r from-teal-500 to-emerald-600 h-2.5 rounded-full" 
                          style={{ width: '60%' }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs mt-1">
                        <span className="text-teal-600 font-bold">30</span>
                        <span className="text-gray-500">/ 50 slots</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MegaDoctors;