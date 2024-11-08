"use client";

import { useQuery } from "@tanstack/react-query";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Users, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from 'next/image';

interface AIModel {
  id: string;
  name: string;
  personality: string;
  imageUrl: string;
  age: number;
  createdBy: {
    name: string;
    id: string;
  };
  followerCount: number;
}


const fetchAIModels = async (filterIsAnime?: boolean): Promise<AIModel[]> => {
  const url = filterIsAnime !== undefined 
    ? `/api/ai-models?isAnime=${filterIsAnime}` 
    : '/api/ai-models';
    
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch AIModels');
  }
  return await response.json();
};

export default function CommunityContent({ filterIsAnime }: { filterIsAnime?: boolean }) {
  const router = useRouter();
  const { data: aiModels, isLoading, error } = useQuery<AIModel[]>({
    queryKey: ['publicAiModels', filterIsAnime],
    queryFn: () => fetchAIModels(filterIsAnime),
  });

  const handleViewProfile = (id: string) => {
    router.push(`/community/AIModelProfile/${id}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-12 px-4">
        <h1 className="text-4xl font-bold mb-12 text-center text-primary">Meet Your New Girlfriends</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="aspect-[3/4] relative rounded-xl overflow-hidden animate-pulse bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-12 text-red-500 text-xl">Error loading AI Models. Please try again later.</div>;
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">
          Meet Your New <span className="text-pink-500">Girlfriends</span>
        </h2>
        <Button onClick={() => router.push('/community/create-ai-model')} variant="outline">
          Create Your Own
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {aiModels?.map((aiModel) => (
          <div
            key={aiModel.id}
            onClick={() => handleViewProfile(aiModel.id)}
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
              <button className="absolute top-3 right-3 z-20 bg-white/20 backdrop-blur-sm p-2 rounded-full hover:bg-white/30 transition-colors">
                <MessageSquare className="w-5 h-5 text-white" />
              </button>

              {/* Main Image */}
              <Image
                src={aiModel.imageUrl || "/placeholder.jpg"}
                alt={aiModel.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {/* Content Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">{aiModel.name}</h3>
                    <p className="text-sm text-gray-200">{aiModel.age || '26'} years</p>
                  </div>
                  <div className="flex items-center gap-1 bg-black/30 px-2 py-1 rounded-full">
                    <Users size={14} className="text-white" />
                    <span className="text-sm text-white font-medium">
                      {aiModel.followerCount.toLocaleString()}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-200 mt-2 line-clamp-2">
                  {aiModel.personality}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
