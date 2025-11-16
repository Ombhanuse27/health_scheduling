import React, { useState, useEffect } from "react";
// ✅ NEW: Import the speech recognition hook and 'regenerator-runtime' for it to work
import "regenerator-runtime/runtime";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import {
  getRecords,
  getDoctorsData,
  savePrescriptionPdf, // 🟢 This API function is updated
  sendPrescriptionEmail, // 🟢 This API function is updated
  getPrescriptions,
} from "../../api/api";
// ⛔️ jsPDF is no longer needed
// import { jsPDF } from "jspdf";
import { generateTeleconsultLink, sendTeleconsultEmail } from "../../api/api";

// ✅ NEW: Import html2pdf.js and your new template
import html2pdf from "html2pdf.js";
import PrescriptionTemplate from "./PrescriptionTemplate.js"; // Adjust path if needed

const DoctorDashboard = ({ children }) => {
  const [opdRecords, setOpdRecords] = useState([]);
  const [loggedInDoctor, setLoggedInDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [prescription, setPrescription] = useState({
    diagnosis: "",
    medication: "",
    advice: "",
  });

  // ✅ NEW: State for photo upload
  const [uploadedPhoto, setUploadedPhoto] = useState(null); // File object
  const [uploadedPhotoBase64, setUploadedPhotoBase64] = useState(null); // Base64 string
  const [photoPreview, setPhotoPreview] = useState(null); // URL for <img> src

  const [targetField, setTargetField] = useState(null);
  const token = localStorage.getItem("token");

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  useEffect(() => {
    if (targetField) {
      setPrescription((prev) => ({
        ...prev,
        [targetField]: transcript,
      }));
    }
  }, [transcript, targetField]);

  // Fetch and process data on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [opdResponse, doctors, prescriptionsResponse] = await Promise.all([
          getRecords(token),
          getDoctorsData(token),
          getPrescriptions(token),
        ]);
        const opdData = opdResponse.data;
        const prescriptions = prescriptionsResponse.data;
        const username = localStorage.getItem("username");
        const currentDoctor = doctors.find((doc) => doc.username === username);
        if (!currentDoctor) {
          alert("Could not identify the logged-in doctor.");
          setLoading(false);
          return;
        }
        setLoggedInDoctor(currentDoctor);

        const assignedRecords = opdData.filter((record) => {
          const assignedDoctorId =
            record.assignedDoctor?.$oid || record.assignedDoctor;
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
              // ✅ MODIFIED: These fields will now be populated from the (fixed) API
              diagnosis: existingPrescription.diagnosis,
              medication: existingPrescription.medication,
              advice: existingPrescription.advice,
              prescriptionPdf: { // Note: This key remains, but it now holds PDF OR image data
                data: existingPrescription.pdfBase64, // This is just a base64 string
                contentType: existingPrescription.contentType, // This is new
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

  const startListening = (field) => {
    // ✅ NEW: If user starts speaking, clear any uploaded photo
    if (uploadedPhoto) {
      clearPhotoUpload();
    }
    setTargetField(field);
    resetTranscript();
    SpeechRecognition.startListening({ continuous: true });
  };

  const stopListening = () => {
    SpeechRecognition.stopListening();
    setTargetField(null);
  };

  // ✅ NEW: Helper to clear photo state
  const clearPhotoUpload = () => {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    setUploadedPhoto(null);
    setUploadedPhotoBase64(null);
    setPhotoPreview(null);
  };

  // ✅ MODIFIED: When opening modal, also stop listening and clear photo
  const handleOpenPrescriptionForm = (record) => {
    setSelectedRecord(record);
    // Reset form for a new prescription
    setPrescription({ diagnosis: "", medication: "", advice: "" });
    clearPhotoUpload(); // Clear photo state
    setShowPrescriptionModal(true);
    stopListening();
    resetTranscript();
  };

  // ✅ MODIFIED: When opening modal, also stop listening and clear photo
  const handleEditPrescription = (record) => {
    setSelectedRecord(record);
    // Pre-fill form with existing prescription data
    setPrescription({
      diagnosis: record.diagnosis || "",
      medication: record.medication || "",
      advice: record.advice || "",
    });
    clearPhotoUpload(); // Clear photo state
    setShowPrescriptionModal(true);
    stopListening();
    resetTranscript();
  };

  // ✅ NEW: Centralized function to close modal
  const closeModal = () => {
    setShowPrescriptionModal(false);
    stopListening();
    resetTranscript();
    clearPhotoUpload(); // Also clear photo on close
  };

  // ✅ NEW: Handle file input change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setUploadedPhoto(file);

      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreview(previewUrl);

      // Clear text fields
      setPrescription({ diagnosis: "", medication: "", advice: "" });

      // Convert to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64String = reader.result.split(",")[1];
        setUploadedPhotoBase64(base64String);
      };
    } else {
      alert("Please upload a valid image file.");
      clearPhotoUpload();
    }
  };

  // ✅ NEW: Handle text input change (to clear photo)
  const handleTextChange = (field, value) => {
    if (uploadedPhoto) {
      clearPhotoUpload();
    }
    setPrescription({ ...prescription, [field]: value });
  };

  // ⛔️ OLD PDF FUNCTION REMOVED
  // const generatePdfBase64 = (doctor, record, prescrData) => { ... }

  // ✅ NEW: This function replaces the old jsPDF one
  const generatePdfBase64 = async () => {
    // Get the HTML element that we want to convert
    const element = document.getElementById("pdf-template-to-export");
    if (!element) {
      alert("Error: Could not find prescription template element.");
      return null;
    }

    const opt = {
      margin: 0, // No margins
      filename: "prescription.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2, // Higher scale for better quality
        useCORS: true, // Needed for external images (like your logo)
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    // This generates the base64 data URI string
    const dataUri = await html2pdf()
      .from(element)
      .set(opt)
      .output("datauristring");

    // We only want the base64 part, after the comma
    return dataUri.split(",")[1];
  };

  // ✅ MAJORLY MODIFIED: To handle both PDF and Photo saving
  const handleSavePrescription = async () => { // 🟢 Made async
    if (!selectedRecord) return;
    if (listening) {
      stopListening();
    }

    let base64Data, contentType, diagnosis, medication, advice;

    if (uploadedPhoto && uploadedPhotoBase64) {
      // --- Save Photo Logic ---
      base64Data = uploadedPhotoBase64;
      contentType = uploadedPhoto.type; // e.g., "image/jpeg"
      diagnosis = ""; // Save empty fields for photo uploads
      medication = "";
      advice = "";
    } else {
      // --- Save PDF Logic ---
      
      // 🟢 MODIFIED: This is now an async call
      base64Data = await generatePdfBase64();
      
      if (!base64Data) {
        alert("Failed to generate PDF. Aborting save.");
        return; // Stop if PDF generation failed
      }
      
      contentType = "application/pdf";
      diagnosis = prescription.diagnosis;
      medication = prescription.medication;
      advice = prescription.advice;
    }

    try {
      await savePrescriptionPdf(
        token,
        selectedRecord._id,
        base64Data,
        contentType, // Pass new field
        diagnosis,
        medication,
        advice
      );
      alert("Prescription saved successfully.");

      // 🟢 Update the record in the state to immediately reflect the change
      setOpdRecords((prevRecords) =>
        prevRecords.map((rec) =>
          rec._id === selectedRecord._id
            ? {
                ...rec,
                diagnosis, // Save new/updated fields
                medication,
                advice,
                prescriptionPdf: { // This object now holds either PDF or image
                  data: base64Data,
                  contentType: contentType,
                },
              }
            : rec
        )
      );
      closeModal(); // Use the centralized close function
    } catch (error) {
      console.error("Error saving prescription:", error);
      alert("Failed to save the prescription.");
    }
  };

  // ✅ MODIFIED: To handle sending emails with PDF or Images
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

    // --- Prepare email data ---
    const base64Data = record.prescriptionPdf.data;
    const contentType = record.prescriptionPdf.contentType || "application/pdf";
    const filename = contentType.includes("pdf")
      ? "prescription.pdf"
      : `prescription.${contentType.split("/")[1] || "jpg"}`; // e.g., "prescription.jpg"

    try {
      await sendPrescriptionEmail({
        email: record.email,
        patientName: record.fullName,
        base64Data, // Pass base64 data
        contentType, // Pass content type
        filename, // Pass filename
      });
      alert("Email sent successfully!");
    } catch (err) {
      console.error("Failed to send email:", err);
      alert("Failed to send the email.");
    }
  };

  // ... uniqueDates and filteredRecords memos remain unchanged ...
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
            <label
              htmlFor="date-select"
              className="font-semibold text-gray-700"
            >
              Filter by Date:
            </label>
            <select
              id="date-select"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="" className="text-black">
                All Dates
              </option>
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
                  <th className="p-4 font-semibold text-gray-600">
                    Appointment
                  </th>
                  <th className="p-4 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((record) => (
                    <tr
                      key={record._id}
                      className="border-t border-gray-200 hover:bg-gray-50"
                    >
                      <td className="p-4">
                        <div className="font-medium text-gray-900">
                          {record.fullName}
                        </div>
                        <div className="text-sm text-gray-500">
                          Age: {record.age}
                        </div>
                      </td>
                      <td className="p-4 text-gray-700">{record.symptoms}</td>
                      <td className="p-4">
                        <div className="text-gray-900">
                          {record.appointmentDate}
                        </div>
                        <div className="text-sm text-gray-500">
                          {record.appointmentTime}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {record.prescriptionPdf?.data ? (
                            <>
                              <button
                                onClick={() => {
                                  // ✅ MODIFIED: View button now handles images too
                                  const contentType =
                                    record.prescriptionPdf.contentType ||
                                    "application/pdf";
                                  const data = record.prescriptionPdf.data;
                                  const win = window.open();
                                  if (contentType.includes("pdf")) {
                                    win.document.write(
                                      `<iframe src="data:application/pdf;base64,${data}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
                                    );
                                  } else {
                                    win.document.write(
                                      `<img src="data:${contentType};base64,${data}" style="max-width: 100%;" />`
                                    );
                                  }
                                }}
                                className="px-3 py-1 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition"
                                title="View Prescription"
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
                              onClick={() =>
                                handleOpenPrescriptionForm(record)
                              }
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
                                const { data } = await generateTeleconsultLink(
                                  record._id
                                );
                                const meetLink = data.meetLink;
                                await sendTeleconsultEmail({
                                  email: record.email,
                                  patientName: record.fullName,
                                  meetLink,
                                });
                                alert(
                                  `Teleconsultation link sent to ${record.fullName}!`
                                );
                                // This automatically opens the teleconsult room for the doctor.
                                window.open(meetLink, "_blank");
                                // ✅ ADD THIS: Update the state to store the new link against the record
                                setOpdRecords((prevRecords) =>
                                  prevRecords.map((rec) =>
                                    rec._id === record._id
                                      ? { ...rec, meetLink: meetLink } // Add/update the meetLink for this record
                                      : rec
                                  )
                                );
                              } catch (err) {
                                console.error(err);
                                alert(
                                  "Failed to send teleconsultation link."
                                );
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
                    <td
                      colSpan="4"
                      className="text-center p-6 text-gray-500"
                    >
                      No records found for the selected date.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 🟢 Improved Prescription Modal UI with Voice-to-Text & Photo Upload */}
      {showPrescriptionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
          
          {/* ✅ NEW: Add the hidden template here */}
          {/* This is hidden off-screen. It's only used by html2pdf.js */}
          <div style={{ position: "absolute", left: "-9999px" }}>
            <PrescriptionTemplate
              id="pdf-template-to-export" // The ID our new function looks for
              doctor={loggedInDoctor}
              record={selectedRecord}
              prescription={prescription}
            />
          </div>

          <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-lg transform transition-all max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-2 text-gray-800">
              Prescription
            </h2>
            <p className="mb-6 text-gray-600">
              For:{" "}
              <span className="font-semibold">{selectedRecord?.fullName}</span>
            </p>
            
            {!browserSupportsSpeechRecognition && (
              <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-3 mb-4 rounded">
                <p>Speech recognition is not supported in this browser.</p>
              </div>
            )}

            {/* ✅ NEW: Photo Upload Section */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Upload Photo (Optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {photoPreview && (
                <div className="mt-4 relative">
                  <img
                    src={photoPreview}
                    alt="Prescription preview"
                    className="w-full h-auto max-h-60 object-contain rounded-md border border-gray-300"
                  />
                  <button
                    onClick={clearPhotoUpload}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold"
                    title="Clear Photo"
                  >
                    &times;
                  </button>
                </div>
              )}
            </div>

            {/* ✅ NEW: Divider */}
            <div className="flex items-center my-6">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="flex-shrink mx-4 text-gray-500 text-sm">
                OR
              </span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>

            {/* ✅ MODIFIED: Form fields are disabled if a photo is uploaded */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Diagnosis
                  </label>
                  <button
                    title="Record Diagnosis"
                    disabled={
                      !!uploadedPhoto || // Disable if photo exists
                      !browserSupportsSpeechRecognition ||
                      (listening && targetField !== "diagnosis")
                    }
                    onClick={() =>
                      listening && targetField === "diagnosis"
                        ? stopListening()
                        : startListening("diagnosis")
                    }
                    className={`text-xl ${
                      listening && targetField === "diagnosis"
                        ? "text-red-500 animate-pulse"
                        : "text-blue-500"
                    } disabled:text-gray-300`}
                  >
                    {listening && targetField === "diagnosis" ? "⏹️" : "🎙️"}
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="e.g., Viral Fever"
                  className="w-full p-2 border border-gray-300 text-black rounded-md focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  value={prescription.diagnosis}
                  disabled={!!uploadedPhoto} // Disable if photo exists
                  onChange={(e) =>
                    handleTextChange("diagnosis", e.target.value)
                  }
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Medication (Rx)
                  </label>
                  <button
                    title="Record Medication"
                    disabled={
                      !!uploadedPhoto || // Disable if photo exists
                      !browserSupportsSpeechRecognition ||
                      (listening && targetField !== "medication")
                    }
                    onClick={() =>
                      listening && targetField === "medication"
                        ? stopListening()
                        : startListening("medication")
                    }
                    className={`text-xl ${
                      listening && targetField === "medication"
                        ? "text-red-500 animate-pulse"
                        : "text-blue-500"
                    } disabled:text-gray-300`}
                  >
                    {listening && targetField === "medication" ? "⏹️" : "🎙️"}
                  </button>
                </div>
                <textarea
                  placeholder="e.g., Paracetamol 500mg - 1 tablet twice a day"
                  rows="4"
                  className="w-full p-2 border border-gray-300 text-black rounded-md focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  value={prescription.medication}
                  disabled={!!uploadedPhoto} // Disable if photo exists
                  onChange={(e) =>
                    handleTextChange("medication", e.target.value)
                  }
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Advice
                  </label>
                  <button
                    title="Record Advice"
                    disabled={
                      !!uploadedPhoto || // Disable if photo exists
                      !browserSupportsSpeechRecognition ||
                      (listening && targetField !== "advice")
                    }
                    onClick={() =>
                      listening && targetField === "advice"
                        ? stopListening()
                        : startListening("advice")
                    }
                    className={`text-xl ${
                      listening && targetField === "advice"
                        ? "text-red-500 animate-pulse"
                        : "text-blue-500"
                    } disabled:text-gray-300`}
                  >
                    {listening && targetField === "advice" ? "⏹️" : "🎙️"}
                  </button>
                </div>
                <textarea
                  placeholder="e.g., Take complete rest, drink plenty of fluids"
                  rows="3"
                  className="w-full p-2 border border-gray-300 text-black rounded-md focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  value={prescription.advice}
                  disabled={!!uploadedPhoto} // Disable if photo exists
                  onChange={(e) =>
                    handleTextChange("advice", e.target.value)
                  }
                />
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-8">
              <button
                className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition"
                onClick={closeModal} // ✅ MODIFIED: Use new close function
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