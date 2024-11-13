'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AIModelProfile from '@/app/community/AIModelProfile';
import { fetchAIModel } from '@/app/api/ai-models';
import { toggleFollowAIModel } from '@/app/api/ai-models/follow-ai-model';
import BaseLayout from '@/components/BaseLayout';
import { AiModel } from '@/types/chat';
import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs';
import { getOrCreateChatRoom } from '@/lib/actions/chat';

export default function AIModelProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [AIModel, setAIModel] = useState<AiModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const { user } = useKindeBrowserClient();
  // const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    async function loadAIModel() {
      try {
        setIsLoading(true);
        const model = await fetchAIModel(params.id);
        if (model) {
          setAIModel(model);
          // Fetch initial follow state
          const response = await fetch(`/api/follow/${params.id}`);
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
  }, [params.id]);

  const handleClose = () => {
    // setIsOpen(false);
    router.push('/community');
  };

  const handleFollowToggle = async (): Promise<boolean> => {
    try {
      const newFollowState = await toggleFollowAIModel(params.id);
      setIsFollowing(newFollowState);
      // Refetch AI model data to get updated follower count
      const updatedModel = await fetchAIModel(params.id);
      if (updatedModel) {
        setAIModel(updatedModel);
      }
      return newFollowState;
    } catch (error) {
      console.error('Failed to toggle follow state', error);
      // Optionally, show an error message to the user
      return isFollowing; // Return current state if toggle fails
    }
  };

  const handleStartChat = async () => {
    try {
      if (!user) {
        router.push('/login');
        return;
      }

      const chatRoom = await getOrCreateChatRoom(params.id);
      if (chatRoom) {
        router.push(`/chat/${params.id}`);
      }
    } catch (error) {
      console.error('Failed to create chat room:', error);
      // Handle error appropriately
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!AIModel) return <div>AI Model not found</div>;

  return (
    <BaseLayout>
      <AIModelProfile 
        aiModel={AIModel}
        onClose={handleClose}
        isFollowing={isFollowing}
        onFollowToggle={handleFollowToggle}
        // initialFollowState={isFollowing}
        // isOpen={isOpen}
        currentUserId={user?.id || ''}
        onStartChat={handleStartChat}
      />
    </BaseLayout>
  );
}
