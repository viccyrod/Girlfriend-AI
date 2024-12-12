import { NextResponse } from 'next/server';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from '@/lib/prisma';
import { 
  PublicKey, 
  Transaction, 
  Connection, 
  SystemProgram,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import { calculateTokens } from '@/lib/tokens';

// Make sure this is a valid Solana address
const MERCHANT_WALLET_ADDRESS = process.env.MERCHANT_WALLET_ADDRESS || '11111111111111111111111111111111';

export async function POST(req: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, publicKey } = await req.json();

    if (!amount || amount < 5) { // Minimum $5 purchase
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    if (!publicKey) {
      return NextResponse.json({ error: 'Wallet not connected' }, { status: 400 });
    }

    // Calculate token amount including bonuses
    const tokenAmount = calculateTokens(amount);

    // Create Solana connection
    const connection = new Connection(
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com'
    );

    // Convert USD amount to SOL
    // Using a fixed rate for demo. In production, fetch real-time price
    const SOL_PRICE_USD = 100; // Example: 1 SOL = $100
    const solAmount = amount / SOL_PRICE_USD;
    const lamports = Math.floor(solAmount * LAMPORTS_PER_SOL);

    // Create payment record first
    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        amount,
        currency: 'USD',
        status: 'pending',
        tokenAmount,
      }
    });

    // Create a new transaction
    const transaction = new Transaction();
    
    // Create PublicKey instances
    const senderPublicKey = new PublicKey(publicKey);
    const merchantPublicKey = new PublicKey(MERCHANT_WALLET_ADDRESS);

    // Add transfer instruction
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: senderPublicKey,
        toPubkey: merchantPublicKey,
        lamports,
      })
    );

    // Get the latest blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = senderPublicKey;

    // Return the serialized transaction
    return NextResponse.json({ 
      transaction: transaction.serialize({ requireAllSignatures: false }), 
      paymentId: payment.id 
    });

  } catch (error) {
    console.error('Payment error:', error);
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    );
  }
} 