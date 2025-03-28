import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="bg-blue-500 text-white p-4 flex justify-between">
      <h1 className="text-xl font-bold">Hospital System</h1>
      <div>
        <Link to="/login" className="px-4">Login</Link>
        <Link to="/register" className="px-4">Register</Link>
      </div>
    </nav>
  );
};

export default Navbar;
