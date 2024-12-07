import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const models = await prisma.aIModel.findMany({
      where: {
        isPrivate: false,
      },
      select: {
        id: true,
        name: true,
        personality: true,
        imageUrl: true,
        age: true,
        createdAt: true,
        _count: {
          select: {
            followers: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        {
          followers: {
            _count: 'desc'
          }
        },
        {
          createdAt: 'desc'
        }
      ],
    });

    const formattedModels = models.map((model) => ({
      ...model,
      followerCount: model._count.followers,
      _count: undefined,
    }));

    return NextResponse.json(formattedModels);
  } catch (error) {
    console.error('Error fetching AI models:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI models' },
      { status: 500 }
    );
  }
}
