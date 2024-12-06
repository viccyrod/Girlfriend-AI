// src/components/chat/ChatComponent.tsx

"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { debounce, DebouncedFunc } from "lodash";
import { useRouter } from "next/navigation";

import {
  ChatRoomList,
  ExtendedChatRoom,
} from "@/components/chat/ChatRoomList";
import ClientChatMessages from "@/components/chat/ClientChatMessages";
import ModelProfile from "@/components/chat/ModelProfile";
import { VoiceMessage } from '@/components/chat/VoiceMessage';
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
import { ChevronRight, Loader2, ChevronLeft } from "lucide-react";
import { generateGreeting } from '@/lib/ai-client';


/**
 * Utility function for consistent API error handling
 */
const handleApiError = (
  error: unknown,
  toast: (props: {
    title: string;
    description: string;
    variant?: "destructive";
  }) => void,
  customMessage?: string
) => {
  console.error(error);
  toast({
    title: "Error",
    description:
      customMessage || "An unexpected error occurred. Please try again.",
    variant: "destructive",
  });
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

  // State variables
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(!initialChatRoom && !!modelId);
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const [chatRooms, setChatRooms] = useState<ExtendedChatRoom[]>(
    initialChatRoom ? [initialChatRoom] : []
  );
  const [selectedRoom, setSelectedRoom] = useState<ExtendedChatRoom | null>(
    initialChatRoom || null
  );
  const [_isProfileVisible, setIsProfileVisible] = useState(true);
  const [_initError, setInitError] = useState<string | null>(null);
  const [_isRoomLoading, _setIsRoomLoading] = useState<string | null>(null); // Loading state for room selection
  const [isMessageSending, setIsMessageSending] = useState(false); // Loading state for message sending
  const [_isGreetingGenerating, setIsGreetingGenerating] = useState(false); // Loading state for greeting generation
  const [_messageError, setMessageError] = useState<string | null>(null); // Error state for message sending
  const [_roomError, setRoomError] = useState<string | null>(null); // Error state for room selection
  const [loadingRoomId, setLoadingRoomId] = useState<string | null>(null);
  const [_isDeletingRoom, setIsDeletingRoom] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  /**
   * Cleanup effect to reset state when the component is unmounted.
   */
  useEffect(() => {
    return () => {
      setIsInitialized(false);
      setIsGeneratingResponse(false);
      setMessageError(null);
      setRoomError(null);
    };
  }, []);

  /**
   * Function to initialize the chat.
   * Fetches chat rooms, selects the active room, and generates a greeting if necessary.
   */
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
        
        activeRoom = {
          ...rawRoom,
          users: rawRoom.users || [],
          createdBy: rawRoom.aiModel?.createdBy || {
            id: '',
            name: '',
            email: '',
            imageUrl: null
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
            id: rawRoom.aiModel.id || '',
            name: rawRoom.aiModel.name || '',
            personality: rawRoom.aiModel.personality || '',
            appearance: rawRoom.aiModel.appearance || '',
            backstory: rawRoom.aiModel.backstory || '',
            hobbies: rawRoom.aiModel.hobbies || '',
            likes: rawRoom.aiModel.likes || '',
            dislikes: rawRoom.aiModel.dislikes || '',
            createdAt: new Date(rawRoom.aiModel.createdAt),
            updatedAt: new Date(rawRoom.aiModel.updatedAt),
            imageUrl: rawRoom.aiModel.imageUrl || '',
            userId: rawRoom.aiModel.userId || '',
            followerCount: rawRoom.aiModel.followerCount || 0,
            isPrivate: rawRoom.aiModel.isPrivate || false,
            isAnime: rawRoom.aiModel.isAnime || false,
            isFollowing: rawRoom.aiModel.isFollowing || false,
            isHumanX: rawRoom.aiModel.isHumanX || false,
            age: rawRoom.aiModel.age || null,
            voiceId: rawRoom.aiModel.voiceId || null,
            createdBy: rawRoom.aiModel.createdBy ? {
              id: rawRoom.aiModel.createdBy.id || '',
              name: rawRoom.aiModel.createdBy.name || '',
              email: rawRoom.aiModel.createdBy.email || '',
              imageUrl: rawRoom.aiModel.createdBy.image || null
            } : null
          } : null,
        };

        // Send greeting if this is a new room
        if (activeRoom.messages.length === 0 && activeRoom.aiModel) {
          setIsGeneratingResponse(true);
          try {
            const greeting = await generateGreeting(
              {
                id: activeRoom.aiModel.id,
                userId: activeRoom.aiModel.userId,
                name: activeRoom.aiModel.name,
                personality: activeRoom.aiModel.personality || '',
                appearance: activeRoom.aiModel.appearance || '',
                backstory: activeRoom.aiModel.backstory || '',
                hobbies: activeRoom.aiModel.hobbies || '',
                likes: activeRoom.aiModel.likes || '',
                dislikes: activeRoom.aiModel.dislikes || '',
                imageUrl: activeRoom.aiModel.imageUrl || '',
                isPrivate: activeRoom.aiModel.isPrivate || false,
                followerCount: activeRoom.aiModel.followerCount || 0,
                isAnime: activeRoom.aiModel.isAnime || false,
                isHumanX: activeRoom.aiModel.isHumanX || false,
                age: activeRoom.aiModel.age || null,
                voiceId: activeRoom.aiModel.voiceId || null,
                createdAt: new Date(activeRoom.aiModel.createdAt),
                updatedAt: new Date(activeRoom.aiModel.updatedAt)
              },
              [],
              true
            );
            await sendMessage(activeRoom.id, greeting);
          } catch (error) {
            console.error('Error generating greeting:', error);
          } finally {
            setIsGeneratingResponse(false);
          }
        }
      }

      // Fetch all chat rooms
      const allRooms = await getChatRooms().catch((error) => {
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

  /**
   * useEffect to initialize the chat when the component mounts or dependencies change.
   */
  useEffect(() => {
    initializeChat();
  }, [initializeChat]);

  /**
   * Debounced function to send a message.
   * Uses useMemo to ensure the debounced function is stable across renders.
   */
  const debouncedSendMessage: DebouncedFunc<SendMessageFunction> = useMemo(
    () =>
      debounce(async (content, room) => {
        try {
          setIsMessageSending(true);
          setMessageError(null);

          const message: ChatMessage = {
            content,
            aiModelId: room.aiModel?.id,
            isAIMessage: false,
          };

          await fetchWithRetry(`/api/chat/${room.id}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(message),
          });
        } catch (error) {
          handleApiError(error, toast, "Failed to send message");
          setMessageError("Failed to send message. Please try again.");
        } finally {
          setIsMessageSending(false);
        }
      }, 500),
    [toast]
  );

  /**
   * Debounced function to toggle the profile visibility.
   * Uses useMemo to ensure the debounced function is stable across renders.
   */
  const debouncedToggleProfile: DebouncedFunc<ToggleProfileFunction> = useMemo(
    () =>
      debounce(() => {
        setIsProfileVisible((prev) => !prev);
      }, 200),
    []
  );

  /**
   * Cleanup effect to cancel debounced functions when the component unmounts.
   */
  useEffect((): CleanupFunction => {
    return () => {
      debouncedToggleProfile.cancel();
      debouncedSendMessage.cancel();
    };
  }, [debouncedToggleProfile, debouncedSendMessage]);

  /**
   * Handler function to send a message.
   * Calls the debounced send message function.
   */
  const handleSendMessage = async (content: string, room: ExtendedChatRoom) => {
    try {
      setIsMessageSending(true);
      console.log('Sending message to room:', room.id);
      return await sendMessage(room.id, content, { type: 'text' });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsMessageSending(false);
    }
  };

  const handleVoiceMessage = async (audioBlob: Blob) => {
    if (!selectedRoom) return;

    try {
      setIsMessageSending(true);

      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64 = reader.result as string;
          resolve(base64.split(',')[1]); // Remove data URL prefix
        };
      });
      reader.readAsDataURL(audioBlob);
      
      const base64Audio = await base64Promise;

      // Send voice message
      return await sendMessage(selectedRoom.id, "", {
        type: 'voice',
        audioData: base64Audio
      });
    } catch (error) {
      console.error('Error sending voice message:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send voice message",
        variant: "destructive",
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
          updatedAt: new Date(room.aiModel.updatedAt)
        } : null
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
        description: "Chat room deleted successfully"
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
    <div className="flex h-full overflow-hidden relative">
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
        flex-1 flex flex-col h-full relative
        transition-all duration-300 ease-in-out
        ${selectedRoom ? 'flex' : 'hidden md:flex'}
        ${_isProfileVisible ? 'md:mr-[400px]' : ''}
      `}>
        {selectedRoom ? (
          <div className="relative flex flex-col h-full">
            {/* Mobile back button */}
            <button
              onClick={() => setSelectedRoom(null)}
              className="md:hidden absolute left-4 top-4 p-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] rounded-full transition-all duration-200 z-10"
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
            
            <ClientChatMessages
              chatRoom={selectedRoom}
              _onSendMessage={(content: string) => handleSendMessage(content, selectedRoom)}
              _isLoading={isMessageSending}
              isGeneratingResponse={isGeneratingResponse}
            />
            
            {/* Toggle profile visibility button */}
            <button
              onClick={debouncedToggleProfile}
              className="absolute right-4 top-4 p-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] rounded-full transition-all duration-200 z-10"
            >
              <ChevronRight
                className={`w-4 h-4 text-white transform transition-transform duration-200 ${
                  _isProfileVisible ? "rotate-180" : ""
                }`}
              />
            </button>
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
        flex-shrink-0 h-full overflow-y-auto bg-[#0a0a0a] 
        transition-transform duration-300 ease-in-out z-40
        ${_isProfileVisible 
          ? "translate-x-0" 
          : "translate-x-full"
        }
        ${_isProfileVisible && !selectedRoom ? "hidden md:block" : ""}
      `}>
        <ModelProfile
          model={selectedRoom?.aiModel ? mapAIModelToProfileProps(selectedRoom.aiModel) : null}
          onClose={() => setIsProfileVisible(false)}
        />
      </div>

      {/* Voice message input */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-2">
          <VoiceMessage
            onVoiceMessage={handleVoiceMessage}
            isRecording={isRecording}
            setIsRecording={setIsRecording}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;
