import React, { useState, useEffect } from "react";
// import { getLoggedInDoctor, updateDoctorInfo } from "../../api/api";
import { getLoggedInDoctor, updateDoctorInfo } from "../../api/doctorApi";
import { FaCamera, FaPenNib, FaUser, FaEnvelope, FaPhone, FaStethoscope, FaMapMarkerAlt, FaVenusMars, FaCalendarAlt } from "react-icons/fa"; // Assuming you have react-icons or similar, if not standard SVG icons are used below

// Reusing your Cloudinary config
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/da9xvfoye/upload";
const CLOUDINARY_PRESET = "ml_default";

const DoctorInfo = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    specialization: "",
    dob: "",
    gender: "",
    photo: "",
    signature: "", // Added signature field
    username: "", // Read-only
  });

  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingSign, setUploadingSign] = useState(false);

  useEffect(() => {
    const fetchDoctorData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Authentication token not found. Please log in again.");
        setLoading(false);
        return;
      }

      try {
        const response = await getLoggedInDoctor(token);
        const doctorData = response.data;

        // Format DOB to YYYY-MM-DD for input field if it exists
        let formattedDob = "";
        if (doctorData.dob) {
            formattedDob = new Date(doctorData.dob).toISOString().split('T')[0];
        }

        setFormData({
          ...doctorData,
          dob: formattedDob,
          // Ensure signature is initialized even if backend doesn't return it yet
          signature: doctorData.signature || "", 
        });
      } catch (error) {
        console.error("Error fetching doctor data:", error);
        alert("Could not fetch your information.");
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Updated to handle both Photo and Signature uploads
  const handleImageUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    // Set specific loading state
    if (field === "photo") setUploadingPhoto(true);
    if (field === "signature") setUploadingSign(true);

    const formDataForUpload = new FormData();
    formDataForUpload.append("file", file);
    formDataForUpload.append("upload_preset", CLOUDINARY_PRESET);

    try {
      const response = await fetch(CLOUDINARY_URL, {
        method: "POST",
        body: formDataForUpload,
      });
      const data = await response.json();
      
      setFormData((prevData) => ({
        ...prevData,
        [field]: data.secure_url, // Dynamically update the correct field
      }));
      
      // alert(`${field === "photo" ? "Profile photo" : "Signature"} uploaded successfully!`);
    } catch (error) {
      console.error(`Error uploading ${field}:`, error);
      alert("Image upload failed!");
    } finally {
      if (field === "photo") setUploadingPhoto(false);
      if (field === "signature") setUploadingSign(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    
    try {
      await updateDoctorInfo(token, formData);
      alert("Profile updated successfully!");
    } catch (error) {
      alert("Error updating profile.");
    }
  };

  return (
    <div className="w-full h-full bg-transparent flex flex-col items-center pb-10">
      <div className="max-w-5xl w-full bg-white dark:bg-neutral-800 shadow-xl rounded-3xl overflow-hidden border border-gray-100 dark:border-neutral-700">
        
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
          <h2 className="text-3xl font-bold text-white">Doctor Profile Settings</h2>
          <p className="text-blue-100 mt-2 text-sm">Manage your personal information and digital credentials.</p>
        </div>

        {loading ? (
          <div className="p-10 animate-pulse space-y-8">
            <div className="flex justify-center">
               <div className="w-32 h-32 bg-gray-200 rounded-full"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1,2,3,4,5,6].map(i => <div key={i} className="h-12 bg-gray-200 rounded-lg"></div>)}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-8 md:p-10">
            
            {/* Top Section: Avatar & Basic Info */}
            <div className="flex flex-col items-center mb-10">
              <div className="relative group">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100 relative">
                  {formData.photo ? (
                    <img src={formData.photo} alt="Doctor" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                    </div>
                  )}
                  {uploadingPhoto && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                
                <label htmlFor="photo" className="absolute bottom-2 right-2 bg-blue-600 text-white p-2 rounded-full shadow-lg cursor-pointer hover:bg-blue-700 transition-all transform hover:scale-110 group-hover:bottom-3">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                </label>
                <input type="file" id="photo" name="photo" accept="image/*" onChange={(e) => handleImageUpload(e, "photo")} className="hidden" />
              </div>
              <p className="mt-4 text-gray-500 text-sm">Allowed *.jpeg, *.jpg, *.png, *.max 5MB</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              
              {/* Section Label */}
              <div className="col-span-1 md:col-span-2 border-b border-gray-100 pb-2 mb-2">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Personal Details</h3>
              </div>

              {/* Full Name */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-600 dark:text-gray-300">Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName || ""}
                    onChange={handleChange}
                    className="w-full pl-4 pr-4 py-3 rounded-lg border border-gray-300 bg-gray-50  focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
                    placeholder="Dr. John Doe"
                  />
                </div>
              </div>

              {/* Username (Read Only) */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-600 dark:text-gray-300">Username / ID</label>
                <input
                  type="text"
                  value={formData.username || ""}
                  readOnly
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-neutral-800 dark:border-neutral-700"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-600 dark:text-gray-300">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-600 dark:text-gray-300">Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
                />
              </div>

               {/* DOB */}
               <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-600 dark:text-gray-300">Date of Birth</label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
                />
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-600 dark:text-gray-300">Gender</label>
                <select
                  name="gender"
                  value={formData.gender || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Section Label */}
              <div className="col-span-1 md:col-span-2 border-b border-gray-100 pb-2 mt-4 mb-2">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Professional Info & Address</h3>
              </div>

              {/* Specialization */}
              <div className="space-y-2 col-span-1 md:col-span-2">
                <label className="text-sm font-semibold text-gray-600 dark:text-gray-300">Specialization</label>
                <input
                  type="text"
                  name="specialization"
                  value={formData.specialization || ""}
                  onChange={handleChange}
                  placeholder="e.g. Cardiologist, Neurologist"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
                />
              </div>

              {/* Address */}
              <div className="space-y-2 col-span-1 md:col-span-2">
                <label className="text-sm font-semibold text-gray-600 dark:text-gray-300">Address</label>
                <textarea
                  name="address"
                  value={formData.address || ""}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
                />
              </div>

              {/* --- NEW SIGNATURE SECTION --- */}
              <div className="col-span-1 md:col-span-2 border-t border-gray-100 pt-6 mt-4">
                 <label className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4 block">Digital Signature</label>
                 
                 <div className="flex flex-col md:flex-row items-start gap-6">
                    {/* Signature Preview Area */}
                    <div className="relative w-full md:w-1/2 h-32 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50 overflow-hidden group hover:border-blue-500 transition-colors">
                        {formData.signature ? (
                            <img src={formData.signature} alt="Signature" className="h-full object-contain p-2" />
                        ) : (
                            <div className="text-center text-gray-400">
                                <p className="text-sm font-medium">No signature uploaded</p>
                            </div>
                        )}
                        
                        {uploadingSign && (
                            <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                                <span className="text-blue-600 font-semibold animate-pulse">Uploading...</span>
                            </div>
                        )}
                    </div>

                    {/* Upload Button */}
                    <div className="flex flex-col justify-center">
                        <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase tracking-widest shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-25 transition ease-in-out duration-150">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                            Upload Signature
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, "signature")} />
                        </label>
                        <p className="text-xs text-gray-500 mt-2">
                            Upload a clear PNG or JPEG of your signature.<br/>This will be used for digital prescriptions.
                        </p>
                    </div>
                 </div>
              </div>

            </div>

            {/* Action Buttons */}
            <div className="mt-10 flex justify-end gap-4 border-t border-gray-100 pt-6">
              <button type="submit" className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200">
                Save Changes
              </button>
            </div>

          </form>
        )}
      </div>
    </div>
  );
};

export default DoctorInfo;