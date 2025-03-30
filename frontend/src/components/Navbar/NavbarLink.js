import React, { useState } from 'react'
import { Container, Nav, Navbar } from 'react-bootstrap'
import './NavbarLink.css'
import Logo from '../../images/logo1.png'
import { faPhoneAlt, faBars, faTimes } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Link } from 'react-router-dom'

function NavbarLink() {
  const [isOpen, setIsOpen] = useState(false);
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };
  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/hospital", label: "Hospitals List" },
    { to: "/opdForm", label: "Book Appointment" },
    { to: "/login", label: "Login / Register" }
  ];
  return (
    <Navbar 
      bg="white" 
      expand="lg" 
      className='fixed top-0 left-0 w-full z-50 shadow-md py-2'
    >
      <Container fluid className='nav-container max-w-screen-xl mx-auto px-4 flex items-center justify-between'>
     
        <Navbar.Brand className='navbar-brand mr-0 flex items-center'>
          <Link to="/" className='flex items-center'>
            <img 
              id="logo-img" 
              src={Logo} 
              alt="Health-schedule" 
              className='w-40 h-20 object-contain'
            />
          </Link>
        </Navbar.Brand>

        
        <div className='lg:hidden'>
          <button 
            onClick={toggleMenu} 
            className='text-2xl focus:outline-none'
          >
            <FontAwesomeIcon 
              icon={isOpen ? faTimes : faBars} 
              className='text-blue-600 text-4xl'
            />
          </button>
        </div>
        
        <Navbar.Collapse 
          id="basic-navbar-nav" 
          className={`
            lg:flex lg:items-center lg:w-auto 
            fixed lg:static 
            top-20 right-0 
            bg-white lg:bg-transparent 
            ${isOpen ? 'block' : 'hidden'}
            lg:block
            shadow-lg lg:shadow-none
            p-4 lg:p-0
            lg:ml-auto
          `}
        >
          <Nav className='flex flex-col lg:flex-row items-center gap-4 lg:gap-10'>
            {navLinks.map((link, index) => (
              <Link 
                key={index} 
                to={link.to} 
                className='
                  nav-link 
                  text-lg 
                  lg:text-2xl 
                  font-semibold 
                  text-blue-800 
                  hover:text-orange-500 
                  transition-colors
                '
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  )
}

export default NavbarLink