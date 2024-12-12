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

    // Get all claims created by this user
    const referralClaims = await prisma.tokenClaim.findMany({
      where: {
        createdById: user.id
      },
      select: {
        claimed: true,
        claimedAt: true,
        amount: true
      }
    });

    // Calculate stats
    const totalReferrals = referralClaims.length;
    const completedReferrals = referralClaims.filter(claim => claim.claimed).length;
    const pendingReferrals = totalReferrals - completedReferrals;
    const totalTokensEarned = referralClaims
      .filter(claim => claim.claimed)
      .reduce((sum, claim) => sum + 600, 0); // 600 tokens per successful referral

    return NextResponse.json({
      totalReferrals,
      completedReferrals,
      pendingReferrals,
      totalTokensEarned
    });
  } catch (error) {
    console.error('Failed to fetch referral stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch referral stats' },
      { status: 500 }
    );
  }
} 