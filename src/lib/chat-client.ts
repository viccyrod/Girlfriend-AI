import { Message } from '@prisma/client';
import { ExtendedChatRoom } from '@/types/chat';

// Get messages for a specific chat room
export async function getChatRoomMessages(chatRoomId: string): Promise<Message[]> {
  console.log('Fetching messages for chat room:', chatRoomId);
  const response = await fetch(`/api/chat/${chatRoomId}/messages`, {
    // Add cache: no-store to prevent caching
    cache: 'no-store'
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch messages');
  }

  return response.json();
}

// Subscribe to chat room messages using SSE
export function subscribeToMessages(chatRoomId: string, onMessage: (message: Message) => void) {
  console.log('Subscribing to messages for chat room:', chatRoomId);
  const eventSource = new EventSource(`/api/chat/${chatRoomId}/subscribe`);
  
  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.message) {
        onMessage(data.message);
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  };

  eventSource.onerror = (error) => {
    console.error('SSE error:', error);
    eventSource.close();
  };

  return () => {
    eventSource.close();
  };
}

// Get all chat rooms for the current user
export async function getChatRooms(): Promise<ExtendedChatRoom[]> {
  try {
    console.log('Fetching chat rooms...');
    const response = await fetch('/api/chat/rooms', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch chat rooms: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Raw chat rooms data:', data);
    
    return data.chatRooms;
  } catch (error) {
    console.error('Error fetching chat rooms:', error);
    throw error;
  }
}

// Generate an image in a chat room
export async function generateImage(prompt: string, chatRoomId: string) {
  try {
    console.log('Generating image with prompt:', prompt);
    const response = await fetch('/api/image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        chatRoomId,
        style: 'realistic'
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate image');
    }

    const data = await response.json();
    console.log('Generated image response:', data);
    return data;
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
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