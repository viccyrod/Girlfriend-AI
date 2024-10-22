import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/community/vectorstores/pinecone";
import { Pinecone } from "@pinecone-database/pinecone";

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

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

export async function retrieveMemories(aiModelId: string, userId: string, query: string): Promise<string[]> {
  console.log('retrieveMemories: Start');
  console.log('Params:', { aiModelId, userId, query });

  try {
    const index = pinecone.Index(INDEX_NAME);
    console.log('retrieveMemories: Pinecone index obtained');

    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, { pineconeIndex: index });
    console.log('retrieveMemories: Vector store created');

    const filter = {
      $and: [
        { aiModelId: { $eq: aiModelId } },
        { userId: { $eq: userId } }
      ]
    };
    console.log('retrieveMemories: Filter constructed:', JSON.stringify(filter));

    const results = await vectorStore.similaritySearch(query, 5, filter);
    console.log('retrieveMemories: Similarity search completed');
    console.log('Results:', results);

    return results.map((result) => result.pageContent);
  } catch (error) {
    console.error('Error in retrieveMemories:', error);
    throw error;
  }
}
