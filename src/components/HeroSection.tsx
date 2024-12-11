'use client';

import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import Image from 'next/image';
import CreateAIButton from "./CreateAIButton";
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const relationshipTypes = [
  'Girlfriend',
  'Lover',
  'Boyfriend',
  'Confidante',
  'Emotional Supporter',
  'Dating Coach'
];

const ShimmeringStar = () => (
  <motion.div
    initial={{ opacity: 0.5, scale: 0.8 }}
    animate={{ 
      opacity: [0.5, 1, 0.5],
      scale: [0.8, 1.2, 0.8],
      rotate: [0, 360]
    }}
    transition={{ 
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }}
    className="absolute -top-1 -right-1 text-yellow-300 z-20"
  >
    <Sparkles className="w-4 h-4" />
  </motion.div>
);

export default function HeroSection() {
  const { user: _user } = useKindeBrowserClient();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % relationshipTypes.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative bg-black text-white">
      <div className="container mx-auto flex items-center justify-between py-16 px-4 md:px-6">
        <div className="w-full z-10">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            Your Dream
          </h1>
          <div className="h-[60px] md:h-[72px] lg:h-[84px] mb-4">
            <AnimatePresence mode="wait">
              <motion.span
                key={currentIndex}
                className="inline-block bg-gradient-to-r from-pink-500 to-purple-600 text-transparent bg-clip-text text-4xl md:text-5xl lg:text-6xl font-bold"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {relationshipTypes[currentIndex]}
              </motion.span>
            </AnimatePresence>
          </div>
          <p className="text-lg text-gray-300 mb-8 max-w-xl">
            Your dream companion awaits! Create your AI Companion, shape their look, personality, and bring them to life in one click.
          </p>
          <div className="flex justify-start mt-8">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative"
            >
              <ShimmeringStar />
              <CreateAIButton />
            </motion.div>
          </div>
        </div>

        <div className="hidden md:block w-1/2 relative h-[400px]">
          <Image
            src="/banner-models.jpeg"
            alt="AI Companions"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
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
