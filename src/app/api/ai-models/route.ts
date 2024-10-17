import { NextResponse } from 'next/server';
import prisma from '@/db/prisma';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function GET() {
  try {
    const aiModels = await prisma.aIModel.findMany({
      orderBy: {
        name: 'asc',
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(aiModels);
  } catch (error) {
    console.error('Error fetching AI Models:', error);
    return NextResponse.json({ error: 'Failed to fetch AI Models' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, personality, appearance, backstory, hobbies, likes, dislikes, imageUrl } = await request.json();

    const newAIModel = await prisma.aIModel.create({
      data: {
        name,
        personality,
        appearance,
        backstory,
        hobbies,
        likes,
        dislikes,
        imageUrl,
        userId: user.id,
      },
    });

    return NextResponse.json(newAIModel);
  } catch (error) {
    console.error('Error creating AI Model:', error);
    return NextResponse.json({ error: 'Failed to create AI Model' }, { status: 500 });
  }
}

