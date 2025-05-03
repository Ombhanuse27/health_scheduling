import React, { useState } from 'react';

const DoctorSearchTable = () => {
  // Sample patient data
  const [patients, setPatients] = useState([
    { id: 1, name: 'John Doe', age: 32, gender: 'Male', doctor: null, status: 'pending' },
    { id: 2, name: 'Jane Smith', age: 28, gender: 'Female', doctor: null, status: 'pending' },
    { id: 3, name: 'Robert Johnson', age: 45, gender: 'Male', doctor: null, status: 'pending' },
    { id: 4, name: 'Emily Davis', age: 22, gender: 'Female', doctor: null, status: 'pending' },
  ]);

  // Sample doctors data
  const doctorsList = [
    { id: 1, name: 'Dr. John David', specialty: 'Cardiologist' },
    { id: 2, name: 'Dr. Sarah Smith', specialty: 'Neurologist' },
    { id: 3, name: 'Dr. Michael Johnson', specialty: 'Pediatrician' },
    { id: 4, name: 'Dr. Emily Wilson', specialty: 'Dermatologist' },
  ];

  // Handle doctor selection
  const handleDoctorSelect = (patientId, doctor) => {
    setPatients(patients.map(patient => 
      patient.id === patientId ? { ...patient, doctor } : patient
    ));
  };

  // Handle status change
  const handleStatusChange = (patientId, newStatus) => {
    setPatients(patients.map(patient => 
      patient.id === patientId ? { ...patient, status: newStatus } : patient
    ));
  };

  return (
    <div className="p-4">
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assign Doctor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {patients.map((patient) => (
              <tr key={patient.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{patient.age}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{patient.gender}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <DoctorSearchDropdown 
                    doctors={doctorsList} 
                    selectedDoctor={patient.doctor}
                    onSelect={(doctor) => handleDoctorSelect(patient.id, doctor)}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleStatusChange(patient.id, 'accepted')}
                      className={`px-3 py-1 rounded-md text-sm font-medium ${patient.status === 'accepted' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800 hover:bg-green-50 hover:text-green-700'}`}
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleStatusChange(patient.id, 'rejected')}
                      className={`px-3 py-1 rounded-md text-sm font-medium ${patient.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800 hover:bg-red-50 hover:text-red-700'}`}
                    >
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const DoctorSearchDropdown = ({ doctors, selectedDoctor, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState(selectedDoctor?.name || '');
  const [isOpen, setIsOpen] = useState(false);

  const filteredDoctors = doctors.filter(doctor =>
    doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectDoctor = (doctor) => {
    onSelect(doctor);
    setSearchTerm(doctor.name);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <input
          type="text"
          placeholder="Select doctor"
          className="w-full p-2 pl-3 pr-8 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg max-h-60 overflow-auto border border-gray-200">
          {filteredDoctors.length > 0 ? (
            filteredDoctors.map((doctor) => (
              <div
                key={doctor.id}
                className="px-3 py-2 hover:bg-blue-50 cursor-pointer transition-colors text-sm"
                onMouseDown={(e) => e.preventDefault()} // Prevent blur on click
                onClick={() => handleSelectDoctor(doctor)}
              >
                <div className="font-medium text-gray-900">{doctor.name}</div>
                <div className="text-xs text-gray-500">{doctor.specialty}</div>
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500">No doctors found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default DoctorSearchTable;