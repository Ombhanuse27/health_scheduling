import { useEffect, useState } from "react";
import { getOpdRecords } from "../api/api";

const AdminDashboard = ({ children }) => {
  const [opdRecords, setOpdRecords] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]); // Default empty
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const { data } = await getOpdRecords(token);
        setOpdRecords(data);
      } catch (error) {
        alert("Error fetching OPD records");
      }
    };
    fetchRecords();
  }, []);

  // Extract unique dates
  const uniqueDates = [...new Set(opdRecords.map((record) => record.appointmentDate))];

  // Filter records by selected date
  const filteredRecords = selectedDate
    ? opdRecords.filter((record) => record.appointmentDate === selectedDate)
    : opdRecords;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Admin Dashboard - OPD Records</h2>

      {/* Date Selection Dropdown */}
      <div className="mb-4">
        <label className="text-lg font-semibold mr-2">Select Date:</label>
        <select
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-4 py-2 border rounded bg-gray-100"
        >
          <option value="">All Dates</option>
          {uniqueDates.map((date) => (
            <option key={date} value={date}>
              {date}
            </option>
          ))}
        </select>
      </div>

      {/* OPD Records Table */}
      <table className="w-full border-collapse border">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Full Name</th>
            <th className="border p-2">Age</th>
            <th className="border p-2">Symptoms</th>
            <th className="border p-2">Appointment Number</th>
            <th className="border p-2">Appointment Date</th>
            <th className="border p-2">Appointment Time</th>
          </tr>
        </thead>
        <tbody>
          {filteredRecords.length > 0 ? (
            filteredRecords.map((record, index) => (
              <tr key={index} className="border">
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
  );
};

export default AdminDashboard;
