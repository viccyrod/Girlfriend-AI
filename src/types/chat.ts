import { User } from '@prisma/client';
import { Message } from './message';

// Core Types
export type { Message };

export interface CreatedBy {
  id: string;
  name: string;
  email?: string;
  imageUrl?: string | null;
}

export type AiModel = {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  likes: string;
  personality: string;
  appearance: string;
  backstory: string;
  hobbies: string;
  dislikes: string;
  imageUrl: string;
  voiceId: string | null;
  isPrivate: boolean;
  followerCount: number;
  isFollowing: boolean;
  isHumanX: boolean;
  isAnime: boolean;
  age: number | null;
  status?: string;
  createdBy?: {
    id: string;
    name: string;
    email: string;
    imageUrl: string | null;
  } | null;
};

export interface ExtendedChatRoom {
  id: string;
  name: string;
  aiModel: AiModel | null;
  aiModelId: string;
  aiModelImageUrl: string | null;
  users: User[];
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: CreatedBy | null;
  voiceId?: string | null;
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
  metadata?: {
    type?: string;
    imageUrl?: string;
    prompt?: string;
    audioData?: string;
    isRead?: boolean;
  };
};

// Add this type definition
export type MessageMetadata = {
  type?: 'text' | 'image' | 'greeting';
  imageUrl?: string;
  prompt?: string;
  style?: string;
}
