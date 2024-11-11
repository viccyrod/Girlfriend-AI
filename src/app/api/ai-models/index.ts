import { AiModel as AIModel } from "@/types/chat";

export async function fetchAIModel(modelId: string): Promise<AIModel | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const url = `${baseUrl}/api/ai-models/${modelId}`;

    console.log(`Fetching AI model from: ${url}`);

    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Failed to fetch AI model with ID ${modelId}: ${response.statusText}`);
      console.error(`Response status: ${response.status}`);
      const errorText = await response.text();
      console.error(`Response body: ${errorText}`);
      return null;
    }

    const data: AIModel = await response.json();
    console.log(`Successfully fetched AI model:`, data);
    return data;
  } catch (error) {
    console.error('Error fetching AI model:', error);
    return null;
  }
}

