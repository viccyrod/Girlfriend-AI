// Importing necessary modules and functions from external libraries
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { getOpenAIClient } from '@/lib/clients/openai';

// Handles POST requests to generate an embedding for the provided text
export async function POST(request: Request) {
  // Extract the 'text' field from the request body
  const { text } = await request.json();

  try {
    // Generate an embedding for the provided text
    const embedding = await getOpenAIClient()?.embeddings.create({
      model: 'text-embedding-3-small',
      input: text
    });
    // Return the generated embedding in the response
    return NextResponse.json({ embedding });
  } catch (error) {
    console.error('Error generating embedding:', error);
    // If an error occurs during embedding generation, return a 500 Internal Server Error response
    return NextResponse.json({ error: 'Failed to generate embedding' }, { status: 500 });
  }
}
