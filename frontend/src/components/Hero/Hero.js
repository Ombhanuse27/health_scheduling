
import React from 'react';
import img from '../../images/doctor15.png'
import { Link } from 'react-router-dom'
import anim1 from "../../video/Telemedicine.mp4"; 
import anim2 from "../../video/Appointment Detail.mp4"; 
import anim4 from "../../video/Appointment.mp4"; 
import anim3 from "../../video/A boy is looking at a health journal.mp4"; 

const Hero = () => {
  return (
    <div className="relative bg-white py-12 mt-32 md:mt-20 lg:mt-10 py-16 lg:py-20 overflow-hidden">

      <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 items-center gap-8 relative z-10">
        <div className="hero-content space-y-4 md:space-y-6 text-center lg:text-left">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-blue-900 leading-tight">
          
            We Provide Appointment Solution
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-xl mx-auto lg:mx-0">
          Save Your Time And Take Care To Of Your Health
          </p>
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-4 justify-center lg:justify-start">
            <Link to="/hospital">
            <button className="bg-red-500 hover:bg-red-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-base sm:text-lg font-semibold shadow-md transition-colors">
             Explore Hospitals
            </button></Link> 
          {/* edit */}
            
          </div>
        </div>
        <div className="hero-image flex justify-center lg:justify-end relative mt-8 lg:mt-0">
        <img 
  src={img} 
  alt="Doctor" 
  className="w-full max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl h-auto mx-auto"
/>

        </div>
      </div>
      
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-bl from-blue-100 to-transparent opacity-50"></div>
      </div>

       {/* <div className="flex items-center justify-center h-screen bg-white relative">
           <video
        className="w-full h-auto max-w-lg md:max-w-xl lg:max-w-2xl absolute top-0  left-20 "
        autoPlay
        loop
        muted
      >
        <source src={anim2} type="video/mp4" />
      </video>
      
           
      
          </div> */}
          <section class="text-gray-600 body-font">
  <div class="container px-5 py-24 mx-auto">
    <div class="flex flex-wrap -m-4">
      <div class="p-4 lg:w-1/3">
        <div class="h-full bg-blue-500 bg-opacity-75 p-8 rounded-lg overflow-hidden text-center relative ">
        <video
              className="w-full h-full max-w-xl "
              autoPlay
              loop
              muted
            >
              <source src={anim4} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          
        </div>
      </div>
      <div class="p-4 lg:w-1/3">
        <div class="h-full bg-blue-500 bg-opacity-75 p-8 rounded-lg overflow-hidden text-center relative ">
        
        <video
              className="w-full h-auto max-w-xl "
              autoPlay
              loop
              muted
            >
              <source src={anim1} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
        </div>
      </div>
      <div class="p-4 lg:w-1/3">
        <div class="h-full bg-blue-500 bg-opacity-75 p-8 rounded-lg overflow-hidden text-center relative ">
        <video
              className="w-full h-auto max-w-xl "
              autoPlay
              loop
              muted
            >
              <source src={anim2} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
        </div>
      </div>
    </div>
  </div>
</section>
    </div>
  );
};

export default Hero;