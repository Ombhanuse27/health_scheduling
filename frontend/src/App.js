import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import OpdForm from "./components/OpdForm";
import Login from "./components/Login/LoginForm";
import Register from "./components/Login/RegisterForm";
import Landingpage from "./components/LandingPage/Landingpage";
import NavbarLink from './components/Navbar/NavbarLink';
import ProtectedRoute  from "./components/Protectedroutes";
// import DoctorForm from "./components/Docform";
import Hospital from "./components/Hospital/Hospital";
import Hospitalsidebar from "./_components/HospitalSidebar";
import HospitalDetails from "./components/Hospital/HospitalDetails";
import './App.css';
import DoctorSidebar from "./_components/DoctorSidebar";
import DoctorInfo from "./components/Doctorsidebar/DoctorInfo";

import DoctorSearchTable from "./components/DoctorSearchTable";
import AdminDashboard from "./components/HospitalAdmin/AdminDashboard";
import TeleConsultPage from "./components/TeleConsultPage";


function App() {
  return (
    <Router>

      <div className="h-screen w-screen overflow-hidden bg-gray-100 flex flex-col">
        
        {/* Navbar sits at the top */}
        <div className="flex-shrink-0 z-50">
          <NavbarLink />
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
          <Routes>
            <Route path="/" element={<Landingpage />} />
            <Route path="/hospital" element={<Hospital />} />
            <Route path="/hospitalsidebar/*" element={<Hospitalsidebar />} /> {/* Added /* for nested routes */}
            <Route path="/doctorsidebar" element={<DoctorSidebar />} />
          
            <Route path="/opdForm" element={<OpdForm />} />
            <Route path="/hospital/:hospitalId" element={<HospitalDetails />} />
            <Route path="/doctorInfo" element={<DoctorInfo />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/DoctorSearchTable" element={<DoctorSearchTable />} />
            <Route path="/teleconsult/:roomId" element={<TeleConsultPage />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;