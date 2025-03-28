// import React from 'react'
// import img from '../../images/Doctor1.png'
// import './Hero.css'
// import img1 from '../../images/download (1).png'
// import img2 from '../../images/download (2).png'
// import img3 from '../../images/download (3).png'
// import img5 from '../../images/download (5).png'
// function Hero() {
//     return (
//         <>
//             <header>
//                 <div className="container">
//                     <div className="row">
//                         <div className="col-md-8">
//                             <h5>We Provide Appointment Solution</h5>
//                             <h2>Save Your Time And Take Care To Of Your Health</h2>
//                             <button>Explore Hospitals</button>
//                         </div>
//                         <div className="col-md-4 img ">
                            
//                             {/* <div className="background-shape"></div> */}
                            
//                             <img src={img} alt="doctor1"  className='doctor-image'/>
//                         </div>
//                     </div>
//                 </div>
//                 <div className="images">
//                     <img className='img-one' src={img1} alt="" />
//                     <img className='img-two' src={img2} alt="" />
//                     <img className='img-three' src={img3} alt="" />
//                     <img className='img-five' src={img5} alt="" />
//                 </div>
//             </header>
//         </>
//     )
// }

// export default Hero
import React from 'react';
import img from '../../images/doctor15.png'

const Hero = () => {
  return (
    <div className="relative bg-blue-50 py-12 md:py-16 lg:py-20 mt-10 overflow-hidden">
      <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 items-center gap-8 relative z-10">
        <div className="hero-content space-y-4 md:space-y-6 text-center lg:text-left">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-blue-900 leading-tight">
            {/* Doctors who <br className="hidden md:block" />treat with care. */}
            We Provide Appointment Solution
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-xl mx-auto lg:mx-0">
          Save Your Time And Take Care To Of Your Health
          </p>
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-4 justify-center lg:justify-start">
            <button className="bg-red-500 hover:bg-red-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-base sm:text-lg font-semibold shadow-md transition-colors">
             Explore Hospitals
            </button>
            {/* <button className="border border-blue-500 text-blue-500 hover:bg-blue-50 px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-base sm:text-lg font-semibold transition-colors">
              Learn More
            </button> */}
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
    </div>
  );
};

export default Hero;