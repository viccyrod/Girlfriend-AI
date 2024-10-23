import { NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';

export async function GET() {
  try {
    const aIModels = await prisma.aIModel.findMany({
      select: {
        id: true,
        name: true,
        personality: true,
        imageUrl: true,
        followerCount: true,
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Ensure createdBy always has a name
    const sanitizedModels = aIModels.map(model => ({
      ...model,
      createdBy: {
        id: model.createdBy?.id || '',
        name: model.createdBy?.name || 'Unknown Creator'
      }
    }));

    return NextResponse.json(sanitizedModels);
  } catch (error) {
    console.error('Error fetching AI models:', error);
    return NextResponse.json({ error: 'Failed to fetch AI models' }, { status: 500 });
  }
}
