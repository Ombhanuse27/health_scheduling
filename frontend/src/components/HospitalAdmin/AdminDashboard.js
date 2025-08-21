import React, { useState, useEffect } from "react";
import { getOpdRecords, getDoctorsData } from "../../api/api"; // Add API path for doctors data

import { assignDoctors } from "../../api/api"; // Add API path for assigning doctors

const AdminDashboard = ({ children }) => {
  const [opdRecords, setOpdRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const token = localStorage.getItem("token");
  

  
console.log("Token:", token); // Debugging

  const assignDoctorsHandler = async (record) => {
  if (!record.assignedDoctorId) {
    alert("Please select a doctor before sending.");
    return;
  }

  const confirmed = window.confirm(
    `Are you sure you want to assign ${record.fullName}'s appointment to the selected doctor?`
  );
  if (!confirmed) return;

  try {
    await assignDoctors(record._id, record.assignedDoctorId, token);
    alert("Appointment successfully assigned to the doctor!");
  } catch (error) {
    alert("Failed to assign appointment.");
  }
};

  useEffect(() => {
  const fetchRecords = async () => {
    setLoading(true);
    try {
      const { data: opdData } = await getOpdRecords(token);
      console.log("Fetched OPD Data:", opdData); // Debugging
      setOpdRecords(Array.isArray(opdData) ? opdData : []);
      const doctorsData  = await getDoctorsData(token);
      console.log("Doctors fetched: ", doctorsData);
     
      setDoctors(doctorsData );
    } catch (error) {
      alert("Error fetching data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  fetchRecords();
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

          

            <table className="w-full border-collapse bg-white rounded-lg overflow-hidden shadow-lg mt-6">
              <thead>
                <tr className="bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 text-lg">
                  <th className="p-4 text-left">Full Name</th>
                  <th className="p-4 text-left">Age</th>
                  <th className="p-4 text-left">Symptoms</th>
                  <th className="p-4 text-left">Appointment Number</th>
                  <th className="p-4 text-left">Appointment Date</th>
                  <th className="p-4 text-left">Appointment Time</th>
                  <th className="p-4 text-left">Assign Doctor</th>

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

                      <td className="border p-2">
  <select
    className="px-2 py-1 rounded border text-black"
    value={record.assignedDoctorId || ""}
    onChange={(e) => {
      const selectedDoctorId = e.target.value;
      // Update assignedDoctorId in state for this record
      setOpdRecords((prev) =>
        prev.map((r) =>
          r._id === record._id ? { ...r, assignedDoctorId: selectedDoctorId } : r
        )
      );
    }}
  >
    <option value="" disabled>
      Select Doctor
    </option>
    {doctors.map((doc) => (
      <option key={doc._id} value={doc._id}>
        {doc.fullName}
      </option>
    ))}
  </select>

  <button
  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition"
  onClick={() => assignDoctorsHandler(record)}
  disabled={!record.assignedDoctorId}
>
  Send
</button>

</td>

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
