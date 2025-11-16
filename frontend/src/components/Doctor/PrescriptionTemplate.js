import React from "react";

// This is your new HTML/CSS prescription template
const PrescriptionTemplate = ({ id, doctor, record, prescription }) => {
  // Inline styles are used here to ensure they are captured by html2pdf.js
  const styles = {
    page: {
      width: "210mm", // A4 width
      minHeight: "297mm", // A4 height
      padding: "15mm",
      boxSizing: "border-box",
      fontFamily: "Arial, sans-serif",
      color: "#333",
      backgroundColor: "#fff",
      lineHeight: 1.5,
      fontSize: "10pt",
      display: "flex", // Use flex to push footer to bottom
      flexDirection: "column", // Stack items vertically
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      padding: "10mm",
      // This gradient approximates your design.
      background: "linear-gradient(110deg, #22c55e 0%, #3b82f6 100%)",
      color: "white",
      borderRadius: "0 0 20px 20px",
    },
    doctorInfo: {
      fontSize: "14pt",
      fontWeight: "bold",
    },
    logo: {
      width: "60px", // Adjust size as needed
      height: "auto",
    },
    patientDetails: {
      padding: "10mm 0",
      borderBottom: "1px solid #eee",
      marginBottom: "10mm",
    },
    detailRow: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: "5px",
    },
    rxSymbol: {
      fontSize: "28pt",
      fontWeight: "bold",
      color: "#555",
      marginBottom: "5mm",
    },
    section: {
      marginBottom: "10mm",
    },
    sectionTitle: {
      fontWeight: "bold",
      fontSize: "12pt",
      borderBottom: "1px solid #ccc",
      paddingBottom: "2px",
      marginBottom: "5px",
    },
    mainContent: {
      flexGrow: 1, // This makes the main content fill the space
    },
    footer: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      borderTop: "2px solid #3b82f6",
      paddingTop: "5mm",
      marginTop: "10mm", // Ensures space from content above
      fontSize: "9pt",
    },
    signature: {
      borderTop: "1px solid #333",
      paddingTop: "2px",
      marginTop: "20mm",
      width: "150px",
      textAlign: "center",
      marginLeft: "auto",
      color: "#555",
    },
    pre: {
      whiteSpace: "pre-wrap", // Ensures long lines wrap
      fontFamily: "Arial, sans-serif", // Inherit font
      fontSize: "10pt", // Inherit font size
    },
  };

  return (
    // The ID you pass as a prop is crucial
    <div id={id} style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.doctorInfo}>
          <div>{doctor?.fullName || "Doctor Name"}</div>
          <div style={{ fontSize: "10pt", fontWeight: "normal" }}>
            {doctor?.specialization || "Qualification"}
          </div>
        </div>
        {/* IMPORTANT: Replace this src with your actual logo.
          It MUST be a full URL (http://...) or a base64 data URL
          for html2pdf.js to see it. A local path like /logo.png won't work.
        */}
        <img
          src="https://imgs.search.brave.com/4jNWdQjvE7oriGJJsGVGYZ5rE6IUyJ-8GQth65WuSDo/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tZWRp/YS5pc3RvY2twaG90/by5jb20vaWQvNDcx/NjI5NjEwL3ZlY3Rv/ci9jYWR1Y2V1cy1t/ZWRpY2FsLXN5bWJv/bC5qcGc_cz02MTJ4/NjEyJnc9MCZrPTIw/JmM9akxuZmRRUXBo/UndzbW02d28wTzgw/c0VvLTVQaGJFWTRQ/SG1RZ0JpUmtxMD0" // <-- REPLACE THIS (using a sample caduceus)
          alt="Clinic Logo"
          style={styles.logo}
          crossOrigin="anonymous" // Important for external images
        />
      </header>

      {/* Main prescription content */}
      <main style={styles.mainContent}>
        {/* Patient Details */}
        <section style={styles.patientDetails}>
          <div style={styles.detailRow}>
            <span>
              <strong>Patient Name:</strong> {record?.fullName || "N/A"}
            </span>
            <span>
              <strong>Date:</strong> {new Date().toLocaleDateString()}
            </span>
          </div>
          <div style={styles.detailRow}>
            <span>
              <strong>Age:</strong> {record?.age || "N/A"}
            </span>
            <span>
              <strong>Gender:</strong> {record?.gender || "N/A"}
            </span>
          </div>
          <div>
            <strong>Diagnosis:</strong> {prescription?.diagnosis || "N/A"}
          </div>
        </section>

        {/* Prescription Body */}
        <div>
          <div style={styles.rxSymbol}>℞</div>
          <section style={styles.section}>
            <div style={styles.sectionTitle}>Medication</div>
            <pre style={styles.pre}>
              {prescription?.medication || "N/A"}
            </pre>
          </section>

          <section style={styles.section}>
            <div style={styles.sectionTitle}>Advice</div>
            <pre style={styles.pre}>
              {prescription?.advice || "N/A"}
            </pre>
          </section>

          <div style={styles.signature}>Doctor's Signature</div>
        </div>
      </main>

      {/* Footer */}
      <footer style={styles.footer}>
        <span>
          <strong>{doctor?.hospital || "Clinic Name"}</strong>
        </span>
        <span>{doctor?.address || "24 Dummy Street Area"}</span>
        <span>{doctor?.phone || "+12-345 678 9012"}</span>
      </footer>
    </div>
  );
};

export default PrescriptionTemplate;