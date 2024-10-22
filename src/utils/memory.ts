import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/community/vectorstores/pinecone";
import { Pinecone } from "@pinecone-database/pinecone";
import { Document } from "@langchain/core/documents";

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
});

const INDEX_NAME = "gf";

export async function storeMemory(aiModelId: string, userId: string, content: string) {
  const index = pinecone.Index(INDEX_NAME);
  const vectorStore = await PineconeStore.fromExistingIndex(embeddings, { pineconeIndex: index });

  await vectorStore.addDocuments([
    new Document({
      pageContent: content,
      metadata: { aiModelId, userId },
    }),
  ]);
}

export async function retrieveMemories(aiModelId: string, userId: string, query: string): Promise<string[]> {
  console.log('retrieveMemories: Start');
  console.log('Params:', { aiModelId, userId, query });

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

  try {
    const results = await vectorStore.similaritySearch(query, 5, { filter });
    console.log('retrieveMemories: Similarity search completed');
    console.log('Results:', results);

    return results.map((result) => result.pageContent);
  } catch (error) {
    console.error('Error in retrieveMemories:', error);
    throw error;
  }
}
