import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Check authentication
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || user.email !== 'victor@hypergrow.ai') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all users with their message and image counts
    const users = await prisma.user.findMany({
      select: {
        name: true,
        email: true,
        messageCount: true,
        imageCount: true,
      },
      orderBy: {
        messageCount: 'desc',
      },
    });

    // Get all AI models with their stats
    const models = await prisma.aIModel.findMany({
      select: {
        name: true,
        messageCount: true,
        imageCount: true,
        age: true,
      },
      orderBy: {
        messageCount: 'desc',
      },
    });

    // Format the data for the frontend
    const stats = {
      totalUsers: users.length,
      totalModels: models.length,
      userStats: users.map(user => ({
        name: user.name,
        email: user.email,
        messages: user.messageCount,
        images: user.imageCount,
      })),
      modelStats: models.map(model => ({
        name: model.name,
        messages: model.messageCount,
        images: model.imageCount,
        age: model.age || 0,
      })),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 