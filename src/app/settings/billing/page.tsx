'use client';

import { useEffect, useState } from 'react';
import BaseLayout from '@/components/BaseLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CreditCard, MessageCircle, Image as ImageIcon, UserCircle, Plus, Calculator, Copy, Users2, Share2 } from 'lucide-react';
import { SolanaPaymentButton } from '@/components/SolanaPaymentButton';
import { SolanaProvider } from '@/providers/SolanaProvider';
import { CREDIT_PACKAGES, TOKEN_COSTS } from '@/lib/constants';
import { TokenIcon } from '@/components/TokenIcon';
import { TokenTooltip } from '@/components/TokenTooltip';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import { TokenCounter } from '@/components/TokenCounter';
import { toast } from 'sonner';
import { WalletButton } from '@/components/WalletButton';
import { SolanaConverter } from '@/components/SolanaConverter';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

interface UsageStats {
  currentPlan: string;
  chat: {
    used: number;
    limit: number;
    percentage: number;
  };
  images: {
    used: number;
    limit: number;
    percentage: number;
  };
  characters: {
    used: number;
    limit: number;
    percentage: number;
  };
}

interface ReferralStats {
  totalReferrals: number;
  pendingReferrals: number;
  completedReferrals: number;
  totalTokensEarned: number;
}

export default function BillingSettings() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [customAmount, setCustomAmount] = useState<number>(1000);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [showPhantomGuide, setShowPhantomGuide] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/settings/usage');
        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  useEffect(() => {
    const fetchReferralStats = async () => {
      try {
        const response = await fetch('/api/referral/stats');
        if (response.ok) {
          const data = await response.json();
          setReferralStats(data);
        }
      } catch (error) {
        console.error('Error fetching referral stats:', error);
      }
    };

    fetchReferralStats();
  }, []);

  // Add claim code handling
  useEffect(() => {
    const handleClaimCode = async () => {
      const params = new URLSearchParams(window.location.search);
      const claimCode = params.get('claim');
      
      if (claimCode) {
        try {
          const response = await fetch('/api/claim', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code: claimCode }),
          });

          const data = await response.json();
          
          if (response.ok) {
            toast.success('Successfully claimed tokens!');
            // Remove claim code from URL without refreshing
            window.history.replaceState({}, '', '/settings/billing');
          } else {
            toast.error(data.error || 'Failed to claim tokens');
          }
        } catch (error) {
          console.error('Error claiming tokens:', error);
          toast.error('Failed to claim tokens');
        }
      }
    };

    handleClaimCode();
  }, []); // Run once on mount

  // Calculate tokens based on amount with bonus tiers
  const calculateTokens = (amount: number) => {
    let bonus = 0;
    // Calculate bonus percentage based on amount
    if (amount >= 100000) {
      bonus = 1.00; // 100% bonus
    } else if (amount >= 50000) {
      bonus = 0.75; // 75% bonus
    } else if (amount >= 10000) {
      bonus = 0.65; // 65% bonus
    } else if (amount >= 5000) {
      bonus = 0.55; // 55% bonus
    } else if (amount >= 1000) {
      bonus = 0.45; // 45% bonus
    }

    const baseTokens = amount * 200; // Base rate: $1 = 200 tokens ($5 = 1,000 tokens)
    const bonusTokens = baseTokens * bonus;
    return Math.floor(baseTokens + bonusTokens);
  };

  const generateShareLink = async () => {
    try {
      const response = await fetch('/api/referral/generate', {
        method: 'POST'
      });
      
      if (!response.ok) throw new Error('Failed to generate link');
      
      const { code } = await response.json();
      const link = `${window.location.origin}/claim/${code}`;
      setShareLink(link);
      
      // Get stats for this referral code
      const statsResponse = await fetch(`/api/referral/stats?code=${code}`);
      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        setReferralStats(stats);
      }
    } catch (error) {
      toast.error('Failed to generate share link');
    }
  };

  const copyShareLink = async () => {
    if (shareLink) {
      await navigator.clipboard.writeText(shareLink);
      toast.success('Share link copied to clipboard!');
    }
  };

  const content = (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-pink-500 to-purple-500 text-transparent bg-clip-text">
        Billing & Usage
      </h1>

      {/* Current Plan / Manual Payment Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Current Plan</h2>
        <p className="text-sm text-gray-400 mb-6">Manage your subscription and billing information.</p>
      </div>

      <TokenCounter />

      {/* Token System Explanation */}
      <div className="mb-8 p-4 rounded-lg bg-gray-900/50 border border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Token System</h2>
          <TokenTooltip />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 rounded-md bg-gray-800/50">
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle className="w-4 h-4" />
              <span className="font-medium">Messages</span>
            </div>
            <p className="text-sm text-gray-400">{TOKEN_COSTS.CHAT} token per message</p>
          </div>
          <div className="p-3 rounded-md bg-gray-800/50">
            <div className="flex items-center gap-2 mb-2">
              <ImageIcon className="w-4 h-4" />
              <span className="font-medium">Photos</span>
            </div>
            <p className="text-sm text-gray-400">{TOKEN_COSTS.IMAGE} tokens per photo</p>
          </div>
          <div className="p-3 rounded-md bg-gray-800/50">
            <div className="flex items-center gap-2 mb-2">
              <UserCircle className="w-4 h-4" />
              <span className="font-medium">Characters</span>
            </div>
            <p className="text-sm text-gray-400">{TOKEN_COSTS.CHARACTER} tokens per character</p>
          </div>
        </div>
      </div>

      {/* Token Packages Section */}
      <div className="mb-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <TokenIcon className="w-8 h-8" animate />
            <h2 className="text-2xl font-bold">Buy Tokens with</h2>
            <div className="flex items-center gap-1">
              <svg className="w-6 h-6" viewBox="0 0 128 128" fill="none">
                <path d="M93.94 42.63H13.78c-1.76 0-2.64-2.13-1.4-3.38l19.23-19.23c.84-.84 1.99-1.31 3.18-1.31h80.16c1.76 0 2.64 2.13 1.4 3.38L97.12 41.32c-.84.84-1.99 1.31-3.18 1.31Z" fill="url(#solana_logo_gradient_1)"/>
                <path d="M93.94 104.36H13.78c-1.76 0-2.64-2.13-1.4-3.38l19.23-19.23c.84-.84 1.99-1.31 3.18-1.31h80.16c1.76 0 2.64 2.13 1.4 3.38l-19.23 19.23c-.84.84-1.99 1.31-3.18 1.31Z" fill="url(#solana_logo_gradient_2)"/>
                <path d="M34.79 73.5h80.16c1.76 0 2.64-2.13 1.4-3.38L97.12 50.89c-.84-.84-1.99-1.31-3.18-1.31H13.78c-1.76 0-2.64 2.13-1.4 3.38l19.23 19.23c.84.84 1.99 1.31 3.18 1.31Z" fill="url(#solana_logo_gradient_3)"/>
                <defs>
                  <linearGradient id="solana_logo_gradient_1" x1="73" y1="18.71" x2="73" y2="42.63" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#9945FF"/>
                    <stop offset="1" stopColor="#14F195"/>
                  </linearGradient>
                  <linearGradient id="solana_logo_gradient_2" x1="73" y1="80.44" x2="73" y2="104.36" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#9945FF"/>
                    <stop offset="1" stopColor="#14F195"/>
                  </linearGradient>
                  <linearGradient id="solana_logo_gradient_3" x1="73" y1="49.58" x2="73" y2="73.5" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#9945FF"/>
                    <stop offset="1" stopColor="#14F195"/>
                  </linearGradient>
                </defs>
              </svg>
              <span className="text-2xl font-bold bg-gradient-to-r from-[#9945FF] to-[#14F195] text-transparent bg-clip-text">
                Solana
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <img src="/phantom.svg" alt="Phantom" className="w-4 h-4" />
                  How to Buy with Phantom
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">How to Buy with Phantom</h3>
                  <div className="space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0">1</div>
                      <p className="text-sm text-gray-400">Download Phantom Wallet from <a href="https://phantom.app" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">phantom.app</a></p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0">2</div>
                      <p className="text-sm text-gray-400">Add funds to your wallet using a credit card or crypto</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0">3</div>
                      <p className="text-sm text-gray-400">Connect your wallet using the button above</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0">4</div>
                      <p className="text-sm text-gray-400">Click any package to purchase tokens instantly</p>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <WalletButton className="w-full sm:w-auto" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {CREDIT_PACKAGES.map((pkg) => (
            <div 
              key={pkg.id}
              className={`
                relative p-6 rounded-lg border bg-gray-900/50
                ${pkg.featured ? 'ring-2 ring-primary' : 'border-gray-800'}
              `}
            >
              {pkg.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-xs rounded-full">
                  Most Popular
                </span>
              )}
              
              {pkg.savings && (
                <span className="absolute top-4 right-4 text-sm font-medium text-green-500">
                  {pkg.savings}
                </span>
              )}

              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-3xl font-bold">${pkg.price}</span>
                <span className="text-gray-400">USD</span>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <TokenIcon className="w-5 h-5" />
                <span className="font-medium">{pkg.tokens.toLocaleString()} tokens</span>
              </div>

              <p className="text-sm text-gray-400 mb-6">
                {pkg.description}
              </p>

              <SolanaPaymentButton 
                amount={pkg.price}
                label={`Buy ${pkg.tokens.toLocaleString()} Tokens`}
                onSuccess={async () => {
                  const response = await fetch('/api/settings/usage');
                  const data = await response.json();
                  setStats(data);
                }}
              />
            </div>
          ))}

          {/* Custom Amount Card */}
          <div className="relative p-6 rounded-lg bg-gray-900/50 border-gray-800 border">
            <div className="absolute top-4 right-4 text-sm font-medium text-green-500">
              Up to 100% off
            </div>

            {!showCustomForm ? (
              <div 
                onClick={() => setShowCustomForm(true)}
                className="cursor-pointer space-y-4"
              >
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-3xl font-bold">Custom</span>
                  <span className="text-gray-400">USD</span>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <TokenIcon className="w-5 h-5" />
                  <span className="font-medium">Calculate your tokens</span>
                </div>

                <p className="text-sm text-gray-400 mb-6">
                  For the most elite gooners: Get up to 100% bonus tokens with larger purchases
                </p>

                <Button 
                  variant="outline" 
                  className="w-full border-dashed"
                >
                  <Calculator className="mr-2 h-4 w-4" />
                  Calculate Custom Amount
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">
                    ${customAmount.toLocaleString()}
                  </span>
                  <span className="text-gray-400">USD</span>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <TokenIcon className="w-5 h-5" />
                  <span className="font-medium">
                    {calculateTokens(customAmount).toLocaleString()} tokens
                  </span>
                </div>

                <div className="space-y-3">
                  <Input
                    type="number"
                    min={1000}
                    max={1000000}
                    value={customAmount}
                    onChange={(e) => setCustomAmount(Number(e.target.value))}
                    className="bg-background/50 border-gray-800"
                    placeholder="Enter amount ($1,000 - $1,000,000)"
                  />

                  <div className="text-sm text-gray-400">
                    <div className="font-medium mb-2">Bonus tiers:</div>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <span className="w-24">$1,000+:</span>
                        <span className="text-green-500 font-medium">45% bonus</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-24">$5,000+:</span>
                        <span className="text-green-500 font-medium">55% bonus</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-24">$10,000+:</span>
                        <span className="text-green-500 font-medium">65% bonus</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-24">$50,000+:</span>
                        <span className="text-green-500 font-medium">75% bonus</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-24">$100,000+:</span>
                        <span className="text-green-500 font-medium">100% bonus</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <SolanaPaymentButton 
                  amount={customAmount}
                  label={`Buy ${calculateTokens(customAmount).toLocaleString()} Tokens`}
                  onSuccess={async () => {
                    // Refresh user's token balance
                    setShowCustomForm(false);
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Manual Payment Section */}
      <div className="mb-12">
        <div className="p-6 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Give 600, Get 600</h3>
              <p className="text-gray-400">Share tokens with friends and earn the same amount back when they sign up</p>
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={generateShareLink}
                className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300"
              >
                Generate Link
              </Button>
              {shareLink && (
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(shareLink);
                    toast.success('Link copied to clipboard!');
                  }}
                  variant="outline"
                  className="gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy Link
                </Button>
              )}
            </div>
          </div>

          {shareLink && (
            <div className="mt-4 p-3 bg-purple-950/20 rounded-lg border border-purple-500/20 flex items-center justify-between">
              <code className="text-sm text-purple-300">{shareLink}</code>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Users2 className="w-4 h-4" />
                <span>{referralStats?.completedReferrals || 0}/{referralStats?.totalReferrals || 0} claimed</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Share & Earn Program Stats */}
      <div className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Referral Stats</CardTitle>
              <CardDescription>Track your referral earnings and progress</CardDescription>
            </CardHeader>
            <CardContent>
              {referralStats ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Total Referrals</span>
                    <span className="font-medium">{referralStats.totalReferrals}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Pending Invites</span>
                    <span className="font-medium">{referralStats.pendingReferrals}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Completed Referrals</span>
                    <span className="font-medium">{referralStats.completedReferrals}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Tokens Earned</span>
                    <span className="font-medium text-primary">{referralStats.totalTokensEarned}</span>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-400">Loading stats...</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How It Works</CardTitle>
              <CardDescription>Simple steps to earn tokens</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0">1</div>
                  <p className="text-sm text-gray-400">Generate and share your unique referral link with friends</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0">2</div>
                  <p className="text-sm text-gray-400">Friends sign up and get 600 tokens</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0">3</div>
                  <p className="text-sm text-gray-400">You automatically receive 600 tokens as a reward</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-6">
        {/* Usage Statistics Card */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle>Usage Statistics</CardTitle>
            <CardDescription>Monitor your current usage and limits.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Chat Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium">Chat Messages</span>
                </div>
                <span className="text-sm text-gray-400">
                  {stats?.chat.used}/{stats?.chat.limit} messages
                </span>
              </div>
              <Progress value={stats?.chat.percentage} className="h-2 bg-gray-800">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full" 
                  style={{ width: `${stats?.chat.percentage}%` }} 
                />
              </Progress>
            </div>

            {/* Image Generation Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium">Image Generation</span>
                </div>
                <span className="text-sm text-gray-400">
                  {stats?.images.used}/{stats?.images.limit} images
                </span>
              </div>
              <Progress value={stats?.images.percentage} className="h-2 bg-gray-800">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full" 
                  style={{ width: `${stats?.images.percentage}%` }} 
                />
              </Progress>
            </div>

            {/* Character Generation Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCircle className="w-4 h-4 text-pink-400" />
                  <span className="text-sm font-medium">Character Generation</span>
                </div>
                <span className="text-sm text-gray-400">
                  {stats?.characters.used}/{stats?.characters.limit} characters
                </span>
              </div>
              <Progress value={stats?.characters.percentage} className="h-2 bg-gray-800">
                <div 
                  className="h-full bg-gradient-to-r from-pink-500 to-pink-400 rounded-full" 
                  style={{ width: `${stats?.characters.percentage}%` }} 
                />
              </Progress>
            </div>
          </CardContent>
        </Card>

        {/* Billing History Card */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
            <CardDescription>View your past transactions and invoices.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6 text-gray-400">
              <p>No billing history available</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <BaseLayout>
      <SolanaProvider>
        {loading ? (
          <div className="container max-w-4xl mx-auto py-8 px-4">
            <div className="animate-pulse space-y-6">
              <div className="h-8 w-48 bg-gray-800 rounded"></div>
              <div className="h-40 bg-gray-800 rounded"></div>
              <div className="h-60 bg-gray-800 rounded"></div>
              <div className="h-40 bg-gray-800 rounded"></div>
            </div>
          </div>
        ) : (
          content
        )}
      </SolanaProvider>
    </BaseLayout>
  );
} 