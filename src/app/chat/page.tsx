'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import BaseLayout from '@/components/BaseLayout';
import { ChatRoomList } from '@/components/chat/ChatRoomList';
import ClientChatMessages from '@/components/chat/ClientChatMessages';
import { getChatRooms, createChatRoom, deleteChatRoom } from '@/app/api/chat/client-actions';
import { useToast } from '@/hooks/use-toast';
import { ExtendedChatRoom } from '@/types/chat';
import { fetchAIModel } from '@/lib/api/ai-models';

export default function ChatPage() {
  const [chatRooms, setChatRooms] = useState<ExtendedChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ExtendedChatRoom | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();
  const modelId = searchParams.get('modelId');
  const { toast } = useToast();

  // Fetch chat rooms from server
  const fetchChatRooms = useCallback(async () => {
    setIsLoading(true);
    try {
      const rooms = await getChatRooms();
      setChatRooms(rooms as ExtendedChatRoom[]);
      
      if (modelId) {
        const modelRoom = (rooms as ExtendedChatRoom[]).find(room => room.users.some(user => user.id === modelId));
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

  // Handle model-specific chat logic if a modelId is present in the URL
  const handleModelChat = useCallback(async (modelId: string) => {
    try {
      const existingRoom = chatRooms.find(room => 
        room.users.some(user => user.id === modelId)
      );

      if (existingRoom) {
        setSelectedRoom(existingRoom);
        return;
      }

      const aiModel = await fetchAIModel(modelId);

      if (!aiModel) {
        throw new Error('Failed to fetch AI model details');
      }

      const newRoom = await createChatRoom(`Chat with ${aiModel.name}`, modelId);
      const extendedNewRoom: ExtendedChatRoom = {
        ...newRoom,
        users: [{
          id: modelId,
          name: aiModel.name,
          image: aiModel.image,
          createdAt: new Date(),
          updatedAt: new Date(),
          email: `${aiModel.name.toLowerCase().replace(/\s+/g, '')}@ai.model`,
          isSubscribed: false,
          customerId: null,
          bio: null,
          isAI: true
        }],
        messages: []
      };

      setChatRooms(prevRooms => [...prevRooms, extendedNewRoom]);
      setSelectedRoom(extendedNewRoom);
    } catch (error) {
      console.error('Error in handleModelChat:', error);
      toast({
        title: "Error",
        description: "Failed to create chat room. Please try again.",
        variant: "destructive",
      });
    }
  }, [chatRooms, createChatRoom, fetchAIModel, setChatRooms, setSelectedRoom, toast]);

  useEffect(() => {
    if (modelId && !isLoading) {
      const existingRoom = chatRooms.find(room =>
        room.users.some(user => user.id === modelId)
      );

      if (existingRoom) {
        setSelectedRoom(existingRoom);
      } else {
        handleModelChat(modelId);
      }
    }
  }, [modelId, chatRooms, isLoading, handleModelChat]);

  // If loading, show a loading screen
  if (isLoading) {
    return (
      <BaseLayout>
        <div className="flex items-center justify-center h-full">Loading chat rooms...</div>
      </BaseLayout>
    );
  }

  return (
    <BaseLayout renderRightPanel={false}>
      <div className="flex h-full bg-background">
        <ChatRoomList
          chatRooms={chatRooms as ExtendedChatRoom[]}
          selectedRoom={selectedRoom as ExtendedChatRoom | null}
          onSelectRoom={(room: ExtendedChatRoom) => setSelectedRoom(room)}
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
