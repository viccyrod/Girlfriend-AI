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
  const maxRetries = 5;
  let retryTimeout: NodeJS.Timeout | null = null;
  let lastPingTime = Date.now();
  
  const cleanup = () => {
    if (retryTimeout) {
      clearTimeout(retryTimeout);
      retryTimeout = null;
    }
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };

  // Add ping monitoring
  const pingMonitor = setInterval(() => {
    if (eventSource && Date.now() - lastPingTime > 15000) {
      console.log('No ping received for 15s, reconnecting...');
      cleanup();
      connect();
    }
  }, 5000);

  const connect = () => {
    cleanup();

    if (retryCount >= maxRetries) {
      clearInterval(pingMonitor);
      console.error('Max SSE reconnection attempts reached');
      return;
    }

    try {
      eventSource = new EventSource(`/api/chat/${chatRoomId}/sse`);

      eventSource.onopen = () => {
        console.log('SSE connection established');
        retryCount = 0;
      };

      eventSource.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === 'ping') {
            lastPingTime = Date.now();
            return;
          }

          if (message && message.id) {
            onMessage(message);
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE Error:', error);
        cleanup();
        
        if (retryCount < maxRetries) {
          const backoff = Math.min(1000 * Math.pow(2, retryCount++), 10000);
          retryTimeout = setTimeout(connect, backoff);
        } else {
          clearInterval(pingMonitor);
        }
      };
    } catch (error) {
      console.error('Error creating EventSource:', error);
      cleanup();
    }
  };

  connect();
  return () => {
    clearInterval(pingMonitor);
    cleanup();
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