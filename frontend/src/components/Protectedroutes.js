// import { Navigate } from "react-router-dom";

// const ProtectedRoute = ({ children }) => {
//   const token = localStorage.getItem("token");
//   console.log("Stored Token:", token); // Debugging

//   return token ? children : <Navigate to="/login" replace />;
// };

// export default ProtectedRoute;

import { Navigate } from "react-router-dom";
import {jwtDecode} from "jwt-decode"; // Install using: npm install jwt-decode

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");

  if (!token) {
    console.log("No token found, redirecting to login...");
    return <Navigate to="/login" replace />;
  }

  try {
    const decodedToken = jwtDecode(token); // Decode JWT

    if (decodedToken.exp * 1000 < Date.now()) {
      console.log("Token expired, redirecting to login...");
      localStorage.removeItem("token"); // Clear expired token
      return <Navigate to="/login" replace />;
    }

    return children; // Token is valid, allow access
  } catch (error) {
    console.log("Invalid token, redirecting to login...");
    localStorage.removeItem("token"); // Remove corrupted token
    return <Navigate to="/login" replace />;
  }
};

export default ProtectedRoute;
