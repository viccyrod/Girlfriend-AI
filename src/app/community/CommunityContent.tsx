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
}

const getModelImage = (model: ExtendedAIModel) => {
  if (!model.imageUrl) return '/images/placeholder.png';
  
  // Handle default models
  if (['Kira', 'Luna', 'Nova', 'Aria'].includes(model.name)) {
    return model.imageUrl; // These are now fixed in the API response
  }
  
  // Handle user-created models
  if (model.imageUrl.startsWith('http')) {
    return model.imageUrl;
  }
  
  return '/images/placeholder.png';
};

export default function Community({ filterIsAnime = false }: CommunityProps) {
  const router = useRouter();
  const [aiModels, setAiModels] = useState<ExtendedAIModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch('/api/ai-models');
        const data = await response.json();
        setAiModels(data);
      } catch (error) {
        console.error('Error fetching models:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchModels();
  }, []);

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
              <button 
                className="absolute top-3 right-3 z-20 bg-white/20 backdrop-blur-sm p-2 rounded-full hover:bg-white/30 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/chat/${aiModel.id}`);
                }}
              >
                <MessageSquare className="w-5 h-5 text-white" />
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
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">{aiModel.name}</h3>
                    <p className="text-sm text-gray-200">{aiModel.age || '26'} years</p>
                  </div>
                  <div className="flex items-center gap-1 bg-black/30 px-2 py-1 rounded-full">
                    <Users size={14} className="text-white" />
                    <span className="text-sm text-white font-medium">
                      {aiModel.followerCount?.toLocaleString() || '0'}
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
