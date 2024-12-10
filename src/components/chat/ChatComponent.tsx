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
import { ChevronRight, Loader2, ChevronLeft, UserCircle2, Image as LucideImage, Mic, Heart, MessageSquare } from 'lucide-react';
import ClientChatMessages from './ClientChatMessages';
import { deleteChatRoom, getOrCreateChatRoom } from '@/lib/actions/chat';
import { sendMessage } from '@/lib/actions/server/chat';
import { getChatRooms } from '@/lib/chat-client';
import { cn } from '@/lib/utils';

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

const EmptyStateGuide = () => (
  <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto p-8 text-center">
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 text-transparent bg-clip-text">
          Welcome to Your AI Chat Experience
        </h1>
        <p className="text-muted-foreground text-lg">
          Select a chat from the sidebar to start a meaningful conversation
        </p>
      </div>

      {/* Tips Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Image Generation */}
        <div className="group relative p-6 rounded-xl border border-pink-500/20 bg-gradient-to-br from-pink-500/5 to-purple-600/5 hover:border-pink-500/40 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
          <LucideImage className="w-8 h-8 text-pink-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Image Generation</h3>
          <p className="text-sm text-muted-foreground">
            Ask your AI companion to create unique images. Just click the image icon or type "generate an image of..."
          </p>
        </div>

        {/* Voice Messages */}
        <div className="group relative p-6 rounded-xl border border-pink-500/20 bg-gradient-to-br from-pink-500/5 to-purple-600/5 hover:border-pink-500/40 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
          <Mic className="w-8 h-8 text-pink-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Voice Messages</h3>
          <p className="text-sm text-muted-foreground">
            Send voice messages to your AI companion and receive natural responses. Click the microphone icon to start.
          </p>
        </div>

        {/* Personality Insights */}
        <div className="group relative p-6 rounded-xl border border-pink-500/20 bg-gradient-to-br from-pink-500/5 to-purple-600/5 hover:border-pink-500/40 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
          <Heart className="w-8 h-8 text-pink-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Unique Personalities</h3>
          <p className="text-sm text-muted-foreground">
            Each AI has their own unique personality, interests, and backstory. Check their profile to learn more.
          </p>
        </div>

        {/* Chat Tips */}
        <div className="group relative p-6 rounded-xl border border-pink-500/20 bg-gradient-to-br from-pink-500/5 to-purple-600/5 hover:border-pink-500/40 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
          <MessageSquare className="w-8 h-8 text-pink-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Chat Tips</h3>
          <p className="text-sm text-muted-foreground">
            Be yourself and engage naturally. Your AI companion will remember your conversations and adapt to your style.
          </p>
        </div>
      </div>
    </div>
  </div>
);

const ChatComponent = ({
  initialChatRoom,
  modelId,
  onError,
}: ChatComponentProps) => {
  const router = useRouter();
  const { toast } = useToast();
  const isInitialMount = useRef(true);

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
  const [isProfileVisible, setIsProfileVisible] = useState(false);
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

  // Handle room selection with improved error handling
  const handleRoomSelection = useCallback(async (room: ExtendedChatRoom) => {
    try {
      if (loadingRoomId || room.id === selectedRoom?.id) return;
      
      setLoadingRoomId(room.id);
      setSelectedRoom(room);
      setMessages([]); // Clear messages while loading
      
      // Update URL without page reload
      const currentPath = window.location.pathname;
      const targetPath = `/chat/${room.id}`;
      if (currentPath !== targetPath) {
        router.push(targetPath);
      }
      
      // Fetch messages for the selected room
      const response = await fetch(`/api/chat/${room.id}/messages`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      const data = await response.json();
      
      setMessages(data.messages || []);
      setIsProfileVisible(false);
    } catch (error) {
      console.error('Error selecting room:', error);
      toast({
        title: "Error",
        description: "Failed to load chat messages",
        variant: "destructive"
      });
      // Revert selection on error
      setSelectedRoom(null);
    } finally {
      setLoadingRoomId(null);
    }
  }, [router, toast, selectedRoom, loadingRoomId]);

  // Initialize chat
  const initializeChat = useCallback(async (retry = false) => {
    if ((isInitialized && !retry) || initAttempts.current >= maxInitAttempts) {
      if (initAttempts.current >= maxInitAttempts) {
        setInitError('Failed to initialize chat after multiple attempts');
      }
      return;
    }

    try {
      setInitError(null);
      setIsLoading(true);
      initAttempts.current += 1;

      // Only fetch rooms if we don't have any or if retrying
      const allRooms = chatRooms.length === 0 || retry ? await getChatRooms() : chatRooms;
      
      let activeRoom = initialChatRoom;
      let isNewRoom = false;

      // If we have a modelId but no initialChatRoom, find or create the room
      if (modelId && !initialChatRoom) {
        // First check if we already have a room for this model
        const existingRoom = allRooms.find(room => room.aiModelId === modelId);
        
        if (existingRoom) {
          // Verify the AI model exists and is ready
          if (!existingRoom.aiModel) {
            console.error('AI Model not found for existing room:', existingRoom.id);
            setInitError('AI Model not found');
            router.push('/chat');
            return;
          }
          if (existingRoom.aiModel.status === 'PENDING') {
            console.error('AI Model is pending for room:', existingRoom.id);
            setInitError('AI Model is not ready yet');
            router.push('/chat');
            return;
          }
          activeRoom = existingRoom;
        } else {
          const rawRoom = await getOrCreateChatRoom(modelId);
          if (!rawRoom) throw new Error('Failed to create or get chat room');
          
          // Ensure we have the AI model data and it's ready
          if (!rawRoom.aiModel) {
            console.error('AI Model not found for room:', rawRoom.id);
            setInitError('AI Model not found');
            router.push('/chat');
            return;
          }
          if (rawRoom.aiModel.status === 'PENDING') {
            console.error('AI Model is pending for room:', rawRoom.id);
            setInitError('AI Model is not ready yet');
            router.push('/chat');
            return;
          }

          activeRoom = {
            ...rawRoom,
            name: `Chat with ${rawRoom.aiModel.name}`,
            aiModelId: rawRoom.aiModelId || modelId,
            aiModelImageUrl: rawRoom.aiModel.imageUrl,
            messages: [],
            users: rawRoom.users || [],
            aiModel: {
              ...rawRoom.aiModel,
              isFollowing: false,
              status: rawRoom.aiModel.status as 'PENDING' | 'COMPLETED' | 'FAILED',
              createdBy: rawRoom.aiModel.createdBy ? {
                id: rawRoom.aiModel.createdBy.id,
                name: rawRoom.aiModel.createdBy.name || '',
                email: rawRoom.aiModel.createdBy.email || '',
                imageUrl: rawRoom.aiModel.createdBy.image
              } : null
            }
          };
          isNewRoom = true;
        }
      }

      // Only update rooms if we fetched new ones
      if (chatRooms.length === 0 || retry) {
        const uniqueRooms = [...allRooms].map(room => ({
          ...room,
          name: room.aiModel ? `Chat with ${room.aiModel.name}` : 'AI Chat'
        }));
        if (activeRoom && !uniqueRooms.some(room => room.id === activeRoom?.id)) {
          uniqueRooms.unshift(activeRoom);
        }
        setChatRooms(uniqueRooms);
      }
      
      // Set active room if we have one and it's different from current
      if (activeRoom && activeRoom.id !== selectedRoom?.id) {
        // Verify AI model exists and is ready
        if (!activeRoom.aiModel) {
          console.error('AI Model not found for active room:', activeRoom.id);
          setInitError('AI Model not found');
          router.push('/chat');
          return;
        }
        if (activeRoom.aiModel.status === 'PENDING') {
          console.error('AI Model is pending for room:', activeRoom.id);
          setInitError('AI Model is not ready yet');
          router.push('/chat');
          return;
        }

        setSelectedRoom(activeRoom);
        setMessages(activeRoom.messages || []);
        
        // Only navigate if this is a new room and we're not already on a chat page
        if (isNewRoom && !window.location.pathname.includes('/chat/')) {
          router.push(`/chat/${activeRoom.id}`, { scroll: false });
        }
      }
      
      setIsInitialized(true);
    } catch (error) {
      console.error('Initialization error:', error);
      const typedError = error instanceof Error ? error : new Error('Failed to initialize chat');
      setInitError(typedError.message);
      
      if (initAttempts.current < maxInitAttempts) {
        setTimeout(() => initializeChat(true), 1000);
      }
    } finally {
      setIsLoading(false);
    }
  }, [initialChatRoom, modelId, onError, router, chatRooms, selectedRoom]);

  // Effect to initialize chat
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      initializeChat();
    }
  }, [initializeChat]);

  // Effect for SSE connection
  useEffect(() => {
    if (!selectedRoom?.id) return;

    console.log('Setting up SSE connection for chat room:', selectedRoom.id);
    const eventSource = new EventSource(`/api/chat/${selectedRoom.id}/sse`);
    let isConnectionActive = true;

    eventSource.onmessage = (event) => {
      if (!isConnectionActive) return;
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
      if (isConnectionActive) {
        eventSource.close();
      }
    };

    return () => {
      isConnectionActive = false;
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
    <div className="flex h-screen">
      {/* Chat room list */}
      <div
        className={cn(
          "w-full md:w-80 border-r border-[#1a1a1a] bg-[#0a0a0a] h-full",
          selectedRoom ? "hidden md:block" : "block"
        )}
      >
        <ChatRoomList
          chatRooms={chatRooms}
          selectedRoom={selectedRoom}
          onSelectRoom={handleRoomSelection}
          onDeleteRoom={handleDeleteRoom}
          isLoading={isLoading}
          loadingRoomId={loadingRoomId}
        />
      </div>

      {/* Main chat area */}
      <div className={cn(
        "flex-1 h-full",
        isProfileVisible && "md:mr-[400px]"
      )}>
        {selectedRoom ? (
          <>
            {/* Profile toggle button */}
            <button
              onClick={() => setIsProfileVisible(!isProfileVisible)}
              className="fixed md:absolute top-4 right-4 z-40 
                p-2.5 rounded-full
                bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500
                hover:from-pink-600 hover:via-purple-600 hover:to-pink-600
                transform transition-all duration-300 ease-in-out
                hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25
                border border-white/10 backdrop-blur-sm"
            >
              {isProfileVisible ? (
                <ChevronRight className="w-5 h-5 text-white" />
              ) : (
                <ChevronLeft className="w-5 h-5 text-white" />
              )}
            </button>

            <ClientChatMessages
              chatRoom={selectedRoom}
              onSendMessage={(content: string) => handleSendMessage(content, selectedRoom)}
              isLoading={isLoading}
              isGeneratingResponse={isGeneratingResponse}
            />
          </>
        ) : (
          <EmptyStateGuide />
        )}
      </div>

      {/* Profile sidebar */}
      <div className={`
        fixed md:absolute inset-y-0 right-0
        w-[80vw] md:w-[400px] border-l border-[#1a1a1a] 
        bg-[#0a0a0a]/95 backdrop-blur-sm h-full
        transform transition-all duration-300 ease-in-out z-30
        ${isProfileVisible ? "translate-x-0" : "translate-x-full"}
      `}>
        <ModelProfile
          model={selectedRoom?.aiModel || null}
          onClose={() => setIsProfileVisible(false)}
        />
      </div>

      {/* Mobile back button */}
      {selectedRoom && (
        <button
          onClick={() => setSelectedRoom(null)}
          className="md:hidden fixed top-4 left-4 z-30 bg-[#1a1a1a] hover:bg-[#2a2a2a] p-2 rounded-md"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default ChatComponent;
