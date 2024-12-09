'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AIModelProfile from '@/components/community/AIModelProfile';
import { fetchAIModel } from '@/app/api/ai-models';
import { toggleFollowAIModel } from '@/app/api/ai-models/follow-ai-model';
import { AiModel } from '@/types/chat';
import { getOrCreateChatRoom } from '@/lib/actions/chat';

interface AIModelProfileClientProps {
  modelId: string;
  userId: string;
}

const LoadingProfile = () => (
  <div className="w-full h-screen bg-gradient-to-b from-gray-900 via-purple-900/20 to-gray-900">
    {/* Header Skeleton */}
    <div className="relative h-64 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-pink-500/20 animate-gradient-x">
      <div className="absolute bottom-0 left-8 transform translate-y-1/2">
        <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gray-800/50 animate-pulse" />
      </div>
    </div>

    {/* Content Skeleton */}
    <div className="px-4 sm:px-8 pt-24 sm:pt-28">
      {/* Name and Bio */}
      <div className="space-y-4 mb-8">
        <div className="h-8 w-64 bg-gray-800/50 rounded-lg animate-pulse" />
        <div className="h-4 w-48 bg-gray-800/50 rounded animate-pulse" />
        <div className="flex gap-4">
          <div className="h-10 w-32 bg-gray-800/50 rounded-full animate-pulse" />
          <div className="h-10 w-32 bg-gray-800/50 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="w-full h-12 bg-gray-800/50 rounded-full mb-8 animate-pulse" />

      {/* Content Cards */}
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-800/30 rounded-xl overflow-hidden backdrop-blur-sm">
            <div className="p-4 border-b border-gray-700/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-700/50 animate-pulse" />
                <div>
                  <div className="h-4 w-32 bg-gray-700/50 rounded animate-pulse mb-2" />
                  <div className="h-3 w-24 bg-gray-700/50 rounded animate-pulse" />
                </div>
              </div>
            </div>
            <div className="aspect-video bg-gray-700/50 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default function AIModelProfileClient({ modelId, userId }: AIModelProfileClientProps) {
  const router = useRouter();
  const [AIModel, setAIModel] = useState<AiModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    async function loadAIModel() {
      try {
        setIsLoading(true);
        const model = await fetchAIModel(modelId);
        if (model) {
          setAIModel(model);
          // Fetch initial follow state
          const response = await fetch(`/api/follow/${modelId}`);
          const data = await response.json();
          setIsFollowing(data.isFollowing);
        } else {
          setError(new Error('AI Model not found'));
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An error occurred'));
      } finally {
        setIsLoading(false);
      }
    }

    loadAIModel();
  }, [modelId]);

  const handleClose = () => {
    router.push('/community');
  };

  const handleFollowToggle = async (): Promise<boolean> => {
    try {
      const newFollowState = await toggleFollowAIModel(modelId);
      setIsFollowing(newFollowState);
      // Refetch AI model data to get updated follower count
      const updatedModel = await fetchAIModel(modelId);
      if (updatedModel) {
        setAIModel(updatedModel);
      }
      return newFollowState;
    } catch (error) {
      console.error('Failed to toggle follow state', error);
      return isFollowing; // Return current state if toggle fails
    }
  };

  const handleStartChat = async () => {
    try {
      if (!userId) {
        router.push('/login');
        return;
      }

      const chatRoom = await getOrCreateChatRoom(modelId);
      if (chatRoom) {
        router.push(`/chat/${modelId}`);
      }
    } catch (error) {
      console.error('Failed to create chat room:', error);
    }
  };

  if (isLoading) return <LoadingProfile />;
  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 via-purple-900/20 to-gray-900 text-white p-4">
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-8 max-w-md w-full text-center space-y-4">
        <div className="w-16 h-16 mx-auto mb-4 text-pink-500">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold">Error Loading Profile</h2>
        <p className="text-gray-400">{error.message}</p>
        <button 
          onClick={() => router.push('/community')}
          className="mt-4 px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full font-medium hover:from-pink-600 hover:to-purple-600 transition-all duration-300"
        >
          Return to Community
        </button>
      </div>
    </div>
  );
  if (!AIModel) return null;

  return (
    <AIModelProfile 
      aiModel={AIModel}
      onClose={handleClose}
      isFollowing={isFollowing}
      onFollowToggle={handleFollowToggle}
      currentUserId={userId}
      onStartChat={handleStartChat}
    />
  );
} 