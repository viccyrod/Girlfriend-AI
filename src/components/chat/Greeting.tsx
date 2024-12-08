import { AiModel } from '@/types/chat';
import { fetchWithRetry } from '@/lib/utils/fetch';

interface AIGreetingProps {
  room: { id: string; aiModel: AiModel };
}

export async function generateAndSaveGreeting({ room }: AIGreetingProps): Promise<void> {
  try {
    // Make a server-side API call with the extended model data
    const response = await fetchWithRetry(`/api/chat/${room.id}/greeting`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        aiModel: {
          ...room.aiModel,
          appearance: '',
          personality: room.aiModel.personality || '',
          backstory: '',
          hobbies: '',
          likes: '',
          dislikes: '',
          age: null,
          userId: '',
          followerCount: 0,
          isPrivate: false,
          isAnime: false,
          isHumanX: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          imageUrl: room.aiModel.imageUrl || ''
        }
      })
    }) as Response;

    if (response.status === 409) {
      // Greeting already exists, this is fine - just return
      return;
    }

    if (!response.ok) {
      throw new Error(`Failed to generate greeting: ${response.status} ${response.statusText}`);
    }

    // Handle successful streaming response
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body reader available');
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      // Process the streaming response chunks
      // The actual message updates will be handled by the SSE listener
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('409')) {
      // Also handle 409 errors that might be thrown by fetchWithRetry
      return;
    }
    console.error('Failed to generate greeting:', error);
  }
}
