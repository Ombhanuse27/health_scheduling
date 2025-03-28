import React from 'react'
import Hero from '../Hero/Hero';
import NavbarLink from '../Navbar/NavbarLink';
import Footer from '../Footer/Footer';
import HospitalSidebar from '../../_components/HospitalSidebar';
import App from '../../App';
import Appointment from '../Appointment/Appointment';




function Landingpage() {
  return (
    <div className="flex flex-col min-h-screen w-full p-0 m-0 relative">

       <NavbarLink/>
       {/* <HospitalSidebar/> */}
      <Hero /> 
      <Appointment/>
       <Footer/> 
        
    </div>
  )
}

export default Landingpage