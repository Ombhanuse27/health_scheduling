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

  // --- IMPROVED UI CLASSES ---
  
// Changed text color to 'text-gray-700' for better contrast/readability
  const navLinkClass = "nav-link text-lg font-medium text-gray-700 hover:text-blue-700 px-4 py-2 rounded-full hover:bg-blue-50 transition-all duration-300 ease-in-out";
  
  // UPDATED: Added 'text-lg' to the button as well
  const buttonClass = "px-6 py-2 text-lg text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-full hover:from-blue-700 hover:to-blue-600 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 font-medium tracking-wide";

  // UPDATED: Added 'text-lg' to logout
  const logoutClass = "text-lg text-red-500 hover:text-red-700 hover:bg-red-50 font-medium px-4 py-2 rounded-full transition-all duration-300 ease-in-out";
  
  const renderNavLinks = () => {
    if (userRole === 'admin') {
      return (
        <>
          <Link to="/hospitalsidebar" className={navLinkClass} onClick={closeMenu}>Admin Dashboard</Link>
          <button onClick={handleLogout} className={logoutClass}>
            Logout
          </button>
        </>
      );
    } else if (userRole === 'doctor') {
      return (
        <>
          <Link to="/doctorsidebar" className={navLinkClass} onClick={closeMenu}>Doctor Dashboard</Link>
          <button onClick={handleLogout} className={logoutClass}>
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
    // Added backdrop-blur and bg-white/90 for a glassmorphism effect
    <Navbar 
      bg="" 
      expand="lg" 
      className='fixed top-0 left-0 w-full z-50 shadow-md bg-white/95 backdrop-blur-md border-b border-gray-100 py-3'
    >
      <Container fluid className='max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between'>
        
        {/* Brand / Logo */}
        <Navbar.Brand className='mr-0 flex items-center p-0'>
          <Link to="/" className='flex items-center transition-opacity hover:opacity-90'>
            {/* Adjusted sizing for a sleeker look */}
            <img id="logo-img" src={Logo} alt="Health-schedule" className='h-12 w-auto object-contain' />
          </Link>
        </Navbar.Brand>

        {/* Mobile Toggle Button */}
        <div className='lg:hidden'>
          <button 
            onClick={toggleMenu} 
            className='p-2 text-gray-600 hover:text-blue-600 focus:outline-none transition-colors'
            aria-label="Toggle navigation"
          >
            <FontAwesomeIcon icon={isOpen ? faTimes : faBars} className='text-2xl' />
          </button>
        </div>
        
        {/* Collapsible Menu */}
        <Navbar.Collapse 
          id="basic-navbar-nav" 
          className={`lg:flex lg:items-center ${isOpen ? 'block' : 'hidden'} w-full lg:w-auto`}
        >
          {/* Added mt-4 for mobile spacing, removed margin on desktop */}
          <Nav className='flex flex-col lg:flex-row items-center gap-3 lg:gap-6 mt-4 lg:mt-0 w-full justify-end'>
            <Link to="/" className={navLinkClass} onClick={closeMenu}>Home</Link>
            <Link to="/hospital" className={navLinkClass} onClick={closeMenu}>Hospitals List</Link>
            <Link to="/opdForm" className={navLinkClass} onClick={closeMenu}>Book Appointment</Link>
            
            {/* Divider line for mobile only to separate main links from auth actions */}
            <div className="w-full h-px bg-gray-100 my-2 lg:hidden"></div>
            
            {renderNavLinks()}
          </Nav>
        </Navbar.Collapse>

      </Container>
    </Navbar>
  );
}

export default NavbarLink;