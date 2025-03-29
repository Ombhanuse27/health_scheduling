import { useState, useEffect } from "react";
import { submitHospitalInfo, getHospitals } from "../../api/api";

const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/da9xvfoye/upload";  
const CLOUDINARY_PRESET = "ml_default";  

const HospitalInfo = () => {
  const [formData, setFormData] = useState({
    hospitalImage: "",
    hospitalId: "",
    hospitalName: "",
    hospitalStartTime: "",
    hospitalEndTime: "",
    Specialist: "",
    opdFees: "",
    contactNumber: "",
    emergencyContact: "",
    email: "",
    address: "",
    paymentMode: "",
  });

  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const data = await getHospitals();
        if (Array.isArray(data)) {
          setHospitals(data);
          console.log("Hospitals fetched:", data);
        } else {
          console.error("Unexpected response format:", data);
          alert("Error fetching hospital list");
        }
      } catch (error) {
        console.error("Error fetching hospitals:", error);
        alert("Error fetching hospital list");
      }
    };

    fetchHospitals();
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "hospitalId") {
      const selectedHospital = hospitals.find((hospital) => hospital._id === value);
      setFormData({
        ...formData,
        hospitalId: value,
        hospitalName: selectedHospital ? selectedHospital.hospitalName : "",
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_PRESET);

    try {
      const response = await fetch(CLOUDINARY_URL, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      setFormData((prevData) => ({
        ...prevData,
        hospitalImage: data.secure_url,
      }));
      alert("Image uploaded successfully!");
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Image upload failed!");
    } finally {
      setUploading(false);
    }
  };


  console.log(formData.hospitalId)
  console.log(formData)

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await submitHospitalInfo(formData.hospitalId, formData);
      alert("Hospital details submitted successfully!");
    } catch (error) {
      alert("Error submitting hospital details");
    }
  };

  return (
    <div className="w-full flex justify-center items-center min-h-screen bg-gradient-to-br">
      <div className="w-full bg-white dark:bg-neutral-800 shadow-2xl rounded-2xl p-10 border border-neutral-200 dark:border-neutral-700 overflow-y-auto max-h-[90vh] custom-scrollbar mb-20">
        <h2 className="text-5xl font-bold text-center text-gray-800 dark:text-white mb-8">
          Hospital Details
        </h2>

        

        {loading ? (
          <div className="animate-pulse space-y-6">
            <div className="w-40 h-40 bg-gray-300 rounded-full mx-auto relative">
              {formData.hospitalImage && (
                <img
                  src={formData.hospitalImage}
                  alt="Hospital"
                  className="w-full h-full rounded-full object-cover"
                />
              )}
            </div>
            {[...Array(10)].map((_, i) => (
              <div key={i} className="w-full h-12 bg-gray-200 dark:bg-neutral-700 rounded-lg"></div>
            ))}
            <div className="w-full h-12 bg-blue-500 rounded-lg"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex justify-center items-center col-span-1 md:col-span-2">
              <label htmlFor="hospitalImage" className="relative w-40 h-40 rounded-full bg-gray-100 dark:bg-neutral-700 border-4 border-blue-500 cursor-pointer flex items-center justify-center">
                {formData.hospitalImage ? (
                  <img
                    src={formData.hospitalImage}
                    alt="Hospital"
                    className="w-full h-full rounded-2 object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    Upload Image
                  </div>
                )}
                <div className="absolute bottom-1 right-1 bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg">+</div>
                <input
                  type="file"
                  id="hospitalImage"
                  name="hospitalImage"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex flex-col">
            <label htmlFor="hospitalId" className="block text-sm font-medium text-black mb-1">
              Select Hospital (Admin Username)
            </label>
            <select
              id="hospitalId"
              name="hospitalId"  // Fix: Corrected the name attribute
              value={formData.hospitalId}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a hospital</option>
              {hospitals.length > 0 ? (
                hospitals.map((hospital) => (
                  <option key={hospital._id} value={hospital._id}>
                  
                    {hospital.username} 
                  </option>
                ))
              ) : (
                <option disabled>Loading hospitals...</option>
              )}
            </select>
          </div>

            
            {/* Other Form Fields */}
            {Object.keys(formData)
              .filter((key) => key !== "hospitalId" && key !== "hospitalImage")
              .map((key) => (
                <div key={key} className="flex flex-col">
                  <label className="block text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-1 capitalize">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </label>
                  <input
                    type={key === "email" ? "email" : key === "opdFees" ? "number" : "text"}
                    name={key}
                    value={formData[key]}
                    onChange={handleChange}
                    placeholder={`Enter ${key.replace(/([A-Z])/g, " $1").trim()}`}
                    className="w-full text-lg px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 bg-gray-50 dark:bg-neutral-700 text-gray-900 dark:text-white"
                  />
                  {errors[key] && <p className="text-red-500 text-sm mt-1">{errors[key]}</p>}
                </div>
              ))}


            <button type="submit" className="col-span-1 md:col-span-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xl py-3 px-6 rounded-lg shadow-md transition">
              Save
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default HospitalInfo;
