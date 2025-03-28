import React from 'react'
import { faPhone } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGithub, faLinkedin, faTwitter } from '@fortawesome/free-brands-svg-icons'
import { Link } from 'react-router-dom'
import Logo from '../../images/logo.png'

function Footer() {
  const quickLinks = [
    { title: 'Hospital List', path: '/hospital' },
    { title: 'Login', path: '/login' },
    { title: 'Booking', path: '/opdForm' }
  ]

  const additionalLinks = [
    { title: 'Privacy Policy', path: '/privacy' },
    { title: 'Terms of Service', path: '/terms' },
    { title: 'Support', path: '/support' }
  ]

  const socialIcons = [
    { icon: faTwitter, color: 'text-sky-400', href: '#twitter' },
    { icon: faGithub, color: 'text-gray-800', href: '#github' },
    { icon: faLinkedin, color: 'text-sky-700', href: '#linkedin' }
  ]

  return (
    <div className="footer bg-sky-100 text-gray-800">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 py-12">
          {/* About Section */}
          <div className="col-span-1">
            <div className="text-center">
              <img
                src={Logo}
                alt="Health-Schedule Logo"
                className="mx-auto mb-4 w-32 h-32 object-contain"
              />
              <p className="text-lg font-medium text-gray-700 mb-4">
                We provide a platform to see the Appointments of multiple Hospitals and
                book an Appointment for any hospital.
              </p>
              <div className="flex items-center justify-center space-x-4 mt-4">
                <FontAwesomeIcon 
                  icon={faPhone} 
                  className="bg-sky-500 text-white p-3 rounded-full text-xl"
                />
                <div>
                  <h6 className="text-sky-600 font-bold text-xl">Contact Us</h6>
                  <span className="text-xl font-semibold">+91 1234567890</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-span-1">
            <h3 className="text-2xl font-bold text-sky-600 border-b-2 border-sky-300 pb-2 mb-4">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link 
                    to={link.path} 
                    className="text-lg hover:text-black transition-colors duration-300"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          
          <div className="col-span-1">
            <h3 className="text-2xl font-bold text-sky-600 border-b-2 border-sky-300 pb-2 mb-4">
              Send Email
            </h3>
            <div className="space-y-4">
              <input 
                type="email" 
                placeholder="Email Address" 
                className="w-full px-4 py-3 rounded-lg bg-white border border-sky-300 focus:ring-2 focus:ring-sky-400"
              />
              <button className="w-full bg-sky-500 text-white py-3 rounded-lg hover:bg-sky-600 transition-colors">
                Subscribe Now
              </button>
            </div>
            
            {/* Social Icons */}
            <div className="flex justify-center space-x-6 mt-6">
              {socialIcons.map((social, index) => (
                <a 
                  key={index} 
                  href={social.href} 
                  className={`text-3xl ${social.color} hover:opacity-75 transition-opacity`}
                >
                  <FontAwesomeIcon icon={social.icon} />
                </a>
              ))}
            </div>
          </div>

          {/* Additional Information */}
          <div className="col-span-1">
            <h3 className="text-2xl font-bold text-sky-600 border-b-2 border-sky-300 pb-2 mb-4">
              Additional Info
            </h3>
            <ul className="space-y-3">
              {additionalLinks.map((link) => (
                <li key={link.path}>
                  <Link 
                    to={link.path} 
                    className="text-lg hover:text-sky-600 transition-colors duration-300"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

     
       
      </div>
      <div className="w-full text-center py-6 border-t border-sky-200 bg-sky-50">
          <p className="text-lg text-gray-600">
            Copyright © 2025 Design by <strong className="text-sky-600">Team CRUD</strong>
          </p>
        </div>
    </div>
  )
}

export default Footer