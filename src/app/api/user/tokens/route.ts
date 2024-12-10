import { NextResponse } from 'next/server';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        tokens: true,
        generations: {
          select: {
            cost: true
          }
        }
      }
    });

    const used = userData?.generations.reduce((acc, gen) => acc + gen.cost, 0) || 0;
    const total = userData?.tokens || 0;

    return NextResponse.json({
      tokens: total,
      used,
      total
    });
  } catch (error) {
    console.error('Failed to fetch tokens:', error);
    return NextResponse.json({ error: 'Failed to fetch tokens' }, { status: 500 });
  }
} 