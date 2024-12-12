'use client';

import { useRouter } from 'next/navigation';
import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs';
import { Button } from '@/components/ui/button';
import { Sparkles, LogIn, Share2 } from 'lucide-react';
import Image from 'next/image';
import confetti from 'canvas-confetti';
import { useEffect, useState } from 'react';

interface ClaimData {
  amount: number;
  expiresAt?: string;
}

export default function ClaimPage({ params }: { params: { code: string } }) {
  const router = useRouter();
  const { isAuthenticated } = useKindeBrowserClient();
  const [claimData, setClaimData] = useState<ClaimData | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    // Trigger confetti on load
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    // Fetch claim details
    const fetchClaimData = async () => {
      const res = await fetch(`/api/claim/${params.code}`);
      if (res.ok) {
        const data = await res.json();
        setClaimData(data);
      }
    };

    fetchClaimData();
  }, [params.code]);

  // Update countdown timer
  useEffect(() => {
    if (!claimData?.expiresAt) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const expires = new Date(claimData.expiresAt!).getTime();
      const distance = expires - now;

      if (distance < 0) {
        setTimeLeft('Expired');
        return;
      }

      const hours = Math.floor(distance / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(timer);
  }, [claimData?.expiresAt]);

  // If user is already logged in, we can handle the claim
  if (isAuthenticated) {
    router.push(`/?claim=${params.code}`);
    return null;
  }

  const handleSignUp = () => {
    router.push(`/auth/login?claimCode=${params.code}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-background/80">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Logo - Smaller */}
        <div className="flex justify-center">
          <Image
            src="/logo-gradient.svg"
            alt="girlfriend logo"
            width={150}
            height={45}
            className="w-auto h-12"
            priority
          />
        </div>

        {/* Main Value Proposition */}
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-8 h-8 text-purple-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
              600 GOON Tokens
            </h1>
          </div>
          <p className="text-xl font-medium">Are Waiting For You!</p>
          <p className="text-sm text-gray-400">
            Plus, your friend will receive 600 tokens too!
          </p>
        </div>

        {/* Countdown Timer */}
        {timeLeft && (
          <div className="space-y-2">
            <p className="text-sm text-purple-400 font-medium">Limited Time Offer</p>
            <div className="flex items-center justify-center gap-4">
              {timeLeft === 'Expired' ? (
                <div className="text-2xl font-bold text-red-400">Offer Expired</div>
              ) : (
                <>
                  <div className="text-center">
                    <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
                      {timeLeft.split('h')[0]}
                    </div>
                    <div className="text-xs text-gray-400 uppercase">Hours</div>
                  </div>
                  <div className="text-2xl font-bold text-gray-500">:</div>
                  <div className="text-center">
                    <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
                      {timeLeft.split('h ')[1].split('m')[0]}
                    </div>
                    <div className="text-xs text-gray-400 uppercase">Minutes</div>
                  </div>
                  <div className="text-2xl font-bold text-gray-500">:</div>
                  <div className="text-center">
                    <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
                      {timeLeft.split('m ')[1].split('s')[0]}
                    </div>
                    <div className="text-xs text-gray-400 uppercase">Seconds</div>
                  </div>
                </>
              )}
            </div>
            <p className="text-sm text-gray-400">
              Claim your tokens before they expire
            </p>
          </div>
        )}

        {/* Value Breakdown */}
        <div className="bg-purple-500/10 rounded-lg p-4 space-y-2 border border-purple-500/20">
          <p className="text-sm text-gray-400">What you can do with 600 tokens:</p>
          <ul className="text-sm space-y-1">
            <li className="text-gray-300">• 600 chat messages</li>
            <li className="text-gray-300">• Generate 6 unique images</li>
            <li className="text-gray-300">• Create 1 custom AI character</li>
          </ul>
        </div>

        {/* Referral Info */}
        <div className="bg-purple-500/10 rounded-lg p-4 space-y-2 border border-purple-500/20">
          <div className="flex items-center gap-2 justify-center">
            <Share2 className="w-4 h-4 text-purple-400" />
            <p className="text-sm font-medium text-purple-400">Share & Earn Program</p>
          </div>
          <p className="text-sm text-gray-300">
            When you claim your tokens, the person who shared this with you will also receive 600 tokens as a thank you!
          </p>
        </div>

        {/* Description - Moved closer to CTA */}
        <p className="text-gray-400">
          Create your account on girlfriend to claim your tokens and start chatting with AI characters
        </p>

        {/* CTA and Terms */}
        <div className="space-y-3">
          <Button 
            onClick={handleSignUp}
            size="lg"
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <LogIn className="mr-2 h-4 w-4" />
            Sign Up to Claim Tokens
          </Button>

          <p className="text-xs text-gray-400">
            By claiming tokens, you confirm that you are at least 18 years old and agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
} 