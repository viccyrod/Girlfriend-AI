'use client';

import BaseLayout from '@/components/BaseLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CreditCard, Zap, MessageCircle, Image as ImageIcon } from 'lucide-react';

export default function BillingSettings() {
  return (
    <BaseLayout>
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
                  <h3 className="text-xl font-semibold">Free Plan</h3>
                  <p className="text-sm text-gray-400">Basic features and limited usage</p>
                </div>
                <Button className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600">
                  Upgrade Plan
                </Button>
              </div>

              <div className="pt-4 border-t border-gray-800">
                <div className="flex items-center gap-4 mb-4">
                  <CreditCard className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-400">No payment method added</span>
                </div>
                <Button variant="outline" className="border-gray-700 hover:bg-gray-800">
                  Add Payment Method
                </Button>
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
                  <span className="text-sm text-gray-400">150/200 messages</span>
                </div>
                <Progress value={75} className="h-2 bg-gray-800">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full" style={{ width: '75%' }} />
                </Progress>
              </div>

              {/* Image Generation Usage */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-medium">Image Generation</span>
                  </div>
                  <span className="text-sm text-gray-400">8/10 images</span>
                </div>
                <Progress value={80} className="h-2 bg-gray-800">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full" style={{ width: '80%' }} />
                </Progress>
              </div>

              {/* API Usage */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-medium">API Calls</span>
                  </div>
                  <span className="text-sm text-gray-400">450/500 calls</span>
                </div>
                <Progress value={90} className="h-2 bg-gray-800">
                  <div className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-full" style={{ width: '90%' }} />
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
    </BaseLayout>
  );
} 