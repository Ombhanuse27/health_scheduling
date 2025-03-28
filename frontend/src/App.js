
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import OpdForm from "./components/OpdForm";



import './App.css';

function App() {
    return (
      <Router>
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <Routes>
            <Route path="/" element={<> <OpdForm /></>} />
            <Route path="/dashboard" element={<ProtectedRoute><AdminDashboard></AdminDashboard></ProtectedRoute>} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </div>
      </Router>
    );
  }
  
  export default App;