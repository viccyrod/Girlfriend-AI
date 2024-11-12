import { AiModel } from '@/types/chat';
import { generateGreeting } from '@/lib/clients/xai';
import { retrieveMemories } from '@/utils/memory';
import { fetchWithRetry } from '@/lib/utils/fetch';

interface AIGreetingProps {
  room: { id: string; aiModel: AiModel };
}

export async function generateAndSaveGreeting({ room }: AIGreetingProps): Promise<void> {
  try {
    const memories = await retrieveMemories(
      room.aiModel.id,
      room.aiModel.id,
      room.aiModel.userId
    );

    const extendedAiModel = {
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
    };
    
    const greeting = await generateGreeting(extendedAiModel, memories);
    if (greeting) {
      await fetchWithRetry(`/api/chat/${room.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: greeting, isAIMessage: true }),
      });
    }
  } catch (error) {
    console.error('Failed to generate greeting:', error);
  }
}
