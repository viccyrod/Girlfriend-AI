import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching current user:', error);
    return NextResponse.json({ error: 'Failed to fetch current user' }, { status: 500 });
  }
}
