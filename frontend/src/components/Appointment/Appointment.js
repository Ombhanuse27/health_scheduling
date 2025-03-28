import lottie from 'lottie-web';
import { useEffect, useRef } from 'react';

function AppointmentForm() {
  const container = useRef(null);

  useEffect(() => {
    lottie.loadAnimation({
      container: container.current,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      animationData: require('../../animations/appointment.json'),
    });

    return () => {
      lottie.destroy();
    };
  }, []);

  return (
    <>
      <div className="appointment bg-gradient-to-r from-[#EBF3FF] to-[#f0f5fd] rounded-[30px] p-[100px_60px_0px_60px] mx-[30px] relative overflow-hidden sm:rounded-none sm:p-[40px_25px_0_30px] sm:mx-0">
        <div className="container mx-auto">
          <div className="flex flex-wrap">
            <div className="w-full lg:w-5/12 md:w-6/12 sm:w-full mb-5 appointment-section relative h-auto sm:h-auto">
              <div className="absolute inset-0 -m-[15px] rounded-[40px] border-[3px] border-[#565acf] z-[1]"></div>

              
              <form className="bg-white box-shadow-gray-500 rounded-[40px]  p-[40px_35px] relative flex flex-col gap-[20px] z-[2] w-full">
                <h2 className="text-center text-[22px] sm:text-[26px] font-bold text-[#316FD2] mb-4">
                  Book Appointment
                </h2>

                <input
                  type="text"
                  placeholder="Your Name"
                  className="p-[16px] text-lg w-full rounded-[10px] border-2 border-black  hover:shadow-md"
                />

                <input
                  type="text"
                  placeholder="Age"
                  className="p-[16px] w-full rounded-[10px] "
                />

                <input
                  type="text"
                  placeholder="Gender"
                  className="p-[16px] w-full rounded-[10px] border-2 "
                />

                <input
                  type="number"
                  placeholder="Phone Number"
                  className="p-[16px] w-full rounded-[10px] "
                />

                <input
                  type="text"
                  placeholder="Disease Name"
                  className="p-[16px] w-full rounded-[10px] "
                />

                <select className="p-[16px] w-full rounded-[10px] ">
                  <option value="">Select Hospital</option>
                  <option value="one">One</option>
                  <option value="two">Two</option>
                  <option value="three">Three</option>
                </select>

                <button className="bg-[#316FD2] text-white rounded-[8px] px-[20px] py-[15px] w-full text-lg font-semibold transition-opacity duration-500 hover:bg-[#313FD2]  shadow-md hover:shadow-lg">
                  Book Appointment
                </button>
              </form>
            </div>

            <div className="w-full lg:w-7/12 md:w-6/12 sm:w-full mb-5 app-image flex items-center justify-center">
              <div className="img" ref={container}></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default AppointmentForm;