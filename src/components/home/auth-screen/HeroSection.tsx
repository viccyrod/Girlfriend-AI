// Import necessary modules and components
import React from 'react';
import Image from 'next/image';
import AuthButtons from './AuthButtons';

// Define the HeroSection component
const HeroSection = () => {
  return (
    <div className='flex h-screen w-full'>
      {/* Left section of the hero, containing the logo and text */}
      <div className='flex-1 overflow-hidden bg-[#000000] relative z-1'>
        {/* Background logo with absolute positioning and opacity */}
        <Image 
          src="/bg-logo.svg" 
          alt="Girlfriend Logo" 
          className='absolute -left-1/4 opacity-15 -bottom-52 lg:scale-150 xl:scale-105 scale-[2] pointer-events-none select-none' 
          width={500}  // Adjust this value based on your logo's actual size
          height={500}
        />
        {/* Main content container */}
        <div className='flex flex-col justify-center h-full px-8 md:px-12 lg:px-16 xl:px-20 text-center md:text-start'>
          <div className='space-y-8 md:space-y-12'>
            {/* Logo with specific width and spacing */}
            <Image 
              src="/logo.png" 
              alt="Girlfriend Logo"
              width={385} 
              height={91}
              className="w-[320px] md:w-[385px] mx-auto md:mx-0 pointer-events-none select-none"
            />
            <div className='space-y-4 md:space-y-6'>
              {/* Main tagline */}
              <p className="text-2xl md:text-3xl lg:text-4xl text-balance font-semibold">
                Meet your new AI companion.
              </p>
              {/* Subheading with highlighted options */}
              <p className="text-2xl md:text-3xl lg:text-4xl text-balance font-semibold">
                <span className="bg-[#9138ab] font-bold px-2 text-white">Friend</span> or{" "}
                <span className='bg-[#f36198] px-2 font-bold text-white'>Lover</span>- you choose.
              </p>
            </div>
            {/* Authentication buttons for login/signup */}
            <AuthButtons />
          </div>
        </div>
      </div>

      {/* Right section of the hero, displaying the image of the AI companion */}
      <div className='flex-1 relative overflow-hidden justify-center items-center hidden md:flex'> 
        <Image 
          src="/girlfriend-1.jpeg" 
          alt="Girlfriend"
          fill
          className="object-cover opacity-90 pointer-events-none select-none"
        />
      </div>
    </div>
  );
};

// Export the HeroSection component as default
export default HeroSection;
