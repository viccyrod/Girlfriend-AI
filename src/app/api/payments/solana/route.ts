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
const MERCHANT_WALLET_ADDRESS = process.env.MERCHANT_WALLET_ADDRESS;
if (!MERCHANT_WALLET_ADDRESS) {
  throw new Error('MERCHANT_WALLET_ADDRESS environment variable is not set');
}

// Alchemy RPC endpoint
const RPC_ENDPOINT = "https://solana-mainnet.g.alchemy.com/v2/_72BKJxKxcuPjZPhvx9w8qbKwfvZF3IX";

console.log('Using merchant wallet address:', MERCHANT_WALLET_ADDRESS);

// Function to get real-time SOL price
async function getSolanaPrice(): Promise<number> {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd',
      { next: { revalidate: 60 } } // Cache for 60 seconds
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

    // Create Solana connection using Alchemy endpoint
    const connection = new Connection(RPC_ENDPOINT);

    // Get real-time SOL price and convert USD amount to SOL
    const SOL_PRICE_USD = await getSolanaPrice();
    const solAmount = parseFloat((amount / SOL_PRICE_USD).toFixed(4)); // Round to 4 decimal places
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
    const merchantPublicKey = new PublicKey(MERCHANT_WALLET_ADDRESS!); // Assert non-null since we checked above
    
    console.log('Sender public key:', senderPublicKey.toString());
    console.log('Merchant public key:', merchantPublicKey.toString());
    console.log('Amount in lamports:', lamports);

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

    console.log('Transaction created with blockhash:', blockhash);
    console.log('Transaction accounts:', transaction.instructions[0].keys.map(k => k.pubkey.toString()));

    // Add transaction metadata for better UX
    const metadata = {
      name: "girlfriend.cx",
      icon: "/logo-gradient-heart-hq.svg",
      amount: {
        value: solAmount,
        currency: "SOL",
        usdValue: amount,
        solPrice: SOL_PRICE_USD
      }
    };

    // Return the serialized transaction with metadata
    return NextResponse.json({ 
      transaction: transaction.serialize({ requireAllSignatures: false }), 
      paymentId: payment.id,
      metadata
    });

  } catch (error) {
    console.error('Payment error:', error);
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    );
  }
} 