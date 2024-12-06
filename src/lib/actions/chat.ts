import { Message } from '@prisma/client';
import { ExtendedChatRoom } from '@/types/chat';
import { getOrCreateChatRoomServer } from './server/chat';

// Send a message in a chat room
export async function sendMessage(
  chatRoomId: string, 
  content: string, 
  options: { type?: string; audioData?: string; } = { type: 'text' }
) {
  const response = await fetch(`/api/chat/${chatRoomId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content, ...options }),
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
      } : null,
      aiModelImageUrl: chatRoom.aiModel?.imageUrl || '/default-ai-image.png',
      voiceId: null
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

// Subscribe to chat room messages using SSE
export function subscribeToMessages(chatRoomId: string, onMessage: (message: Message) => void) {
  const eventSource = new EventSource(`/api/chat/${chatRoomId}/subscribe`);
  
  eventSource.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      if (message.id) { 
        console.log('New message received:', message);
        onMessage(message);
      }
    } catch (error) {
      console.error('SSE parse error:', error);
    }
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