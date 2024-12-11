import { NextResponse } from 'next/server';
import prisma from '@/lib/clients/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 10;

export async function GET() {
  try {
    // Get total count of public models
    const totalModels = await prisma.aIModel.count({
      where: {
        isPrivate: false,
        status: 'COMPLETED'
      }
    });

    // Get total followers/users
    const totalUsers = await prisma.user.count({
      where: {
        isAI: false
      }
    });

    return NextResponse.json({
      totalModels,
      totalUsers,
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