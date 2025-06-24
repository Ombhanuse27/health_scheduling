import React, { useState, useEffect } from "react";
import { getRecords, getDoctorsData } from "../../api/api";
import { savePrescriptionPdf } from "../../api/api";
import { jsPDF } from "jspdf";
import { getPrescriptions } from "../../api/api";



const DoctorDashboard = ({ children }) => {
  const [opdRecords, setOpdRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username"); // stored during login


  const [prescriptionsMap, setPrescriptionsMap] = useState({});


  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
const [selectedRecord, setSelectedRecord] = useState(null);
const [prescription, setPrescription] = useState({
  diagnosis: "",
  medication: "",
  advice: "",
});


const handleOpenPrescriptionForm = (record) => {
  setSelectedRecord(record);
  setShowPrescriptionModal(true);
};



const generatePdfBase64 = () => {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Prescription", 80, 20);
  doc.setFontSize(12);
  doc.text(`Patient: ${selectedRecord.fullName}`, 10, 40);
  doc.text(`Date: ${selectedDate}`, 10, 50);
  doc.text(`Diagnosis: ${prescription.diagnosis}`, 10, 60);
  doc.text(`Medication: ${prescription.medication}`, 10, 70);
  doc.text(`Advice: ${prescription.advice}`, 10, 80);

  const pdfBase64 = doc.output("datauristring").split(",")[1]; // Extract base64 part
  return pdfBase64;
};

const handleSavePrescription = async () => {
  if (!selectedRecord) return;

  const pdfBase64 = generatePdfBase64();

  try {
    await savePrescriptionPdf(token, selectedRecord._id, pdfBase64);
    alert("Prescription saved and stored successfully!");
  } catch (error) {
    console.error("Error saving prescription", error);
    alert("Failed to store prescription.");
  }

  setShowPrescriptionModal(false);
  setPrescription({ diagnosis: "", medication: "", advice: "" });

  setPrescriptionsMap((prev) => ({
  ...prev,
  [selectedRecord._id]: pdfBase64,
}));

};

  useEffect(() => {
  const fetchRecords = async () => {
    setLoading(true);
    try {
      const { data: opdData } = await getRecords(token);
      const allDoctors = await getDoctorsData(token);

      const { data: prescriptions } = await getPrescriptions(token);

// Create a map of appointmentId => prescriptionBase64
const map = {};
prescriptions.forEach((presc) => {
  map[presc.appointmentId] = presc.pdfBase64;
});
setPrescriptionsMap(map);


      console.log("OPD Data:", opdData);
      const username = localStorage.getItem("username");
      const loggedInDoctor = allDoctors.find((doc) => doc.username === username);

      if (!loggedInDoctor) {
        alert("Doctor not found.");
        return;
      }

      // Filter OPD records assigned to this doctor
      const assignedRecords = opdData.filter((record) => {
        const assignedDoctorId = record.assignedDoctor?.$oid || record.assignedDoctor;
        const loggedInDoctorId = loggedInDoctor._id?.$oid || loggedInDoctor._id;
        return assignedDoctorId === loggedInDoctorId;
      });

      setOpdRecords(assignedRecords);
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
                  <th className="p-4 text-left">Prescription</th>

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
  {prescriptionsMap[record._id] ? (
    <>
      <button className="bg-green-500 text-white px-4 py-1 rounded mr-2 cursor-default">
        Added
      </button>
      <button
        onClick={() => {
          const win = window.open();
          win.document.write(
            `<iframe src="data:application/pdf;base64,${prescriptionsMap[record._id]}" ` +
            `width="100%" height="100%"></iframe>`
          );
        }}
        className="bg-purple-500 hover:bg-purple-700 text-white px-4 py-1 rounded"
      >
        View
      </button>
    </>
  ) : (
    <button
      onClick={() => handleOpenPrescriptionForm(record)}
      className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-1 rounded"
    >
      Add
    </button>
  )}
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


                {showPrescriptionModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div className="bg-white p-6 rounded-lg w-[400px]">
      <h2 className="text-xl font-bold mb-4">Add Prescription</h2>

      <input
        type="text"
        placeholder="Diagnosis"
        className="border w-full p-2 mb-2"
        value={prescription.diagnosis}
        onChange={(e) => setPrescription({ ...prescription, diagnosis: e.target.value })}
      />
      <input
        type="text"
        placeholder="Medication"
        className="border w-full p-2 mb-2"
        value={prescription.medication}
        onChange={(e) => setPrescription({ ...prescription, medication: e.target.value })}
      />
      <input
        type="text"
        placeholder="Advice"
        className="border w-full p-2 mb-2"
        value={prescription.advice}
        onChange={(e) => setPrescription({ ...prescription, advice: e.target.value })}
      />

      <div className="flex justify-between mt-4">
        <button
          className="bg-green-500 text-white px-4 py-1 rounded"
          onClick={handleSavePrescription}
        >
          Save
        </button>
        <button
          className="bg-gray-500 text-white px-4 py-1 rounded"
          onClick={() => setShowPrescriptionModal(false)}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
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

export default DoctorDashboard;
