import { ChatRoom, User, Message as PrismaMessage } from '@prisma/client';

export interface ExtendedChatRoom extends ChatRoom {
  users: User[];
  messages: PrismaMessage[];
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