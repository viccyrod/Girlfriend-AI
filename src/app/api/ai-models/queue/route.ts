import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import prisma from '@/lib/clients/prisma';
import { getDbUser } from '@/lib/actions/server/auth';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Initialize Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Request validation schema
const RequestSchema = z.object({
  customPrompt: z.string().min(1, "Custom prompt is required").max(1000),
  isPrivate: z.boolean().optional(),
});

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

    const currentUser = await getDbUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create pending model
    const pendingModel = await prisma.aIModel.create({
      data: {
        name: "AI Model (Queued...)",
        personality: customPrompt || "Generating personality...",
        appearance: "",
        backstory: "",
        hobbies: "",
        likes: "",
        dislikes: "",
        userId: currentUser.id,
        imageUrl: "",
        isPrivate,
        isAnime: false,
        isHumanX: false,
        status: 'PENDING'
      }
    });

    // Add job to queue
    const jobId = `model_gen_${pendingModel.id}`;
    await redis.hset(jobId, {
      modelId: pendingModel.id,
      userId: currentUser.id,
      customPrompt,
      isPrivate,
      status: 'QUEUED',
      createdAt: new Date().toISOString()
    });

    // Add to processing queue
    await redis.lpush('model_gen_queue', jobId);

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

// Status endpoint
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
  }

  const job = await redis.hgetall(jobId);
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  return NextResponse.json(job);
} 