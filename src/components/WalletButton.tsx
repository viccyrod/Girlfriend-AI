'use client';

import { Button } from "@/components/ui/button";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Wallet, LogOut } from "lucide-react";

export function WalletButton() {
  const { connected, publicKey, disconnect } = useWallet();
  const { setVisible } = useWalletModal();

  if (connected && publicKey) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => disconnect()}
        className="bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/20"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
          </span>
          <LogOut className="h-4 w-4" />
        </div>
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setVisible(true)}
      className="bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/20"
    >
      <Wallet className="mr-2 h-4 w-4" />
      Connect Wallet
    </Button>
  );
} 