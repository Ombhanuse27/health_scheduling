// src/components/Navbar/NavbarLink.js

import React, { useState, useEffect } from 'react';
import { Container, Nav, Navbar } from 'react-bootstrap';
import './NavbarLink.css'; // Keep this for any custom styles not in Tailwind
import Logo from '../../images/logo1.png';
import { faBars, faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link, useNavigate } from 'react-router-dom';

function NavbarLink() {
  const [isOpen, setIsOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');

    if (token && username) {
      setUserRole('doctor');
    } else if (token) {
      setUserRole('admin');
    } else {
      setUserRole(null);
    }
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setUserRole(null);
    setIsOpen(false);
    navigate('/login');
  };

  const closeMenu = () => setIsOpen(false);

  // Reusable class for all navigation links
  const navLinkClass = "nav-link text-base font-medium text-gray-700 hover:text-blue-600 transition duration-300 ease-in-out px-3 py-2 rounded-md";
  const buttonClass = "px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition duration-300 ease-in-out font-medium";

  const renderNavLinks = () => {
    if (userRole === 'admin') {
      return (
        <>
          <Link to="/hospitalsidebar" className={navLinkClass} onClick={closeMenu}>Admin Dashboard</Link>
          <button onClick={handleLogout} className="text-red-600 hover:text-red-700 font-semibold transition duration-300 ease-in-out px-3 py-2 rounded-md">
            Logout
          </button>
        </>
      );
    } else if (userRole === 'doctor') {
      return (
        <>
          <Link to="/doctorsidebar" className={navLinkClass} onClick={closeMenu}>Doctor Dashboard</Link>
          <button onClick={handleLogout} className="text-red-600 hover:text-red-700 font-semibold transition duration-300 ease-in-out px-3 py-2 rounded-md">
            Logout
          </button>
        </>
      );
    } else {
      return (
        <Link to="/login" className={buttonClass} onClick={closeMenu}>Login / Register</Link>
      );
    }
  };

  return (
    <Navbar bg="white" expand="lg" className='fixed top-0 left-0 w-full z-50 shadow-lg py-2'>
      <Container fluid className='max-w-screen-xl mx-auto px-4 flex items-center justify-between'>
        <Navbar.Brand className='mr-0 flex items-center'>
          <Link to="/" className='flex items-center'>
            <img id="logo-img" src={Logo} alt="Health-schedule" className='w-40 h-20 object-contain' />
          </Link>
        </Navbar.Brand>
        <div className='lg:hidden'>
          <button onClick={toggleMenu} className='text-2xl focus:outline-none'>
            <FontAwesomeIcon icon={isOpen ? faTimes : faBars} className='text-blue-600 text-3xl' />
          </button>
        </div>
        
        <Navbar.Collapse id="basic-navbar-nav" className={`lg:flex lg:items-center ${isOpen ? 'flex-grow justify-end' : 'hidden'}`}>
          <Nav className='flex flex-col lg:flex-row items-center gap-2 lg:gap-8 mt-4 lg:mt-0'>
            <Link to="/" className={navLinkClass} onClick={closeMenu}>Home</Link>
            <Link to="/hospital" className={navLinkClass} onClick={closeMenu}>Hospitals List</Link>
            <Link to="/opdForm" className={navLinkClass} onClick={closeMenu}>Book Appointment</Link>
            {renderNavLinks()}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavbarLink;