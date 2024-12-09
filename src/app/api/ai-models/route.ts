import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getDbUser } from '@/lib/actions/server/auth';

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

export async function POST(request: Request) {
  try {
    const user = await getDbUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await request.json();
    const { 
      name, 
      personality, 
      appearance,
      backstory,
      hobbies,
      likes,
      dislikes,
      isPrivate 
    } = data;

    // Validate required fields
    if (!name || !personality) {
      return NextResponse.json(
        { error: 'Name and personality are required' },
        { status: 400 }
      );
    }

    // Create new AI model
    const newModel = await prisma.aIModel.create({
      data: {
        name,
        personality,
        appearance,
        backstory,
        hobbies,
        likes,
        dislikes,
        imageUrl: '/default-avatar.png',
        isPrivate: isPrivate || false,
        createdBy: { connect: { id: user.id } },
      },
    });

    return NextResponse.json(newModel);
  } catch (error) {
    console.error('Error creating AI model:', error);
    return NextResponse.json(
      { error: 'Failed to create AI model' },
      { status: 500 }
    );
  }
}
