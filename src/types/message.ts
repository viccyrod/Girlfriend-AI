import { Message as PrismaMessage, Prisma } from '@prisma/client';

export type JsonValue = string | number | boolean | null | JsonObject | JsonArray | undefined;
export interface JsonObject {
  [key: string]: JsonValue;
}
export interface JsonArray extends Array<JsonValue> { }

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
  userId: string | null;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
  createdAt: Date;
  updatedAt: Date;
  chatRoomId: string;
  isAIMessage: boolean;
  aiModelId: string | null;
  metadata: MessageMetadata;
  role: string;
}
