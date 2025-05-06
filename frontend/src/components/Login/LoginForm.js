import { Link } from 'react-router-dom'
import Logo from '../../images/login.jpg'
import './LoginForm.css'
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginAdmin, loginDoctor } from "../../api/api"; // Import both APIs
import Footer from '../Footer/Footer';

function LoginForm() {
    const [formData, setFormData] = useState({
        username: "",
        password: "",
        role: "admin" // default to admin
    });

    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let response;

            if (formData.role === "admin") {
                response = await loginAdmin({
                    username: formData.username,
                    password: formData.password
                });
                localStorage.setItem("token", response.data.token);
                alert("Admin login successful!");
                navigate("/hospitalsidebar");

            } else if (formData.role === "doctor") {
                response = await loginDoctor({
                    username: formData.username,
                    password: formData.password
                });
                localStorage.setItem("token", response.data.token);
                alert("Doctor login successful!");
                navigate("/doctorsidebar");
            }

        } catch (error) {
            alert(error.response?.data?.message || "Login failed!");
        }
    };

    return (
        <div>
            <div className="login2">
                <div className="container2">
                    <img src={Logo} alt="Login" />
                    <div className="box-login2">
                        <form onSubmit={handleSubmit} className="inputs2">
                            <h2 className="login-text2">Login</h2>

                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className="role-select2"
                            >
                                <option value="admin">Admin</option>
                                <option value="doctor">Doctor</option>
                            </select>

                            <input
                                type="text"
                                name="username"
                                placeholder="Username"
                                value={formData.username}
                                onChange={handleChange}
                                required
                            />
                            <input
                                type="password"
                                name="password"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                            <button type="submit" className="submit2">Login</button>
                        </form>

                        <span>Don't Have Any Account?</span>
                        <div className="register-link2">
                            <Link to="/register">Register</Link>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}

export default LoginForm;
