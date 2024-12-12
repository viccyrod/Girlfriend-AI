'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';

export function SolanaConverter() {
  const [usdAmount, setUsdAmount] = useState<string>('');
  
  const { data: solPrice } = useQuery({
    queryKey: ['solana-price'],
    queryFn: async () => {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
      const data = await response.json();
      return data.solana.usd;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const solAmount = solPrice && usdAmount ? (parseFloat(usdAmount) / solPrice).toFixed(4) : '0';

  return (
    <div className="mt-4 p-4 rounded-md bg-gray-800/50">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium">USD to SOL Converter</span>
        <span className="text-xs text-gray-400">Powered by CoinGecko</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            type="number"
            value={usdAmount}
            onChange={(e) => setUsdAmount(e.target.value)}
            placeholder="Enter USD amount"
            className="bg-background/50 border-gray-800"
          />
        </div>
        <div className="text-sm">
          <span className="text-gray-400">≈</span>
          <span className="ml-2 font-medium">{solAmount} SOL</span>
        </div>
      </div>
      {solPrice && (
        <div className="mt-2 text-xs text-gray-400">
          1 SOL = ${solPrice.toFixed(2)} USD
        </div>
      )}
    </div>
  );
} 