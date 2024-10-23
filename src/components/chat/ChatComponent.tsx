'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChatRoomList, ExtendedChatRoom as ComponentExtendedChatRoom } from '@/components/chat/ChatRoomList';
import ClientChatMessages from '@/components/chat/ClientChatMessages';
import { getChatRooms, createChatRoom, deleteChatRoom } from '@/app/api/chat/client-actions';
import { useToast } from '@/hooks/use-toast';
import { ExtendedChatRoom as LocalExtendedChatRoom } from '@/types/chat';
import { fetchAIModel } from '@/lib/api/ai-models';
import { User } from '@prisma/client';

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
    createdBy: (room.aiModel as unknown as { createdBy?: string }).createdBy || 'SYSTEM',
    isFollowing: false, // Add this line
  } : undefined
});

const ChatComponent = () => {
  const [chatRooms, setChatRooms] = useState<LocalExtendedChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<LocalExtendedChatRoom | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const searchParams = useSearchParams();
  const modelId = searchParams.get('modelId');
  const { toast } = useToast();
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await fetch('/api/user/current');
      if (!response.ok) {
        throw new Error('Failed to fetch current user');
      }
      const user = await response.json();
      setCurrentUser(user);
    } catch (error) {
      console.error('Error fetching current user:', error);
      toast({
        title: "Error",
        description: "Failed to fetch user information. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

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
    if (isCreatingRoom) return;
    setIsCreatingRoom(true);
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

      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const extendedNewRoom: LocalExtendedChatRoom = {
        ...newRoom,
        users: [
          {
            id: currentUser.id,
            name: currentUser.name || '',
            image: currentUser.image || null,
            createdAt: new Date(),
            updatedAt: new Date(),
            email: currentUser.email || '',
            isSubscribed: currentUser.isSubscribed || false,
            customerId: currentUser.customerId || null,
            bio: currentUser.bio || null,
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
          createdBy: (AIModel as unknown as { createdBy?: string }).createdBy || 'SYSTEM',
          isFollowing: false,
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
    } finally {
      setIsCreatingRoom(false);
    }
  }, [chatRooms, toast, currentUser, isCreatingRoom]);

  useEffect(() => {
    if (modelId && !isLoading && !isCreatingRoom) {
      selectOrCreateRoom(modelId);
    }
  }, [modelId, isLoading, selectOrCreateRoom, isCreatingRoom]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Loading chat rooms...</div>;
  }

  return (
    <div className="flex h-full bg-background">
      <ChatRoomList
        isLoading={isLoading}
        chatRooms={chatRooms.map(room => ({
          ...room,
          aiModel: room.aiModel ? {
            ...room.aiModel,
            imageUrl: room.aiModel.imageUrl || '',
            name: room.aiModel.name || 'AI Model',  // Ensure name is set
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
            imageUrl: selectedRoom.aiModel.imageUrl || '',
            name: selectedRoom.aiModel.name || 'AI Model',  // Ensure name is set
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
          <ClientChatMessages 
            chatRoom={{
              ...selectedRoom,
              aiModel: selectedRoom.aiModel ? {
                ...selectedRoom.aiModel,
                name: selectedRoom.aiModel.name || 'AI Model',
                imageUrl: selectedRoom.aiModel.imageUrl || '',
                id: selectedRoom.aiModel.id || '',
                createdAt: selectedRoom.aiModel.createdAt || new Date(),
                updatedAt: selectedRoom.aiModel.updatedAt || new Date(),
                personality: selectedRoom.aiModel.personality || '',
                appearance: selectedRoom.aiModel.appearance || '',
                backstory: selectedRoom.aiModel.backstory || '',
                hobbies: selectedRoom.aiModel.hobbies || '',
                likes: selectedRoom.aiModel.likes || '',
                dislikes: selectedRoom.aiModel.dislikes || '',
                userId: selectedRoom.aiModel.userId || '',
                followerCount: selectedRoom.aiModel.followerCount || 0,
              } : null
            }} 
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-foreground">Select a chat room to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatComponent;
