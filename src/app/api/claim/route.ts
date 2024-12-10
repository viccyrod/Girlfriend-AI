import { NextResponse } from 'next/server';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code } = await req.json();

    // Verify the claim code is valid and hasn't been used
    const claim = await prisma.tokenClaim.findUnique({
      where: { 
        code,
        claimed: false
      }
    });

    if (!claim) {
      return NextResponse.json({ error: 'Invalid or already used claim code' }, { status: 400 });
    }

    // Update user's tokens and mark claim as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          tokens: {
            increment: 1800
          }
        }
      }),
      prisma.tokenClaim.update({
        where: { code },
        data: {
          claimed: true,
          claimedById: user.id,
          claimedAt: new Date()
        }
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Claim error:', error);
    return NextResponse.json({ error: 'Failed to process claim' }, { status: 500 });
  }
} 