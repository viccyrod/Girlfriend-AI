import { ChatRoom, User, Message as PrismaMessage } from '@prisma/client';
import { AIModel } from './AIModel';


export interface ExtendedChatRoom extends ChatRoom {
  users: User[];
  messages: PrismaMessage[];
  aiModel?: AIModel;
  aiModelId: string;
  aiModelImageUrl: string | null;
  createdBy?: string

}

export interface ExtendedMessage extends PrismaMessage {
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

export interface Message {
    id: string;
    content: string;
    userId: string;
    user: {
      id: string;
      name: string | null;
      image: string | null;
    };
    createdAt: Date;
  }
