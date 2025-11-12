import React, { useState, useEffect } from "react";
import { getOpdRecords } from "../../api/api";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  InputBase,
  Skeleton,
} from "@mui/material";

const Doctordashboard = ({ children }) => {
  const [opdRecords, setOpdRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const { data } = await getOpdRecords(token);
        if (data && Array.isArray(data)) {
          setOpdRecords(data);
        } else {
          console.error("Invalid API response:", data);
        }
      } catch (error) {
        console.error("API Error:", error);
        alert("Error fetching OPD records");
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, [token]);

  const uniqueDates = [...new Set(opdRecords.map((record) => record.appointmentDate))];

  const parseTimeToDate = (timeStr) => {
    // Convert "3:00 PM" → Date object
    return new Date(`2000-01-01T${new Date(`2000/01/01 ${timeStr}`).toTimeString().slice(0,8)}`);
  };
  
  

  const filteredRecords = selectedDate
  ? opdRecords
      .filter((record) => record.appointmentDate === selectedDate)
      .sort((a, b) => parseTimeToDate(a.appointmentTime) - parseTimeToDate(b.appointmentTime))
  : opdRecords.sort((a, b) => parseTimeToDate(a.appointmentTime) - parseTimeToDate(b.appointmentTime));



  return (
    <div className="flex flex-1">
      <div className="p-2  bg-blue-200 flex flex-col gap-2 flex-1 w-full h-full">
        {loading ? (
          <>
            <div className="h-12 w-80 mb-6 ml-auto">
              <Skeleton variant="rectangular" width={320} height={40} />
            </div>
            <div className="flex flex-col gap-4">
              {[...new Array(7)].map((_, i) => (
                <Skeleton key={i} variant="rectangular" width="100%" height={80} />
              ))}
            </div>
          </>
        ) : (
          <div className="p-6 md:px-20 py-10 flex flex-col gap-4 flex-1 w-full h-full">
            <h2 className="text-5xl font-extrabold mb-6   text-red-600 text-center uppercase tracking-wide">
              Appointment List
            </h2>
 
            
            {/* Date Filter */}
            <div className="mb-4 flex justify-between items-center">
              <label className="text-lg font-semibold mr-2 text-black">Select Date:</label>
              <Select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 text-lg text-black border rounded bg-gray-400"
                displayEmpty
                input={<InputBase />}
              >
                <MenuItem value="">All Dates</MenuItem>
                {uniqueDates.map((date) => (
                  <MenuItem key={date} value={date}>
                    {date}
                  </MenuItem>
                ))}
              </Select>
              <input
              className="h-12 w-80 rounded-lg  bg-white text-gray-700 px-4 ml-auto border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-shadow shadow-md hover:shadow-lg"
              placeholder="Search records..."
            />
            </div>

           
<TableContainer component={Paper} className="shadow-lg">
  <Table>
    <TableHead className="bg-gradient-to-r from-gray-200 to-gray-300">
      <TableRow>
        <TableCell style={{ fontSize: "1.5rem", fontWeight: "bold" }}>Appointment No</TableCell>
        <TableCell style={{ fontSize: "1.5rem", fontWeight: "bold" }}>Full Name</TableCell>
        <TableCell style={{ fontSize: "1.5rem", fontWeight: "bold" }}>Age</TableCell>
        <TableCell style={{ fontSize: "1.5rem", fontWeight: "bold" }}>Symptoms</TableCell>
        <TableCell style={{ fontSize: "1.5rem", fontWeight: "bold" }}>Contact No</TableCell>
        <TableCell style={{ fontSize: "1.5rem", fontWeight: "bold" }}>Appointment Time</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {filteredRecords.length > 0 ? (
        filteredRecords.map((record, index) => (  
          <TableRow key={index}>
            <TableCell style={{ fontSize: "1.25rem" }}>{record.appointmentNumber}</TableCell>
            <TableCell style={{ fontSize: "1.25rem" }}>{record.fullName}</TableCell>
            <TableCell style={{ fontSize: "1.25rem" }}>{record.age}</TableCell>
            <TableCell style={{ fontSize: "1.25rem" }}>{record.symptoms}</TableCell>
            <TableCell style={{ fontSize: "1.25rem" }}>{record.contactNumber}</TableCell>
            <TableCell style={{ fontSize: "1.25rem" }}>{record.appointmentTime}</TableCell>
          </TableRow>
        ))
      ) : (
        <TableRow>
          <TableCell colSpan={6} className="text-center p-4" style={{ fontSize: "1.25rem" }}>
            No records found for this date.
          </TableCell>
        </TableRow>
      )}
    </TableBody>
  </Table>
</TableContainer>
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

export default Doctordashboard;
