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

    return NextResponse.json({
      amount: claim?.amount || 1800
    });
  } catch (error) {
    return NextResponse.json({ amount: 1800 });
  }
} 