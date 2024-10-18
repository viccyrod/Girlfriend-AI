import { AIModel } from '@/types/AIModel';


export async function fetchAIModel(modelId: string) {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const url = `${baseUrl}/api/ai-models/${modelId}`;
  
      const response = await fetch(url);
  
      if (!response.ok) {
        console.error(`Failed to fetch AI model with ID ${modelId}: ${response.statusText}`);
        return null;
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching AI model:', error);
      return null;
    }
  }
