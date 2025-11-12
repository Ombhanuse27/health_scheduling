import React, { useState, useEffect } from "react";

import { Trash2 } from "lucide-react";


// ✅ Import getLoggedInHospital
import { getOpdRecords, getDoctorsData, assignDoctors, getLoggedInHospital ,deleteOpdRecord} from "../../api/api";

const AdminDashboard = ({ children }) => {
  const [opdRecords, setOpdRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]); // This will now hold the filtered list

  // ✅ Changed initial state to "" to show all records by default
  const [selectedDate, setSelectedDate] = useState("");
  const token = localStorage.getItem("token");
  
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

      // ✅ Find the full doctor object from the state
      const assignedDoctorObject = doctors.find(doc => doc._id === record.assignedDoctorId);

      // ✅ Update the local state immediately to reflect the assignment
      setOpdRecords(prevRecords =>
        prevRecords.map(r =>
          r._id === record._id
            ? { ...r, assignedDoctor: assignedDoctorObject } // Add the doctor object to the record
            : r
        )
      );

    } catch (error) {
      alert("Failed to assign appointment.");
    }
  };

  // ✅ Updated useEffect to fetch and filter doctors
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Step 1: Get the logged-in hospital's details to find its username
        const { data: hospitalData } = await getLoggedInHospital(token);
        if (!hospitalData || !hospitalData.username) {
          throw new Error("Could not determine the logged-in hospital.");
        }
        const hospitalUsername = hospitalData.username;

        // Step 2: Fetch OPD records and all doctors in parallel
        const [opdResponse, allDoctorsData] = await Promise.all([
          getOpdRecords(token),
          getDoctorsData(token)
        ]);
        
        const opdData = opdResponse.data;
        
        // Step 3: Filter the doctors list to match the logged-in hospital's username
        const filteredDoctors = allDoctorsData.filter(doc => doc.hospital === hospitalUsername);
        setDoctors(filteredDoctors); // Set the filtered list for the dropdown
        
        // ✅ CORRECTED LOGIC: Manually "populate" the assignedDoctor field for each OPD record.
        // This connects the doctor's ID from the appointment to the full doctor details.
        const populatedOpdRecords = opdData.map(record => {
          // Check if a doctor ID exists on the record
          if (record.assignedDoctor) { 
            // Find the full doctor object from the complete list of doctors
            const doctorDetails = allDoctorsData.find(doc => doc._id === record.assignedDoctor);
            // If the doctor is found, replace the ID with the full object
            if (doctorDetails) {
              return { ...record, assignedDoctor: doctorDetails };
            }
          }
          // If no doctor is assigned or found, return the record as is
          return record;
        });

        // Set the state with the populated records
        setOpdRecords(Array.isArray(populatedOpdRecords) ? populatedOpdRecords : []);

      } catch (error) {
        alert("Error fetching dashboard data");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchData();
    }
  }, [token]);


  const uniqueDates = [...new Set(opdRecords.map((record) => record.appointmentDate))];

  const parseTimeToDate = (timeStr) => {
    return new Date(`2000-01-01T${new Date(`2000/01/01 ${timeStr}`).toTimeString().slice(0, 8)}`);
  };

  // This logic now correctly shows all records by default because selectedDate is initially ""
  const filteredRecords = selectedDate
    ? opdRecords
        .filter((record) => record.appointmentDate === selectedDate)
        .sort((a, b) => parseTimeToDate(a.appointmentTime) - parseTimeToDate(b.appointmentTime))
    : opdRecords.sort((a, b) => parseTimeToDate(a.appointmentTime) - parseTimeToDate(b.appointmentTime));

  return (
    <div className="flex flex-1">
      {/* ✅ Improved base layout and background color */}
      <div className="p-4 md:p-10 bg-gray-100 dark:bg-gray-900 flex flex-col gap-4 flex-1 w-full min-h-screen">
        {loading ? (
          // ✅ Improved loading state
          <div className="flex flex-1 justify-center items-center">
            <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-red-500"></div>
          </div>
        ) : (
          <div className="w-full max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-6 text-red-500 text-center uppercase tracking-wide">
              Appointment List
            </h2>

            {/* ✅ Improved controls layout for responsiveness */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 px-4 py-3 bg-white dark:bg-gray-800 rounded-lg shadow">
              <input
                className="h-12 w-full md:w-80 rounded-lg bg-white dark:bg-gray-700 dark:text-gray-200 text-gray-700 px-4 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-shadow"
                placeholder="Search records..."
              />
              <div className="flex items-center gap-2 w-full md:w-auto">
                <label className="text-lg text-black dark:text-gray-200 font-semibold mr-2 shrink-0">
                  Select Date:
                </label>
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-4 py-2 text-lg text-black dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 w-full md:w-auto"
                >
                  <option value="">All Dates</option>
                  {uniqueDates.map((date) => (
                    <option key={date} value={date}>
                      {date}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* ✅ Responsive Table Container */}
            <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden mt-6">
              <table className="w-full border-collapse">
                {/* ✅ Table head is hidden on mobile */}
                <thead className="hidden md:table-header-group">
                  <tr className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-left text-sm uppercase">
                    <th className="p-4 font-semibold">Full Name</th>
                    <th className="p-4 font-semibold">Age</th>
                    <th className="p-4 font-semibold">Symptoms</th>
                    <th className="p-4 font-semibold">Appt. Number</th>
                    <th className="p-4 font-semibold">Appt. Date</th>
                    <th className="p-4 font-semibold">Appt. Time</th>
                    <th className="p-4 font-semibold">Assign Doctor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 md:divide-none">
                  {filteredRecords.length > 0 ? (
                    filteredRecords.map((record) => (
                      <AppointmentRow
                        key={record._id}
                        record={record}
                        doctors={doctors}
                        assignDoctorsHandler={assignDoctorsHandler}
                        setOpdRecords={setOpdRecords}
                      />
                    ))
                  ) : (
                    <tr>
                      {/* ✅ Adjusted colSpan for the stacking layout */}
                      <td
                        colSpan="7"
                        className="text-center p-8 text-gray-500 dark:text-gray-400"
                      >
                        No records found for this date.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

// ✅ Extracted Row into its own component for clarity
const AppointmentRow = ({
  record,
  doctors,
  assignDoctorsHandler,
  setOpdRecords,
}) => {
  const   token = localStorage.getItem("token");
  const isAssigned = record.assignedDoctor && record.assignedDoctor.fullName;

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${record.fullName}'s appointment?`
    );
    if (!confirmed) return;

    try {
      await deleteOpdRecord(record._id, token);
      alert("Appointment deleted successfully!");
      setOpdRecords((prev) => prev.filter((r) => r._id !== record._id));
    } catch (error) {
      console.error("Error deleting record:", error);
      alert("Failed to delete the appointment.");
    }
  };

  const ResponsiveCell = ({ label, children, className = "" }) => (
    <td
      data-label={label}
      className={`
        block md:table-cell p-4 md:p-3
        text-gray-900 dark:text-gray-200 
        text-right md:text-left
        relative md:static
        border-b border-gray-200 dark:border-gray-700 md:border-none
        before:content-[attr(data-label)]
        before:absolute before:left-4 before:text-left
        before:font-semibold before:text-gray-600 dark:before:text-gray-400
        md:before:content-none
        ${className}
      `}
    >
      {children}
    </td>
  );

  return (
    <tr className="block md:table-row mb-4 md:mb-0 bg-white dark:bg-gray-800 md:hover:bg-gray-50 dark:md:hover:bg-gray-700/50 shadow-md md:shadow-none rounded-lg md:rounded-none overflow-hidden md:overflow-visible">
      <ResponsiveCell label="Full Name">{record.fullName}</ResponsiveCell>
      <ResponsiveCell label="Age">{record.age}</ResponsiveCell>
      <ResponsiveCell label="Symptoms" className="whitespace-pre-wrap break-words">
        {record.symptoms}
      </ResponsiveCell>
      <ResponsiveCell label="Appt. Number">
        {record.appointmentNumber}
      </ResponsiveCell>
      <ResponsiveCell label="Appt. Date">
        {record.appointmentDate}
      </ResponsiveCell>
      <ResponsiveCell label="Appt. Time">
        {record.appointmentTime}
      </ResponsiveCell>
      <ResponsiveCell label="Assign Doctor">
        {isAssigned ? (
          <span className="font-semibold text-green-700 dark:text-green-400">
            Assigned to {record.assignedDoctor.fullName}
          </span>
        ) : (
          <div className="flex flex-col sm:flex-row gap-2 items-end sm:items-center justify-end md:justify-start">
            <select
              className="px-2 py-1.5 rounded border border-gray-300 dark:border-gray-600 text-black dark:bg-gray-700 dark:text-white w-full sm:w-auto"
              value={record.assignedDoctorId || ""}
              onChange={(e) => {
                const selectedDoctorId = e.target.value;
                setOpdRecords((prev) =>
                  prev.map((r) =>
                    r._id === record._id
                      ? { ...r, assignedDoctorId: selectedDoctorId }
                      : r
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
              className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
              onClick={() => assignDoctorsHandler(record)}
              disabled={!record.assignedDoctorId}
            >
              Send
            </button>

            {/* ✅ Lucide Delete Icon */}
            <button
              onClick={handleDelete}
              className="p-2 bg-red-600 text-white rounded hover:bg-red-700 transition flex items-center justify-center"
              title="Delete Appointment"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </ResponsiveCell>
    </tr>
  );
};


export default AdminDashboard;
