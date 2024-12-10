import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const claim = await prisma.tokenClaim.findUnique({
      where: { code: params.code }
    });

    if (!claim) {
      return NextResponse.json({ error: 'Invalid claim code' }, { status: 404 });
    }

    // Add 24 hours expiry from creation
    const expiresAt = new Date(claim.createdAt);
    expiresAt.setHours(expiresAt.getHours() + 24);

    return NextResponse.json({
      amount: claim.amount,
      expiresAt: expiresAt.toISOString()
    });
  } catch (error) {
    console.error('Failed to fetch claim:', error);
    return NextResponse.json({ error: 'Failed to fetch claim' }, { status: 500 });
  }
} 