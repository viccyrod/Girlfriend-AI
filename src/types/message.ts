import { Message as PrismaMessage, Prisma } from '@prisma/client';

export type JsonValue = string | number | boolean | null | { [key: string]: JsonValue } | JsonValue[];

export interface MessageMetadata {
  type: string;
  imageUrl?: string | null;
  prompt?: string | null;
  audioData?: string | null;
  isRead?: boolean | null;
  [key: string]: JsonValue | undefined;
}

export interface Message {
  id: string;
  content: string;
  userId: string | null;
  chatRoomId: string;
  createdAt: Date;
  updatedAt: Date;
  aiModelId: string | null;
  isAIMessage: boolean;
  metadata: MessageMetadata;
  role: string;
  user?: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
  aiModel?: {
    id: string;
    name: string;
    imageUrl: string;
  } | null;
}

interface ImageMetadata {
  type: 'image';
  status: string;
  imageUrl?: string;
}
