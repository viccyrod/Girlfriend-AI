import { User } from '@prisma/client';

// Core Types
export interface Message {
  id: string;
  content: string;
  chatRoomId: string;
  role: 'user' | 'assistant';
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
  aiModelId?: string | null;
  isAIMessage?: boolean;
  metadata?: Record<string, MetadataValue>;
}

export interface CreatedBy {
  id: string;
  name: string;
  email?: string;
  imageUrl?: string | null;
}

export interface AiModel {
  id: string;
  name: string;
  imageUrl: string | null;
  personality: string;
  userId: string;
  followerCount: number;
  appearance: string;
  backstory: string;
  hobbies: string;
  likes: string;
  dislikes: string;
  age: number | null;
  isPrivate: boolean;
  isAnime: boolean;
  isHuman: boolean;
  isHumanX: boolean;
  isFollowing: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: {
    id: string;
    name: string;
    email: string;
    imageUrl: string | null;
  };
}

export interface ExtendedChatRoom {
  id: string;
  name: string;
  aiModel: AiModel;
  aiModelId: string;
  aiModelImageUrl: string | null;
  users: User[];
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: CreatedBy | null;
}

// Component Props and Function Types
export interface ChatComponentProps {
  initialChatRoom?: ExtendedChatRoom | null;
  modelId?: string;
  onError?: (error: Error) => void;
}

export type SendMessageFunction = (
  content: string,
  room: ExtendedChatRoom
) => Promise<void>;
export type ToggleProfileFunction = () => void;
export type CleanupFunction = () => void;

// API Types
export interface ChatMessage {
  content: string;
  aiModelId?: string;
  isAIMessage?: boolean;
}

export interface ChatRoomResponse {
  id: string;
  name: string;
  aiModelId: string;
  messages: Message[];
  aiModel: AiModel;
}

export interface MessageResponse {
  userMessage?: Message;
  aiMessage: Message;
  error?: string;
}

export type MetadataValue = string | number | boolean | null | undefined | Record<string, unknown>;

export type ExtendedMessage = {
  id: string;
  content: string;
  createdAt: Date | string;
  isAIMessage: boolean;
  aiModelId?: string;
  // Add any other necessary fields
};

// Add this type definition
export type MessageMetadata = {
  type?: string;
  imageData?: string;
  prompt?: string;
  [key: string]: unknown; // Allows for additional properties while maintaining type safety
};
