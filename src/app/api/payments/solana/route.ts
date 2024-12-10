import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { Connection, PublicKey } from '@solana/web3.js';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { signature } = await req.json();
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to Solana network
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

    // Verify the transaction
    const tx = await connection.getTransaction(signature);
    if (!tx || !tx.meta) {
      return NextResponse.json({ error: 'Transaction not found or invalid' }, { status: 404 });
    }

    // Verify the amount (in production, you'd want to verify the exact amount)
    const preBalance = tx.meta.preBalances[0] ?? 0;
    const postBalance = tx.meta.postBalances[0] ?? 0;
    const lamports = postBalance - preBalance;
    
    if (lamports < 0) {
      return NextResponse.json({ error: 'Invalid transaction amount' }, { status: 400 });
    }

    // Update user subscription status
    await prisma.user.update({
      where: { email: user.email || '' },
      data: {
        isSubscribed: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Payment verification failed:', error);
    return NextResponse.json(
      { error: 'Payment verification failed' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 