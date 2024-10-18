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

export async function sendMessage(content: string, chatRoomId: string, aiModelId: string | null): Promise<Message> {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'sendMessage', content, chatRoomId, aiModelId }),
    });
    if (!response.ok) {
      throw new Error('Failed to send message');
    }
    const message = await response.json();
    
    if (aiModelId) {
      const aiResponse = await fetch('/api/chat/chatgpt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, aiModelId, chatRoomId }),
      });
      if (!aiResponse.ok) {
        throw new Error('Failed to get AI response');
      }
      const aiMessage = await aiResponse.json();
      return [message, aiMessage];
    }
    
    return message;
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

export async function deleteMessage(messageId: string): Promise<void> {
  const response = await fetch(`/api/chat/message/${messageId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete message');
  }
}

export async function deleteChatRoom(roomId: string): Promise<void> {
  const response = await fetch(`/api/chat/rooms/${roomId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete chat room');
  }
}
