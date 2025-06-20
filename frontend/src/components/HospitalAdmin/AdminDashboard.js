import React, { useState, useEffect } from "react";
import { getOpdRecords, getDoctorsData } from "../../api/api"; // Add API path for doctors data

const AdminDashboard = ({ children }) => {
  const [opdRecords, setOpdRecords] = useState([]);
  const [doctorsData, setDoctorsData] = useState([]); // New state for doctors data
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchRecordsAndDoctors = async () => {
      setLoading(true);

      try {
        // Fetch OPD records
        const { data: opdData } = await getOpdRecords(token);
        setOpdRecords(opdData);

        // Fetch Doctors data
        const { data: doctorsData } = await getDoctorsData(token); // Assuming the API call is implemented
        setDoctorsData(doctorsData);
      } catch (error) {
        alert("Error fetching data");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecordsAndDoctors();
  }, [token]);

  const uniqueDates = [...new Set(opdRecords.map((record) => record.appointmentDate))];

  const parseTimeToDate = (timeStr) => {
    return new Date(`2000-01-01T${new Date(`2000/01/01 ${timeStr}`).toTimeString().slice(0, 8)}`);
  };

  const filteredRecords = selectedDate
    ? opdRecords
        .filter((record) => record.appointmentDate === selectedDate)
        .sort((a, b) => parseTimeToDate(a.appointmentTime) - parseTimeToDate(b.appointmentTime))
    : opdRecords.sort((a, b) => parseTimeToDate(a.appointmentTime) - parseTimeToDate(b.appointmentTime));

  return (
    <div className="flex flex-1">
      <div className="p-2 md:px-20 py-10 border-neutral-200 dark:border-neutral-700 bg-blue-200 flex flex-col gap-2 flex-1 w-full h-full">
        {loading ? (
          <>
            <input className="h-10 w-60 bg-gray-100 dark:bg-neutral-800 animate-pulse ml-auto" />
            <div className="flex gap-2 md:mt-10">
              {[...new Array(7)].map((_, i) => (
                <div
                  key={"first-array" + i}
                  className="h-20 w-full rounded-lg bg-gray-100 dark:bg-neutral-800 animate-pulse"
                ></div>
              ))}
            </div>
            <div className="flex gap-2 flex-1 min-h-[100px]">
              <div className="h-20 w-full rounded-lg bg-gray-100 dark:bg-neutral-800 animate-pulse"></div>
            </div>
          </>
        ) : (
          <div className="p-6 md:px-20 py-10 flex flex-col gap-4 flex-1 w-full h-full">
            <h2 className="text-5xl font-extrabold mb-6 text-red-500 text-center uppercase tracking-wide">
              Appointment List
            </h2>

            <input
              className="h-12 w-80 rounded-lg bg-white text-gray-700 px-4 ml-auto border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-shadow shadow-md hover:shadow-lg"
              placeholder="Search records..."
            />
            <div className="mb-4">
              <label className="text-lg text-black font-semibold mr-2">Select Date:</label>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 text-lg text-black border rounded bg-gray-400"
              >
                <option className="text-black" value="">
                  All Dates
                </option>
                {uniqueDates.map((date) => (
                  <option key={date} value={date}>
                    {date}
                  </option>
                ))}
              </select>
            </div>

            <h3 className="text-3xl font-semibold mt-6">Doctors List</h3>
            <ul>
              {doctorsData.length > 0 ? (
                doctorsData.map((doctor, index) => (
                  <li key={index} className="mb-2">
                    <p>{doctor.name}</p>
                    <p>{doctor.specialization}</p>
                  </li>
                ))
              ) : (
                <p>No doctors found.</p>
              )}
            </ul>

            <table className="w-full border-collapse bg-white rounded-lg overflow-hidden shadow-lg mt-6">
              <thead>
                <tr className="bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 text-lg">
                  <th className="p-4 text-left">Full Name</th>
                  <th className="p-4 text-left">Age</th>
                  <th className="p-4 text-left">Symptoms</th>
                  <th className="p-4 text-left">Appointment Number</th>
                  <th className="p-4 text-left">Appointment Date</th>
                  <th className="p-4 text-left">Appointment Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((record, index) => (
                    <tr key={index} className="border text-black">
                      <td className="border p-2">{record.fullName}</td>
                      <td className="border p-2">{record.age}</td>
                      <td className="border p-2">{record.symptoms}</td>
                      <td className="border p-2">{record.appointmentNumber}</td>
                      <td className="border p-2">{record.appointmentDate}</td>
                      <td className="border p-2">{record.appointmentTime}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center p-4">
                      No records found for this date.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
