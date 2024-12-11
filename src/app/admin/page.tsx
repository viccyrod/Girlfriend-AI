'use client';

import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, MessageSquare, Image as ImageIcon, Bot, Activity, Coins, TrendingUp, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface Stats {
  totalModels: number;
  totalUsers: number;
  stats: {
    messages: string;
    images: string;
    totalInteractions: string;
    totalFollowers: string;
    tokensUsed: string;
  };
  averages: {
    messagesPerUser: number;
    imagesPerUser: number;
    followersPerModel: number;
    tokensPerUser: number;
  };
  growth: {
    newUsers7d: number;
    userGrowthRate: number;
  };
  activity: {
    last24h: {
      messages: number;
      images: number;
      characters: number;
      total: number;
    };
    daily: Array<{
      date: string;
      messages: number;
      images: number;
      characters: number;
    }>;
  };
  topModels: Array<{
    id: string;
    name: string;
    followers: number;
    engagement: number;
    imageUrl: string | null;
    age: number;
  }>;
  lastUpdated: string;
}

export default function AdminPage() {
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const res = await fetch('/api/models/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    subtitle,
    trend,
    delay = 0 
  }: { 
    title: string; 
    value: string | number; 
    icon: any;
    subtitle?: string;
    trend?: number;
    delay?: number;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
    >
      <Card className="p-6 bg-[#1a1a1a] border-white/5">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-pink-500/10 to-purple-600/10 border border-white/5">
            <Icon className="w-6 h-6 text-pink-500" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-white/60">{title}</h3>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-white">{value}</p>
              {subtitle && (
                <span className="text-sm text-white/40">{subtitle}</span>
              )}
              {trend !== undefined && (
                <span className={`text-xs ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {trend > 0 ? '+' : ''}{trend}%
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="p-6 bg-[#1a1a1a] border-white/5">
              <div className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total AI Models"
          value={stats?.totalModels || 0}
          icon={Bot}
          delay={0.1}
        />
        <StatCard
          title="Active Users"
          value={stats?.totalUsers || 0}
          icon={Users}
          subtitle={`+${stats?.growth.newUsers7d || 0} this week`}
          trend={stats?.growth.userGrowthRate}
          delay={0.2}
        />
        <StatCard
          title="Total Interactions"
          value={stats?.stats.totalInteractions || '0'}
          icon={Activity}
          subtitle={`${stats?.activity.last24h.total || 0} today`}
          delay={0.3}
        />
        <StatCard
          title="Tokens Used"
          value={stats?.stats.tokensUsed || '0'}
          icon={Coins}
          subtitle={`~${stats?.averages.tokensPerUser || 0} per user`}
          delay={0.4}
        />
      </div>

      {/* Engagement Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Messages Sent"
          value={stats?.stats.messages || '0'}
          icon={MessageSquare}
          subtitle={`${stats?.activity.last24h.messages || 0} today`}
          delay={0.5}
        />
        <StatCard
          title="Images Generated"
          value={stats?.stats.images || '0'}
          icon={ImageIcon}
          subtitle={`${stats?.activity.last24h.images || 0} today`}
          delay={0.6}
        />
        <StatCard
          title="Total Followers"
          value={stats?.stats.totalFollowers || '0'}
          icon={Users}
          subtitle={`~${stats?.averages.followersPerModel || 0} per model`}
          delay={0.7}
        />
        <StatCard
          title="24h Growth"
          value={`${((stats?.activity.last24h.total || 0) / (stats?.totalUsers || 1) * 100).toFixed(1)}%`}
          icon={TrendingUp}
          subtitle="Active users"
          delay={0.8}
        />
      </div>

      {/* Top Models */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {stats?.topModels.map((model, index) => (
          <Card key={model.id} className="p-4 bg-[#1a1a1a] border-white/5">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-xl overflow-hidden">
                <Image
                  src={model.imageUrl || '/placeholder.jpg'}
                  alt={model.name}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
              <div>
                <h3 className="font-medium text-white">{model.name}</h3>
                <div className="flex items-center gap-4 text-sm text-white/60">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {model.followers}
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="w-4 h-4" />
                    {model.engagement}
                  </span>
                  <span className="text-white/40">{model.age}d old</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </motion.div>

      {/* Last Updated */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="flex justify-between items-center text-sm text-white/40"
      >
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4" />
          <span>Total Interactions: {stats?.stats.totalInteractions || '0'}</span>
        </div>
        <div>
          Last updated: {stats?.lastUpdated ? new Date(stats.lastUpdated).toLocaleTimeString() : '-'}
        </div>
      </motion.div>
    </div>
  );
} 