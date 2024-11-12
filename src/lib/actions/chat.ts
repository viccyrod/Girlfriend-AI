import { Message } from '@prisma/client';
import { ExtendedChatRoom } from '@/types/chat';

// Send a message in a chat room
export async function sendMessage(chatRoomId: string, content: string) {
  const response = await fetch(`/api/chat/${chatRoomId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to send message');
  }

  return response.json();
}

// Get messages for a specific chat room
export async function getChatRoomMessages(chatRoomId: string): Promise<Message[]> {
  console.log('Fetching messages for chat room:', chatRoomId);
  const response = await fetch(`/api/chat/${chatRoomId}/messages`);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch messages');
  }

  const messages = await response.json();
  console.log('Fetched messages:', messages);
  return messages;
}

// Get all chat rooms for the current user
export async function getChatRooms(): Promise<ExtendedChatRoom[]> {
  console.log('Fetching chat rooms...');
  const response = await fetch('/api/chat');
  
  if (!response.ok) {
    throw new Error('Failed to fetch chat rooms');
  }

  const rooms = await response.json();
  console.log('Fetched chat rooms:', rooms);
  return rooms;
}

// Create or get existing chat room for an AI model
export async function getOrCreateChatRoom(modelId: string): Promise<ExtendedChatRoom> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      action: 'createChatRoom', 
      aiModelId: modelId,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create chat room');
  }

  return response.json();
}

// Delete a chat room
export async function deleteChatRoom(roomId: string): Promise<void> {
  const response = await fetch(`/api/chat/${roomId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to delete chat room');
  }
}

// Generate an image in a chat room
export async function generateImage(prompt: string, chatRoomId: string) {
  const response = await fetch('/api/image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      prompt,
      chatRoomId,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to generate image');
  }

  return response.json();
}

// Subscribe to chat room messages using SSE
export function subscribeToMessages(chatRoomId: string, onMessage: (message: Message) => void) {
  const eventSource = new EventSource(`/api/chat/${chatRoomId}/sse`);

  eventSource.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      if (message && message.id) {
        onMessage(message);
      }
    } catch (error) {
      console.error('Error parsing SSE message:', error);
    }
  };

  eventSource.onerror = (error) => {
    console.error('SSE Error:', error);
    eventSource.close();
  };

  return () => {
    eventSource.close();
  };
}

// Helper function to check if a message should generate an image
export function shouldGenerateImage(content: string): boolean {
  const imageGenerationTriggers = [
    'send me',
    'generate',
    'create image',
    'show me'
  ];
  
  return imageGenerationTriggers.some(trigger => 
    content.toLowerCase().startsWith(trigger.toLowerCase())
  );
}