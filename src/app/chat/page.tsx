'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import BaseLayout from '@/components/BaseLayout';
import ChatRoomList from '@/components/chat/ChatRoomList';
import ClientChatMessages from '@/components/chat/ClientChatMessages';
import { getChatRooms, createChatRoom } from '@/app/api/chat/client-actions';
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

  // Handle model-specific chat logic if a modelId is present in the URL
  const handleModelChat = useCallback(async (modelId: string) => {
    try {
      // Check if a room with this model already exists
      const existingRoom = chatRooms.find(room => 
        room.users.some(user => user.id === modelId)
      );

      if (existingRoom) {
        setSelectedRoom(existingRoom);
        return;
      }

      // Fetch the AI model details
      const aiModel = await fetchAIModel(modelId);

      if (!aiModel) {
        throw new Error('Failed to fetch AI model details');
      }

      const newRoom = await createChatRoom(`Chat with ${aiModel.name}`, [modelId]);
      const extendedNewRoom: ExtendedChatRoom = {
        ...newRoom,
        users: [{
          id: modelId,
          name: aiModel.name,
          image: aiModel.imageUrl,
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
    const handleModelChat = async (modelId: string) => {
      try {
        let roomToSelect: ExtendedChatRoom | null = null;
        const existingRoom = chatRooms.find(room =>
          room.users.some(user => user.id === modelId)
        );

        if (existingRoom) {
          roomToSelect = existingRoom;
        } else {
          const newRoom = await createChatRoom(`Chat with ${modelId}`, [modelId]);
          const extendedNewRoom = newRoom as ExtendedChatRoom;
          setChatRooms((prevRooms) => [...prevRooms, extendedNewRoom]);
          roomToSelect = extendedNewRoom;
        }

        setSelectedRoom(roomToSelect);
      } catch (error) {
        console.error('Failed to create or find chat room:', error);
        toast({
          title: "Error",
          description: "Failed to start chat. Please try again later.",
          variant: "destructive",
        });
      }
    };

    if (modelId) {
      handleModelChat(modelId);
    }
  }, [modelId, chatRooms, toast, createChatRoom]);

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
