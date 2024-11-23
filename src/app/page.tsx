// Import React and various components
import React from "react";
import { Button } from "@/components/ui/button";
// import { Card, CardContent } from "@/components/ui/card";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import BaseLayout from "@/components/BaseLayout";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"; // Authentication utility
import prisma from "@/lib/clients/prisma"; // Prisma client for interacting with the database
import Link from "next/link";
import Image from "next/image";
import { Users } from 'lucide-react';
import ChatButton from "@/components/ChatButton";
import AuthWrapper from "@/components/ClientAuthWrapper";
import CreateAIButton from "@/components/CreateAIButton";

// Function to fetch featured AI models from the database
async function getFeaturedModels() {
  try {
    console.log('🔍 Fetching featured models...');
    
    const models = await prisma.aIModel.findMany({
      where: {
        isPrivate: false,
        isAnime: false
      },
      select: {
        id: true,
        name: true,
        personality: true,
        imageUrl: true,
        followerCount: true,
        createdBy: {
          select: {
            name: true,
            id: true,
          }
        }
      },
      orderBy: {
        followerCount: 'desc'
      },
      take: 8,
    });

    console.log('📊 Found models:', models.length);
    console.log('📝 Models data:', JSON.stringify(models, null, 2));

    return models;
  } catch (error) {
    console.error('❌ Error fetching featured models:', error);
    return [];
  }
}

// Default export - main function for rendering the Home page
export default async function Home() {
  const { getUser } = getKindeServerSession(); // Get the authentication session
  const user = await getUser(); // Retrieve user information if logged in
  const featuredModels = await getFeaturedModels(); // Fetch featured AI models

  return (
    <AuthWrapper isAuthenticated={!!user}> {/* Ensure authentication context */}
      <BaseLayout> {/* Base layout that wraps the content of the page */}
        {/* Beta Banner */}
        <div className="bg-gradient-to-r from-pink-500/90 to-purple-600/90 text-white p-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">
              🚀 BETA
            </span>
            <span className="text-white/90">
              Full launch coming soon - join the waitlist!
            </span>
          </div>
          <Button variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 text-white">
            Join Waitlist →
          </Button>
        </div>

        {/* Hero Section */}
        <div className="relative bg-black text-white">
          <div className="container mx-auto flex items-center justify-between py-16 px-4 md:px-6">
            {/* Left Content */}
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

            {/* Right Content - Image Group */}
            <div className="hidden md:block w-1/2 relative h-[400px]">
              <Image
                src="/banner-models.jpeg"
                alt="AI Companions"
                fill
                className="object-cover object-center rounded-2xl"
                priority
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent" />
            </div>
          </div>
          
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-transparent" />
        </div>

        {/* Featured AI Characters Section */}
        <div className="container mx-auto py-16">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">
              Most Popular <span className="text-pink-500">AI Girlfriends</span>
            </h2>
            <Link href="/community">
              <Button variant="outline">View All Models</Button> {/* Button to view all AI models */}
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredModels.map((model) => ( // Loop through the featured models to display each one
              <Link 
                href={`/community/AIModelProfile/${model.id}`} // Link to individual AI model profile
                key={model.id}
                className="group cursor-pointer"
              >
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden">
                  {/* New Badge */}
                  <div className="absolute top-3 left-3 z-20">
                    <span className="bg-pink-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                      ⚡ New
                    </span>
                  </div>

                  {/* Chat Button */}
                  <ChatButton modelId={model.id} /> {/* Button to chat with the AI model */}

                  {/* Main Image */}
                  <Image
                    src={model.imageUrl || "/placeholder.jpg"} // AI model's image, or placeholder if not available
                    alt={model.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Content Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">{model.name}</h3>
                        <p className="text-sm text-gray-200">26 years</p> {/* Age (static value here) */}
                      </div>
                      <div className="flex items-center gap-1 bg-black/30 px-2 py-1 rounded-full">
                        <Users size={14} className="text-white" />
                        <span className="text-sm text-white font-medium">
                          {model.followerCount?.toLocaleString() || '0'} {/* Follower count */}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-200 mt-2 line-clamp-2">
                      {model.personality} {/* AI model personality description */}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </BaseLayout>
    </AuthWrapper>
  );
}
