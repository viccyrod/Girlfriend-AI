'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AIModelProfile from '@/app/community/AIModelProfile';
import { fetchAIModel } from '@/app/api/ai-models';
import { toggleFollowAIModel } from '@/app/api/ai-models/follow-ai-model';
import { AiModel } from '@/types/chat';
import { getOrCreateChatRoom } from '@/lib/actions/chat';

interface AIModelProfileClientProps {
  modelId: string;
  userId: string;
}

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

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!AIModel) return <div>AI Model not found</div>;

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