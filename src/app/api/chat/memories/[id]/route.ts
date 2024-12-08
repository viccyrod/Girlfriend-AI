import { NextRequest, NextResponse } from 'next/server';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/community/vectorstores/pinecone";
import { Pinecone } from "@pinecone-database/pinecone";
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Initialize Pinecone client
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY || '',
});

// Initialize OpenAI embeddings
const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
});

const INDEX_NAME = "gf";

// Validate route parameters
const RouteParamsSchema = z.object({
  id: z.string().min(1)
});

// Validate query parameters
const QueryParamsSchema = z.object({
  limit: z.string().optional().transform(val => parseInt(val || '5'))
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate route parameters
    const validatedParams = RouteParamsSchema.safeParse(params);
    if (!validatedParams.success) {
      return NextResponse.json(
        { error: 'Invalid route parameters' },
        { status: 400 }
      );
    }

    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get and validate search params
    const { searchParams } = new URL(req.url);
    const validatedQuery = QueryParamsSchema.safeParse({
      limit: searchParams.get('limit')
    });

    if (!validatedQuery.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters' },
        { status: 400 }
      );
    }

    // Get memories directly using Pinecone
    try {
      const index = pinecone.Index(INDEX_NAME);
      const vectorStore = await PineconeStore.fromExistingIndex(embeddings, { pineconeIndex: index });

      const filter = {
        $and: [
          { aiModelId: { $eq: params.id } },
          { userId: { $eq: user.id } }
        ]
      };

      const results = await vectorStore.similaritySearch(' ', validatedQuery.data.limit, filter);
      const memories = results.map(result => result.pageContent);

      return NextResponse.json({ memories });
    } catch (error) {
      console.error('Error accessing vector store:', error);
      return NextResponse.json({ memories: [] });
    }
  } catch (error) {
    console.error('Error fetching memories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch memories' },
      { status: 500 }
    );
  }
}
