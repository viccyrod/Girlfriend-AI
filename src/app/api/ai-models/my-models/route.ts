import { NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const myModels = await prisma.aIModel.findMany({
      where: {
        userId: currentUser.id
      },
      select: {
        id: true,
        name: true,
        personality: true,
        appearance: true,
        imageUrl: true,
        isPrivate: true,
        createdAt: true,
        updatedAt: true,
        followerCount: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(myModels);
  } catch (error) {
    console.error('Error fetching user\'s AI models:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
