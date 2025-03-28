import { useEffect, useState } from "react";
import { getdoclist } from "../api/api";

const Doclist = () => {
  const [docRecords, setdocRecords] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const { data } = await getdoclist(token);
        setdocRecords(data);
      } catch (error) {
        alert("Error fetching OPD records");
      }
    };
    fetchRecords();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
     
      <table className="w-full border-collapse border">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Full Name</th>
            <th className="border p-2">Age</th>
            <th className="border p-2">Symptoms</th>
          </tr>
        </thead>
        <tbody>
          {docRecords.map((record, index) => (
            <tr key={index} className="border">
              <td className="border p-2">{record.hospital_name}</td>
              <td className="border p-2">{record.name}</td>
              <td className="border p-2">{record.specialization}</td>
              <td className="border p-2">{record.contact_info}</td>
              <td className="border p-2">{record.availability}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Doclist;
