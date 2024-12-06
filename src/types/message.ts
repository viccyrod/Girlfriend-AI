import { Message as PrismaMessage, Prisma } from '@prisma/client';

export type JsonValue = string | number | boolean | null | { [key: string]: JsonValue } | JsonValue[] | undefined;

export interface MessageMetadata {
  type: string;
  imageUrl?: string | null;
  prompt?: string | null;
  audioData?: string | null;
  isRead?: boolean | null;
  [key: string]: JsonValue;
}

export interface Message {
  id: string;
  content: string;
  isAIMessage: boolean;
  userId: string | null;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
  createdAt: Date;
  updatedAt: Date;
  chatRoomId: string;
  aiModelId: string | null;
  metadata: MessageMetadata;
  role: string;
}

interface ImageMetadata {
  type: 'image';
  status: string;
  imageUrl?: string;
}
