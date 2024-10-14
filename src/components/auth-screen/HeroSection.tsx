import React from 'react'
import Image from 'next/image'
import AuthButtons from './AuthButtons';

const HeroSection = () => {
  return (
    <div className='flex h-screen w-full'>
      <div className='flex-1 overflow-hidden bg-[##000000] relative justify-center items-center z-1 '>
        <img 
          src="logo.svg" 
          alt="Girlfriend Logo" 
          className='absolute -left-1/4 opacity-15 -bottom-52 lg:scale-150 xl:scale-105 scale-[2]' 
          pointer-events-none select-none
        />
        <div className='flex flex-col gap-2 px-4 xl:ml-40 text-center md:text-start font-semibold'>
          <Image 
            src={"/girlfriend.png"} 
            alt="Girlfriend Logo"
            width={769} 
            height={182}
            className="mt-20 w-[420px] z-0 pointer-events-none select-none"
          />
          <p className="text-2xl md:text-3xl text-balance">
            Meet you your new AI companion.
          </p>
          <p className="text-2xl md:text-3xl mb-32 leading-snug text-balance">
            <span className="bg-purple-400 font-bold px-2 text-white">Friend</span> or {" "}
            <span className='bg-purple-500 px-2 font-bold text-white'>Lover</span>, you choose.
          </p>
          <AuthButtons />  
        </div>
      </div>

      <div className='flex-1 relative overflow-hidden justify-center items-center hidden md:flex'> 
        <Image 
            src={"/girlfriend-1.png"} 
            alt="Girlfriend"
            fill
            className="object-cover opacity-90 pointer-events-none select-none h-full"
          />
         </div>
    </div>
  );
};

export default HeroSection
