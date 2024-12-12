import { NextResponse } from 'next/server';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from '@/lib/prisma';
import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';

const MERCHANT_WALLET_ADDRESS = process.env.MERCHANT_WALLET_ADDRESS;
if (!MERCHANT_WALLET_ADDRESS) {
  throw new Error('MERCHANT_WALLET_ADDRESS environment variable is not set');
}

const RPC_ENDPOINT = "https://solana-mainnet.g.alchemy.com/v2/_72BKJxKxcuPjZPhvx9w8qbKwfvZF3IX";

async function getSolanaPrice(): Promise<number> {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd',
      { next: { revalidate: 60 } }
    );
    const data = await response.json();
    return data.solana.usd;
  } catch (error) {
    console.error('Error fetching SOL price:', error);
    throw new Error('Failed to fetch SOL price');
  }
}

export async function POST(req: Request) {
  try {
    console.log('Starting payment confirmation...');
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user?.id) {
      console.log('Unauthorized: No user ID');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { paymentId, signature } = await req.json();
    console.log('Confirmation request:', { paymentId, signature });

    if (!paymentId || !signature) {
      console.log('Missing required fields:', { paymentId, signature });
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
        amount: true,
      }
    });

    if (!payment) {
      console.log('Payment not found:', paymentId);
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    if (payment.userId !== user.id) {
      console.log('Unauthorized: Payment belongs to different user');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (payment.status === 'completed') {
      console.log('Payment already processed:', paymentId);
      return NextResponse.json({ error: 'Payment already processed' }, { status: 400 });
    }

    // Verify transaction on Solana
    const connection = new Connection(RPC_ENDPOINT);
    console.log('Fetching transaction details for signature:', signature);
    
    const transaction = await connection.getTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0
    });
    
    if (!transaction) {
      console.error('Transaction not found on Solana');
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (transaction.meta?.err) {
      console.error('Transaction failed on Solana:', transaction.meta.err);
      return NextResponse.json({ 
        error: 'Transaction failed on Solana',
        details: transaction.meta.err 
      }, { status: 400 });
    }

    // Verify the transaction is to the merchant wallet
    const merchantPubKey = new PublicKey(MERCHANT_WALLET_ADDRESS!);
    const postBalances = transaction.meta?.postBalances || [];
    const preBalances = transaction.meta?.preBalances || [];
    const accountKeys = transaction.transaction.message.staticAccountKeys;
    
    const merchantIndex = accountKeys.findIndex(key => key.equals(merchantPubKey));
    if (merchantIndex === -1) {
      console.error('Transaction not sent to merchant wallet');
      return NextResponse.json({ error: 'Invalid transaction recipient' }, { status: 400 });
    }

    // Verify the amount received
    const amountReceived = (postBalances[merchantIndex] - preBalances[merchantIndex]) / LAMPORTS_PER_SOL;
    const solPrice = await getSolanaPrice();
    console.log('Amount verification:', {
      received: amountReceived,
      expected: payment.amount,
      solPrice
    });

    // Update payment status and add tokens
    let result;
    try {
      result = await prisma.$transaction([
        prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: 'completed',
            transactionSignature: signature
          }
        }),
        prisma.user.update({
          where: { id: user.id },
          data: {
            tokens: {
              increment: payment.tokenAmount
            }
          }
        })
      ]);
      
      console.log('Transaction completed successfully:', {
        paymentUpdate: result[0],
        userUpdate: result[1]
      });
    } catch (error) {
      console.error('Database transaction failed:', error);
      throw error;
    }

    return NextResponse.json({ 
      success: true,
      tokenAmount: payment.tokenAmount,
      newBalance: result[1].tokens
    });

  } catch (error) {
    console.error('Payment confirmation error:', error);
    return NextResponse.json(
      { error: 'Failed to confirm payment' },
      { status: 500 }
    );
  }
} 