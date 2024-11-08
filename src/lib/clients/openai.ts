import OpenAI from 'openai';
import { OpenAIEmbeddings } from '@langchain/openai';

let openaiClient: OpenAI | null = null;
let embeddingsClient: OpenAIEmbeddings | null = null;

// Get the standard OpenAI client
export const getOpenAIClient = () => {
  if (!openaiClient && typeof window === 'undefined') {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
};

// Get LangChain embeddings client
export const getEmbeddingsClient = () => {
  if (!embeddingsClient && typeof window === 'undefined') {
    embeddingsClient = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
  }
  return embeddingsClient;
};

// Utility function for generating embeddings
export const getEmbedding = async (text: string): Promise<number[]> => {
  const client = getOpenAIClient();
  if (!client) throw new Error('OpenAI client not initialized');

  const response = await client.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });

  return response.data[0].embedding;
};
