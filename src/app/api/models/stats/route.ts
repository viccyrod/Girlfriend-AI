import { NextResponse } from 'next/server';
import prisma from '@/lib/clients/prisma';
import { GenerationType } from '@prisma/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 10;

export async function GET() {
  try {
    const [
      totalModels,
      totalUsers,
      modelStats,
      topModels,
      recentActivity,
      tokenStats,
      userGrowth,
      dailyStats
    ] = await Promise.all([
      // Count public models
      prisma.aIModel.count({
        where: {
          isPrivate: false,
          status: 'COMPLETED'
        }
      }),
      
      // Count real users
      prisma.user.count({
        where: {
          isAI: false
        }
      }),

      // Get aggregated message and image counts
      prisma.aIModel.aggregate({
        _sum: {
          messageCount: true,
          imageCount: true,
          followerCount: true
        }
      }),

      // Get top 5 most popular models
      prisma.aIModel.findMany({
        where: {
          status: 'COMPLETED'
        },
        orderBy: {
          followerCount: 'desc'
        },
        take: 5,
        select: {
          id: true,
          name: true,
          followerCount: true,
          messageCount: true,
          imageCount: true,
          imageUrl: true,
          createdAt: true
        }
      }),

      // Get recent activity (last 24h)
      prisma.generation.groupBy({
        by: ['type'],
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        },
        _count: true
      }),

      // Get token usage stats
      prisma.user.aggregate({
        _sum: {
          tokens: true
        },
        _avg: {
          tokens: true
        }
      }),

      // Get user growth (users who joined in last 7 days)
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          },
          isAI: false
        }
      }),

      // Get daily stats for the last 7 days
      prisma.generation.groupBy({
        by: ['type', 'createdAt'],
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        },
        _count: true,
        orderBy: {
          createdAt: 'desc'
        }
      })
    ]);

    // Calculate totals
    const totalMessages = modelStats._sum.messageCount || 0;
    const totalImages = modelStats._sum.imageCount || 0;
    const totalFollowers = modelStats._sum.followerCount || 0;
    const totalInteractions = totalMessages + totalImages;
    const totalTokensUsed = tokenStats._sum.tokens || 0;
    const avgTokensPerUser = Math.round(tokenStats._avg.tokens || 0);

    // Calculate 24h activity
    const last24h = {
      messages: recentActivity.find(a => a.type === 'CHAT')?._count || 0,
      images: recentActivity.find(a => a.type === 'IMAGE')?._count || 0,
      characters: recentActivity.find(a => a.type === 'CHARACTER')?._count || 0,
      total: recentActivity.reduce((acc, curr) => acc + curr._count, 0)
    };

    // Process daily stats
    const dailyActivity = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dayStats = dailyStats.filter(s => 
        s.createdAt.toDateString() === date.toDateString()
      );
      
      return {
        date: date.toISOString().split('T')[0],
        messages: dayStats.find(s => s.type === 'CHAT')?._count || 0,
        images: dayStats.find(s => s.type === 'IMAGE')?._count || 0,
        characters: dayStats.find(s => s.type === 'CHARACTER')?._count || 0
      };
    });

    return NextResponse.json({
      totalModels,
      totalUsers,
      stats: {
        messages: totalMessages.toLocaleString(),
        images: totalImages.toLocaleString(),
        totalInteractions: totalInteractions.toLocaleString(),
        totalFollowers: totalFollowers.toLocaleString(),
        tokensUsed: totalTokensUsed.toLocaleString()
      },
      averages: {
        messagesPerUser: totalUsers > 0 ? Math.round(totalMessages / totalUsers) : 0,
        imagesPerUser: totalUsers > 0 ? Math.round(totalImages / totalUsers) : 0,
        followersPerModel: totalModels > 0 ? Math.round(totalFollowers / totalModels) : 0,
        tokensPerUser: avgTokensPerUser
      },
      growth: {
        newUsers7d: userGrowth,
        userGrowthRate: totalUsers > 0 ? Math.round((userGrowth / totalUsers) * 100) : 0
      },
      activity: {
        last24h,
        daily: dailyActivity
      },
      topModels: topModels.map(model => ({
        id: model.id,
        name: model.name,
        followers: model.followerCount,
        engagement: model.messageCount + model.imageCount,
        imageUrl: model.imageUrl,
        age: Math.round((Date.now() - new Date(model.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      })),
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching model stats:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch stats',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 