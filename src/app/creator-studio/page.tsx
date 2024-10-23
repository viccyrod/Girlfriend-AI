'use client';

import React, { useState, useEffect } from 'react';
import BaseLayout from '@/components/BaseLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, Wand2 } from 'lucide-react';

export default function CreatorStudioPage() {
  const router = useRouter();
  const [magicPhrase, setMagicPhrase] = useState('');
  const phrases = [
    "Crafting digital dreams...",
    "Brewing AI magic...",
    "Unleashing virtual charm...",
    "Coding seductive algorithms...",
    "Designing digital desires..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setMagicPhrase(phrases[Math.floor(Math.random() * phrases.length)]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <BaseLayout>
      <div className="container mx-auto py-12 px-4 min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-pink-800 to-red-900">
        <Card className="w-full max-w-3xl mx-auto bg-black/50 backdrop-blur-md border border-pink-500/30">
          <CardContent className="text-center p-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-5xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-600">
                Creator Studio
              </h1>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <h2 className="text-4xl font-bold mb-4 text-white">Coming Soon!</h2>
            </motion.div>
            <motion.p
              className="text-2xl mb-8 text-pink-200"
              key={magicPhrase}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
            >
              {magicPhrase}
            </motion.p>
            <div className="flex justify-center space-x-4">
              <Button 
                onClick={() => router.push('/my-models')}
                className="bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700 transform hover:scale-105 transition duration-300"
              >
                <Wand2 className="mr-2 h-5 w-5" />
                Explore Your Models
              </Button>
              <Button 
                onClick={() => router.push('/community')}
                className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700 transform hover:scale-105 transition duration-300"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Discover Community
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </BaseLayout>
  );
}
