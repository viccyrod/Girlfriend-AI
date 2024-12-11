'use client';

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import BaseLayout from "@/components/BaseLayout";
import Link from "next/link";
import Image from "next/image";
import { Users, ArrowRight, Sparkles } from 'lucide-react';
import ChatButton from "@/components/ChatButton";
import AuthWrapper from "@/components/ClientAuthWrapper";
import CreateAIButton from "@/components/CreateAIButton";
import HeroSection from "@/components/HeroSection";
import { WelcomeDialog } from "@/components/WelcomeDialog";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { useQuery } from "@tanstack/react-query";
import { motion } from 'framer-motion';

interface AIModel {
  id: string;
  name: string;
  personality: string;
  imageUrl: string | null;
  followerCount: number;
  createdBy: {
    name: string;
    id: string;
  };
}

export default function Home() {
  const { user } = useKindeBrowserClient();
  const [showWelcome, setShowWelcome] = useState(false);
  
  const { data: featuredModels = [] } = useQuery<AIModel[]>({
    queryKey: ['featuredModels'],
    queryFn: async () => {
      const res = await fetch('/api/models/featured');
      return res.json();
    }
  });

  // Fetch total model count
  const { data: modelStats } = useQuery({
    queryKey: ['modelStats'],
    queryFn: async () => {
      const res = await fetch('/api/models/stats');
      return res.json();
    }
  });

  const totalModels = modelStats?.totalModels || 0;

  // Check if user has seen welcome dialog
  const { data: userData } = useQuery({
    queryKey: ['userData', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const res = await fetch('/api/user/current');
      return res.json();
    },
    enabled: !!user?.id
  });

  useEffect(() => {
    const isNewUser = sessionStorage.getItem('isNewUser') === 'true';
    // Show dialog if it's a new signup or if user has never seen it
    if ((user && isNewUser) || (user && userData?.tokens === 1000)) {
      setShowWelcome(true);
      sessionStorage.removeItem('isNewUser');
    }
  }, [user, userData]);

  return (
    <AuthWrapper isAuthenticated={!!user}>
      <BaseLayout>
        <HeroSection />
        
        <WelcomeDialog 
          isOpen={showWelcome} 
          onClose={() => setShowWelcome(false)} 
        />

        {/* Featured AI Characters Section */}
        <div className="container mx-auto py-16">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">
              Most Popular{' '}
              <span className="bg-gradient-to-r from-pink-500 to-purple-600 text-transparent bg-clip-text">
                AI Companions
              </span>
            </h2>
            <Link href="/community">
              <Button 
                variant="outline" 
                className="border-pink-500/20 hover:bg-gradient-to-r from-pink-500/10 to-purple-600/10 transition-all duration-300"
              >
                View All Models
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredModels.map((model: AIModel) => (
              <Link 
                href={`/community/AIModelProfile/${model.id}`}
                key={model.id}
                className="group cursor-pointer"
              >
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-pink-500/20 bg-gradient-to-br from-pink-500/5 to-purple-600/5">
                  <div className="absolute top-3 left-3 z-20">
                    <span className="bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs px-3 py-1 rounded-full font-medium shadow-lg shadow-pink-500/20">
                      ⚡ New
                    </span>
                  </div>

                  <ChatButton modelId={model.id} />

                  <Image
                    src={model.imageUrl || "/placeholder.jpg"}
                    alt={model.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1 group-hover:text-pink-500 transition-colors duration-300">
                          {model.name}
                        </h3>
                        <p className="text-sm text-gray-300">26 years</p>
                      </div>
                      <div className="flex items-center gap-1 bg-gradient-to-r from-pink-500/20 to-purple-600/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                        <Users size={14} className="text-pink-500" />
                        <span className="text-sm text-white font-medium">
                          {model.followerCount?.toLocaleString() || '0'}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-300 mt-2 line-clamp-2">
                      {model.personality}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* View More Models Section */}
          <motion.div 
            className="mt-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <motion.div
              className="inline-block"
              animate={{ 
                scale: [1, 1.02, 1],
                rotate: [0, 1, 0] 
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Link href="/community" className="inline-block">
                <Button
                  size="lg"
                  className="group relative px-8 py-6 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-xl shadow-xl shadow-pink-500/20 transition-all duration-300 hover:shadow-2xl hover:shadow-pink-500/30"
                >
                  <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative flex items-center gap-3 text-lg font-semibold">
                    <Sparkles className="w-5 h-5" />
                    Discover {totalModels.toLocaleString()}+ AI Companions
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                </Button>
              </Link>
            </motion.div>
            
            <motion.p 
              className="mt-4 text-white/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              Join our growing community of AI enthusiasts
            </motion.p>
          </motion.div>
        </div>
      </BaseLayout>
    </AuthWrapper>
  );
}
