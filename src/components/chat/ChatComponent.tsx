// src/components/chat/ChatComponent.tsx

"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { debounce, DebouncedFunc } from "lodash";
import { generateAndSaveGreeting } from "./Greeting";

import {
  ChatRoomList,
  ExtendedChatRoom as ComponentExtendedChatRoom,
} from "@/components/chat/ChatRoomList";
import ClientChatMessages from "@/components/chat/ClientChatMessages";
import ModelProfile from "@/components/chat/ModelProfile";
import {
  ChatComponentProps,
  SendMessageFunction,
  ToggleProfileFunction,
  CleanupFunction,
  ChatMessage,
  ExtendedChatRoom,
  AiModel,
} from "@/types/chat";
import { useToast } from "@/hooks/use-toast";
import {
  deleteChatRoom,
  getChatRooms,
  getOrCreateChatRoom,
} from "@/app/api/chat/client-actions";
import { ChevronRight, Loader2 } from "lucide-react";


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
const LoadingState = () => (
  <div className="flex-1 flex items-center justify-center gap-2">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    <p className="text-muted-foreground">Loading chat...</p>
  </div>
);

/**
 * Error state component
 */
const ErrorState = ({
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
 * Helper function to map a chat room from the component format to the local format.
 * Ensures date fields are proper Date objects and fills in default values.
 */
const mapComponentToLocalRoom = (
  room: ComponentExtendedChatRoom
): ExtendedChatRoom => {
  return {
    id: room.id,
    name: room.name || "",
    aiModelId: room.aiModelId || "",
    aiModelImageUrl: room.aiModelImageUrl || null,
    users: room.users || [],
    messages:
      room.messages?.map((msg) => ({
        id: msg.id,
        content: msg.content,
        chatRoomId: msg.chatRoomId,
        role: msg.isAIMessage ? "assistant" : "user",
        createdAt: new Date(msg.createdAt),
        updatedAt: new Date(msg.updatedAt),
        user: msg.user || null,
        aiModelId: msg.aiModelId || null,
        isAIMessage: !!msg.isAIMessage,
        metadata: msg.metadata || {},
      })) || [],
    createdAt: new Date(room.createdAt),
    updatedAt: new Date(room.updatedAt),
    aiModel: {
      id: room.aiModel?.id || "",
      name: room.aiModel?.name || "",
      imageUrl: room.aiModel?.imageUrl || null,
      personality: room.aiModel?.personality || "",
      userId: room.aiModel?.userId || "",
      followerCount: room.aiModel?.followerCount || 0,
      appearance: room.aiModel?.appearance || "",
      backstory: room.aiModel?.backstory || "",
      hobbies: room.aiModel?.hobbies || "",
      likes: room.aiModel?.likes || "",
      dislikes: room.aiModel?.dislikes || "",
      age: room.aiModel?.age || null,
      isPrivate: room.aiModel?.isPrivate || false,
      isAnime: room.aiModel?.isAnime || false,
      isHuman: room.aiModel?.isHuman || false,
      isHumanX: room.aiModel?.isHumanX || false,
      isFollowing: room.aiModel?.isFollowing || false,
      createdAt: room.aiModel?.createdAt || undefined,
      updatedAt: room.aiModel?.updatedAt || undefined,
      createdBy: {
        id: "",
        name: "",
        email: "",
        imageUrl: null
      }
    },
    createdBy: room.createdBy || null,
  };
};

/**
 * Helper function to map an AI model to the props expected by the ModelProfile component.
 * Ensures date fields are proper Date objects and fills in default values.
 */
const mapAIModelToProfileProps = (model: AiModel | undefined | null) => {
  if (!model) return null;
  return {
    id: model.id,
    name: model.name,
    imageUrl: model.imageUrl || "",
    personality: model.personality,
    userId: model.userId,
  };
};

/**
 * Generic fetch function with retry logic and error handling.
 * Retries the fetch request up to a specified number of times in case of failure.
 */
const fetchWithRetry = async <T,>(
  url: string,
  options: RequestInit,
  retries = 3
): Promise<T> => {
  let lastError: Error | null = null;

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return (await response.json()) as T;
    } catch (error) {
      lastError = error as Error;
      if (i === retries - 1) break;
      // Exponential backoff before retrying
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
  const [chatRooms, setChatRooms] = useState<ExtendedChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ExtendedChatRoom | null>(
    initialChatRoom || null
  );
  const [isProfileVisible, setIsProfileVisible] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [isRoomLoading, setIsRoomLoading] = useState<string | null>(null); // Loading state for room selection
  const [isMessageSending, setIsMessageSending] = useState(false); // Loading state for message sending
  const [_isGreetingGenerating, setIsGreetingGenerating] = useState(false); // Loading state for greeting generation
  const [_messageError, setMessageError] = useState<string | null>(null); // Error state for message sending
  const [_roomError, setRoomError] = useState<string | null>(null); // Error state for room selection

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
  const initializeChat = useMemo(
    () =>
      async (retry = false) => {
        if (isInitialized && !retry) return;

        try {
          setInitError(null);
          setIsLoading(true);

          // Fetch all chat rooms if not provided
          if (!initialChatRoom) {
            const allRooms = await getChatRooms().catch((error) => {
              throw new Error("Failed to fetch chat rooms: " + error.message);
            });
            setChatRooms(
              (allRooms as ComponentExtendedChatRoom[]).map(
                mapComponentToLocalRoom
              )
            );
          }

          let activeRoom = initialChatRoom;
          // If a modelId is provided and no initial chat room, create or get a chat room
          if (modelId && !initialChatRoom) {
            const rawRoom = await getOrCreateChatRoom(modelId);
            console.log('Raw Room Data:', JSON.stringify(rawRoom, null, 2));
            activeRoom = {
              ...rawRoom,
              users: [],
              aiModelId: rawRoom.aiModelId ?? '',
              aiModelImageUrl: rawRoom.aiModel?.imageUrl ?? null,
              messages: [],
              createdBy: null,
              aiModel: {
                ...rawRoom.aiModel,
                id: rawRoom.aiModel?.id ?? '',
                name: rawRoom.aiModel?.name ?? '',
                imageUrl: rawRoom.aiModel?.imageUrl ?? '',
                personality: rawRoom.aiModel?.personality ?? '',
                userId: rawRoom.aiModel?.userId ?? '',
                followerCount: rawRoom.aiModel?.followerCount ?? 0,
                appearance: rawRoom.aiModel?.appearance ?? '',
                backstory: rawRoom.aiModel?.backstory ?? '',
                hobbies: rawRoom.aiModel?.hobbies ?? '',
                likes: rawRoom.aiModel?.likes ?? '',
                dislikes: rawRoom.aiModel?.dislikes ?? '',
                age: rawRoom.aiModel?.age ?? null,
                isPrivate: rawRoom.aiModel?.isPrivate ?? false,
                isAnime: rawRoom.aiModel?.isAnime ?? false,
                isHuman: false,
                isHumanX: false,
                isFollowing: false,
                createdAt: rawRoom.aiModel?.createdAt ?? new Date(),
                updatedAt: rawRoom.aiModel?.updatedAt ?? new Date(),
                createdBy: {
                  id: '',
                  name: '',
                  email: '',
                  imageUrl: null
                }
              }
            };
            setChatRooms((prev) => {
              if (!activeRoom) return prev;
              const exists = prev.some(
                (r) => r.id === (activeRoom as ExtendedChatRoom).id
              );
              return exists ? prev : [...prev, activeRoom as ExtendedChatRoom];
            });
            router.push(`/chat/${activeRoom.id}`);
          }

          if (activeRoom) {
            setSelectedRoom(activeRoom);

            // Generate and save greeting if the chat room is new
            if (activeRoom.aiModel) {
              setIsGreetingGenerating(true);
              await generateAndSaveGreeting({ room: activeRoom });
              setIsGreetingGenerating(false);
            }
          }

          setIsInitialized(true);
        } catch (error) {
          handleApiError(error, toast, "Failed to initialize chat");
          setInitError("Failed to initialize chat. Please try again.");
          // Propagate error to parent if handler exists
          if (onError && error instanceof Error) {
            onError(error);
          }
        } finally {
          setIsLoading(false);
        }
      },
    [initialChatRoom, modelId, isInitialized, router, toast, onError]
  );

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
      
      const response = await fetch(`/api/chat/${room.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send message');
      }

      const message = await response.json();
      return message;
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

  /**
   * Handler function for selecting a chat room.
   * Updates the selected room and navigates to the room's URL.
   */
  const handleRoomSelection = async (room: ComponentExtendedChatRoom) => {
    try {
      setIsRoomLoading(room.id);
      setRoomError(null);

      const mappedRoom = mapComponentToLocalRoom(room);
      setSelectedRoom(mappedRoom);
      
      // Update URL without navigation
      window.history.replaceState({}, '', `/chat?room=${room.id}`);
    } catch (error) {
      handleApiError(error, toast, "Failed to switch chat rooms");
      setRoomError("Failed to switch chat rooms. Please try again.");
    } finally {
      setIsRoomLoading(null);
    }
  };

  /**
   * Render the chat interface with improved error handling and loading states.
   */
  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {isLoading ? (
        <LoadingState />
      ) : initError ? (
        <ErrorState message={initError} onRetry={() => initializeChat(true)} />
      ) : (
        <>
          {/* Chat room list */}
          <div className="w-80 border-r border-[#1a1a1a] flex-shrink-0 h-full overflow-hidden">
            <ChatRoomList
              isLoading={false}
              loadingRoomId={isRoomLoading}
              chatRooms={chatRooms.map((room) => ({
                ...room,
                aiModel: room.aiModel,
                messages: room.messages.map((msg) => ({
                  ...msg,
                  user: msg.user || null,
                  aiModelId: msg.aiModelId || null,
                  isAIMessage: !!msg.isAIMessage,
                  metadata: msg.metadata || {},
                  role: msg.isAIMessage ? "assistant" : "user",
                })),
              }))}
              selectedRoom={selectedRoom}
              onSelectRoom={handleRoomSelection}
              onDeleteRoom={deleteChatRoom}
            />
          </div>

          {/* Chat messages and input */}
          <div
            className={`transition-all duration-300 ${
              isProfileVisible ? "flex-1" : "flex-[2]"
            } flex flex-col h-full`}
          >
            {selectedRoom ? (
              <div className="relative flex flex-col h-full">
                <ClientChatMessages
                  chatRoom={{
                    id: selectedRoom.id,
                    users: selectedRoom.users,
                    aiModel: selectedRoom.aiModel
                      ? {
                          ...selectedRoom.aiModel,
                          imageUrl: selectedRoom.aiModel.imageUrl || "",
                        }
                      : null,
                  }}
                  onSendMessage={(content) =>
                    handleSendMessage(content, selectedRoom)
                  }
                  _isLoading={isMessageSending || isGeneratingResponse}
                />
                {/* Toggle profile visibility button */}
                <button
                  onClick={debouncedToggleProfile}
                  className="absolute right-4 top-4 p-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] rounded-full transition-all duration-200 z-10"
                >
                  <ChevronRight
                    className={`w-4 h-4 text-white transform transition-transform duration-200 ${
                      isProfileVisible ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>
            ) : (
              // Placeholder when no room is selected
              <div className="flex-1 flex items-center justify-center">
                <p className="text-muted-foreground">
                  Select a chat room to start messaging
                </p>
              </div>
            )}
          </div>

          {/* AI model profile sidebar */}
          {selectedRoom && (
            <div
              className={`w-[400px] border-l border-[#1a1a1a] flex-shrink-0 h-full 
                  overflow-y-auto bg-[#0a0a0a] transition-all duration-300 ease-in-out
                  ${
                    isProfileVisible ? "translate-x-0" : "translate-x-full w-0"
                  }`}
            >
              <ModelProfile
                model={mapAIModelToProfileProps(selectedRoom.aiModel)}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ChatComponent;
