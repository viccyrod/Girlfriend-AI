'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { toast } from 'sonner';
import { useGenerations } from '@/hooks/useGenerations';
import { Loader2 } from 'lucide-react';
import { Transaction } from '@solana/web3.js';

interface Props {
  amount: number;
  label: string;
  onSuccess?: () => void;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function SolanaPaymentButton({ 
  onSuccess, 
  amount, 
  label, 
  variant = 'default',
  size = 'default',
  className = ''
}: Props) {
  const { connected, publicKey, sendTransaction, connect } = useWallet();
  const { connection } = useConnection();
  const [isLoading, setIsLoading] = useState(false);
  const { refresh: refreshGenerations } = useGenerations();

  const handlePayment = async () => {
    if (!connected || !publicKey) {
      try {
        await connect();
        return;
      } catch (error) {
        toast.error('Please connect your wallet to continue');
        return;
      }
    }
    
    try {
      setIsLoading(true);
      
      // Step 1: Create payment intent
      const response = await fetch('/api/payments/solana', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount,
          publicKey: publicKey.toString()
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create payment');
      }

      const { transaction: serializedTransaction, paymentId } = await response.json();
      
      // Step 2: Deserialize and send transaction
      const transaction = Transaction.from(Buffer.from(serializedTransaction, 'base64'));
      const signature = await sendTransaction(transaction, connection);
      
      // Step 3: Wait for confirmation and update tokens
      await toast.promise(
        (async () => {
          // Wait for transaction confirmation
          await connection.confirmTransaction(signature);
          
          // Update payment status and add tokens
          const confirmResponse = await fetch('/api/payments/solana/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              paymentId,
              signature 
            }),
          });

          if (!confirmResponse.ok) {
            throw new Error('Failed to confirm payment');
          }

          // Call success callback
          onSuccess?.();
          refreshGenerations();
        })(),
        {
          loading: 'Processing payment...',
          success: 'Payment successful! Tokens added to your account.',
          error: 'Transaction failed. Please try again.'
        }
      );

    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error instanceof Error ? error.message : 'Payment failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={isLoading}
      variant={variant}
      size={size}
      className={className}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        label
      )}
    </Button>
  );
} 