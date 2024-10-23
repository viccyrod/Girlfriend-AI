import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';

const prisma = new PrismaClient();


export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const aiModelId = params.id;

  const follow = await prisma.follow.findFirst({
    where: {
      userId: user.id,
      aiModelId: aiModelId,
    },
  });

  return NextResponse.json({ isFollowing: !!follow });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const aiModelId = params.id;

  try {
    // Check if AIModel exists
    const aiModel = await prisma.aIModel.findUnique({
      where: { id: aiModelId },
    });

    if (!aiModel) {
      return NextResponse.json({ error: 'AI Model not found' }, { status: 404 });
    }

    // Check if the user already follows the AI model
    const existingFollow = await prisma.follow.findUnique({
      where: {
        userId_aiModelId: {
          userId: user.id,
          aiModelId: aiModelId,
        },
      },
    });

    if (existingFollow) {
      // Unfollow the AI model
      await prisma.$transaction([
        prisma.follow.delete({
          where: {
            userId_aiModelId: {
              userId: user.id,
              aiModelId: aiModelId,
            },
          },
        }),
        prisma.aIModel.update({
          where: { id: aiModelId },
          data: { followerCount: { decrement: 1 } },
        }),
      ]);
      return NextResponse.json({ isFollowing: false });
    } else {
      // Follow the AI model
      await prisma.$transaction([
        prisma.follow.create({
          data: {
            user: { connect: { id: user.id } },
            aiModel: { connect: { id: aiModelId } },
          },
        }),
        prisma.aIModel.update({
          where: { id: aiModelId },
          data: { followerCount: { increment: 1 } },
        }),
      ]);
      return NextResponse.json({ isFollowing: true });
    }
  } catch (error) {
    console.error('Error in follow/unfollow:', error);
    return NextResponse.json({ error: 'Failed to update follow status' }, { status: 500 });
  }
}
