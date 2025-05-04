import { Link } from 'react-router-dom'
import Logo from '../../images/login.jpg'
import './LoginForm.css'
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginAdmin } from "../../api/api";
import Footer from '../Footer/Footer';

function LoginForm() {
    const [formData, setFormData] = useState({ username: "", password: "" });
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await loginAdmin(formData); 
            localStorage.setItem("token", response.data.token); 
            alert("Login successful!");
            navigate("/hospitalsidebar"); 
        } catch (error) {
            alert(error.response?.data?.message || "Login failed!");
        }
    };

    return (
     <div>
            <div className="login2">
                <div className="container2">
                    <img src={Logo} alt="" />
                    <div className="box-login2">
                        
                        <form onSubmit={handleSubmit} className="inputs2">
                        <h2 className="login-text2"> Login </h2>
                            <input type="text"
                                name="username"
                                placeholder="Username"
                                value={formData.username}
                                onChange={handleChange} required id="" />
                            <input type="password"
                                name="password"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleChange}

                                required id="" />
                                <button type="submit" className="submit2">
                           Login
                        </button>
                        </form>
                        
                        <span>Dont Have Any Account?</span>
                        <div className="register-link2">
                            <Link to="/register">register</Link>
                        </div>

                    </div>
                </div>
                </div>
               <Footer/>
            </div>
        
    )
}

export default LoginForm