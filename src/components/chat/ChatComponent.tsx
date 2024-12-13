// src/components/chat/ChatComponent.tsx

"use client";

import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ExtendedChatRoom, Message, MessageMetadata } from '@/types/chat';
import { ChatRoomList } from './ChatRoomList';
import { ChevronRight, Loader2, ChevronLeft } from 'lucide-react';
import { ClientChatMessages } from './ClientChatMessages';
import { deleteChatRoom, getOrCreateChatRoom } from '@/lib/actions/chat';
import { cn } from '@/lib/utils';
import { ChatInfoBar } from './ChatInfoBar';

interface ChatComponentProps {
  initialChatRoom?: ExtendedChatRoom;
  modelId?: string;
  onError?: (error: Error) => void;
}

export default function ChatComponent({
  initialChatRoom,
  modelId,
  onError,
}: ChatComponentProps) {
  // Core state
  const [chatRooms, setChatRooms] = useState<ExtendedChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ExtendedChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loadingRoomId, setLoadingRoomId] = useState<string | null>(null);
  const [isDeletingRoom, setIsDeletingRoom] = useState<string | null>(null);
  const handleRoomSelectionRef = useRef<(room: ExtendedChatRoom) => Promise<void>>();

  const router = useRouter();
  const { toast } = useToast();

  // Memoized transformations
  const transformMessage = useCallback((msg: any): Message => ({
    id: msg.id,
    content: msg.content,
    chatRoomId: msg.chatRoomId,
    createdAt: msg.createdAt,
    updatedAt: msg.updatedAt,
    isAIMessage: msg.isAIMessage,
    metadata: {
      type: msg.metadata?.type || 'text',
      imageUrl: msg.metadata?.imageUrl,
      prompt: msg.metadata?.prompt,
      audioData: msg.metadata?.audioData,
      isRead: msg.metadata?.isRead
    },
    userId: msg.userId,
    aiModelId: msg.aiModelId,
    role: msg.isAIMessage ? 'assistant' : 'user',
    user: msg.user
  }), []);

  const transformRoom = useCallback((room: any): ExtendedChatRoom => ({
    id: room.id,
    name: room.name || '',
    aiModelId: room.aiModelId || modelId || '',
    createdById: room.createdById || null,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
    messages: (room.messages || []).map(transformMessage),
    users: room.users || [],
    aiModel: room.aiModel ? {
      ...room.aiModel,
      age: room.aiModel.age || null,
      imageUrl: room.aiModel.imageUrl || null,
      voiceId: room.aiModel.voiceId || null,
      messageCount: room.aiModel.messageCount || 0,
      imageCount: room.aiModel.imageCount || 0,
      followerCount: room.aiModel.followerCount || 0,
      isPrivate: room.aiModel.isPrivate || false,
      isAnime: room.aiModel.isAnime || false,
      isHumanX: room.aiModel.isHumanX || false,
      status: room.aiModel.status || 'COMPLETED',
      createdBy: room.aiModel.createdBy || null
    } : null
  }), [modelId]);

  // Memoized handlers
  const generateGreeting = (aiModel: any): string => {
    if (!aiModel) return "Hi there! How can I help you today?";

    // Create a personalized greeting based on the AI's characteristics
    const greetings = [
      // Base greeting with name and a key personality trait
      `Hey! I'm ${aiModel.name}! ${aiModel.personality.split('.')[0]}.`,
      
      // Add a personal touch based on their characteristics
      aiModel.hobbies ? 
        `I love ${aiModel.hobbies.split(',')[0].toLowerCase()}` : '',
      
      // Add a conversation starter based on their interests
      aiModel.likes ? 
        `We should chat about ${aiModel.likes.split(',')[0].toLowerCase()}!` : '',
      
      // End with an inviting question
      "What's on your mind?"
    ];

    return greetings.filter(Boolean).join(' ');
  };

  // Fetch chat rooms only once on mount or when modelId changes
  useEffect(() => {
    const fetchChatRooms = async () => {
      try {
        const response = await fetch('/api/chat/rooms');
        const data = await response.json();
        const transformed = data.chatRooms.map(transformRoom);
        setChatRooms(transformed);

        // Check for pending room selection from sessionStorage
        const pendingRoomId = window.sessionStorage.getItem('pendingChatRoomId');
        if (pendingRoomId && handleRoomSelectionRef.current) {
          const pendingRoom = transformed.find((room: ExtendedChatRoom) => room.id === pendingRoomId);
          if (pendingRoom) {
            handleRoomSelectionRef.current(pendingRoom);
            window.sessionStorage.removeItem('pendingChatRoomId');
          }
        }
      } catch (error) {
        console.error('Error fetching chat rooms:', error);
        if (onError) onError(error as Error);
      }
    };

    if (!initialChatRoom && !modelId) {
      fetchChatRooms();
    }
  }, [initialChatRoom, modelId, transformRoom, onError]);

  // Handle initial chat room or model ID
  useEffect(() => {
    const initializeChat = async () => {
      if (initialChatRoom) {
        const transformed = transformRoom(initialChatRoom);
        setChatRooms([transformed]);
        setSelectedRoom(transformed);
        setMessages(transformed.messages);
      } else if (modelId) {
        setIsLoading(true);
        try {
          const room = await getOrCreateChatRoom(modelId);
          if (room) {
            const transformed = transformRoom(room);
            setChatRooms([transformed]);
            setSelectedRoom(transformed);
            setMessages(transformed.messages);
          }
        } catch (error) {
          console.error('Error creating chat room:', error);
          if (onError) onError(error as Error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    initializeChat();
  }, [initialChatRoom, modelId, transformRoom, onError]);

  const handleRoomSelection = useCallback(async (room: ExtendedChatRoom) => {
    if (loadingRoomId || room.id === selectedRoom?.id) return;
    setLoadingRoomId(room.id);
    
    try {
      setSelectedRoom(room);

      const response = await fetch(`/api/chat/${room.id}/messages`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      
      const data = await response.json();
      const roomMessages = data.messages?.map(transformMessage) || [];
      const sortedMessages = roomMessages.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setMessages(sortedMessages);

      // Always send greeting when entering a room
      if (room.aiModel) {
        try {
          const greetingResponse = await fetch(`/api/chat/${room.id}/greeting`, {
            method: 'POST',
          });

          if (greetingResponse.ok) {
            let accumulatedContent = '';
            const reader = greetingResponse.body?.getReader();
            
            if (reader) {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = new TextDecoder().decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                  if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') continue;

                    try {
                      const parsed = JSON.parse(data);
                      accumulatedContent = parsed.content || accumulatedContent;
                      
                      const streamingMessage = {
                        ...parsed,
                        content: accumulatedContent,
                        createdAt: new Date().toISOString(),
                        isAIMessage: true,
                        role: 'assistant',
                        metadata: { type: 'greeting' }
                      };

                      setMessages(prev => {
                        const existing = prev.find(m => m.id === parsed.id);
                        if (existing) {
                          return prev.map(m => 
                            m.id === parsed.id ? transformMessage(streamingMessage) : m
                          );
                        } else {
                          return [transformMessage(streamingMessage), ...prev];
                        }
                      });
                    } catch (e) {
                      console.error('Error parsing greeting response:', e);
                    }
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error('Error sending greeting:', error);
        }
      }

      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    } catch (error) {
      console.error('Error selecting room:', error);
      toast({
        title: "Error",
        description: "Failed to load chat room",
        variant: "destructive"
      });
      if (onError) onError(error as Error);
    } finally {
      setLoadingRoomId(null);
    }
  }, [loadingRoomId, selectedRoom?.id, onError, toast, transformMessage]);

  // Store the latest handleRoomSelection in ref
  useEffect(() => {
    handleRoomSelectionRef.current = handleRoomSelection;
  }, [handleRoomSelection]);

  const handleDeleteRoom = useCallback(async (roomId: string) => {
    if (isDeletingRoom) return;
    setIsDeletingRoom(roomId);
    
    try {
      const success = await deleteChatRoom(roomId);
      if (success) {
        setChatRooms(prev => prev.filter(room => room.id !== roomId));
        if (selectedRoom?.id === roomId) {
          setSelectedRoom(null);
          setMessages([]);
        }
        toast({
          title: "Success",
          description: "Chat room deleted successfully",
        });
      }
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
  }, [isDeletingRoom, selectedRoom?.id, toast]);

  // Add polling for chat updates
  useEffect(() => {
    if (!selectedRoom?.id) return;

    let isPolling = true;
    const pollInterval = 3000; // 3 seconds

    const pollUpdates = async () => {
      if (!isPolling) return;

      try {
        const response = await fetch(`/api/chat/${selectedRoom.id}/updates?lastUpdate=${selectedRoom.updatedAt}`);
        if (!response.ok) throw new Error('Failed to fetch updates');

        const data = await response.json();
        
        if (data.hasUpdates) {
          // Update chat rooms if there are changes
          if (data.rooms) {
            setChatRooms(prev => {
              const updatedRooms = [...prev];
              data.rooms.forEach((updatedRoom: any) => {
                const index = updatedRooms.findIndex(r => r.id === updatedRoom.id);
                if (index !== -1) {
                  updatedRooms[index] = transformRoom(updatedRoom);
                }
              });
              return updatedRooms;
            });
          }

          // Update messages if there are new ones
          if (data.messages) {
            setMessages(prev => {
              const newMessages = data.messages.map(transformMessage);
              return [...newMessages, ...prev];
            });
          }
        }
      } catch (error) {
        console.error('Error polling updates:', error);
      }

      // Schedule next poll
      setTimeout(pollUpdates, pollInterval);
    };

    // Start polling
    pollUpdates();

    // Cleanup
    return () => {
      isPolling = false;
    };
  }, [selectedRoom?.id, selectedRoom?.updatedAt, transformMessage, transformRoom]);

  // Memoized UI elements
  const sidebarContent = useMemo(() => (
    <div className={cn(
      "h-full w-[280px] bg-[#0f0f0f] border-r border-white/5",
      "fixed inset-y-0 left-0 z-30 md:relative md:translate-x-0",
      "transition-transform duration-300 ease-in-out",
      isSidebarOpen ? "translate-x-0" : "-translate-x-full",
      "flex flex-col"
    )}>
      <div className="flex-1 flex flex-col h-full">
        <div className="shrink-0 p-4 border-b border-white/5 hidden md:block">
          <h2 className="font-medium text-white/70">Your Chats</h2>
        </div>
        <div className="flex-1 overflow-hidden">
          <ChatRoomList
            rooms={chatRooms}
            selectedRoom={selectedRoom}
            onRoomSelect={handleRoomSelection}
            onDeleteRoom={handleDeleteRoom}
            loadingRoomId={loadingRoomId}
            isDeletingRoom={isDeletingRoom}
            onClose={() => setIsSidebarOpen(false)}
          />
        </div>
      </div>
    </div>
  ), [chatRooms, selectedRoom, isSidebarOpen, loadingRoomId, isDeletingRoom, handleRoomSelection, handleDeleteRoom]);

  const backdropOverlay = useMemo(() => (
    <div 
      className={cn(
        "fixed inset-0 bg-black/50 z-20 md:hidden",
        "transition-opacity duration-300",
        isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      onClick={() => setIsSidebarOpen(false)}
    />
  ), [isSidebarOpen]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {backdropOverlay}
      {sidebarContent}
      
      <div className="flex-1 flex flex-col h-full relative">
        {/* Floating toggle button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="md:hidden fixed top-[4.5rem] left-4 z-[100] h-9 w-9 bg-[#0f0f0f] border border-white/10 shadow-lg rounded-full hover:bg-[#1a1a1a]"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>

        <div className="flex-1">
          <ClientChatMessages
            messages={messages}
            setMessages={setMessages}
            selectedRoom={selectedRoom}
          />
        </div>
      </div>
    </div>
  );
}
