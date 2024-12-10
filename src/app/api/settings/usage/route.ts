import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Check authentication
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's message and image counts
    const userData = await prisma.user.findUnique({
      where: { email: user.email || '' },
      select: {
        messageCount: true,
        imageCount: true,
        isSubscribed: true,
      },
    });

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Define limits based on subscription status
    const limits = userData.isSubscribed ? {
      messages: 1000,
      images: 100,
    } : {
      messages: 200,
      images: 10,
    };

    const stats = {
      currentPlan: userData.isSubscribed ? 'Premium' : 'Free',
      messages: {
        used: userData.messageCount,
        limit: limits.messages,
        percentage: Math.min((userData.messageCount / limits.messages) * 100, 100),
      },
      images: {
        used: userData.imageCount,
        limit: limits.images,
        percentage: Math.min((userData.imageCount / limits.images) * 100, 100),
      },
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching usage stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage statistics' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 