'use client';

import { useQuery } from '@tanstack/react-query';
import { Progress } from "@/components/ui/progress";
import { Sparkles } from 'lucide-react';

// Helper function to format numbers
const formatNumber = (num: number) => {
  return new Intl.NumberFormat('en-US').format(num);
};

export function TokenCounter({ minimal = false }: { minimal?: boolean }) {
  const { data: tokenData } = useQuery({
    queryKey: ['tokens'],
    queryFn: async () => {
      const res = await fetch('/api/user/tokens');
      if (!res.ok) throw new Error('Failed to fetch tokens');
      return res.json();
    }
  });

  if (minimal) {
    return (
      <div className="px-3 py-2 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm">Tokens</span>
          </div>
          <span className="font-semibold text-sm bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
            {formatNumber(tokenData?.tokens || 0)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 p-6 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/20">
            <Sparkles className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Available Tokens</h3>
            <p className="text-sm text-gray-400">Use tokens for chat, images, and characters</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
            {formatNumber(tokenData?.tokens || 0)}
          </div>
          <div className="text-sm text-gray-400">tokens remaining</div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Token Usage</span>
          <span className="text-gray-400">
            {formatNumber(tokenData?.used || 0)} / {formatNumber((tokenData?.total || 0) + (tokenData?.used || 0))} used
          </span>
        </div>
        <Progress 
          value={tokenData ? (tokenData.used / (tokenData.total + tokenData.used)) * 100 : 0} 
          className="h-2 bg-purple-950"
        >
          <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
        </Progress>
      </div>
    </div>
  );
} 