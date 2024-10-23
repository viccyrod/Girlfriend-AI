import { NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const posts = await prisma.post.findMany({
      where: {
        author: {
          followedAIModels: {
            some: {
              userId: currentUser.id
            }
          }
        }
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20 // Limit to 20 posts for performance
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error('Error fetching news feed:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
