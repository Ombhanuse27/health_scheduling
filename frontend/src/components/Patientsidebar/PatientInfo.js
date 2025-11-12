import { useState, useEffect } from "react";
import { submitOpdForm } from "../../api/api";

const PatientInfo = () => {
  const [formData, setFormData] = useState({
    patientImage: "",
    patientId: "",
    patientName: "",
    contactNumber: "",
    email: "",
    address: "",
  
  });

  const [loading, setLoading] = useState(true);
  const [errors] = useState({});
 
 
  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await submitOpdForm(formData.patientId, formData);
      alert("OPD Form submitted successfully!");
    } catch (error) {
      alert("Error submitting OPD Form");
    }
  };

  return (
    <div className="w-full flex justify-center items-center min-h-screen bg-gradient-to-br ">
      <div className="w-full bg-blue-200 dark:bg-neutral-800 shadow-2xl rounded-2xl p-10  overflow-y-auto max-h-[90vh] custom-scrollbar mb-20">
        <h2 className="text-5xl font-bold text-center text-gray-800 dark:text-white mb-8">
          Patient Profile
        </h2>

        {loading ? (
         
          <div className="animate-pulse space-y-6">
          
            <div className="w-40 h-40 bg-gray-300 rounded-full mx-auto relative "></div>

            
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="w-full h-12 bg-gray-200 dark:bg-neutral-700 rounded-lg"
              ></div>
            ))}

            <div className="w-full h-12 bg-blue-500 rounded-lg"></div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
           
            <div className="flex justify-center items-center col-span-1 md:col-span-2">
              <label
                htmlFor="hospitalImage"
                className="relative w-40 h-40 rounded-full bg-gray-100 dark:bg-neutral-700 border-4 border-blue-500 cursor-pointer flex items-center justify-center"
              >
                {formData.hospitalImage ? (
                  <img
                    src={formData.hospitalImage}
                    alt="Hospital"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    Upload Image
                  </div>
                )}
                <div className="absolute bottom-1 right-1 bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg">
                  +
                </div>
                <input
                  type="file"
                  id="hospitalImage"
                  name="hospitalImage"
                  className="hidden"
                  onChange={handleChange}
                />
              </label>
            </div>

            {/* Form Input Fields */}
            {Object.keys(formData)
              .filter((key) => key !== "hospitalImage")
              .map((key) => (
                <div key={key} className="flex flex-col">
                  <label
                    htmlFor={key}
                    className="block text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-1 capitalize"
                  >
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </label>
                  <input
                    type={
                      key === "email"
                        ? "email"
                        : key === "age" || key === "opdFees"
                        ? "number"
                        : "text"
                    }
                    id={key}
                    name={key}
                    value={formData[key]}
                    onChange={handleChange}
                    placeholder={`Enter ${key.replace(/([A-Z])/g, " $1").trim()}`}
                     className="w-full text-lg px-4 py-3  border-2 border-solid border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 bg-gray-50 dark:bg-neutral-700 text-gray-900 dark:text-white"
                  />
                  {errors[key] && (
                    <p className="text-red-500 text-sm mt-1">{errors[key]}</p>
                  )}
                </div>
              ))}

          
            <button
              type="submit"
              className="col-span-1 md:col-span-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xl py-3 px-6 rounded-lg shadow-md transition"
            >
              Save
            </button>
          </form>
        )}
      </div>

  
      <style>
        {`
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
            
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f1f1;
            
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #555;
          }
        `}
      </style>
    </div>
  );
};

export default PatientInfo;
