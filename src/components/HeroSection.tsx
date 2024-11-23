'use client';

import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import Image from 'next/image';
import CreateAIButton from "./CreateAIButton";

export default function HeroSection() {
  const { user } = useKindeBrowserClient();

  return (
    <div className="relative bg-black text-white">
      <div className="container mx-auto flex items-center justify-between py-16 px-4 md:px-6">
        <div className="w-full z-10">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            Create your own <span className="text-[#ff4d8d]">AI Girlfriend</span>
          </h1>
          <p className="text-lg text-gray-300 mb-8 max-w-xl">
            Your dream companion awaits! Create your AI Girlfriend, shape her look, personality, and bring her to life in one click. 100% powered by Artificial Intelligence.
          </p>
          <div className="flex justify-start mt-8">
            <CreateAIButton />
          </div>
        </div>

        <div className="hidden md:block w-1/2 relative h-[400px]">
          <Image
            src="/banner-models.jpeg"
            alt="AI Companions"
            fill
            className="object-cover object-center rounded-2xl"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent" />
        </div>
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-transparent" />
    </div>
  );
}
