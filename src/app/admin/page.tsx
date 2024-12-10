'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { redirect } from 'next/navigation';

interface Stats {
  totalUsers: number;
  totalModels: number;
  userStats: Array<{
    name: string;
    email: string;
    messages: number;
    images: number;
  }>;
  modelStats: Array<{
    name: string;
    messages: number;
    images: number;
    age: number;
  }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, isLoading } = useKindeBrowserClient();

  useEffect(() => {
    // Check if user is authorized
    if (!isLoading && (!user || user.email !== 'victor@hypergrow.ai')) {
      redirect('/');
    }
  }, [user, isLoading]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/stats');
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

    if (user?.email === 'victor@hypergrow.ai') {
      fetchStats();
    }
  }, [user]);

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-pink-500"></div>
      </div>
    );
  }

  if (!user || user.email !== 'victor@hypergrow.ai') {
    return null;
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="text-pink-500">Error loading statistics</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-600">
            Girlfriend Admin Dashboard
          </h1>
          <div className="text-sm text-gray-400">
            Last updated: {new Date().toLocaleString()}
          </div>
        </div>
        
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="text-pink-500">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-white">{stats.totalUsers}</p>
              <p className="text-sm text-gray-400 mt-1">Active accounts</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="text-pink-500">Total AI Models</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-white">{stats.totalModels}</p>
              <p className="text-sm text-gray-400 mt-1">Virtual companions</p>
            </CardContent>
          </Card>
        </div>

        {/* User Stats */}
        <Card className="mb-8 bg-gray-800/50 backdrop-blur-lg border border-gray-700 shadow-lg">
          <CardHeader>
            <CardTitle className="text-pink-500">User Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left p-3 text-pink-500">Name</th>
                    <th className="text-left p-3 text-pink-500">Email</th>
                    <th className="text-right p-3 text-pink-500">Messages</th>
                    <th className="text-right p-3 text-pink-500">Images</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.userStats.map((user, index) => (
                    <tr key={index} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                      <td className="p-3 text-white">{user.name}</td>
                      <td className="p-3 text-gray-400">{user.email}</td>
                      <td className="text-right p-3 font-medium text-white">{user.messages}</td>
                      <td className="text-right p-3 font-medium text-white">{user.images}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* AI Model Stats */}
        <Card className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 shadow-lg">
          <CardHeader>
            <CardTitle className="text-pink-500">AI Model Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left p-3 text-pink-500">Name</th>
                    <th className="text-right p-3 text-pink-500">Age</th>
                    <th className="text-right p-3 text-pink-500">Messages</th>
                    <th className="text-right p-3 text-pink-500">Images</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.modelStats.map((model, index) => (
                    <tr key={index} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                      <td className="p-3 text-white">{model.name}</td>
                      <td className="text-right p-3 font-medium text-white">{model.age}</td>
                      <td className="text-right p-3 font-medium text-white">{model.messages}</td>
                      <td className="text-right p-3 font-medium text-white">{model.images}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 