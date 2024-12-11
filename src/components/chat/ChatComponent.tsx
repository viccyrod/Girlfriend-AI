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
import { ChevronRight, Loader2, ChevronLeft, UserCircle2, Image as LucideImage, Mic, Heart, MessageSquare, Send } from 'lucide-react';
import ClientChatMessages from './ClientChatMessages';
import { deleteChatRoom, getOrCreateChatRoom } from '@/lib/actions/chat';
import { sendMessage } from '@/lib/actions/server/chat';
import { getChatRooms } from '@/lib/chat-client';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

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

export default function ChatComponent({
  initialChatRoom,
  modelId,
  onError,
}: ChatComponentProps) {
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
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const initAttempts = useRef(0);
  const maxInitAttempts = 3;
  const [isTyping, setIsTyping] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Message handling
  const handleSendMessage = useCallback(async (content: string, room: ExtendedChatRoom) => {
    if (!room || !content.trim()) return;

    try {
      // Create user message
      const userMessage: Message = {
        id: Date.now().toString(),
        content,
        chatRoomId: room.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        isAIMessage: false,
        metadata: { type: 'text' },
        userId: null,
        aiModelId: room.aiModelId || null,
        role: 'user',
        user: null
      };
      setMessages(prev => [...prev, userMessage]);

      // Send to API
      const response = await fetch(`/api/chat/${room.id}/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // Read the response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Failed to read response');
      }

      let aiMessageContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('event: message')) {
            const dataLine = lines[lines.indexOf(line) + 1];
            if (!dataLine?.startsWith('data: ')) continue;

            const data = JSON.parse(dataLine.slice(6));
            
            if (data.type === 'chunk') {
              aiMessageContent += data.content;
            }
          }
        }
      }

      // Create AI message
      const aiMessage: Message = {
        id: Date.now().toString(),
        content: aiMessageContent,
        chatRoomId: room.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        isAIMessage: true,
        metadata: { type: 'text' },
        userId: null,
        aiModelId: room.aiModelId || null,
        role: 'assistant',
        user: null
      };
      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, []);

  // Handle room selection with improved error handling
  const handleRoomSelection = useCallback(async (room: ExtendedChatRoom) => {
    if (loadingRoomId || room.id === selectedRoom?.id) return;
    
    setLoadingRoomId(room.id);
    setInitError(null);
    
    try {
      // Fetch messages for the selected room
      const response = await fetch(`/api/chat/${room.id}/messages?limit=${PAGE_SIZE}`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      
      const data = await response.json();
      setMessages(data.messages || []);
      setHasMoreMessages(data.hasMore);
      
      setSelectedRoom(room);
    } catch (error) {
      console.error('Error selecting room:', error);
      setInitError('Failed to load chat room');
      if (onError) onError(error as Error);
    } finally {
      setLoadingRoomId(null);
    }
  }, [loadingRoomId, selectedRoom?.id, onError]);

  // Initialize chat with optimized loading
  const initializeChat = useCallback(async (retry = false) => {
    if ((isInitialized && !retry) || initAttempts.current >= maxInitAttempts) {
      console.log('🔄 Skipping initialization:', { isInitialized, retry, attempts: initAttempts.current });
      if (initAttempts.current >= maxInitAttempts) {
        setInitError('Failed to initialize chat after multiple attempts');
      }
      return;
    }

    try {
      console.log('🚀 Starting chat initialization...');
      setInitError(null);
      setIsLoading(true);
      initAttempts.current += 1;

      // If we have initialChatRoom, use it immediately
      if (initialChatRoom) {
        console.log('📦 Using initial chat room:', initialChatRoom.id);
        setSelectedRoom(initialChatRoom);
        setMessages(initialChatRoom.messages || []);
        setIsInitialized(true);
        setIsLoading(false);
        return;
      }

      // Only fetch rooms if we don't have any or if retrying
      console.log('📡 Fetching chat rooms...', { shouldFetch: chatRooms.length === 0 || retry });
      const allRooms = chatRooms.length === 0 || retry ? await getChatRooms() : chatRooms;
      console.log('📥 Received chat rooms:', allRooms);
      
      // If we have a modelId, find or create the room
      if (modelId) {
        console.log('🔍 Looking for room with modelId:', modelId);
        const existingRoom = allRooms.find(room => room.aiModelId === modelId);
        
        if (existingRoom && existingRoom.aiModel?.status === 'COMPLETED') {
          console.log('✅ Found existing room:', existingRoom.id);
          setSelectedRoom(existingRoom);
          setMessages(existingRoom.messages || []);
          setChatRooms(prev => prev.length === 0 ? [existingRoom] : prev);
          setIsInitialized(true);
          setIsLoading(false);
          return;
        }

        // Create new room if needed
        console.log('🏗️ Creating new room for modelId:', modelId);
        const rawRoom = await getOrCreateChatRoom(modelId);
        if (!rawRoom || !rawRoom.aiModel || rawRoom.aiModel.status !== 'COMPLETED') {
          console.error('❌ AI Model not ready:', rawRoom);
          setInitError('AI Model not ready');
          router.push('/chat');
          return;
        }

        const newRoom: ExtendedChatRoom = {
          ...rawRoom,
          name: `Chat with ${rawRoom.aiModel.name}`,
          messages: [],
          users: rawRoom.users || [],
          aiModelId: modelId!,
          aiModel: {
            ...rawRoom.aiModel,
            isFollowing: false,
            status: 'COMPLETED' as const,
            createdBy: rawRoom.aiModel?.createdBy ? {
              id: rawRoom.aiModel.createdBy.id,
              name: rawRoom.aiModel.createdBy.name || null,
              email: rawRoom.aiModel.createdBy.email || null,
              image: rawRoom.aiModel.createdBy.image || null
            } : null
          }
        };

        console.log('✨ Created new room:', newRoom.id);
        setSelectedRoom(newRoom);
        setChatRooms(prev => [newRoom, ...prev]);
        setIsInitialized(true);
        
        if (!window.location.pathname.includes('/chat/')) {
          router.push(`/chat/${newRoom.id}`, { scroll: false });
        }
      } else {
        // Just set rooms if no specific room needed
        console.log('📋 Setting chat rooms:', allRooms.length);
        setChatRooms(allRooms.map(room => ({
          ...room,
          name: room.aiModel ? `Chat with ${room.aiModel.name}` : 'AI Chat'
        })));
        setIsInitialized(true);
      }

    } catch (error) {
      console.error('❌ Initialization error:', error);
      const typedError = error instanceof Error ? error : new Error('Failed to initialize chat');
      setInitError(typedError.message);
      
      if (initAttempts.current < maxInitAttempts) {
        console.log('🔄 Retrying initialization in 1s...');
        setTimeout(() => initializeChat(true), 1000);
      }
    } finally {
      setIsLoading(false);
    }
  }, [initialChatRoom, modelId, router, chatRooms]);

  // Effect to initialize chat
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      initializeChat();
    } else if (initialChatRoom) {
      // Always reinitialize when initialChatRoom changes
      console.log('Room changed, reinitializing...', initialChatRoom.id);
      initializeChat(true);
    }
  }, [initializeChat, initialChatRoom]);

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

  // Memoize expensive computations and callbacks
  const transformRoom = useCallback((rawRoom: any): ExtendedChatRoom => {
    return {
      id: rawRoom.id,
      name: `Chat with ${rawRoom.aiModel?.name || 'AI'}`,
      aiModelId: rawRoom.aiModelId || modelId,
      createdById: rawRoom.createdById || null,
      createdAt: rawRoom.createdAt || new Date(),
      updatedAt: rawRoom.updatedAt || new Date(),
      messages: [],
      users: rawRoom.users || [],
      aiModel: rawRoom.aiModel ? {
        ...rawRoom.aiModel,
        isFollowing: false,
        status: (rawRoom.aiModel.status || 'PENDING') as 'PENDING' | 'COMPLETED' | 'FAILED',
        createdBy: rawRoom.aiModel?.createdBy ? {
          id: rawRoom.aiModel.createdBy.id,
          name: rawRoom.aiModel.createdBy.name || null,
          email: rawRoom.aiModel.createdBy.email || null,
          image: rawRoom.aiModel.createdBy.image || null
        } : null
      } : null
    };
  }, [modelId]);

  // Optimize initial data loading
  useEffect(() => {
    if (!isInitialized && modelId) {
      const initializeChat = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/chat?modelId=${modelId}`);
          if (!response.ok) throw new Error('Failed to fetch chat rooms');
          
          const data = await response.json();
          const rooms = data.rooms.map(transformRoom);
          
          setChatRooms(rooms);
          setIsInitialized(true);
        } catch (error) {
          console.error('Error initializing chat:', error);
          setInitError('Failed to initialize chat');
          if (onError) onError(error as Error);
        } finally {
          setIsLoading(false);
        }
      };

      initializeChat();
    }
  }, [isInitialized, modelId, transformRoom, onError]);

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <div
        className={cn(
          "h-full w-80 bg-background border-r transform transition-transform duration-300 ease-in-out",
          "fixed inset-y-0 left-0 z-20 md:relative md:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Your Chats</h2>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-pretty">
            <ChatRoomList
              rooms={chatRooms}
              selectedRoom={selectedRoom}
              onRoomSelect={handleRoomSelection}
              loadingRoomId={loadingRoomId}
              onDeleteRoom={handleDeleteRoom}
              isDeletingRoom={isDeletingRoom}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full w-full">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </Button>
          {selectedRoom?.aiModel && (
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={selectedRoom.aiModel.imageUrl || undefined} />
                <AvatarFallback>
                  <UserCircle2 className="w-6 h-6" />
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-medium">{selectedRoom.aiModel.name}</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs text-muted-foreground">Online</span>
                </div>
              </div>
            </div>
          )}
          {selectedRoom?.aiModel && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsProfileVisible(true)}
            >
              <UserCircle2 className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          {selectedRoom?.aiModel && (
            <>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={selectedRoom.aiModel.imageUrl || undefined} />
                  <AvatarFallback>
                    <UserCircle2 className="w-6 h-6" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-medium">{selectedRoom.aiModel.name}</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs text-muted-foreground">Online</span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={() => setIsProfileVisible(true)}
                className="gap-2"
              >
                <UserCircle2 className="h-5 w-5" />
                View Profile
              </Button>
            </>
          )}
        </div>

        {/* Chat Content */}
        <div className="flex-1 min-h-0">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : initError ? (
            <div className="h-full flex items-center justify-center text-destructive">
              {initError}
            </div>
          ) : !selectedRoom ? (
            <div className="h-full overflow-y-auto scrollbar-pretty">
              <EmptyStateGuide />
            </div>
          ) : (
            <ClientChatMessages
              chatRoom={selectedRoom}
              onSendMessage={async (content: string) => {
                await handleSendMessage(content, selectedRoom);
              }}
              messages={messages}
            />
          )}
        </div>
      </div>
    </div>
  );
};
