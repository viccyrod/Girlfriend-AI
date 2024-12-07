// src/components/chat/ChatComponent.tsx

"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { debounce, DebouncedFunc } from "lodash";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Image as LucideImage } from "lucide-react";

import {
  ChatRoomList,
  ExtendedChatRoom,
} from "@/components/chat/ChatRoomList";
import ClientChatMessages from "@/components/chat/ClientChatMessages";
import ModelProfile from "@/components/chat/ModelProfile";
import {
  ChatComponentProps,
  SendMessageFunction,
  ToggleProfileFunction,
  CleanupFunction,
  ChatMessage,
  AiModel,
  MetadataValue,
} from "@/types/chat";
import { useToast } from "@/hooks/use-toast";
import { 
  deleteChatRoom, 
  getChatRooms, 
  getOrCreateChatRoom,
  sendMessage 
} from '@/lib/actions/chat';
import { ChevronRight, Loader2, ChevronLeft, UserCircle2 } from "lucide-react";
import { generateGreeting } from '@/lib/ai-client';


/**
 * Utility function for consistent API error handling
 */
const handleApiError = (
  error: unknown,
  toast: any,
  customMessage?: string
) => {
  console.error(error);
  const errorMessage = error instanceof Error ? error.message : customMessage || "An error occurred";
  toast({
    title: "Error",
    description: errorMessage,
    variant: "destructive",
    duration: 3000,
    role: "alert"
  });
  // Add visible error message in DOM
  const errorDiv = document.createElement('div');
  errorDiv.setAttribute('role', 'alert');
  errorDiv.textContent = errorMessage;
  document.body.appendChild(errorDiv);
};

/**
 * Loading state component
 */
const _LoadingState = () => (
  <div className="flex-1 flex items-center justify-center gap-2">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    <p className="text-muted-foreground">Loading chat...</p>
  </div>
);

/**
 * Error state component
 */
const _ErrorState = ({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) => (
  <div className="flex-1 flex flex-col items-center justify-center gap-4">
    <p className="text-destructive">{message}</p>
    <button
      onClick={onRetry}
      className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
    >
      Retry
    </button>
  </div>
);

/**
 * Helper function to map an AI model to the props expected by the ModelProfile component.
 * Ensures date fields are proper Date objects and fills in default values.
 */
const DEFAULT_AVATAR = '/images/default-avatar.png';
const DEFAULT_MODEL_IMAGE = '/images/default-model.png';

const mapAIModelToProfileProps = (model: AiModel) => ({
  ...model,
  imageUrl: model.imageUrl || DEFAULT_MODEL_IMAGE,
  createdBy: {
    ...model.createdBy,
    imageUrl: model.createdBy?.imageUrl || DEFAULT_AVATAR
  }
});

/**
 * Generic fetch function with retry logic and error handling.
 * Retries the fetch request up to a specified number of times in case of failure.
 */
const fetchWithRetry = async <T,>(
  url: string,
  options: RequestInit = {},
  retries = 3
): Promise<T> => {
  let lastError: Error | null = null;

  // Add default headers for CORS
  const defaultOptions: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  };

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, defaultOptions);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return (await response.json()) as T;
    } catch (error) {
      lastError = error as Error;
      if (i === retries - 1) break;
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, i) * 1000)
      );
    }
  }

  throw new Error(
    `Failed after ${retries} retries. Last error: ${lastError?.message}`
  );
};

/**
 * Main ChatComponent that renders the chat interface.
 * Handles initialization, room selection, and message sending.
 */
const ChatComponent = ({
  initialChatRoom,
  modelId,
  onError,
}: ChatComponentProps) => {
  const router = useRouter();
  const { toast } = useToast();

  // All state hooks
  const [mounted, setMounted] = useState(false);
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
  const [isRoomLoading, setIsRoomLoading] = useState<string | null>(null);
  const [isMessageSending, setIsMessageSending] = useState(false);
  const [isGreetingGenerating, setIsGreetingGenerating] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [loadingRoomId, setLoadingRoomId] = useState<string | null>(null);
  const [isDeletingRoom, setIsDeletingRoom] = useState<string | null>(null);

  // All memoized functions
  const debouncedSendMessage = useMemo(
    () =>
      debounce(async (content: string, room: ExtendedChatRoom) => {
        try {
          setIsMessageSending(true);
          setMessageError(null);
          await sendMessage(room.id, content);
        } catch (error) {
          handleApiError(error, toast, "Failed to send message");
          setMessageError("Failed to send message");
        } finally {
          setIsMessageSending(false);
        }
      }, 500),
    [toast]
  );

  const debouncedToggleProfile = useMemo(
    () =>
      debounce(() => {
        setIsProfileVisible((prev) => !prev);
      }, 200),
    []
  );

  const initializeChat = useCallback(async (retry = false) => {
    if (isInitialized && !retry) return;

    try {
      setInitError(null);
      setIsLoading(true);

      let activeRoom = initialChatRoom;
      
      if (modelId && !initialChatRoom) {
        const rawRoom = await getOrCreateChatRoom(modelId);
        activeRoom = {
          ...rawRoom,
          users: rawRoom.users || [],
          createdBy: {
            id: rawRoom.aiModel?.createdBy?.id || '',
            name: rawRoom.aiModel?.createdBy?.name || '',
            email: rawRoom.aiModel?.createdBy?.email || '',
            imageUrl: rawRoom.aiModel?.createdBy?.image || null
          },
          aiModelId: rawRoom.aiModelId || '',
          aiModelImageUrl: rawRoom.aiModel?.imageUrl || null,
          messages: rawRoom.messages.map(msg => ({
            ...msg,
            role: msg.isAIMessage ? "assistant" : "user" as const,
            metadata: msg.metadata as Record<string, MetadataValue> || undefined
          })) || [],
          aiModel: rawRoom.aiModel ? {
            ...rawRoom.aiModel,
            createdBy: {
              id: rawRoom.aiModel.createdBy?.id || '',
              name: rawRoom.aiModel.createdBy?.name || '',
              email: rawRoom.aiModel.createdBy?.email || '',
              imageUrl: rawRoom.aiModel.createdBy?.image || null
            }
          } : null
        };
      }

      const allRooms = await getChatRooms();
      const uniqueRooms = [...allRooms];
      if (activeRoom && !uniqueRooms.some(room => room.id === activeRoom?.id)) {
        uniqueRooms.unshift(activeRoom);
      }
      
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

  // All effects
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      initializeChat();
    }
  }, [mounted, initializeChat]);

  useEffect(() => {
    return () => {
      debouncedToggleProfile.cancel();
      debouncedSendMessage.cancel();
      setIsInitialized(false);
      setIsGeneratingResponse(false);
      setMessageError(null);
      setRoomError(null);
    };
  }, [debouncedToggleProfile, debouncedSendMessage]);

  if (!mounted) {
    return null;
  }

  /**
   * Handler function to send a message.
   * Calls the debounced send message function.
   */
  const handleSendMessage = async (content: string, room: ExtendedChatRoom) => {
    try {
      setIsMessageSending(true);
      console.log('Sending message to room:', room.id);
      await sendMessage(room.id, content, { type: 'text' });
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

  /**
   * Handler function for selecting a chat room.
   * Updates the selected room and navigates to the room's URL.
   */
  const handleRoomSelection = async (room: ExtendedChatRoom) => {
    try {
      setLoadingRoomId(room.id);
      setRoomError(null);
      setSelectedRoom({
        ...room,
        aiModel: room.aiModel ? {
          ...room.aiModel,
          id: room.aiModel.id,
          userId: room.aiModel.userId,
          name: room.aiModel.name,
          personality: room.aiModel.personality,
          appearance: room.aiModel.appearance,
          backstory: room.aiModel.backstory,
          hobbies: room.aiModel.hobbies,
          likes: room.aiModel.likes,
          dislikes: room.aiModel.dislikes,
          imageUrl: room.aiModel.imageUrl,
          isPrivate: room.aiModel.isPrivate,
          followerCount: room.aiModel.followerCount,
          isHumanX: room.aiModel.isHumanX,
          isAnime: room.aiModel.isAnime,
          age: room.aiModel.age || null,
          voiceId: room.aiModel.voiceId || null,
          createdAt: new Date(room.aiModel.createdAt),
          updatedAt: new Date(room.aiModel.updatedAt),
        } as AiModel
        : null
      });
      
      // Send greeting through dedicated endpoint
      if (room.aiModel) {
        console.log('Sending greeting for room:', room.id);
        setIsGreetingGenerating(true);
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

        const data = await response.json();
        console.log('Greeting response:', data);
      }
    } catch (error) {
      console.error('Room selection error:', error);
      handleApiError(error, toast, "Failed to select chat room");
      setRoomError("Failed to select chat room");
    } finally {
      setLoadingRoomId(null);
      setIsGreetingGenerating(false);
      setIsGeneratingResponse(false);
    }
  };

  /**
   * Handler function to delete a chat room.
   * Updates local state and navigation.
   */
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
      handleApiError(error, toast, "Failed to delete chat room");
    } finally {
      setIsDeletingRoom(null);
    }
  };

  /**
   * Render the chat interface with improved error handling and loading states.
   */
  return (
    <div className="flex h-full relative">
      {/* Chat rooms list */}
      <div className={`
        flex-shrink-0 w-full md:w-80 border-r border-[#1a1a1a] bg-[#0a0a0a]
        ${selectedRoom ? 'hidden md:block' : ''}
      `}>
        <ChatRoomList
          chatRooms={chatRooms}
          selectedRoom={selectedRoom}
          onSelectRoom={handleRoomSelection}
          onDeleteRoom={handleDeleteRoom}
          loadingRoomId={loadingRoomId}
          isLoading={isLoading}
        />
      </div>

      {/* Chat messages container */}
      <div className={`
        flex-1 flex flex-col h-full relative
        transition-all duration-300 ease-in-out
        ${selectedRoom ? 'flex' : 'hidden md:flex'}
        ${isProfileVisible ? 'md:mr-[400px]' : ''}
      `}>
        {selectedRoom ? (
          <div className="relative flex flex-col h-full w-full">
            {/* Mobile back button */}
            <button
              onClick={() => setSelectedRoom(null)}
              className="md:hidden absolute left-4 top-4 p-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] rounded-full transition-all duration-200 z-10"
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
            
            <ClientChatMessages
              chatRoom={selectedRoom}
              onSendMessage={(content: string) => handleSendMessage(content, selectedRoom)}
              isLoading={isMessageSending}
              isGeneratingResponse={isGeneratingResponse}
            />
          </div>
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
        flex-shrink-0 h-full bg-[#0a0a0a] 
        transition-transform duration-300 ease-in-out z-40
        ${isProfileVisible 
          ? "translate-x-0 shadow-2xl" 
          : "translate-x-full"
        }
        ${isProfileVisible && !selectedRoom ? "hidden md:block" : ""}
      `}>
        {/* Profile toggle button - only show when expanded */}
        {isProfileVisible && (
          <button
            onClick={debouncedToggleProfile}
            className="absolute left-0 top-6 -translate-x-full bg-[#1a1a1a] hover:bg-[#2a2a2a] p-2 pl-3 pr-4 rounded-l-md transition-all duration-200 flex items-center gap-2 text-sm text-white/80 hover:text-white"
            aria-label="Hide profile"
          >
            <UserCircle2 className="w-4 h-4" />
            <span className="hidden md:inline">Hide Profile</span>
            <ChevronRight className="w-4 h-4 transform rotate-180" />
          </button>
        )}
        
        <div className="h-full overflow-y-auto scrollbar-pretty">
          <ModelProfile
            model={selectedRoom?.aiModel ? mapAIModelToProfileProps(selectedRoom.aiModel) : null}
            onClose={() => setIsProfileVisible(false)}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;
