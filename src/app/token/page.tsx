"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import BaseLayout from "@/components/BaseLayout";
import Link from "next/link";
import Image from "next/image";
import { ExternalLink, Wallet, ChevronRight } from 'lucide-react';
import { motion } from "framer-motion";
import CountdownTimer from "@/components/CountdownTimer";

export default function TokenPage() {
  return (
    <BaseLayout requireAuth={false}>
      {/* Hero Section */}
      <div className="relative bg-black text-white min-h-screen">
        <div className="container mx-auto flex flex-col-reverse md:flex-row items-center justify-between py-8 md:py-16 px-4 md:px-6 gap-8">
          {/* Left Content */}
          <motion.div 
            className="w-full md:w-1/2 z-10"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <motion.span 
                className="bg-pink-500/20 text-pink-500 px-3 py-1 rounded-full text-sm font-semibold"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                $GOON Token
              </motion.span>
              <Link 
                href="https://dexscreener.com/solana/goon" 
                target="_blank" 
                className="flex items-center gap-1 text-sm text-pink-300 hover:text-pink-400"
              >
                View Chart <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
            
            <motion.h1 
              className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Power the Future of <span className="text-[#ff4d8d]">AI Dating & Relationships</span>
            </motion.h1>
            
            <motion.p 
              className="text-lg text-gray-300 mb-8 max-w-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              $GOON is the native token of the Girlfriend.cx ecosystem, enabling premium features, AI model creation, and community governance.
            </motion.p>

            {/* Countdown Timer */}
            <motion.div 
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h3 className="text-lg font-semibold mb-4">Token Launch In:</h3>
              <CountdownTimer />
            </motion.div>

            <motion.div 
              className="flex flex-wrap gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Link href="https://raydium.io/swap" target="_blank">
                <Button className="bg-[#ff4d8d] hover:bg-[#ff3377] text-white px-6 md:px-8 py-3 rounded-full text-base md:text-lg font-semibold transition-all duration-300 hover:transform hover:scale-105">
                  <Wallet className="mr-2 h-5 w-5" />
                  Buy $GOON
                </Button>
              </Link>
              
              <Link href="/token/whitepaper">
                <Button variant="outline" className="px-6 md:px-8 py-3 rounded-full text-base md:text-lg font-semibold">
                  <ChevronRight className="mr-2 h-5 w-5" />
                  Whitepaper
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Right Content - Token Image */}
          <motion.div 
            className="w-full md:w-1/2 relative"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Image 
              src="/token/gf_token.jpg"
              alt="GOON Token"
              width={500}
              height={500}
              className="rounded-full border-4 border-pink-500/20 shadow-2xl mx-auto md:mx-0"
              priority
            />
          </motion.div>
        </div>
        
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-transparent" />
      </div>

      {/* Token Stats Section */}
      <div className="bg-black/50 backdrop-blur-xl border-y border-pink-500/20">
        <div className="container mx-auto py-12 px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <TokenStat label="Market Cap" value="$1M" />
            <TokenStat label="Total Supply" value="69,000,000,000" />
            <TokenStat label="Holders" value="100+" />
            <TokenStat label="Price" value="$0.00001449275" />
          </div>
        </div>
      </div>

      {/* Token Utility Section */}
      <div className="container mx-auto py-16 px-4">
        <h2 className="text-3xl font-bold mb-12 text-center">
          $GOON Token <span className="text-pink-500">Utility</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <UtilityCard 
            title="Premium Features"
            description="Access exclusive AI model features, unlimited chats, and custom model creation"
            icon="✨"
          />
          <UtilityCard 
            title="Governance"
            description="Vote on platform features, AI model guidelines, and ecosystem decisions"
            icon="🏛️"
          />
          <UtilityCard 
            title="Rewards"
            description="Earn tokens through platform engagement, content creation, and staking"
            icon="💎"
          />
        </div>
      </div>

      {/* AI Integration Showcase */}
      <div className="relative bg-black/80 py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Unlock Premium AI <span className="text-[#ff4d8d]">Companions</span>
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Use $GOON tokens to access exclusive AI models, premium features, and unique experiences.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              '/ai-models/sofia/Sofia.jpeg',
              '/ai-models/luna/Luna.jpeg',
              '/ai-models/valeria/Valeria.jpeg'
            ].map((image, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="relative group"
              >
                <div className="aspect-[3/4] relative overflow-hidden rounded-2xl">
                  <Image
                    src={image}
                    alt="AI Companion"
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-white">Premium Model</h3>
                        <div className="flex items-center gap-2">
                          <span className="bg-pink-500/20 text-pink-500 px-2 py-0.5 rounded-full text-sm">
                            500 $GOON
                          </span>
                        </div>
                      </div>
                      <Button size="sm" className="bg-[#ff4d8d] hover:bg-[#ff3377]">
                        Unlock
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </BaseLayout>
  );
}

function TokenStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className="text-2xl font-bold text-white">{value}</span>
    </div>
  );
}

function UtilityCard({ title, description, icon }: { title: string; description: string; icon: string }) {
  return (
    <div className="bg-black/50 backdrop-blur-xl p-6 rounded-2xl border border-pink-500/10 hover:border-pink-500/30 transition-all duration-300">
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}