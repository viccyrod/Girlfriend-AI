"use client";

import { Button } from "@/components/ui/button";
import { Users, MessageSquare, Sparkles, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from 'next/image';
import { useEffect, useState } from "react";
import { AIModel } from "@prisma/client";
import { getOrCreateChatRoom } from '@/lib/actions/chat';

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
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div className="h-8 w-64 bg-gray-800/50 rounded-lg animate-pulse" />
            <div className="h-10 w-32 bg-gray-800/50 rounded-full animate-pulse" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="group">
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-800/30 backdrop-blur-sm animate-pulse">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="h-6 w-24 bg-gray-700/50 rounded mb-2" />
                    <div className="h-4 w-16 bg-gray-700/50 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 md:py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 text-transparent bg-clip-text mb-2">
              Meet Your New Girlfriends
            </h2>
            <p className="text-gray-400 text-sm sm:text-base">
              Discover and connect with unique AI personalities
            </p>
          </div>
          <Button 
            onClick={() => router.push('/community/create-ai-model')} 
            className="relative group overflow-hidden bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-2 px-4 rounded-full transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/25"
          >
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="relative flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Your Own
            </span>
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
                  <span className="bg-gradient-to-r from-pink-500 to-purple-500 text-white text-[10px] sm:text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    New
                  </span>
                </div>

                {/* Chat Button */}
                <button 
                  className="absolute top-2 sm:top-3 right-2 sm:right-3 z-20 bg-white/10 backdrop-blur-sm p-1.5 sm:p-2 rounded-full hover:bg-white/20 transition-all duration-300 border border-white/10"
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      const chatRoom = await getOrCreateChatRoom(aiModel.id);
                      if (chatRoom?.id) {
                        window.sessionStorage.setItem('pendingChatRoomId', chatRoom.id);
                        router.push('/chat');
                        router.refresh();
                      }
                    } catch (error) {
                      console.error('Failed to create chat room:', error);
                    }
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
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    priority={false}
                    className="object-cover transition-all duration-500 group-hover:scale-[1.02]"
                  />
                </div>

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-90 group-hover:opacity-75 transition-opacity duration-300" />

                {/* Content Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 transform transition-transform duration-300 group-hover:translate-y-[-4px]">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-base sm:text-xl font-bold text-white mb-0.5 sm:mb-1">{aiModel.name}</h3>
                      <p className="text-xs sm:text-sm text-gray-300">{aiModel.age || '26'} years</p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-sm px-2 py-1 rounded-full border border-white/10">
                      <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-300" />
                      <span className="text-xs sm:text-sm text-gray-300 font-medium">
                        {aiModel.followerCount?.toLocaleString() || '0'}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-300/90 line-clamp-2 font-light">
                    {aiModel.personality}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 