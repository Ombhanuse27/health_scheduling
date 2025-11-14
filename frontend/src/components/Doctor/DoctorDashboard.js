import React, { useState, useEffect } from "react";
import {
  getRecords,
  getDoctorsData,
  savePrescriptionPdf,
  sendPrescriptionEmail,
  getPrescriptions,
} from "../../api/api";
import { jsPDF } from "jspdf";

import { generateTeleconsultLink, sendTeleconsultEmail } from "../../api/api";

const DoctorDashboard = ({ children }) => {
  const [opdRecords, setOpdRecords] = useState([]);
  const [loggedInDoctor, setLoggedInDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  // 🟢 Changed: Default selectedDate is now an empty string to show "All Dates" by default.
  const [selectedDate, setSelectedDate] = useState("");
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [prescription, setPrescription] = useState({
    diagnosis: "",
    medication: "",
    advice: "",
  });

  const token = localStorage.getItem("token");

  // Fetch and process data on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        // Fetch all necessary data in parallel
        const [opdResponse, doctors, prescriptionsResponse] = await Promise.all([
          getRecords(token),
          getDoctorsData(token),
          getPrescriptions(token),
        ]);

        const opdData = opdResponse.data;
        const prescriptions = prescriptionsResponse.data;

        // Find the currently logged-in doctor
        const username = localStorage.getItem("username");
        const currentDoctor = doctors.find((doc) => doc.username === username);

        if (!currentDoctor) {
          alert("Could not identify the logged-in doctor.");
          setLoading(false);
          return;
        }
        setLoggedInDoctor(currentDoctor);

        // Filter OPD records for the logged-in doctor
        const assignedRecords = opdData.filter((record) => {
          const assignedDoctorId = record.assignedDoctor?.$oid || record.assignedDoctor;
          const loggedInDoctorId = currentDoctor._id?.$oid || currentDoctor._id;
          return assignedDoctorId === loggedInDoctorId;
        });

        // 🟢 Create a map of prescriptions for easy lookup
        const prescriptionsMap = new Map(
          prescriptions.map((p) => [p.appointmentId, p])
        );

        // 🟢 Enrich OPD records with existing prescription data
        const enrichedRecords = assignedRecords.map((record) => {
          const existingPrescription = prescriptionsMap.get(record._id);
          if (existingPrescription) {
            return {
              ...record,
              diagnosis: existingPrescription.diagnosis,
              medication: existingPrescription.medication,
              advice: existingPrescription.advice,
              prescriptionPdf: {
                data: existingPrescription.pdfBase64,
                contentType: "application/pdf",
              },
            };
          }
          return record;
        });

        setOpdRecords(enrichedRecords);
      } catch (error) {
        console.error("Error fetching data:", error);
        alert("An error occurred while fetching data.");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [token]);

  const handleOpenPrescriptionForm = (record) => {
    setSelectedRecord(record);
    // Reset form for a new prescription
    setPrescription({ diagnosis: "", medication: "", advice: "" });
    setShowPrescriptionModal(true);
  };

  const handleEditPrescription = (record) => {
    setSelectedRecord(record);
    // Pre-fill form with existing prescription data
    setPrescription({
      diagnosis: record.diagnosis || "",
      medication: record.medication || "",
      advice: record.advice || "",
    });
    setShowPrescriptionModal(true);
  };

  const generatePdfBase64 = (doctor, record, prescrData) => {
    const doc = new jsPDF();
    const doctorName = doctor?.fullName || "N/A";
    const qualification = doctor?.specialization || "N/A";
    const hospital = doctor?.hospital || "Clinic";
    const contact = doctor?.phone || "N/A";
    const address = doctor?.address || "N/A";

    // Header
    doc.setDrawColor(0, 176, 240);
    doc.setLineWidth(2);
    doc.line(10, 20, 200, 20);
    doc.setTextColor(0, 102, 204);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(`Dr. ${doctorName}`, 10, 15);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text(qualification, 10, 25);
    doc.setFontSize(30);
    doc.setTextColor(0, 102, 204);
    doc.text("⚕️", 180, 18);

    // Patient Details
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text("PATIENT DETAILS", 10, 40);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Patient Name: ${record.fullName}`, 10, 48);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 120, 48);
    doc.text(`Age: ${record.age || "N/A"}`, 10, 55);
    doc.text(`Gender: ${record.gender || "N/A"}`, 60, 55);
    doc.text(`Diagnosis: ${prescrData.diagnosis}`, 10, 62);

    // Prescription Body
    doc.setDrawColor(200);
    doc.setLineWidth(0.5);
    doc.line(10, 68, 200, 68);
    doc.setFontSize(32);
    doc.setTextColor(0, 102, 204);
    doc.text("℞", 10, 85);

    // Medication
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text("MEDICATION:", 25, 85);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const medicationLines = doc.splitTextToSize(prescrData.medication, 170);
    doc.text(medicationLines, 25, 93);

    // Advice
    const medicationHeight = medicationLines.length * 5;
    const adviceStartY = 93 + medicationHeight + 15;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("ADVICE:", 25, adviceStartY);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const adviceLines = doc.splitTextToSize(prescrData.advice, 170);
    doc.text(adviceLines, 25, adviceStartY + 8);

    // Signature
    const adviceHeight = adviceLines.length * 5;
    const signatureY = Math.max(adviceStartY + adviceHeight + 30, 220);
    doc.setDrawColor(100);
    doc.line(130, signatureY, 190, signatureY);
    doc.setFontSize(9);
    doc.setTextColor(80);
    doc.text("Doctor's Signature", 145, signatureY + 6);

    // Footer
    const footerY = 280;
    doc.setDrawColor(0, 176, 240);
    doc.setLineWidth(1);
    doc.line(10, footerY - 5, 200, footerY - 5);
    doc.setFontSize(9);
    doc.setTextColor(60);
    doc.text(hospital, 10, footerY);
    const addressText = `📍 ${address}`;
    doc.text(addressText, (210 - doc.getTextWidth(addressText)) / 2, footerY);
    const contactText = `📞 ${contact}`;
    doc.text(contactText, 200 - doc.getTextWidth(contactText), footerY);

    return doc.output("datauristring").split(",")[1];
  };

  const handleSavePrescription = async () => {
    if (!selectedRecord) return;

    const pdfBase64 = generatePdfBase64(
      loggedInDoctor,
      selectedRecord,
      prescription
    );

    try {
      await savePrescriptionPdf(
        token,
        selectedRecord._id,
        pdfBase64,
        prescription.diagnosis,
        prescription.medication,
        prescription.advice
      );
      alert("Prescription saved successfully.");

      // 🟢 Update the record in the state to immediately reflect the change
      setOpdRecords((prevRecords) =>
        prevRecords.map((rec) =>
          rec._id === selectedRecord._id
            ? {
                ...rec,
                ...prescription, // Add diagnosis, medication, advice
                prescriptionPdf: {
                  data: pdfBase64,
                  contentType: "application/pdf",
                },
              }
            : rec
        )
      );

      setShowPrescriptionModal(false);
    } catch (error) {
      console.error("Error saving prescription:", error);
      alert("Failed to save the prescription.");
    }
  };

  const sendEmail = async (recordId) => {
    const record = opdRecords.find((r) => r._id === recordId);
    if (!record?.email) {
      alert("Patient email address not found.");
      return;
    }
    if (!record.prescriptionPdf?.data) {
      alert("No prescription found to send.");
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to email the prescription to ${record.fullName}?`
      )
    )
      return;

    try {
      await sendPrescriptionEmail({
        email: record.email,
        patientName: record.fullName,
        pdfBase64: record.prescriptionPdf.data,
      });
      alert("Email sent successfully!");
    } catch (err) {
      console.error("Failed to send email:", err);
      alert("Failed to send the email.");
    }
  };

  // Memoize unique dates to prevent recalculation on every render
  const uniqueDates = React.useMemo(
    () => [...new Set(opdRecords.map((record) => record.appointmentDate))],
    [opdRecords]
  );

  // Filter and sort records based on the selected date
  const filteredRecords = React.useMemo(() => {
    const recordsToFilter = selectedDate
      ? opdRecords.filter((record) => record.appointmentDate === selectedDate)
      : opdRecords;

    const parseTime = (timeStr) =>
      new Date(`1970-01-01T${timeStr}`).getTime();
    return recordsToFilter.sort(
      (a, b) => parseTime(a.appointmentTime) - parseTime(b.appointmentTime)
    );
  }, [opdRecords, selectedDate]);

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-gray-800 text-center">
          Doctor's Dashboard
        </h1>

        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <label htmlFor="date-select" className="font-semibold text-gray-700">
              Filter by Date:
            </label>
            <select
              id="date-select"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="" className="text-black">All Dates</option>
              {uniqueDates.map((date) => (
                <option key={date} value={date}>
                  {new Date(date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <p className="text-center text-gray-500">Loading appointments...</p>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-4 font-semibold text-gray-600">Patient</th>
                  <th className="p-4 font-semibold text-gray-600">Symptoms</th>
                  <th className="p-4 font-semibold text-gray-600">Appointment</th>
                  <th className="p-4 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((record) => (
                    <tr key={record._id} className="border-t border-gray-200 hover:bg-gray-50">
                      <td className="p-4">
                        <div className="font-medium text-gray-900">{record.fullName}</div>
                        <div className="text-sm text-gray-500">Age: {record.age}</div>
                      </td>
                      <td className="p-4 text-gray-700">{record.symptoms}</td>
                      <td className="p-4">
                        <div className="text-gray-900">{record.appointmentDate}</div>
                        <div className="text-sm text-gray-500">{record.appointmentTime}</div>
                      </td>
                      <td className="p-4">
                        {/* 🟢 Improved Button UI */}
                        <div className="flex items-center gap-2">
                          {record.prescriptionPdf?.data ? (
                            <>
                              <button
                                onClick={() => {
                                  const win = window.open();
                                  win.document.write(
                                    `<iframe src="data:application/pdf;base64,${record.prescriptionPdf.data}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
                                  );
                                }}
                                className="px-3 py-1 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition"
                                title="View PDF"
                              >
                                📄 View
                              </button>
                              <button
                                onClick={() => handleEditPrescription(record)}
                                className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition"
                                title="Edit Prescription"
                              >
                                ✏️ Edit
                              </button>
                              <button
                                onClick={() => sendEmail(record._id)}
                                className="px-3 py-1 text-sm font-medium text-white bg-yellow-500 rounded-md hover:bg-yellow-600 transition"
                                title="Send Email"
                              >
                                📧 Send
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleOpenPrescriptionForm(record)}
                              className="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition"
                              title="Add Prescription"
                            >
                              ➕ Add Prescription
                            </button>
                            

                          )}


<button
  onClick={async () => {
    const confirmStart = window.confirm(
      `Are you sure you want to start a teleconsultation with ${record.fullName}?`
    );
    if (!confirmStart) return;

    try {
      const { data } = await generateTeleconsultLink(record._id);
      const meetLink = data.meetLink;

      await sendTeleconsultEmail({
        email: record.email,
        patientName: record.fullName,
        meetLink,
      });

      alert(`Teleconsultation link sent to ${record.fullName}!`);
      
      // This automatically opens the teleconsult room for the doctor.
      window.open(meetLink, '_blank'); 

      // ✅ ADD THIS: Update the state to store the new link against the record
      setOpdRecords(prevRecords =>
        prevRecords.map(rec =>
          rec._id === record._id
            ? { ...rec, meetLink: meetLink } // Add/update the meetLink for this record
            : rec
        )
      );

    } catch (err) {
      console.error(err);
      alert("Failed to send teleconsultation link.");
    }
  }}
  className="px-3 py-1 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 transition"
>
  💻 Start Teleconsult
</button>

{/* ✅ ADD THIS NEW BUTTON */}
{record.meetLink && (
  <button
    onClick={() => {
      navigator.clipboard.writeText(record.meetLink);
      alert("Link copied to clipboard!");
    }}
    className="px-3 py-1 text-sm font-medium text-white bg-gray-500 rounded-md hover:bg-gray-600 transition"
    title="Copy teleconsult link"
  >
    📋 Copy Link
  </button>
)}




                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center p-6 text-gray-500">
                      No records found for the selected date.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 🟢 Improved Prescription Modal UI */}
      {showPrescriptionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-lg transform transition-all">
            <h2 className="text-2xl font-bold mb-2 text-gray-800">
              Prescription
            </h2>
            <p className="mb-6 text-gray-600">
              For:{" "}
              <span className="font-semibold">{selectedRecord?.fullName}</span>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis</label>
                <input
                  type="text"
                  placeholder="e.g., Viral Fever"
                  className="w-full p-2 border border-gray-300 text-black rounded-md focus:ring-2 focus:ring-blue-500"
                  value={prescription.diagnosis}
                  onChange={(e) => setPrescription({ ...prescription, diagnosis: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Medication (Rx)</label>
                <textarea
                  placeholder="e.g., Paracetamol 500mg - 1 tablet twice a day"
                  rows="4"
                  className="w-full p-2 border border-gray-300 text-black rounded-md focus:ring-2 focus:ring-blue-500"
                  value={prescription.medication}
                  onChange={(e) => setPrescription({ ...prescription, medication: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Advice</label>
                <textarea
                  placeholder="e.g., Take complete rest, drink plenty of fluids"
                  rows="3"
                  className="w-full p-2 border border-gray-300 text-black rounded-md focus:ring-2 focus:ring-blue-500"
                  value={prescription.advice}
                  onChange={(e) => setPrescription({ ...prescription, advice: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-8">
              <button
                className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition"
                onClick={() => setShowPrescriptionModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition"
                onClick={handleSavePrescription}
              >
                Save Prescription
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;