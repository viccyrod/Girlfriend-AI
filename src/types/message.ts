import { Message as PrismaMessage } from '@prisma/client';

export interface Message extends PrismaMessage {
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
  metadata: {
    type: string;
    imageData?: string;
    prompt?: string;
  };
}
