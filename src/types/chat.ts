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

export interface AiModel {
  id: string;
  name: string;
  imageUrl?: string | null;
  personality?: string;
  userId: string;
}

export interface ExtendedChatRoom {
  id: string;
  name: string;
  aiModel: AiModel;
  aiModelId: string;
  users: User[];
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: {
    id: string;
    name: string | null;
  } | null;
}

// Component Props and Function Types
export interface ChatComponentProps {
  initialChatRoom?: ExtendedChatRoom | null;
  modelId?: string;
  onError?: (error: Error) => void;
}

export type SendMessageFunction = (content: string, room: ExtendedChatRoom) => Promise<void>;
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

type MetadataValue = string | number | boolean | null | undefined;
