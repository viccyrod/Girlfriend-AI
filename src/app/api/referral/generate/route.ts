import { NextResponse } from 'next/server';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from '@/lib/prisma';
import { nanoid } from 'nanoid';

export async function POST() {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const code = nanoid(10);
    
    await prisma.tokenClaim.create({
      data: {
        code,
        amount: 600,
        createdById: user.id,
        referralReward: 600
      }
    });

    return NextResponse.json({ code });
  } catch (error) {
    console.error('Failed to generate referral:', error);
    return NextResponse.json({ error: 'Failed to generate referral' }, { status: 500 });
  }
} 