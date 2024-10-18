import { AIModel } from "@/lib/api/types/ai-model";

export async function fetchAIModel(modelId: string): Promise<AIModel | null> {
  try {
    const response = await fetch(`/api/ai-models/${modelId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch AI model');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching AI model:', error);
    return null;
  }
}

