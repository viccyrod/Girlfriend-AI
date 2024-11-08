import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/community/vectorstores/pinecone";
import { Pinecone } from "@pinecone-database/pinecone";

// Add debugging logs at the top of the file
console.log('Environment variables check:', {
  hasPineconeKey: !!process.env.PINECONE_API_KEY,
  envKeys: Object.keys(process.env).filter(key => key.includes('PINE')),
});

// Validate environment variables
if (!process.env.PINECONE_API_KEY) {
  throw new Error('PINECONE_API_KEY is not defined in environment variables');
}

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not defined in environment variables');
}

// Initialize Pinecone client
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

// Initialize OpenAI embeddings with correct API key
const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
});

const INDEX_NAME = "gf";

export async function storeMemory(aiModelId: string, userId: string, content: string) {
  console.log('storeMemory: Start');
  console.log('Params:', { aiModelId, userId, content });

  try {
    const index = pinecone.Index(INDEX_NAME);
    console.log('storeMemory: Pinecone index obtained');

    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, { pineconeIndex: index });
    console.log('storeMemory: Vector store created');

    await vectorStore.addDocuments([
      {
        pageContent: content,
        metadata: { aiModelId, userId },
      },
    ]);
    console.log('storeMemory: Document added to vector store');
  } catch (error) {
    console.error('Error in storeMemory:', error);
    throw error;
  }
}

export async function retrieveMemories(
  aiModelId: string, 
  userId: string, 
  query: string,
  limit: number = 5
): Promise<string[]> {
  try {
    const index = pinecone.Index(INDEX_NAME);
    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, { pineconeIndex: index });

    const filter = {
      $and: [
        { aiModelId: { $eq: aiModelId } },
        { userId: { $eq: userId } }
      ]
    };

    const results = await vectorStore.similaritySearch(query || ' ', limit, filter);
    return results.map((result) => result.pageContent);
  } catch (error) {
    console.error('Error in retrieveMemories:', error);
    return []; // Return empty array instead of throwing
  }
}
