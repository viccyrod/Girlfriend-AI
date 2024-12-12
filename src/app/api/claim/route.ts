import { NextResponse } from 'next/server';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user?.id) {
      console.log('Claim attempt failed: No user ID');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code } = await req.json();
    console.log(`[Claim] Processing claim for code: ${code} by user: ${user.id}`);

    // Get initial token balance
    const initialBalance = await prisma.user.findUnique({
      where: { id: user.id },
      select: { tokens: true }
    });
    console.log(`[Claim] Initial claimer balance:`, initialBalance);

    // Verify the claim code is valid and hasn't been used
    const claim = await prisma.tokenClaim.findUnique({
      where: { 
        code
      },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            tokens: true
          }
        }
      }
    });

    if (!claim) {
      console.log(`[Claim] Invalid claim code: ${code}`);
      return NextResponse.json({ error: 'Invalid claim code' }, { status: 400 });
    }

    if (claim.claimed) {
      console.log(`[Claim] Already used claim code: ${code}`, {
        claimedAt: claim.claimedAt,
        claimedById: claim.claimedById
      });
      return NextResponse.json({ error: 'Claim code already used' }, { status: 400 });
    }

    if (claim.createdById === user.id) {
      console.log(`[Claim] User trying to claim their own referral code`);
      return NextResponse.json({ error: 'Cannot claim your own referral code' }, { status: 400 });
    }

    console.log(`[Claim] Found valid claim:`, {
      code: claim.code,
      amount: claim.amount,
      referrerId: claim.createdById,
      referrerEmail: claim.createdBy?.email,
      referrerCurrentBalance: claim.createdBy?.tokens
    });

    try {
      // Update user's tokens and mark claim as used
      const result = await prisma.$transaction(async (tx) => {
        // First update claimer's tokens
        const updatedClaimer = await tx.user.update({
          where: { id: user.id },
          data: {
            tokens: {
              increment: 600
            }
          },
          select: { id: true, email: true, tokens: true }
        });
        
        console.log(`[Claim] Updated claimer tokens:`, {
          userId: updatedClaimer.id,
          email: updatedClaimer.email,
          previousBalance: initialBalance?.tokens,
          newBalance: updatedClaimer.tokens,
          difference: updatedClaimer.tokens - (initialBalance?.tokens || 0)
        });

        // If there's a referrer, update their tokens
        let updatedReferrer = null;
        if (claim.createdById) {
          updatedReferrer = await tx.user.update({
            where: { id: claim.createdById },
            data: {
              tokens: {
                increment: 600
              }
            },
            select: { id: true, email: true, tokens: true }
          });

          console.log(`[Claim] Updated referrer tokens:`, {
            userId: updatedReferrer.id,
            email: updatedReferrer.email,
            previousBalance: claim.createdBy?.tokens,
            newBalance: updatedReferrer.tokens,
            difference: updatedReferrer.tokens - (claim.createdBy?.tokens || 0)
          });
        }

        // Mark claim as used
        const updatedClaim = await tx.tokenClaim.update({
          where: { code },
          data: {
            claimed: true,
            claimedById: user.id,
            claimedAt: new Date()
          }
        });

        console.log(`[Claim] Marked claim as used:`, {
          code: updatedClaim.code,
          claimedById: updatedClaim.claimedById,
          claimedAt: updatedClaim.claimedAt
        });

        return { updatedClaim, updatedClaimer, updatedReferrer };
      });

      // Verify the token updates
      const finalBalances = await prisma.$transaction(async (tx) => {
        const claimer = await tx.user.findUnique({
          where: { id: user.id },
          select: { id: true, email: true, tokens: true }
        });
        
        const referrer = claim.createdById ? await tx.user.findUnique({
          where: { id: claim.createdById },
          select: { id: true, email: true, tokens: true }
        }) : null;

        return { claimer, referrer };
      });

      console.log('[Claim] Final verification:', {
        claimer: {
          initialBalance: initialBalance?.tokens,
          finalBalance: finalBalances.claimer?.tokens,
          difference: (finalBalances.claimer?.tokens || 0) - (initialBalance?.tokens || 0)
        },
        referrer: claim.createdById ? {
          initialBalance: claim.createdBy?.tokens,
          finalBalance: finalBalances.referrer?.tokens,
          difference: (finalBalances.referrer?.tokens || 0) - (claim.createdBy?.tokens || 0)
        } : null
      });

      return NextResponse.json({ 
        success: true,
        details: {
          code,
          claimedBy: user.id,
          referrer: claim.createdById,
          tokenUpdates: {
            claimer: finalBalances.claimer?.tokens,
            referrer: finalBalances.referrer?.tokens
          }
        }
      });
    } catch (txError) {
      console.error('[Claim] Transaction failed:', txError);
      throw txError;
    }
  } catch (error) {
    console.error('[Claim] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to process claim',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 