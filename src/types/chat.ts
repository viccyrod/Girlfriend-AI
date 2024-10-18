import { ChatRoom, User, Message } from '@prisma/client';

export interface ExtendedChatRoom extends ChatRoom {
  users: User[];
  messages: Message[];
}

export interface Message {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  chatRoomId: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}
