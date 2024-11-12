import { Message } from '@prisma/client';

export async function sendMessage(modelId: string, content: string) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      modelId, 
      message: content 
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to send message');
  }

  return response.json();
}

export async function getChatMessages(chatRoomId: string): Promise<Message[]> {
  const response = await fetch(`/api/chat/${chatRoomId}/messages`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch messages');
  }

  return response.json();
} 