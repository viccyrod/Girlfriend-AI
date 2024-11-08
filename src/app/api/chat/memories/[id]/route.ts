import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { retrieveMemories } from '@/utils/memory';

export async function GET(
  request: Request,
  { params }: { params: { aiModelId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get search params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5');

    // Get the last N memories for this AI model and user
    const memories = await retrieveMemories(
      params.aiModelId,
      user.id,
      '', // Empty query returns recent memories
      limit
    );

    return NextResponse.json(memories);
  } catch (error) {
    console.error('Error fetching memories:', error);
    return NextResponse.json([]); // Return empty array on error
  }
}
