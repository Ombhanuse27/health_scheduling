"use client";
import React, { useEffect, useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "../components/ui/Sidebar";
import editIcon from '../images/editIcon.png'
// import Dashboard from "../components/HospitalAdmin/AdminDashboard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsisH } from "@fortawesome/free-solid-svg-icons";
import {
  IconArrowLeft,
  IconBrandTabler,
  IconDetails,
  IconSettings,
  IconUserBolt,
} from "@tabler/icons-react";

import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { cn } from "../lib/utils";
import Dashboard from "../components/Doctorsidebar/Doctordashboard";
import DoctorInfo from "../components/Doctorsidebar/DoctorInfo";


export function DoctorSidebar() {
  const links = [
    {
      label: "Dashboard",
      to: "/hospitalsidebar/dashboard",
      icon: (
        <IconBrandTabler className="text-neutral-700 dark:text-neutral-200 h-8 w-6 shrink-0" />
      ),
    },
    // {
    //   label: "Doctors",
    //   to: "/hospitalsidebar/doctor",
    //   icon: (
    //     <IconUserBolt className="text-neutral-700 dark:text-neutral-200 h-8 w-6 shrink-0" />
    //   ),
    // },
    // {
    //   label: "Info",
    //   to: "/hospitalsidebar/info",
    //   icon: (
    //     <IconDetails className="text-neutral-700 dark:text-neutral-200 h-8 w-6 shrink-0" />
    //   ),
    // },
    {
      label: "Logout",
      to: "/logout",
      icon: (
        <IconArrowLeft className="text-neutral-700 dark:text-neutral-200 h-8 w-6 shrink-0" />
      ),
    },
  ];

  // ✅ State to track selected link URL
  const [selectedLink, setSelectedLink] = useState(null); // No default URL selected
  const [open, setOpen] = useState(false);

  return (
    <div
      className={cn(
        "rounded-md flex flex-col md:flex-row bg-gray-100 dark:bg-blue-800 w-screen h-screen flex-1 border border-neutral-200 dark:border-neutral-700 overflow-hidden"
      )}
    >
      {/* ✅ Sidebar */}
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            {open ? <Logo /> : <LogoIcon />}
            {/* <Logo /> */}
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-3 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
                    selectedLink === link.to
                      ? "bg-gray-300 dark:bg-gray-600" // Highlight selected link
                      : ""
                  }`}
                  onClick={() => setSelectedLink(link.to)} // ✅ Set URL on click
                >
                  {link.icon}
                  <span className="text-lg font-medium text-neutral-700 dark:text-neutral-200">
                    {link.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute bottom-5">
            <SidebarLink
              link={{
                label: "Radhey Patil",
                href: "#",
                icon: (
                  <img
                    src="https://assets.aceternity.com/manu.png"
                    className="h-10 w-8 shrink-0 rounded-full"
                    width={50}
                    height={50}
                    alt="Avatar"
                  />
                ),
              }}
            />
          </div>
        </SidebarBody>
      </Sidebar>

      {/* ✅ Render content dynamically inside Skeleton */}
      <div className="flex flex-1">
        {selectedLink ? (
          <Skeleton selectedLink={selectedLink} />
        ) : (
          <Skeleton /> // Show default Skeleton initially
        )}
      </div>
    </div>
  );
}

export const Logo = () => {
  return (
    // <Link
    //   to="#"
    //   className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
    // >
    <div className="flex flex-col gap-2 w-full items-center justify-center border-b border-gray-700 p-1">
    {/* Profile and 3-dot */}
    <div className="flex w-full justify-between items-center">
      <h4 className="text-lg font-semibold">Profile</h4>
      <img src={editIcon} width={30} height={30}/>
    </div>

    {/* Profile Image */}
    <img
      src="https://assets.aceternity.com/manu.png"
      className="shrink-0 rounded-full mt-2"
      width={100}
      height={100}
      alt="Avatar"
    />

    {/* Doctor Name and Specification */}
    <h3 className="text-2xl font-bold">Doctor Name</h3>
    <p className="text-xl text-blue-500">Specification</p>

    {/* Details Section with hover effects */}
    <div className="w-full flex flex-col gap-4 mt-4">
      <span className="flex flex-col">
        QUALIFICATION
        <p className="border p-2 rounded-md hover:bg-blue-500 hover:text-black transition-all duration-300 cursor-pointer">
          qualification
        </p>
      </span>
      <span className="flex flex-col">
        HOSPITAL NAME
        <p className="border p-2 rounded-md hover:bg-blue-500 hover:text-black transition-all duration-300 cursor-pointer">
          DYP HOSPITAL
        </p>
      </span>
      <span className="flex flex-col">
        EMAIL
        <p className="border p-2 rounded-md hover:bg-blue-500 hover:text-black transition-all duration-300 cursor-pointer">
          radhey@gmail.com
        </p>
      </span>

      <span className="flex flex-col">
        PHONE
        <p className="border p-2 rounded-md hover:bg-blue-500 hover:text-black transition-all duration-300 cursor-pointer">
          9876543210
        </p>
      </span>

     
    </div>
  </div>
    // </Link>
  );
};


export const LogoIcon = () => {
  return (
    <Link
      to="#"
      className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
    >
       <SidebarLink
              link={{
                label: "Radhey Patil",
                href: "#",
                icon: (
                  <img
                    src="https://assets.aceternity.com/manu.png"
                    className="h-10 w-8 shrink-0 rounded-full"
                    width={50}
                    height={50}
                    alt="Avatar"
                  />
                ),
              }}
            />
    </Link>
  );
};


const Skeleton = ({ selectedLink }) => {

  const renderContent = () => {
    switch (selectedLink) {
      case "/hospitalsidebar/dashboard":
        return <Dashboard />; 
    //   case "/hospitalsidebar/doctor":
    //     return (
    //       <MegaDoctors />
    //     );
      case "/hospitalsidebar/info":
        return (
         <DoctorInfo  />
        );
      case "/logout":
        return (
          <div className="text-white text-xl font-bold">🚪 Logout Page Content</div>
        );
      default:
        return <Dashboard />; 
    }
  };

  return (
    <div className="flex flex-1">
      <div className="p-2 md:px-20 py-10 rounded-tl-2xl border border-neutral-200 dark:border-neutral-700 bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 dark:bg-neutral-900 flex flex-col gap-2 flex-1 w-full h-full">
      
        {/* {!selectedLink ? (
          <>
            <input className="h-10 w-60 rounded-lg bg-gray-100 dark:bg-neutral-800 animate-pulse ml-auto"></input>
            <div className="flex gap-2 md:mt-10">
              {[...new Array(7)].map((_, i) => (
                <div
                  key={"first-array" + i}
                  className="h-20 w-full rounded-lg bg-gray-100 dark:bg-neutral-800 animate-pulse"
                ></div>
              ))}
            </div>
            <div className="flex gap-2 flex-1">
              {[...new Array(1)].map((_, i) => (
                <div
                  key={"second-array" + i}
                  className="h-full w-full rounded-lg bg-gray-100 dark:bg-neutral-800 animate-pulse"
                ></div>
              ))}
            </div>
            <div className="text-white text-xl font-bold mt-5">
              👋 Welcome! Click any label.
            </div>
          </>
        ) : ( */}
          
          <div className="text-white text-xl font-bold mt-5">{renderContent()}</div>
        {/*  )} */}
      </div>
    </div>
  );
};

export default DoctorSidebar;
