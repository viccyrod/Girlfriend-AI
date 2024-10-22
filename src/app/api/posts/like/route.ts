import { NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { getCurrentUser } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const { postId } = await request.json();
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existingLike = await prisma.like.findFirst({
      where: {
        postId: postId,
        userId: user.id,
      },
    });

    if (existingLike) {
      await prisma.like.delete({
        where: {
          id: existingLike.id,
        },
      });
      return NextResponse.json({ message: 'Like removed' });
    } else {
      await prisma.like.create({
        data: {
          postId: postId,
          userId: user.id,
        },
      });
      return NextResponse.json({ message: 'Post liked' });
    }
  } catch (error) {
    console.error('Error in like/unlike post:', error);
    return NextResponse.json({ error: 'Failed to like/unlike post' }, { status: 500 });
  }
}
