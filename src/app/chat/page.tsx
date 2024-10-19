'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import BaseLayout from '@/components/BaseLayout';
import { ChatRoomList, ExtendedChatRoom as ComponentExtendedChatRoom } from '@/components/chat/ChatRoomList';
import ClientChatMessages from '@/components/chat/ClientChatMessages';
import { getChatRooms, createChatRoom, deleteChatRoom } from '@/app/api/chat/client-actions';
import { useToast } from '@/hooks/use-toast';
import { ExtendedChatRoom as LocalExtendedChatRoom } from '@/types/chat';
import { fetchAIModel } from '@/lib/api/ai-models';
import { getCurrentUser } from '@/lib/session';
import { AIModel } from '@/types/AIModel';

// Add this function near the top of your component
const mapComponentToLocalRoom = (room: ComponentExtendedChatRoom): LocalExtendedChatRoom => ({
  ...room,
  aiModelId: room.aiModel?.id || '',
  aiModelImageUrl: room.aiModel?.imageUrl || null,
  name: room.name || '',
  createdAt: room.createdAt || new Date(),
  updatedAt: room.updatedAt || new Date(),
  messages: room.messages || [],
  aiModel: room.aiModel ? {
    ...room.aiModel,
    createdBy: (room.aiModel as AIModel).createdBy || 'SYSTEM',
  } : undefined
});

export default function ChatPage() {
  const [chatRooms, setChatRooms] = useState<LocalExtendedChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<LocalExtendedChatRoom | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();
  const modelId = searchParams.get('modelId');
  const { toast } = useToast();

  // Fetch chat rooms from server
  const fetchChatRooms = useCallback(async () => {
    setIsLoading(true);
    try {
      const rooms = await getChatRooms();
      setChatRooms(rooms as LocalExtendedChatRoom[]);
      
      if (modelId) {
        const modelRoom = (rooms as LocalExtendedChatRoom[]).find(room => room.users.some(user => user.id === modelId));
        if (modelRoom) {
          setSelectedRoom(modelRoom);
        }
      }
    } catch (error) {
      console.error('Failed to fetch chat rooms:', error);
      toast({
        title: "Error",
        description: "Failed to fetch chat rooms. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, modelId]);

  useEffect(() => {
    fetchChatRooms();
  }, [fetchChatRooms]);

  const handleDeleteRoom = async (roomId: string) => {
    try {
      await deleteChatRoom(roomId);
      setChatRooms(prevRooms => prevRooms.filter(room => room.id !== roomId));
      if (selectedRoom?.id === roomId) {
        setSelectedRoom(null);
      }
      toast({
        title: "Success",
        description: "Chat room deleted successfully.",
      });
    } catch (error) {
      console.error('Failed to delete room:', error);
      toast({
        title: "Error",
        description: "Failed to delete chat room. Please try again.",
        variant: "destructive",
      });
    }
  };

  const selectOrCreateRoom = useCallback(async (modelId: string) => {
    try {
      if (!modelId) {
        throw new Error('Model ID is undefined');
      }

      const existingRoom = chatRooms.find(room => room.aiModelId === modelId);

      if (existingRoom) {
        setSelectedRoom(existingRoom);
        return;
      }

      const AIModel = await fetchAIModel(modelId);
      if (!AIModel) throw new Error('Failed to fetch AI model details');

      console.log('Creating new chat room for model:', AIModel);
      const newRoom = await createChatRoom(`Chat with ${AIModel.name}`, AIModel.id);
      console.log('New room created:', newRoom);

      // Assuming you have a way to get the current user, e.g., from a context or state
      const currentUser = await getCurrentUser(); // You need to implement this function

      const extendedNewRoom: LocalExtendedChatRoom = {
        ...newRoom,
        users: [
          {
            id: currentUser?.id || '',
            name: currentUser?.name || '',
            image: currentUser?.image || null,
            createdAt: new Date(),
            updatedAt: new Date(),
            email: currentUser?.email || '',
            isSubscribed: currentUser?.isSubscribed || false,
            customerId: currentUser?.customerId || null,
            bio: currentUser?.bio || null,
            isAI: false
          },
          {
            id: AIModel.id,
            name: AIModel.name,
            image: AIModel.imageUrl || null,
            createdAt: new Date(),
            updatedAt: new Date(),
            email: `${AIModel.name.toLowerCase().replace(/\s+/g, '')}@ai.model`,
            isSubscribed: false,
            customerId: null,
            bio: null,
            isAI: true
          }
        ],
        messages: [],
        aiModelId: AIModel.id,
        aiModel: {
          ...AIModel,
          imageUrl: AIModel.imageUrl || null,
          createdBy: (AIModel as AIModel).createdBy || 'SYSTEM',
        },
        aiModelImageUrl: AIModel.imageUrl || null,
      };

      setChatRooms(prevRooms => [...prevRooms, extendedNewRoom]);
      setSelectedRoom(extendedNewRoom);
    } catch (error) {
      console.error('Error in selectOrCreateRoom:', error);
      toast({
        title: "Error",
        description: `Failed to create chat room: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    }
  }, [chatRooms, toast]);

  useEffect(() => {
    if (modelId && !isLoading) {
      selectOrCreateRoom(modelId);
    }
  }, [modelId, isLoading, selectOrCreateRoom]);

  // If loading, show a loading screen
  if (isLoading) {
    return (
      <BaseLayout>
        <div className="flex items-center justify-center h-full">Loading chat rooms...</div>
      </BaseLayout>
    );
  }

  return (
    <BaseLayout>
      <div className="flex h-full bg-background">
        <ChatRoomList
          chatRooms={chatRooms.map(room => ({
            ...room,
            aiModel: room.aiModel ? {
              ...room.aiModel,
              imageUrl: room.aiModel.imageUrl || '', // Ensure imageUrl is always a string
              createdAt: new Date(),
              updatedAt: new Date(),
              userId: '',
              appearance: '',
              backstory: '',
              hobbies: '',
              likes: '',
              dislikes: ''
            } : null
          }))}
          selectedRoom={selectedRoom && {
            ...selectedRoom,
            aiModel: selectedRoom.aiModel ? {
              ...selectedRoom.aiModel,
              imageUrl: selectedRoom.aiModel.imageUrl || '', // Ensure imageUrl is always a string
              createdAt: new Date(),
              updatedAt: new Date(),
              userId: '',
              appearance: '',
              backstory: '',
              hobbies: '',
              likes: '',
              dislikes: ''
            } : null
          }}
          onSelectRoom={(room: ComponentExtendedChatRoom) => setSelectedRoom(mapComponentToLocalRoom(room))}
          onDeleteRoom={handleDeleteRoom}
        />
        <div className="flex-1 flex flex-col">
          {selectedRoom ? (
            <ClientChatMessages chatRoom={selectedRoom} />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-foreground">Select a chat room to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </BaseLayout>
  );
}
