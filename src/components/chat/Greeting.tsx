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

    if (!response.ok) {
      throw new Error('Failed to generate greeting');
    }
  } catch (error) {
    console.error('Failed to generate greeting:', error);
  }
}
