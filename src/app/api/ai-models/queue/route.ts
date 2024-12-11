import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import prisma from '@/lib/clients/prisma';
import { getDbUser } from '@/lib/actions/server/auth';
import { z } from 'zod';
import { checkTokenBalance, deductTokens } from '@/lib/tokens';
import { GenerationType } from '@prisma/client';
import { TOKEN_COSTS } from '@/lib/constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Initialize Redis with connection pooling
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
});

// Cache TTL in seconds
const CACHE_TTL = 60;

// Request validation schema
const RequestSchema = z.object({
  customPrompt: z.string().min(1, "Custom prompt is required").max(1000),
  isPrivate: z.boolean().optional(),
});

// Helper function to get cached job status
async function getCachedJobStatus(jobId: string) {
  const cacheKey = `job_status:${jobId}`;
  const cachedStatus = await redis.get(cacheKey);
  if (cachedStatus) {
    return JSON.parse(cachedStatus as string);
  }
  return null;
}

// Helper function to set cached job status
async function setCachedJobStatus(jobId: string, status: any) {
  const cacheKey = `job_status:${jobId}`;
  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(status));
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const result = RequestSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ 
        error: 'Invalid request format',
        details: result.error.issues 
      }, { status: 400 });
    }

    const { customPrompt, isPrivate = false } = result.data;

    // Get user and check tokens in parallel
    const [currentUser, hasTokens] = await Promise.all([
      getDbUser(),
      getDbUser().then(user => 
        user ? checkTokenBalance(user.id, GenerationType.CHARACTER) : false
      )
    ]);

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasTokens) {
      return NextResponse.json({ 
        error: 'Insufficient tokens',
        action: 'PURCHASE_TOKENS',
        redirect: '/settings/billing',
        title: '✨ Unlock Character Creation',
        message: 'Creating a new AI companion requires 500 tokens',
        details: {
          required: TOKEN_COSTS.CHARACTER,
          actionLabel: 'Get Tokens',
          description: 'Get tokens now to create your perfect AI companion! Your progress will be saved.',
          benefits: [
            'Create unique AI companions',
            'Customize their personality',
            'Generate profile pictures',
            'Chat unlimited with your creation'
          ]
        }
      }, { status: 402 });
    }

    // Deduct tokens before queueing
    const deducted = await deductTokens(currentUser.id, GenerationType.CHARACTER, customPrompt);
    if (!deducted) {
      return NextResponse.json({ 
        error: 'Failed to deduct tokens',
        details: 'Token deduction failed. Please try again or contact support if the issue persists.'
      }, { status: 402 });
    }

    // Create pending model with optimized fields
    const pendingModel = await prisma.aIModel.create({
      data: {
        name: "AI Model (Queued...)",
        personality: customPrompt,
        userId: currentUser.id,
        isPrivate,
        status: 'PENDING',
        appearance: "",
        backstory: "",
        hobbies: "",
        likes: "",
        dislikes: "",
        imageUrl: "",
        isAnime: false,
        isHumanX: false,
        messageCount: 0,
        imageCount: 0,
        followerCount: 0
      },
      select: {
        id: true,
        status: true
      }
    }).catch(error => {
      console.error('Failed to create AIModel:', error);
      throw new Error('Failed to create AI model');
    });

    // Add job to queue with batched Redis operations
    const jobId = `model_gen_${pendingModel.id}`;
    const jobData = {
      modelId: pendingModel.id,
      userId: currentUser.id,
      customPrompt,
      isPrivate,
      status: 'QUEUED',
      createdAt: new Date().toISOString()
    };

    await Promise.all([
      redis.hset(jobId, jobData),
      redis.lpush('model_gen_queue', jobId),
      setCachedJobStatus(jobId, jobData)
    ]);

    return NextResponse.json({ 
      id: pendingModel.id,
      jobId,
      message: 'AI model creation queued'
    });

  } catch (error) {
    console.error('Error queueing AI model creation:', error);
    return NextResponse.json({ 
      error: 'Failed to queue AI model creation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
  }

  // Try to get status from cache first
  const cachedStatus = await getCachedJobStatus(jobId);
  if (cachedStatus) {
    return NextResponse.json(cachedStatus);
  }

  // If not in cache, get from Redis and cache it
  const job = await redis.hgetall(jobId);
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  await setCachedJobStatus(jobId, job);
  return NextResponse.json(job);
} 