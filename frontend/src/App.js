import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import OpdForm from "./components/OpdForm";
// import AdminDashboard from "./components/AdminDashboard";
import Login from "./components/Login/Login";
import Register from "./components/Login/RegisterForm";
import Landingpage from "./components/LandingPage/Landingpage";
import NavbarLink from './components/Navbar/NavbarLink';
import ProtectedRoute  from "./components/Protectedroutes";
import Doclist from "./components/doclist";
import DoctorForm from "./components/Docform";
import Hospital from "./components/Hospital/Hospital";
import Hospitalsidebar from "./_components/HospitalSidebar";
import HospitalDetails from "./components/Hospital/HospitalDetails";
import './App.css';
import DoctorSidebar from "./_components/DoctorSidebar";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Routes>
     
        <Route path="/" element={<Landingpage />} />
        <Route path="/hospital" element={<Hospital />} />
        <Route path="/hospitalsidebar" element={<Hospitalsidebar />} />
        <Route path="/doctorsidebar" element={<DoctorSidebar />} />
          <Route path="/opdForm" element={<> <OpdForm /></>} />
          <Route path="/hospital/hospital-details" element={<><HospitalDetails /></>}/>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
