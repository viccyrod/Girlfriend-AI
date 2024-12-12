import { NextResponse } from 'next/server';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from '@/lib/prisma';
import { Connection } from '@solana/web3.js';

export async function POST(req: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { paymentId, signature } = await req.json();

    if (!paymentId || !signature) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get payment record
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      select: {
        id: true,
        userId: true,
        status: true,
        tokenAmount: true,
      }
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    if (payment.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (payment.status === 'completed') {
      return NextResponse.json({ error: 'Payment already processed' }, { status: 400 });
    }

    // Verify transaction on Solana
    const connection = new Connection(
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com'
    );
    
    const transaction = await connection.getTransaction(signature);
    
    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Update payment status and add tokens in a transaction
    const result = await prisma.$transaction([
      // Update payment status
      prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'completed',
          transactionSignature: signature
        }
      }),
      // Add tokens to user's balance
      prisma.user.update({
        where: { id: user.id },
        data: {
          tokens: {
            increment: payment.tokenAmount
          }
        }
      })
    ]);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Payment confirmation error:', error);
    return NextResponse.json(
      { error: 'Failed to confirm payment' },
      { status: 500 }
    );
  }
} 