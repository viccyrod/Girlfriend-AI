import { AiModel as AIModel } from "@/types/chat";

export async function fetchAIModel(modelId: string): Promise<AIModel | null> {
  try {
    const response = await fetch(`/api/ai-models/${modelId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch AI model with ID ${modelId}: ${response.statusText}`);
      console.error(`Response status: ${response.status}`);
      const errorText = await response.text();
      console.error(`Response body: ${errorText}`);
      return null;
    }

    const data: AIModel = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching AI model:', error);
    return null;
  }
}

