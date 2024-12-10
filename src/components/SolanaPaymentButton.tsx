'use client';

import { useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { toast } from 'sonner';
import { PhantomGuide } from './PhantomGuide';
import { Wallet, HelpCircle } from 'lucide-react';
import { useGenerations } from '@/hooks/useGenerations';

interface Props {
  onSuccess?: () => void;
  amount: number;
  label: string;
  generationCount?: number;
}

export function SolanaPaymentButton({ onSuccess, amount, label, generationCount }: Props) {
  const { connected, publicKey, sendTransaction, connect } = useWallet();
  const { connection } = useConnection();
  const [isLoading, setIsLoading] = useState(false);
  const { refresh: refreshGenerations } = useGenerations();

  const handlePayment = async () => {
    if (!connected || !publicKey) return;
    
    try {
      setIsLoading(true);
      const response = await fetch('/api/payments/solana', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount,
          generationCount
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment');
      }

      const { transaction } = await response.json();

      const tx = await sendTransaction(transaction, connection);
      
      toast.promise(
        connection.confirmTransaction(tx), 
        {
          loading: 'Confirming transaction...',
          success: () => {
            onSuccess?.();
            refreshGenerations();
            return 'Payment successful!';
          },
          error: 'Transaction failed'
        }
      );

    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!connected) {
    return (
      <div className="flex flex-col items-center gap-3">
        <Button 
          onClick={connect}
          className="w-full"
          size="lg"
        >
          <Wallet className="mr-2 h-4 w-4" />
          Connect Wallet
        </Button>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="link" size="sm">
              <HelpCircle className="mr-2 h-4 w-4" />
              How to Pay with Phantom
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <PhantomGuide />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <Button
      onClick={handlePayment}
      disabled={isLoading}
      className="w-full"
      size="lg"
    >
      {isLoading ? (
        <span className="flex items-center">
          <svg className="animate-spin -ml-1 mr-3 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processing...
        </span>
      ) : (
        label
      )}
    </Button>
  );
} 