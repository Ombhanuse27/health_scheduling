import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import OpdForm from "./components/OpdForm";
// import AdminDashboard from "./components/AdminDashboard";
import Login from "./components/Login/LoginForm";
import Register from "./components/Login/RegisterForm";
import Landingpage from "./components/LandingPage/Landingpage";
import NavbarLink from './components/Navbar/NavbarLink';
import ProtectedRoute  from "./components/Protectedroutes";
import DoctorForm from "./components/Docform";
import Hospital from "./components/Hospital/Hospital";
import Hospitalsidebar from "./_components/HospitalSidebar";
import HospitalDetails from "./components/Hospital/HospitalDetails";
import './App.css';
import DoctorSidebar from "./_components/DoctorSidebar";
import DoctorInfo from "./components/Doctorsidebar/DoctorInfo";
import PatientSidebar from "./_components/PatientSidebar";
import DoctorSearchTable from "./components/DoctorSearchTable";


function App() {
  return (
    <Router>
      <NavbarLink />
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Routes>
     
        <Route path="/" element={<Landingpage />} />
        <Route path="/hospital" element={<Hospital />} />
        <Route path="/hospitalsidebar" element={<Hospitalsidebar />} />
        <Route path="/doctorsidebar" element={<DoctorSidebar />} />
        <Route path="/patientsidebar" element={<PatientSidebar />} />
          <Route path="/opdForm" element={<> <OpdForm /></>} />
          <Route path="/hospital/:hospitalId" element={<><HospitalDetails /></>}/>
          <Route path="/doctorInfo" element={<DoctorInfo />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/DoctorSearchTable" element={<DoctorSearchTable />} />

        </Routes>
      </div>
    </Router>
  );
}

export default App;
