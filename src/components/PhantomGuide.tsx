'use client';

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { WalletIcon, ArrowRightIcon, CreditCardIcon, SparklesIcon } from "lucide-react";

const STEPS = [
  {
    icon: WalletIcon,
    title: "1. Install Phantom Wallet",
    description: "Download Phantom from phantom.app and create a wallet",
  },
  {
    icon: CreditCardIcon,
    title: "2. Add SOL to Your Wallet",
    description: "Buy SOL from an exchange or directly in Phantom",
  },
  {
    icon: ArrowRightIcon,
    title: "3. Connect Your Wallet",
    description: "Click 'Connect Wallet' and select Phantom",
  },
  {
    icon: SparklesIcon,
    title: "4. Purchase Credits",
    description: "Select amount and approve the transaction in Phantom",
  },
] as const;

export function PhantomGuide() {
  return (
    <Card className="p-6 bg-card/50 border-border/50">
      <h3 className="text-lg font-medium mb-4">How to Buy with Phantom</h3>
      
      <div className="space-y-4">
        {STEPS.map(({ icon: Icon, title, description }) => (
          <div key={title} className="flex items-start space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <div className="font-medium">{title}</div>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Need help?
        </p>
        <Button 
          variant="link" 
          className="text-primary p-0 h-auto"
          onClick={() => window.open('https://docs.phantom.app', '_blank')}
        >
          Detailed guide →
        </Button>
      </div>
    </Card>
  );
} 