// ExampleComponent.jsx
import React from "react";
import anim1 from "../../video/Telemedicine.mp4"; 
import anim2 from "../../video/Appointment Detail.mp4"; 
import anim3 from "../../video/A boy is looking at a health journal.mp4"; 



const Anim = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-white relative">
     <video
  className="w-full h-auto max-w-lg md:max-w-xl lg:max-w-2xl absolute top-0  left-20 "
  autoPlay
  loop
  muted
>
  <source src={anim2} type="video/mp4" />
</video>

      <video
        className="w-full h-auto max-w-xl absolute top-0 right-5"
        autoPlay
        loop
        muted
      >
        <source src={anim1} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

    </div>
  );
};

export default Anim;
