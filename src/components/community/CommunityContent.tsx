"use client";

import { Button } from "@/components/ui/button";
import { Users, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from 'next/image';
import { useEffect, useState } from "react";
import { AIModel } from "@prisma/client";

interface ExtendedAIModel extends AIModel {
  createdBy: {
    name: string;
    id: string;
  };
  followerCount: number;
}

interface CommunityProps {
  filterIsAnime?: boolean;
  initialModels: ExtendedAIModel[];
}

const getModelImage = (model: ExtendedAIModel) => {
  if (!model.imageUrl) return '/images/placeholder.png';
  
  // Handle default models
  if (['Kira', 'Luna', 'Nova', 'Aria'].includes(model.name)) {
    return model.imageUrl;
  }
  
  // Handle user-created models
  if (model.imageUrl.startsWith('http')) {
    return model.imageUrl;
  }
  
  return '/images/placeholder.png';
};

export default function CommunityContent({ filterIsAnime = false, initialModels }: CommunityProps) {
  const router = useRouter();
  const [aiModels, setAiModels] = useState<ExtendedAIModel[]>(initialModels);
  const [isLoading, setIsLoading] = useState(false);

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

  return (
    <div className="container mx-auto py-6 md:py-12 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold">
          Meet Your New <span className="text-pink-500">Girlfriends</span>
        </h2>
        <Button onClick={() => router.push('/community/create-ai-model')} variant="outline" className="w-full sm:w-auto">
          Create Your Own
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {aiModels?.map((aiModel) => (
          <div 
            key={aiModel.id}
            onClick={() => handleViewProfile(aiModel.id)}
            className="group cursor-pointer"
          >
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden">
              {/* New Badge */}
              <div className="absolute top-2 sm:top-3 left-2 sm:left-3 z-20">
                <span className="bg-pink-500 text-white text-[10px] sm:text-xs px-2 py-1 rounded-full font-medium">
                  ⚡ New
                </span>
              </div>

              {/* Chat Button */}
              <button 
                className="absolute top-2 sm:top-3 right-2 sm:right-3 z-20 bg-white/20 backdrop-blur-sm p-1.5 sm:p-2 rounded-full hover:bg-white/30 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/chat/${aiModel.id}`);
                }}
              >
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </button>

              {/* Main Image */}
              <div className="relative w-full h-full">
                <Image
                  src={getModelImage(aiModel)}
                  alt={aiModel.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  priority={false}
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {/* Content Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base sm:text-xl font-bold text-white mb-0.5 sm:mb-1">{aiModel.name}</h3>
                    <p className="text-xs sm:text-sm text-gray-200">{aiModel.age || '26'} years</p>
                  </div>
                  <div className="flex items-center gap-1 bg-black/30 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                    <Users size={12} className="text-white" />
                    <span className="text-xs sm:text-sm text-white font-medium">
                      {aiModel.followerCount?.toLocaleString() || '0'}
                    </span>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-gray-200 mt-1 sm:mt-2 line-clamp-2">
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