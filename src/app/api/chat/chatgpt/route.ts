import { NextResponse } from 'next/server';
import { getEmbedding } from '@/utils/embedding';

export async function POST(request: Request) {
  const { text } = await request.json();

  try {
    const embedding = await getEmbedding(text);
    return NextResponse.json({ embedding });
  } catch (error) {
    console.error('Error generating embedding:', error);
    return NextResponse.json({ error: 'Failed to generate embedding' }, { status: 500 });
  }
}
