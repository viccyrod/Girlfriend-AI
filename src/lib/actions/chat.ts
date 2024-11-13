import { Message } from '@prisma/client';
import { ExtendedChatRoom } from '@/types/chat';
import { getOrCreateChatRoomServer } from './server/chat';

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
  const response = await fetch(`/api/chat/${chatRoomId}/messages`);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch messages');
  }

  return response.json();
}

// Create or get existing chat room for an AI model
export async function getOrCreateChatRoom(modelId: string) {
  try {
    const chatRoom = await getOrCreateChatRoomServer(modelId);
    return {
      ...chatRoom,
      aiModel: chatRoom.aiModel ? {
        ...chatRoom.aiModel,
        isHuman: false,
        isFollowing: false
      }: null,
      aiModelImageUrl: chatRoom.aiModel?.imageUrl || '/default-ai-image.png'
    };
  } catch (error) {
    console.error('Error in getOrCreateChatRoom:', error);
    throw error;
  }
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
  if (!chatRoomId) {
    throw new Error('Chat room ID is required');
  }

  const response = await fetch('/api/image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      prompt,
      chatRoomId
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
  let retryCount = 0;
  let eventSource: EventSource | null = null;

  const connect = () => {
    eventSource = new EventSource(`/api/chat/${chatRoomId}/sse`, {
      withCredentials: true
    });

    eventSource.onopen = () => {
      console.log('SSE connection established for chat:', chatRoomId);
      retryCount = 0;
    };

    eventSource.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'ping' || message.type === 'connection') {
          console.log(`Received ${message.type} message`);
          return;
        }

        if (message && message.id) {
          console.log('Received message:', message);
          onMessage(message);
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
      eventSource?.close();
      
      const backoff = Math.min(1000 * Math.pow(2, retryCount++), 30000);
      setTimeout(() => {
        console.log('Attempting to reconnect SSE...');
        connect();
      }, backoff);
    };
  };

  connect();

  // Return cleanup function
  return () => {
    if (eventSource) {
      console.log('Cleaning up SSE connection');
      eventSource.close();
      eventSource = null;
    }
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