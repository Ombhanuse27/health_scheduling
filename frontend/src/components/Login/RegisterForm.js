import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
// import { Link } from 'react-router-dom'
import Logo from '../../images/login.jpg'
import { registerAdmin } from "../../api/api";
import NavLink  from '../Navbar/NavbarLink';
import Footer from '../Footer/Footer';
import './RegisterForm.css';
const Register = () => {


  
  const [formData, setFormData] = useState({ username: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await registerAdmin(formData);
      alert(response.data.message);
      navigate("/login"); // Redirect to login after successful registration
    } catch (error) {
      alert(error.response?.data?.message || "Registration failed");
    }
  };

  return (
  
    <div>
 <div className="register1">
  <NavLink/>
                <div className="container1">
              
                    <div className="box-register1">
                  
                        <h2 className="register-text"> Register </h2>
                        <form onSubmit={handleSubmit} className="inputs1">
                            <input type="text"
                                name="username"
                                placeholder="Username"
                                value={formData.username}
                                onChange={handleChange}
                                required id="" />
                            <input type="password"
                                name="password"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleChange}
                                required id="" />
                                <button type="submit" className=" rounded submit1">
                           Register
                        </button>
                        </form>
                        
                       
                        <span>Do Have Any Account?</span>
                        <div className="login-link1">
                            <Link to="/login">Login</Link>
                        </div>

                    </div>
                    <img src={Logo} alt="" />
                </div>
               
            </div>
            <Footer/>
            </div>
  );
};

export default Register;
