import { NextResponse } from 'next/server';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from '@/lib/prisma';
import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';

const MERCHANT_WALLET_ADDRESS = process.env.MERCHANT_WALLET_ADDRESS;
if (!MERCHANT_WALLET_ADDRESS) {
  throw new Error('MERCHANT_WALLET_ADDRESS environment variable is not set');
}

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

    console.log(`Processing payment confirmation: ${paymentId} with signature: ${signature}`);

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
    
    console.log('Fetching transaction details from Solana...');
    const transaction = await connection.getTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0
    });
    
    if (!transaction) {
      console.error('Transaction not found on Solana');
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Verify the transaction is to the merchant wallet
    const merchantPubKey = new PublicKey(MERCHANT_WALLET_ADDRESS!);
    const postBalances = transaction.meta?.postBalances || [];
    const preBalances = transaction.meta?.preBalances || [];
    const accountKeys = transaction.transaction.message.staticAccountKeys;
    
    console.log('Transaction accounts:', accountKeys.map(k => k.toString()));
    console.log('Merchant wallet:', merchantPubKey.toString());
    console.log('Pre-balances:', preBalances);
    console.log('Post-balances:', postBalances);
    
    const merchantIndex = accountKeys.findIndex(key => key.equals(merchantPubKey));
    console.log('Merchant index in accounts:', merchantIndex);
    
    if (merchantIndex === -1) {
      console.error('Transaction not sent to merchant wallet');
      return NextResponse.json({ error: 'Invalid transaction recipient' }, { status: 400 });
    }

    // Verify the amount received
    const amountReceived = (postBalances[merchantIndex] - preBalances[merchantIndex]) / LAMPORTS_PER_SOL;
    console.log(`Amount received: ${amountReceived} SOL`);

    // Update payment status and add tokens in a transaction
    console.log(`Crediting ${payment.tokenAmount} tokens to user ${user.id}`);
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

    console.log('Payment processed successfully');
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