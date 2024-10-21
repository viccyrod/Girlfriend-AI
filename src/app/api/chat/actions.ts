import { Message } from '@/types/chat';

export async function getChatRoomMessages(chatRoomId: string): Promise<Message[]> {
  const response = await fetch(`/api/chat/${chatRoomId}/messages`);
  if (!response.ok) {
    throw new Error('Failed to fetch messages');
  }
  return response.json();
}

export async function sendMessage(chatRoomId: string, message: Omit<Message, 'id' | 'createdAt' | 'updatedAt' | 'user'>): Promise<{ userMessage: Message, aiMessage: Message }> {
  const response = await fetch(`/api/chat/${chatRoomId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(message)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to send message');
  }

  const data = await response.json();
  return { userMessage: data.userMessage, aiMessage: data.aiMessage };
}

export async function deleteMessage(chatRoomId: string, messageId: string) {
  await fetch(`/api/chat/${chatRoomId}/messages/${messageId}`, {
    method: 'DELETE'
  });
}
