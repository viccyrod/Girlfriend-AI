// src/components/chat/ChatComponent.tsx

"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ExtendedChatRoom } from '@/types/chat';
import { Message, MessageMetadata } from '@/types/message';
import { ChatRoomList } from './ChatRoomList';
import ModelProfile from './ModelProfile';
import { ChevronRight, Loader2, ChevronLeft, UserCircle2, Image as LucideImage } from 'lucide-react';
import ClientChatMessages from './ClientChatMessages';
import { deleteChatRoom, getOrCreateChatRoom } from '@/lib/actions/chat';
import { sendMessage } from '@/lib/actions/server/chat';
import { getChatRooms } from '@/lib/chat-client';

interface ChatComponentProps {
  initialChatRoom?: ExtendedChatRoom;
  modelId?: string;
  onError?: (error: Error) => void;
}

const ChatComponent = ({
  initialChatRoom,
  modelId,
  onError,
}: ChatComponentProps) => {
  const router = useRouter();
  const { toast } = useToast();

  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(!initialChatRoom && !!modelId);
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const [chatRooms, setChatRooms] = useState<ExtendedChatRoom[]>(
    initialChatRoom ? [initialChatRoom] : []
  );
  const [selectedRoom, setSelectedRoom] = useState<ExtendedChatRoom | null>(
    initialChatRoom || null
  );
  const [isProfileVisible, setIsProfileVisible] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [isMessageSending, setIsMessageSending] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [loadingRoomId, setLoadingRoomId] = useState<string | null>(null);
  const [isDeletingRoom, setIsDeletingRoom] = useState<string | null>(null);

  // Initialize chat
  const initializeChat = useCallback(async (retry = false) => {
    if (isInitialized && !retry) return;

    try {
      setInitError(null);
      setIsLoading(true);

      let activeRoom = initialChatRoom;
      
      // If modelId is provided but no initialChatRoom, create/get the room
      if (modelId && !initialChatRoom) {
        console.log('Fetching/creating room for model:', modelId);
        const rawRoom = await getOrCreateChatRoom(modelId);
        console.log('Raw Room Data:', rawRoom);
        
        if (!rawRoom) {
          throw new Error('Failed to create or get chat room');
        }

        activeRoom = {
          ...rawRoom,
          aiModelId: rawRoom.aiModelId || modelId,
          messages: (rawRoom.messages || []).map(msg => ({
            ...msg,
            role: msg.isAIMessage ? 'assistant' as const : 'user' as const,
            metadata: (typeof msg.metadata === 'object' ? msg.metadata : { type: 'text' }) as MessageMetadata
          })),
          users: rawRoom.users?.map(user => ({
            id: user.id,
            name: user.name || '',
            email: user.email || '',
            image: user.image,
            isSubscribed: false,
            customerId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            isAI: false,
            bio: null
          })) || [],
          aiModelImageUrl: rawRoom.aiModel?.imageUrl || null,
          createdBy: rawRoom.aiModel?.createdBy ? {
            id: rawRoom.aiModel.createdBy.id,
            name: rawRoom.aiModel.createdBy.name || '',
            email: rawRoom.aiModel.createdBy.email || '',
            imageUrl: rawRoom.aiModel.createdBy.image
          } : null,
          aiModel: rawRoom.aiModel ? {
            ...rawRoom.aiModel,
            createdAt: new Date(rawRoom.aiModel.createdAt),
            updatedAt: new Date(rawRoom.aiModel.updatedAt),
            voiceId: rawRoom.aiModel.voiceId || null,
            isFollowing: false,
            isAnime: false,
            age: null,
            isHumanX: rawRoom.aiModel.isHumanX || false,
            createdBy: rawRoom.aiModel.createdBy ? {
              id: rawRoom.aiModel.createdBy.id,
              name: rawRoom.aiModel.createdBy.name || '',
              email: rawRoom.aiModel.createdBy.email || '',
              imageUrl: rawRoom.aiModel.createdBy.image
            } : null
          } : null
        };
      }

      // Fetch all chat rooms
      const allRooms = await getChatRooms().catch((error: Error) => {
        console.error('Failed to fetch chat rooms:', error);
        return [];
      });

      // Combine rooms, ensuring no duplicates
      const uniqueRooms = [...allRooms];
      if (activeRoom && !uniqueRooms.some(room => room.id === activeRoom?.id)) {
        uniqueRooms.unshift(activeRoom);
      }

      console.log('Final rooms:', uniqueRooms);
      
      setChatRooms(uniqueRooms);
      
      if (activeRoom) {
        setSelectedRoom(activeRoom);
      }
      
      setIsInitialized(true);
    } catch (error) {
      console.error('Initialization error:', error);
      const typedError = error instanceof Error ? error : new Error('Failed to initialize chat');
      setInitError(typedError.message);
      if (onError) onError(typedError);
    } finally {
      setIsLoading(false);
    }
  }, [initialChatRoom, modelId, isInitialized, onError]);

  useEffect(() => {
    initializeChat();
  }, [initializeChat]);

  // Message handling
  const handleSendMessage = async (content: string, room: ExtendedChatRoom) => {
    try {
      setIsMessageSending(true);
      console.log('Sending message to room:', room.id);
      
      // Send message to server
      await sendMessage(room.id, content);

      // Update local state optimistically
      const newMessage = {
        id: `temp-${Date.now()}`,
        content,
        role: 'user' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        chatRoomId: room.id,
        isAIMessage: false,
        metadata: { type: 'text' },
        userId: null,
        user: null,
        aiModelId: null
      };

      setSelectedRoom(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...prev.messages, newMessage]
        };
      });

    } catch (error) {
      console.error('Error sending message:', error);
      setMessageError("Failed to send message");
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
        duration: 3000,
        role: "alert"
      });
      throw error;
    } finally {
      setIsMessageSending(false);
    }
  };

  // Room selection
  const handleRoomSelection = async (room: ExtendedChatRoom) => {
    try {
      setLoadingRoomId(room.id);
      setSelectedRoom(room);
      
      // Send greeting through dedicated endpoint
      if (room.aiModel) {
        console.log('Sending greeting for room:', room.id);
        setIsGeneratingResponse(true);
        const response = await fetch(`/api/chat/${room.id}/greeting`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('Greeting error:', error);
          throw new Error(error.details || 'Failed to generate greeting');
        }

        await response.json();
      }
    } catch (error) {
      console.error('Room selection error:', error);
      toast({
        title: "Error",
        description: "Failed to select chat room",
        variant: "destructive"
      });
    } finally {
      setLoadingRoomId(null);
      setIsGeneratingResponse(false);
    }
  };

  // Room deletion
  const handleDeleteRoom = async (roomId: string) => {
    try {
      setIsDeletingRoom(roomId);
      await deleteChatRoom(roomId);
      
      // Update local state
      setChatRooms(prev => prev.filter(room => room.id !== roomId));
      
      // If the deleted room was selected, clear selection
      if (selectedRoom?.id === roomId) {
        setSelectedRoom(null);
        router.push('/chat');
      }

      toast({
        title: "Success",
        description: "Chat room deleted successfully",
        role: "alert"
      });
    } catch (error) {
      console.error('Error deleting room:', error);
      toast({
        title: "Error",
        description: "Failed to delete chat room",
        variant: "destructive"
      });
    } finally {
      setIsDeletingRoom(null);
    }
  };

  // Setup SSE for real-time updates
  useEffect(() => {
    if (!selectedRoom) return;

    const eventSource = new EventSource(`/api/chat/${selectedRoom.id}/sse`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'message') {
          setSelectedRoom(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              messages: [...prev.messages, data.message]
            };
          });
        }
      } catch (error) {
        console.error('Error processing SSE message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [selectedRoom?.id]);

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      {/* Chat rooms list */}
      <div className={`
        ${selectedRoom ? 'hidden md:flex' : 'flex'} 
        flex-col w-full md:w-80 border-r border-[#1a1a1a]
      `}>
        <ChatRoomList
          chatRooms={chatRooms}
          selectedRoom={selectedRoom}
          onSelectRoom={handleRoomSelection}
          onDeleteRoom={handleDeleteRoom}
          isLoading={isLoading}
          loadingRoomId={loadingRoomId}
        />
      </div>

      {/* Chat messages container */}
      <div className={`
        flex-1 flex flex-col
        transition-all duration-300 ease-in-out
        ${selectedRoom ? 'flex' : 'hidden md:flex'}
        ${isProfileVisible ? 'md:mr-[400px]' : ''}
      `}>
        {selectedRoom ? (
          <ClientChatMessages
            chatRoom={selectedRoom}
            onSendMessage={(content: string) => handleSendMessage(content, selectedRoom)}
            isLoading={isMessageSending}
            isGeneratingResponse={isGeneratingResponse}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">
              Select a chat room to start messaging
            </p>
          </div>
        )}
      </div>

      {/* Profile sidebar */}
      <div className={`
        fixed md:absolute inset-y-0 right-0
        w-[85vw] md:w-[400px] border-l border-[#1a1a1a] 
        flex-shrink-0 bg-[#0a0a0a] 
        transition-transform duration-300 ease-in-out z-40
        ${isProfileVisible ? "translate-x-0 shadow-2xl" : "translate-x-full"}
        ${isProfileVisible && !selectedRoom ? "hidden md:block" : ""}
      `}>
        {/* Profile toggle button */}
        <button
          onClick={() => setIsProfileVisible(!isProfileVisible)}
          className="absolute left-0 top-6 -translate-x-full bg-[#1a1a1a] hover:bg-[#2a2a2a] p-2 pl-3 pr-4 rounded-l-md transition-all duration-200 flex items-center gap-2 text-sm text-white/80 hover:text-white"
          aria-label={isProfileVisible ? "Hide profile" : "Show profile"}
        >
          <UserCircle2 className="w-4 h-4" />
          <span className="hidden md:inline">
            {isProfileVisible ? "Hide Profile" : "View Profile"}
          </span>
          <ChevronRight
            className={`w-4 h-4 transform transition-transform duration-200 ${
              isProfileVisible ? "rotate-180" : ""
            }`}
          />
        </button>
        
        <div className="h-full overflow-y-auto scrollbar-pretty">
          <ModelProfile
            model={selectedRoom?.aiModel || null}
            onClose={() => setIsProfileVisible(false)}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;
