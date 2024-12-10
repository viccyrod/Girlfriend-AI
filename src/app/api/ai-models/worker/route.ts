import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import prisma from '@/lib/clients/prisma';
import { v2 as cloudinary } from 'cloudinary';
import { generateAIModelDetails } from '@/lib/ai-client';
import { MAGIC_AI_PROMPT } from '../magic/prompts';
import { uploadBase64Image } from '@/lib/cloudinary';
import { RunPodClient } from '@/lib/clients/runpod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Initialize Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Optimized image generation parameters
const IMAGE_GEN_CONFIG = {
  negative_prompt: "blurry, bad quality, distorted, deformed, disfigured, bad anatomy, watermark",
  num_inference_steps: 25,
  guidance_scale: 7.5,
  width: 512,
  height: 512,
  scheduler: "DPM++ 2M Karras",
  num_images: 1
};

type QueueJob = Record<string, string> & {
  modelId: string;
  userId: string;
  customPrompt: string;
  isPrivate: string;
  status: string;
  createdAt: string;
};

async function processJob(jobId: string) {
  console.log(`Processing job ${jobId}...`);
  
  const job = await redis.hgetall(jobId) as QueueJob | null;
  if (!job) {
    console.error(`Job ${jobId} not found`);
    return;
  }

  try {
    // Update status to processing
    await redis.hset(jobId, { status: 'PROCESSING' });

    // Generate AI model details
    const aiResponse = await generateAIModelDetails(
      MAGIC_AI_PROMPT.replace(/\{\{CUSTOM_PROMPT\}\}/g, job.customPrompt)
    );
    
    if (!aiResponse || !aiResponse.content) throw new Error('Failed to generate AI model details');
    
    // Clean and parse JSON response
    let cleanContent = aiResponse.content
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
      .replace(/```json\s*|\s*```/g, '') // Remove code blocks
      .trim();

    // Try to extract JSON object if it's wrapped in other text
    const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanContent = jsonMatch[0];
    }

    let modelDetails;
    try {
      modelDetails = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', {
        original: aiResponse.content,
        cleaned: cleanContent,
        error: parseError
      });
      
      // Attempt recovery by creating a basic model
      modelDetails = {
        name: "AI Model",
        personality: job.customPrompt,
        appearance: "A beautiful and friendly person",
        backstory: "",
        hobbies: "",
        likes: "",
        dislikes: ""
      };
      console.log('Using fallback model details:', modelDetails);
    }

    if (!modelDetails || typeof modelDetails !== 'object') {
      throw new Error('Invalid AI model details structure');
    }

    // Initialize RunPod client
    const runpodJobId = await RunPodClient.startImageGeneration(
      modelDetails.appearance,
      IMAGE_GEN_CONFIG
    );

    // Poll for completion
    let retries = 0;
    const maxRetries = 20;
    const pollInterval = 3000;

    while (retries < maxRetries) {
      const status = await RunPodClient.checkJobStatus(runpodJobId);
      
      if (status.status === 'COMPLETED' && status.output?.image) {
        // Upload image to Cloudinary
        const imageUrl = await uploadBase64Image(status.output.image);

        // Update AI model in database
        await prisma.aIModel.update({
          where: { id: job.modelId },
          data: {
            name: modelDetails.name || "AI Model",
            personality: modelDetails.personality || "",
            appearance: modelDetails.appearance || "",
            backstory: modelDetails.backstory || "",
            hobbies: modelDetails.hobbies || "",
            likes: modelDetails.likes || "",
            dislikes: modelDetails.dislikes || "",
            imageUrl,
            status: 'COMPLETED'
          }
        });

        // Update job status and clean up
        await redis.hset(jobId, { 
          status: 'COMPLETED',
          completedAt: new Date().toISOString()
        });
        await redis.del(jobId);
        return;
      }

      if (status.status === 'FAILED') {
        throw new Error('Image generation failed');
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
      retries++;
    }

    throw new Error('Image generation timed out');

  } catch (error) {
    console.error(`Error processing job ${jobId}:`, error);
    
    // Update job and model status on failure
    await redis.hset(jobId, { 
      status: 'FAILED',
      error: error instanceof Error ? error.message : 'Unknown error',
      failedAt: new Date().toISOString()
    });

    await prisma.aIModel.update({
      where: { id: job.modelId },
      data: { status: 'FAILED' }
    });
  }
}

// Worker endpoint that processes one job at a time
export async function POST() {
  try {
    // Get next job from queue
    const jobId = await redis.rpop('model_gen_queue');
    if (!jobId) {
      return NextResponse.json({ message: 'No jobs to process' });
    }

    // Process the job
    await processJob(jobId);

    return NextResponse.json({ 
      message: 'Job processed successfully',
      jobId 
    });

  } catch (error) {
    console.error('Worker error:', error);
    return NextResponse.json({ 
      error: 'Worker failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 