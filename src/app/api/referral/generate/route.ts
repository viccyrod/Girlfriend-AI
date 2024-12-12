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

    // Check if user already has an active claim code
    const existingClaim = await prisma.tokenClaim.findFirst({
      where: {
        createdById: user.id,
        claimed: false
      }
    });

    if (existingClaim) {
      return NextResponse.json({ code: existingClaim.code });
    }

    // Generate a new claim code
    const code = nanoid(8); // 8 character unique code
    const claim = await prisma.tokenClaim.create({
      data: {
        code,
        amount: 600,
        createdById: user.id,
        referralReward: 600 // The amount the referrer gets
      }
    });

    return NextResponse.json({ code: claim.code });
  } catch (error) {
    console.error('Failed to generate referral link:', error);
    return NextResponse.json(
      { error: 'Failed to generate referral link' },
      { status: 500 }
    );
  }
} 