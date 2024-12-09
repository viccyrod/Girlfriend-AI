// src/components/chat/ChatComponent.tsx

"use client";

import React, { useCallback, useEffect, useState, useRef } from 'react';
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

const PAGE_SIZE = 30;

const TypingIndicator = () => (
  <div className="flex items-center space-x-2 p-4 bg-muted/50 rounded-lg max-w-[200px]">
    <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]"></div>
    <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]"></div>
    <div className="w-2 h-2 rounded-full bg-primary animate-bounce"></div>
  </div>
);

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
  const [messages, setMessages] = useState<Message[]>(
    initialChatRoom?.messages || []
  );
  const [isProfileVisible, setIsProfileVisible] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [isMessageSending, setIsMessageSending] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [loadingRoomId, setLoadingRoomId] = useState<string | null>(null);
  const [isDeletingRoom, setIsDeletingRoom] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const initAttempts = useRef(0);
  const maxInitAttempts = 3;

  // Initialize chat
  const initializeChat = useCallback(async (retry = false) => {
    if (isInitialized && !retry) return;
    if (initAttempts.current >= maxInitAttempts) {
      setInitError('Failed to initialize chat after multiple attempts');
      return;
    }

    try {
      setInitError(null);
      setIsLoading(true);
      initAttempts.current += 1;

      let activeRoom = initialChatRoom;
      let isNewRoom = false;
      
      // If modelId is provided but no initialChatRoom, create/get the room
      if (modelId && !initialChatRoom) {
        console.log('Fetching/creating room for model:', modelId);
        const rawRoom = await getOrCreateChatRoom(modelId);
        console.log('Raw Room Data:', rawRoom);
        
        if (!rawRoom) {
          throw new Error('Failed to create or get chat room');
        }

        isNewRoom = !rawRoom.messages || rawRoom.messages.length === 0;
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

      // Fetch all chat rooms with retry logic
      const fetchRooms = async (retries = 3): Promise<ExtendedChatRoom[]> => {
        try {
          return await getChatRooms();
        } catch (error) {
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            return fetchRooms(retries - 1);
          }
          console.error('Failed to fetch chat rooms:', error);
          return [];
        }
      };

      const allRooms = await fetchRooms();

      // Combine rooms, ensuring no duplicates
      const uniqueRooms = [...allRooms];
      if (activeRoom && !uniqueRooms.some(room => room.id === activeRoom?.id)) {
        uniqueRooms.unshift(activeRoom);
      }

      console.log('Final rooms:', uniqueRooms);
      
      setChatRooms(uniqueRooms);
      
      if (activeRoom) {
        setSelectedRoom(activeRoom);
        
        // Send greeting for new rooms with retry logic
        if (isNewRoom && activeRoom.id) {
          console.log('Sending greeting for new room:', activeRoom.id);
          setIsGeneratingResponse(true);
          
          let greetingSuccess = false;
          let greetingAttempts = 0;
          const maxGreetingAttempts = 3;

          while (!greetingSuccess && greetingAttempts < maxGreetingAttempts) {
            try {
              const response = await fetch(`/api/chat/${activeRoom.id}/messages`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  content: "greeting"
                })
              });

              if (response.ok) {
                greetingSuccess = true;
              } else if (response.status === 409) {
                // Duplicate greeting, consider it a success
                greetingSuccess = true;
              } else {
                throw new Error(`Failed to send greeting: ${response.statusText}`);
              }
            } catch (error) {
              console.error(`Greeting attempt ${greetingAttempts + 1} failed:`, error);
              greetingAttempts++;
              if (greetingAttempts < maxGreetingAttempts) {
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }
          }
          
          setIsGeneratingResponse(false);
        }
      }
      
      setIsInitialized(true);
      setIsLoading(false);
    } catch (error) {
      console.error('Initialization error:', error);
      const typedError = error instanceof Error ? error : new Error('Failed to initialize chat');
      setInitError(typedError.message);
      if (onError) onError(typedError);
      
      // Retry initialization after a delay
      if (initAttempts.current < maxInitAttempts) {
        setTimeout(() => {
          initializeChat(true);
        }, 1000);
      }
    } finally {
      setIsLoading(false);
    }
  }, [initialChatRoom, modelId, onError]);

  // Handle room selection with improved error handling
  const handleRoomSelection = async (room: ExtendedChatRoom) => {
    try {
      if (!room?.id) {
        throw new Error('Invalid room data');
      }

      setLoadingRoomId(room.id);
      setMessages([]);
      
      // Verify room exists and is accessible
      const response = await fetch(`/api/chat/${room.id}`);
      if (!response.ok) {
        throw new Error('Failed to access chat room');
      }
      
      // Set selected room
      setSelectedRoom(room);
      
      // Fetch initial messages with retry logic
      let messagesData;
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        try {
          const messagesResponse = await fetch(`/api/chat/${room.id}/messages?limit=30`);
          if (!messagesResponse.ok) {
            throw new Error('Failed to fetch messages');
          }
          
          messagesData = await messagesResponse.json();
          break;
        } catch (error) {
          attempts++;
          if (attempts === maxAttempts) {
            throw error;
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log('Initial messages:', messagesData.messages);
      setMessages(messagesData.messages || []);
      
    } catch (error) {
      console.error('Error selecting room:', error);
      toast({
        title: "Error",
        description: "Failed to load chat room",
        variant: "destructive"
      });
    } finally {
      setLoadingRoomId(null);
    }
  };

  // Effect to initialize chat
  useEffect(() => {
    initializeChat();
  }, [initializeChat]);

  // Update SSE connection
  useEffect(() => {
    if (!selectedRoom?.id) return;

    console.log('Setting up SSE connection for chat room:', selectedRoom.id);
    const eventSource = new EventSource(`/api/chat/${selectedRoom.id}/subscribe`);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received SSE message:', data);
        
        if (data.message) {
          setMessages(prev => {
            // Check if message already exists (including temp messages)
            const exists = prev.some(m => 
              m.id === data.message.id || 
              (m.id.startsWith('temp-') && m.content === data.message.content && m.role === data.message.role)
            );
            
            if (exists) {
              // Replace temp message with real one or update existing
              return prev.map(m => {
                if (m.id === data.message.id || 
                   (m.id.startsWith('temp-') && m.content === data.message.content && m.role === data.message.role)) {
                  return data.message;
                }
                return m;
              });
            }
            
            // Add new message
            return [...prev, data.message];
          });
        }
      } catch (error) {
        console.error('Error handling SSE message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      eventSource.close();
    };

    return () => {
      console.log('Closing SSE connection for chat room:', selectedRoom.id);
      eventSource.close();
    };
  }, [selectedRoom?.id]);

  // Message handling
  const handleSendMessage = async (content: string, room: ExtendedChatRoom) => {
    try {
      setIsMessageSending(true);
      console.log('Sending message to room:', room.id);
      
      // Create optimistic message
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        content,
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
        chatRoomId: room.id,
        isAIMessage: false,
        metadata: { type: 'text' },
        userId: null,
        user: null,
        aiModelId: null
      };

      // Add optimistic message immediately
      setMessages(prev => [...prev, optimisticMessage]);

      // Send message to server
      const response = await sendMessage(room.id, content);
      console.log('Message sent:', response);

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

  const handleLoadMore = useCallback(async (oldestMessageId: string) => {
    try {
      const response = await fetch(
        `/api/chat/${selectedRoom?.id}/messages?before=${oldestMessageId}&limit=${PAGE_SIZE}`
      );
      if (!response.ok) throw new Error('Failed to fetch more messages');
      
      const data = await response.json();
      setMessages(prev => [...data.messages, ...prev]);
      setHasMoreMessages(data.hasMore);
    } catch (error) {
      console.error('Error loading more messages:', error);
      toast({
        title: "Error",
        description: "Failed to load more messages",
        variant: "destructive"
      });
    }
  }, [selectedRoom?.id, toast]);

  const handleImageGenerate = useCallback(async (prompt: string) => {
    if (!selectedRoom) return;

    try {
      // Create an optimistic message
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        content: `🎨 Generating image: "${prompt}"...`,
        chatRoomId: selectedRoom.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        isAIMessage: true,
        metadata: { type: 'image', status: 'generating', prompt } as MessageMetadata,
        userId: null,
        aiModelId: selectedRoom.aiModelId,
        role: 'assistant',
        user: null
      };

      // Add optimistic message
      setMessages(prev => [...prev, optimisticMessage]);

      // Make the API call
      const response = await fetch('/api/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          chatRoomId: selectedRoom.id,
          style: 'realistic'
        }),
      });

      if (!response.ok) throw new Error('Failed to generate image');
      
      const { jobId, message: initialMessage } = await response.json();

      // Start polling for status
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`/api/image?jobId=${jobId}&chatRoomId=${selectedRoom.id}&messageId=${initialMessage.id}`);
          if (!statusResponse.ok) throw new Error('Failed to check image status');
          
          const statusData = await statusResponse.json();
          console.log('Status data:', statusData);
          
          // Check both message metadata and status
          if ((statusData.message?.metadata?.status === 'completed' || statusData.status === 'COMPLETED') && statusData.message) {
            console.log('Image generation completed, stopping polling');
            // Update message with completed image
            setMessages(prev => prev.map(msg => 
              msg.id === optimisticMessage.id ? statusData.message : msg
            ));
            clearInterval(pollInterval);
          } else if (statusData.status === 'FAILED') {
            throw new Error('Image generation failed');
          }
        } catch (error) {
          console.error('Error polling image status:', error);
          clearInterval(pollInterval);
          
          // Update the optimistic message to show error
          setMessages(prev => prev.map(msg => 
            msg.id === optimisticMessage.id 
              ? {
                  ...msg,
                  content: 'Failed to generate image. Please try again.',
                  metadata: { type: 'image', status: 'error' } as MessageMetadata
                }
              : msg
          ));

          toast({
            title: "Error",
            description: "Failed to check image status. Please try again.",
            variant: "destructive"
          });
        }
      }, 2000);

      // Cleanup interval after 5 minutes (timeout)
      setTimeout(() => {
        clearInterval(pollInterval);
      }, 5 * 60 * 1000);

    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: "Error",
        description: "Failed to generate image. Please try again.",
        variant: "destructive"
      });
    }
  }, [selectedRoom, toast]);

  return (
    <div className="flex h-[100dvh] overflow-hidden relative">
      {/* Mobile back button */}
      {selectedRoom && (
        <button
          onClick={() => setSelectedRoom(null)}
          className="md:hidden fixed top-4 left-4 z-30 bg-[#1a1a1a] hover:bg-[#2a2a2a] p-2 rounded-md"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      {/* Chat rooms list */}
      <div className={`
        absolute md:relative w-full md:w-80 border-r border-[#1a1a1a] 
        overflow-hidden bg-[#0a0a0a] h-full
        transition-transform duration-200
        ${selectedRoom ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}
        z-20
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
        flex-1 flex flex-col min-w-0
        transition-all duration-300 ease-in-out
        relative z-10
        ${selectedRoom ? 'translate-x-0' : 'hidden md:flex'}
        ${isProfileVisible ? 'md:mr-[400px]' : ''}
      `}>
        {selectedRoom ? (
          <ClientChatMessages
            chatRoom={selectedRoom}
            onSendMessage={(content: string) => handleSendMessage(content, selectedRoom)}
            isLoading={isLoading}
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
        transition-transform duration-300 ease-in-out z-30
        ${isProfileVisible ? "translate-x-0 shadow-2xl" : "translate-x-full"}
        ${isProfileVisible && !selectedRoom ? "hidden md:block" : ""}
      `}>
        {/* Profile toggle button */}
        <button
          onClick={() => setIsProfileVisible(!isProfileVisible)}
          className="absolute left-0 top-6 -translate-x-full bg-[#1a1a1a] hover:bg-[#2a2a2a] p-2 pl-3 pr-4 rounded-l-md transition-all duration-200 flex items-center gap-2 text-sm text-white/80 hover:text-white z-30"
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
