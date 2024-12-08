'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Heart, Home } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-black text-white overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-transparent" />
      
      <motion.div 
        className="relative text-center space-y-6 px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mb-8"
        >
          <Heart className="w-16 h-16 text-pink-500 mx-auto" />
        </motion.div>

        <h1 className="text-7xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 text-transparent bg-clip-text">
          404
        </h1>
        
        <h2 className="text-2xl text-muted-foreground">
          Looks like you&apos;re lost in love
        </h2>
        
        <p className="text-pink-300/80 max-w-md mx-auto">
          Don&apos;t worry, your perfect AI companion is waiting for you back home
        </p>

        <Link href="/" className="block mt-8">
          <Button className="bg-[#ff4d8d] hover:bg-[#ff3377] text-white px-6 py-6 rounded-full text-lg font-semibold transition-all duration-300 hover:transform hover:scale-105">
            <Home className="mr-2 h-5 w-5" />
            Take Me Home
          </Button>
        </Link>
      </motion.div>
    </div>
  );
} 