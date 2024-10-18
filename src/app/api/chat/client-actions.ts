import { ChatRoom, Message } from '@prisma/client';

export async function getChatRooms(): Promise<ChatRoom[]> {
  const response = await fetch('/api/chat');
  if (!response.ok) {
    throw new Error('Failed to fetch chat rooms');
  }
  return response.json();
}

export async function createChatRoom(name: string, userIds: string[]): Promise<ChatRoom> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'createChatRoom', name, userIds }),
  });
  if (!response.ok) {
    throw new Error('Failed to create chat room');
  }
  return response.json();
}

export async function sendMessage(content: string, chatRoomId: string): Promise<Message> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'sendMessage', content, chatRoomId }),
  });
  if (!response.ok) {
    throw new Error('Failed to send message');
  }
  return response.json();
}

export async function getChatRoomMessages(chatRoomId: string): Promise<Message[]> {
  const response = await fetch(`/api/chat/${chatRoomId}/messages`);
  if (!response.ok) {
    throw new Error('Failed to fetch messages');
  }
  const messages = await response.json();
  return messages.map((message: any) => ({
    ...message,
    user: {
      id: message.userId,
      name: message.userName,
      image: message.userImage
    }
  }));
}
