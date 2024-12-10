import prisma from '@/lib/prisma';
import { GenerationType, type Prisma } from '@prisma/client';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { NextResponse } from 'next/server';

type CreditFields = {
  imageCredits: number;
  photoCredits: number;
  characterCredits: number;
};

export async function POST(req: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, prompt, result, cost } = await req.json();
    
    // Verify user has enough credits
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        imageCredits: true,
        photoCredits: true,
        characterCredits: true,
      }
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check credits based on type
    const creditsField = `${type.toLowerCase()}Credits` as keyof CreditFields;
    if (!dbUser || dbUser[creditsField] < 1) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 400 });
    }

    // Create generation record and update credits in transaction
    const generation = await prisma.$transaction(async (tx) => {
      // Create generation record
      const gen = await tx.generation.create({
        data: {
          type,
          prompt,
          result,
          cost,
          userId: user.id,
        }
      });

      // Decrement credits
      await tx.user.update({
        where: { id: user.id },
        data: {
          [creditsField]: {
            decrement: 1
          }
        }
      });

      return gen;
    });

    return NextResponse.json(generation);
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: 'Failed to process generation' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') as 'IMAGE' | 'PHOTO' | 'CHARACTER' | null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where = {
      userId: user.id,
      ...(type && { type: type as GenerationType })
    };

    const generations = await prisma.generation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
    });

    const total = await prisma.generation.count({ where });

    return NextResponse.json({
      generations,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        current: page,
      }
    });
  } catch (error) {
    console.error('Error fetching generations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch generations' },
      { status: 500 }
    );
  }
} 