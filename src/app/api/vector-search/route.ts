import { NextResponse } from 'next/server';
import prisma from '@/db/prisma';
import openai from '@/lib/openai';

export async function POST(req: Request) {
  const { query } = await req.json();

  const embedding = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: query,
  });

  const vectorQuery = embedding.data[0].embedding;

  const results = await prisma.$queryRaw`
    SELECT p.*, e.embedding <-> ${vectorQuery}::vector AS distance
    FROM "Post" p
    JOIN "Embedding" e ON p.id = e."postId"
    ORDER BY distance
    LIMIT 5;
  `;

  return NextResponse.json(results);
}