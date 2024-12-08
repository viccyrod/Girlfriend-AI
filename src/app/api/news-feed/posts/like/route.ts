import { NextResponse } from 'next/server';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from '@/lib/clients/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { postId } = await request.json();
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user?.id) {
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
