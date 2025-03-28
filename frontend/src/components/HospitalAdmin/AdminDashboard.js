import React, { useState, useEffect } from "react";
import { getOpdRecords } from "../../api/api"; // Check and ensure the correct API path

const AdminDashboard = ({children}) => {
  const [opdRecords, setOpdRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]); 
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const { data } = await getOpdRecords(token);
        setOpdRecords(data);
        setLoading(false);
      } catch (error) {
        alert("Error fetching OPD records");
      }

      try {
        const response = await getOpdRecords(token);

        
        if (response && response.data && Array.isArray(response.data)) {
          setOpdRecords(response.data);
        } else {
          console.error("Invalid API response:", response);

        }
      } catch (error) {
        console.error("API Error:", error);
   
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, [token]);

  const uniqueDates = [...new Set(opdRecords.map((record) => record.appointmentDate))];


  const filteredRecords = selectedDate
    ? opdRecords.filter((record) => record.appointmentDate === selectedDate)
    : opdRecords;

  return (
    <div className="flex flex-1">
      <div className="p-2 md:px-20 py-10 border border-neutral-200 dark:border-neutral-700 bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 dark:bg-neutral-900 flex flex-col gap-2 flex-1 w-full h-full">
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
         
            <h2 className="text-5xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-500 text-center uppercase tracking-wide">
              Appointment List
            </h2>

           
            <input
              className="h-12 w-80 rounded-lg  bg-white text-gray-700 px-4 ml-auto border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-shadow shadow-md hover:shadow-lg"
              placeholder="Search records..."
            />
              <div className="mb-4">
       
        <label className="text-lg font-semibold mr-2">Select Date:</label>
        <select
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-4 py-2 text-lg text-black border rounded bg-gray-400"
        >
          <option className="text-black" value="">All Dates</option>
          {uniqueDates.map((date) => (
            <option  key={date} value={date}>
              {date}
            </option>
          ))}
        </select>
      </div>
          
          
            <table className="w-full border-collapse bg-white rounded-lg overflow-hidden shadow-lg mt-6">
              <thead>
                <tr className="bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 text-lg">
                  <th className="p-4 text-left">Sr.No</th>
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
              <tr key={index} className="border text-black  ">
                 <td className="border p-2">{record.fullName}</td>
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
