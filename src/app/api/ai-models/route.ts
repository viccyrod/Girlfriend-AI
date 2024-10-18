import { NextResponse } from 'next/server';
import prisma from '@/db/prisma';

export async function GET() {
  try {
    const aIModels = await prisma.aIModel.findMany({
      select: {
        id: true,
        name: true,
        personality: true,
        imageUrl: true,
        createdBy: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json(aIModels);
  } catch (error) {
    console.error('Error fetching influencers:', error);
    return NextResponse.json({ error: 'Failed to fetch aIModels' }, { status: 500 });
  }
}