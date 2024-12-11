// src/components/chat/ChatComponent.tsx

"use client";

import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ExtendedChatRoom, Message, MessageMetadata } from '@/types/chat';
import { ChatRoomList } from './ChatRoomList';
import { ChevronRight, Loader2, ChevronLeft } from 'lucide-react';
import { ClientChatMessages } from './ClientChatMessages';
import { deleteChatRoom, getOrCreateChatRoom } from '@/lib/actions/chat';
import { cn } from '@/lib/utils';

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
  const handleRoomSelection = useCallback(async (room: ExtendedChatRoom) => {
    if (loadingRoomId || room.id === selectedRoom?.id) return;
    setLoadingRoomId(room.id);
    
    try {
      const response = await fetch(`/api/chat/${room.id}/messages`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      
      const data = await response.json();
      setMessages(data.messages?.map(transformMessage) || []);
      setSelectedRoom(room);
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

  // Effects
  useEffect(() => {
    if (initialChatRoom) {
      const transformed = transformRoom(initialChatRoom);
      setChatRooms([transformed]);
      setSelectedRoom(transformed);
      setMessages(transformed.messages);
    } else if (modelId) {
      setIsLoading(true);
      getOrCreateChatRoom(modelId)
        .then(room => {
          if (room) {
            const transformed = transformRoom(room);
            setChatRooms([transformed]);
            setSelectedRoom(transformed);
            setMessages(transformed.messages);
          }
        })
        .catch(error => {
          console.error('Error creating chat room:', error);
          if (onError) onError(error);
        })
        .finally(() => setIsLoading(false));
    } else {
      // Load all chat rooms if no specific room or model is provided
      setIsLoading(true);
      fetch('/api/chat/rooms')
        .then(res => res.json())
        .then(data => {
          const transformed = data.chatRooms.map(transformRoom);
          setChatRooms(transformed);
        })
        .catch(error => {
          console.error('Error fetching chat rooms:', error);
          if (onError) onError(error);
        })
        .finally(() => setIsLoading(false));
    }
  }, [initialChatRoom, modelId, transformRoom, onError]);

  // Memoized UI elements
  const sidebarContent = useMemo(() => (
    <div className={cn(
      "h-full w-[280px] bg-[#0f0f0f] border-r border-white/5",
      "fixed inset-y-0 left-0 z-20 md:relative md:translate-x-0",
      "transition-transform duration-300 ease-in-out",
      isSidebarOpen ? "translate-x-0" : "-translate-x-full",
      "md:shadow-none"
    )}>
      <div className="flex flex-col h-full">
        <div className="shrink-0 p-4 border-b border-white/5">
          <h2 className="font-medium text-white/70">Your Chats</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ChatRoomList
            rooms={chatRooms}
            selectedRoom={selectedRoom}
            onRoomSelect={handleRoomSelection}
            onDeleteRoom={handleDeleteRoom}
            loadingRoomId={loadingRoomId}
            isDeletingRoom={isDeletingRoom}
          />
        </div>
      </div>
    </div>
  ), [chatRooms, selectedRoom, isSidebarOpen, loadingRoomId, isDeletingRoom, handleRoomSelection, handleDeleteRoom]);

  const backdropOverlay = useMemo(() => (
    <div 
      className={cn(
        "fixed inset-0 bg-black/50 z-10 md:hidden",
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
      
      <div className="flex-1 flex flex-col h-full">
        <div className="h-12 flex items-center px-4 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="h-8 w-8 -ml-2"
          >
            {isSidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </Button>
        </div>

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
