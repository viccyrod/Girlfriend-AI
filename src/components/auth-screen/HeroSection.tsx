import React from 'react';
import Image from 'next/image';
import AuthButtons from './AuthButtons';
import { Heart, MessageCircle, Sparkles, Brain, Shield, Code } from 'lucide-react';

const FeaturePoint = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors">
    <div className="mt-1 shrink-0">
      <Icon className="w-5 h-5 text-[#ff4d8d]" />
    </div>
    <div>
      <h3 className="text-white font-semibold">{title}</h3>
      <p className="text-gray-400 text-sm mt-0.5">{description}</p>
    </div>
  </div>
);

const HeroSection = () => {
  return (
    <div className='flex min-h-[100dvh] w-full flex-col md:flex-row'>
      {/* Left section */}
      <div className='flex-1 overflow-y-auto overflow-x-hidden bg-[#0a0a0a] relative z-1 px-6 py-12 md:px-8 md:py-0'>
        {/* Background logo */}
        <Image 
          src="/bg-logo.svg" 
          alt="Girlfriend Logo" 
          className='fixed -left-1/4 opacity-15 -bottom-52 lg:scale-150 xl:scale-105 scale-[2] pointer-events-none select-none' 
          width={500}
          height={500}
          priority
        />
        {/* Main content */}
        <div className='flex flex-col justify-center min-h-full relative z-10'>
          <div className='space-y-6 md:space-y-12 max-w-xl mx-auto md:mx-0'>
            {/* Logo */}
            <Image 
              src="/logo.png" 
              alt="Girlfriend Logo"
              width={385} 
              height={91}
              className="w-[280px] md:w-[385px] mx-auto md:mx-0 pointer-events-none select-none"
              priority
            />
            
            {/* Main taglines */}
            <div className='space-y-3 md:space-y-4 text-center md:text-left'>
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
                Your Perfect AI Companion Awaits
              </h1>
              <p className="text-lg md:text-2xl text-gray-400">
                Choose between a <span className="text-[#9138ab] font-semibold">Friend</span> or{" "}
                <span className='text-[#ff4d8d] font-semibold'>Lover</span> - each with their own unique personality.
              </p>
            </div>

            {/* Feature points */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-6 text-left">
              <FeaturePoint 
                icon={Brain}
                title="Advanced AI"
                description="Powered by state-of-the-art language models for natural conversations"
              />
              <FeaturePoint 
                icon={Heart}
                title="Emotional Intelligence"
                description="Companions that understand and respond to your feelings"
              />
              <FeaturePoint 
                icon={MessageCircle}
                title="Real-time Chat"
                description="Instant responses with memory of your conversations"
              />
              <FeaturePoint 
                icon={Shield}
                title="Private & Secure"
                description="Your conversations are always private and protected"
              />
              <FeaturePoint 
                icon={Sparkles}
                title="Customizable"
                description="Create and customize your perfect AI companion"
              />
              <FeaturePoint 
                icon={Code}
                title="Advanced Features"
                description="Image generation, voice messages, and more"
              />
            </div>

            {/* Auth buttons */}
            <div className="pt-4">
              <AuthButtons />
            </div>
          </div>
        </div>
      </div>

      {/* Right section - Image */}
      <div className='flex-1 relative overflow-hidden justify-center items-center hidden md:flex'> 
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-transparent to-transparent z-10" />
        <Image 
          src="/girlfriend-1.jpeg" 
          alt="AI Companion"
          fill
          className="object-cover opacity-90 pointer-events-none select-none"
          priority
        />
      </div>
    </div>
  );
};

export default HeroSection;
