import React, { useState, useEffect } from "react";
// ✅ Import getLoggedInHospital
import { getOpdRecords, getDoctorsData, assignDoctors, getLoggedInHospital } from "../../api/api";

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
      <div className="p-2 md:px-20 py-10 border-neutral-200 dark:border-neutral-700 bg-blue-200 flex flex-col gap-2 flex-1 w-full h-full">
        {loading ? (
          // ... (loading skeleton JSX)
          <p>Loading Dashboard...</p>
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
                  filteredRecords.map((record, index) => {
                    // ✅ This check now works correctly on page load because of the population step above
                    const isAssigned = record.assignedDoctor && record.assignedDoctor.fullName;

                    return (
                      <tr key={index} className="border text-black">
                        <td className="border p-2">{record.fullName}</td>
                        <td className="border p-2">{record.age}</td>
                        <td className="border p-2">{record.symptoms}</td>
                        <td className="border p-2">{record.appointmentNumber}</td>
                        <td className="border p-2">{record.appointmentDate}</td>
                        <td className="border p-2">{record.appointmentTime}</td>
                        <td className="border p-2">
                          {isAssigned ? (
                            // ✅ If assigned, display the updated text
                            <span className="font-semibold text-green-700">
                              Assigned to {record.assignedDoctor.fullName}
                            </span>
                          ) : (
                            // ✅ If not assigned, show the controls
                            <>
                              <select
                                className="px-2 py-1 rounded border text-black"
                                value={record.assignedDoctorId || ""}
                                onChange={(e) => {
                                  const selectedDoctorId = e.target.value;
                                  setOpdRecords((prev) =>
                                    prev.map((r) =>
                                      r._id === record._id ? { ...r, assignedDoctorId: selectedDoctorId } : r
                                    )
                                  );
                                }}
                              >
                                <option value="" disabled>Select Doctor</option>
                                {doctors.map((doc) => (
                                  <option key={doc._id} value={doc._id}>
                                    {doc.fullName}
                                  </option>
                                ))}
                              </select>
                              <button
                                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition ml-2"
                                onClick={() => assignDoctorsHandler(record)}
                                disabled={!record.assignedDoctorId}
                              >
                                Send
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center p-4">
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
