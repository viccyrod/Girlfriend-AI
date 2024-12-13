'use client';

import React, { createContext, useContext, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { NoTokensDialog } from '@/components/NoTokensDialog';

interface TokensContextType {
  tokens: number;
  showNoTokensDialog: () => void;
  isLoading: boolean;
}

const TokensContext = createContext<TokensContextType | null>(null);

export function useTokens() {
  const context = useContext(TokensContext);
  if (!context) {
    throw new Error('useTokens must be used within a TokensProvider');
  }
  return context;
}

export function TokensProvider({ children }: { children: React.ReactNode }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Query user's token balance
  const { data: tokenData, isLoading } = useQuery({
    queryKey: ['tokens'],
    queryFn: async () => {
      const res = await fetch('/api/user/tokens');
      if (!res.ok) throw new Error('Failed to fetch tokens');
      return res.json();
    },
    refetchInterval: 5000,
    refetchOnWindowFocus: true
  });

  const showNoTokensDialog = () => {
    setIsDialogOpen(true);
  };

  const value = {
    tokens: tokenData?.tokens || 0,
    showNoTokensDialog,
    isLoading
  };

  return (
    <TokensContext.Provider value={value}>
      {children}
      <NoTokensDialog 
        isOpen={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)} 
      />
    </TokensContext.Provider>
  );
} 