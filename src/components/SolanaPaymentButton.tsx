'use client';

import { FC } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { LAMPORTS_PER_SOL, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';

interface Props {
  amount: number;
  onSuccess?: () => Promise<void>;
}

export const SolanaPaymentButton: FC<Props> = ({ amount, onSuccess }) => {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();

  const handlePayment = async () => {
    if (!publicKey) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      // Convert USD to SOL (you'll want to use a real price feed in production)
      const solPrice = 60; // Example: 1 SOL = $60
      const solAmount = amount / solPrice;
      const lamports = solAmount * LAMPORTS_PER_SOL;

      // Create transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey('YOUR_RECIPIENT_ADDRESS'), // Replace with your wallet address
          lamports: Math.round(lamports)
        })
      );

      const signature = await sendTransaction(transaction, connection);
      console.log('Transaction sent:', signature);

      // Wait for confirmation
      const confirmation = await connection.confirmTransaction(signature);
      console.log('Transaction confirmed:', confirmation);
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        await onSuccess();
      }
    } catch (error) {
      console.error('Payment failed:', error);
      alert('Payment failed. Please try again.');
    }
  };

  return (
    <div>
      <WalletMultiButton />
      {publicKey && (
        <button onClick={handlePayment}>
          Pay ${amount} with Solana
        </button>
      )}
    </div>
  );
}; 