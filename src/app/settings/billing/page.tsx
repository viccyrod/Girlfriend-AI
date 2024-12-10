'use client';

import { useEffect, useState } from 'react';
import BaseLayout from '@/components/BaseLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CreditCard, MessageCircle, Image as ImageIcon } from 'lucide-react';
import { SolanaPaymentButton } from '@/components/SolanaPaymentButton';
import { SolanaProvider } from '@/providers/SolanaProvider';

interface UsageStats {
  currentPlan: string;
  messages: {
    used: number;
    limit: number;
    percentage: number;
  };
  images: {
    used: number;
    limit: number;
    percentage: number;
  };
}

export default function BillingSettings() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

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

  const content = (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-pink-500 to-purple-500 text-transparent bg-clip-text">
        Billing & Usage
      </h1>

      <div className="space-y-6">
        {/* Current Plan Card */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>Manage your subscription and billing information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">{stats?.currentPlan || 'Free'} Plan</h3>
                <p className="text-sm text-gray-400">
                  {stats?.currentPlan === 'Premium' 
                    ? 'Full access to all features'
                    : 'Basic features and limited usage'}
                </p>
              </div>
              {stats?.currentPlan !== 'Premium' && (
                <SolanaPaymentButton 
                  amount={49.99} 
                  onSuccess={async () => {
                    const response = await fetch('/api/settings/usage');
                    const data = await response.json();
                    setStats(data);
                  }}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Usage Statistics Card */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle>Usage Statistics</CardTitle>
            <CardDescription>Monitor your current usage and limits.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Messages Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium">Messages</span>
                </div>
                <span className="text-sm text-gray-400">
                  {stats?.messages.used}/{stats?.messages.limit} messages
                </span>
              </div>
              <Progress value={stats?.messages.percentage} className="h-2 bg-gray-800">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full" 
                  style={{ width: `${stats?.messages.percentage}%` }} 
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