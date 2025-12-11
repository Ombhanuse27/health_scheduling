import { Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import doctorone from '../../images/doctor-6.jpg';
import doctortwo from '../../images/doctor-3.jpg';
import doctorthree from '../../images/doctor-1.jpg';
import doctorfour from '../../images/doctor-4.jpg';
import doctorfive from '../../images/doctor-2.jpg';
import doctorsix from '../../images/doctor-5.jpg';
import { getOpdRecords, registerDoctor,getLoggedInHospital ,getDoctorsData,deleteDoctor} from "../../api/api";

const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/da9xvfoye/upload";
const CLOUDINARY_PRESET = "ml_default";

function MegaDoctors() {
  const [opdRecords, setOpdRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [doctors, setDoctors] = useState([]); // ✅ state for doctors


  const [hospital, setHospital] = useState(null);

useEffect(() => {
  const fetchHospital = async () => {
    try {
      const { data } = await getLoggedInHospital(token); 

      console.log("Hospital data:", data); // Debugging
      setHospital(data);
      setDoctor(prev => ({ ...prev, hospital: data.username ,hospitalId:data._id})); // set hospital automatically

      // ✅ Fetch doctors once hospital is known
        const doctorsList = await getDoctorsData();

        console.log("Doctors fetched: ", doctorsList);
        const filtered = doctorsList.filter(d => d.hospital === data.username);
        setDoctors(filtered);
    } catch (error) {
      console.error("Error fetching hospital details", error);
    }
  };
  fetchHospital();
}, [token]);

// ✅ delete handler
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this doctor?")) return;
    try {
      await deleteDoctor(id);
      setDoctors((prev) => prev.filter((doc) => doc._id !== id)); // remove locally
      alert("Doctor deleted successfully!");
    } catch (error) {
      alert("Error deleting doctor");
    }
  };


  const [doctor, setDoctor] = useState({
    fullName: "",
    gender: "",
    dob: "",
    email: "",
    phone: "",
    address: "",
    specialization: "",
    hospital: "",
    hospitalId: "",
    photo: "",
  });

  const handleChange = (e) => {
    setDoctor({ ...doctor, [e.target.name]: e.target.value });
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_PRESET);

    try {
      const res = await fetch(CLOUDINARY_URL, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setDoctor({ ...doctor, photo: data.secure_url });
    } catch (error) {
      alert("Error uploading photo");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!doctor.email || !doctor.phone) {
      alert("Email and phone are required.");
      return;
    }

    const emailPrefix = doctor.email.slice(0, 4);
    const phoneSuffix = doctor.phone.slice(-3);
    const password = `${emailPrefix}@${phoneSuffix}`;
    const data = { ...doctor, username: doctor.email, password };




    try {
      await registerDoctor(data);
      alert("Doctor registered successfully!");
      setShowModal(false);
      setDoctor({
        fullName: "",
        gender: "",
        dob: "",
        email: "",
        phone: "",
        address: "",
        specialization: "",
        hospital: "",
        photo: "",
      });
    } catch (error) {
      alert("Error registering doctor");
    }
  };

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const { data } = await getOpdRecords(token);
        setOpdRecords(data);
      } catch (error) {
        alert("Error fetching OPD records");
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, [token]);

  return (
    <div className="flex flex-1 bg-gray-100 min-h-screen">
      <div className="p-6 md:px-20 py-10 flex flex-col gap-6 w-full">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : (
          <>
            <h2 className="text-4xl font-extrabold text-blue-700 text-center uppercase tracking-wide">
              Our Doctors
            </h2>

            <div className="flex justify-end">
              <button
                onClick={() => setShowModal(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition"
              >
                + Add Doctor
              </button>
            </div>

            {/* Search bar */}
            <div className="flex justify-end">
              <input
                className="h-12 w-80 rounded-lg bg-white text-gray-700 px-4 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                placeholder="Search doctors..."
              />
            </div>

            {/* Doctors Grid */}
            {/* Doctors Grid */}
<div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mt-6">
  {doctors.length > 0 ? (
    doctors.map((doc, i) => (
      <div
        key={doc._id || i}
        className="bg-white rounded-xl border border-gray-200 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
      >
        <div className="relative">
          <img
            src={doc.photo || doctorone}
            alt={doc.fullName}
            className="w-full h-64 rounded-t-xl object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 rounded-b-xl">
            <h4 className="text-lg font-bold text-white">{doc.fullName}</h4>
            <span className="block text-white/80 text-sm">{doc.specialization}</span>
          </div>
        </div>
        <div className="p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Phone</span>
            <span className="font-medium">{doc.phone}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Email</span>
            <span className="font-medium">{doc.email}</span>
          </div>
        </div>
        {/* Delete Button */}
        <div className="p-4">
          <button
            onClick={() => handleDelete(doc._id)}
            className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
          >
            Delete
          </button>
        </div>
      </div>
    ))
  ) : (
    <p className="col-span-full text-center text-gray-500">No doctors found for this hospital.</p>
  )}
</div>


          </>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-lg overflow-y-auto max-h-[90vh]">
              <h2 className="text-2xl font-bold mb-4 text-blue-700">Doctor Registration</h2>
              <form onSubmit={handleSubmit} className="space-y-3">
                <input name="fullName" value={doctor.fullName} onChange={handleChange} placeholder="Full Name" required className="w-full p-2 border rounded text-black" />
                <select name="gender" value={doctor.gender} onChange={handleChange} required className="w-full p-2 border rounded text-gray-700">
                  <option value="">Select Gender</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
                <input name="dob" type="date" value={doctor.dob} onChange={handleChange} required className="w-full p-2 border rounded text-gray-700" />
                <input name="email" type="email" value={doctor.email} onChange={handleChange} placeholder="Email" required className="w-full p-2 border rounded text-black" />
                <input name="phone" value={doctor.phone} onChange={handleChange} placeholder="Phone Number" required className="w-full p-2 border rounded text-black" />
                <input name="address" value={doctor.address} onChange={handleChange} placeholder="Address" required className="w-full p-2 border rounded text-black" />
                <input name="specialization" value={doctor.specialization} onChange={handleChange} placeholder="Specialization" required className="w-full p-2 border rounded text-black" />
{/* Hospital (auto-filled) */}
<input
  name="hospital"
  value={hospital?.username || ""}
  readOnly
  className="w-full p-2 border rounded text-black"
/>

                {/* Photo upload */}
                <div>
                  <label className="block text-gray-700 mb-1">Upload Photo</label>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="w-full p-2 border rounded" />
                  {uploading && <p className="text-blue-600 text-sm">Uploading...</p>}
                  {doctor.photo && <img src={doctor.photo} alt="Doctor Preview" className="h-24 mt-2 rounded" />}
                </div>

                <div className="flex justify-between mt-4">
                  <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                    Register
                  </button>
                  <button type="button" onClick={() => setShowModal(false)} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MegaDoctors;
