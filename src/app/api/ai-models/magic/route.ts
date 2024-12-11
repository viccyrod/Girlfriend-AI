import { NextResponse } from 'next/server';
import prisma from '@/lib/clients/prisma';
import { getDbUser } from '@/lib/actions/server/auth';
import { v2 as cloudinary } from 'cloudinary';
import { RunPodClient } from '@/lib/clients/runpod';
import { generateAIModelDetails } from '@/lib/ai-client';
import type { AIResponse } from '@/lib/ai-client';
import { MAGIC_AI_PROMPT } from './prompts';
import { uploadBase64Image } from '@/lib/cloudinary';
import { z } from 'zod';
import { checkTokenBalance, deductTokens } from '@/lib/tokens';
import { GenerationType } from '@prisma/client';
import { TOKEN_COSTS } from '@/lib/constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Request validation schema
const RequestSchema = z.object({
  customPrompt: z.string().min(1, "Custom prompt is required").max(1000),
  isPrivate: z.boolean().optional(),
  useQueue: z.boolean().optional(),
});

// Reduced timeout to 90 seconds for faster feedback
const AI_TIMEOUT = 90000;

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

// Add timeout utility
const timeout = (ms: number): Promise<null> => 
  new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms));

// Add prompt enhancement function with timeout
async function enhanceImagePrompt(basePrompt: string): Promise<string> {
  try {
    const PROMPT_TIMEOUT = 5000;

    const grokPrompt = `Enhance this description for a photorealistic portrait: "${basePrompt}". Focus on physical features and styling. Be concise.`;

    const enhancedPrompt = await Promise.race([
      generateAIModelDetails(grokPrompt) as Promise<AIResponse>,
      timeout(PROMPT_TIMEOUT)
    ]).catch(() => null);

    if (!enhancedPrompt || !enhancedPrompt.content) {
      console.log('Prompt enhancement timed out, using original prompt');
      return basePrompt;
    }

    const parsed = JSON.parse(enhancedPrompt.content);
    return parsed.appearance || basePrompt;
  } catch (error) {
    console.error('Error enhancing prompt:', error);
    return basePrompt;
  }
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

    const { customPrompt, isPrivate = false, useQueue = true } = result.data;

    const currentUser = await getDbUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check token balance first
    const hasTokens = await checkTokenBalance(currentUser.id, GenerationType.CHARACTER);
    if (!hasTokens) {
      return NextResponse.json({ 
        error: 'Insufficient tokens',
        action: 'PURCHASE_TOKENS',
        redirect: '/settings/billing',
        title: '✨ Create Your Perfect AI Companion',
        message: `Creating a unique AI companion requires ${TOKEN_COSTS.CHARACTER} tokens`,
        details: {
          required: TOKEN_COSTS.CHARACTER,
          actionLabel: 'Get Tokens',
          description: 'Get tokens now to bring your dream companion to life! Your customization will be saved.',
          benefits: [
            'Fully customized personality',
            'Unique appearance & backstory',
            'Professional profile photo',
            'Private or public profile options',
            'Unlimited chat messages'
          ],
          packages: [
            {
              tokens: 1000,
              price: '$5',
              description: 'Perfect for getting started'
            },
            {
              tokens: 5000,
              price: '$20',
              description: 'Most popular choice',
              featured: true
            }
          ]
        }
      }, { status: 402 });
    }

    // If using queue system (default), redirect to queue endpoint
    if (useQueue) {
      const queueUrl = new URL(request.url);
      queueUrl.pathname = '/api/ai-models/queue';
      
      const queueResponse = await fetch(queueUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          // Forward the original request's cookies for auth
          cookie: request.headers.get('cookie') || ''
        },
        body: JSON.stringify({ customPrompt, isPrivate })
      });

      if (!queueResponse.ok) {
        const errorText = await queueResponse.text();
        console.error('Queue error:', errorText);
        throw new Error(`Queue error: ${errorText}`);
      }

      const queueData = await queueResponse.json();
      return NextResponse.json(queueData);
    }

    // Legacy direct processing path
    try {
      // Deduct tokens before processing
      const deducted = await deductTokens(currentUser.id, GenerationType.CHARACTER, customPrompt);
      if (!deducted) {
        return NextResponse.json({ error: 'Failed to deduct tokens' }, { status: 402 });
      }

      const aiResponse = await Promise.race([
        generateAIModelDetails(MAGIC_AI_PROMPT.replace(/\{\{CUSTOM_PROMPT\}\}/g, customPrompt)) as Promise<AIResponse>,
        timeout(AI_TIMEOUT)
      ]);

      if (!aiResponse || !aiResponse.content) {
        throw new Error('AI model generation timed out');
      }

      const modelDetails = JSON.parse(aiResponse.content);
      const enhancedPrompt = await enhanceImagePrompt(modelDetails.appearance);

      // Start image generation
      const runpodJobId = await RunPodClient.startImageGeneration(
        enhancedPrompt,
        IMAGE_GEN_CONFIG
      );

      // Poll for completion
      let retries = 0;
      const maxRetries = 20;
      const pollInterval = 3000;

      while (retries < maxRetries) {
        const status = await RunPodClient.checkJobStatus(runpodJobId);
        
        if (status.status === 'COMPLETED' && status.output?.image) {
          const imageUrl = await uploadBase64Image(status.output.image);

          const aiModel = await prisma.aIModel.create({
            data: {
              name: modelDetails.name || "AI Model",
              personality: modelDetails.personality || "",
              appearance: modelDetails.appearance || "",
              backstory: modelDetails.backstory || "",
              hobbies: modelDetails.hobbies || "",
              likes: modelDetails.likes || "",
              dislikes: modelDetails.dislikes || "",
              userId: currentUser.id,
              imageUrl,
              isPrivate,
              isAnime: false,
              isHumanX: false,
              status: 'COMPLETED'
            }
          });

          // Save the profile image to the Image table
          await prisma.image.create({
            data: {
              imageUrl,
              aiModelId: aiModel.id,
              isNSFW: false
            }
          });

          // Update image count
          await prisma.aIModel.update({
            where: { id: aiModel.id },
            data: {
              imageCount: {
                increment: 1
              }
            }
          });

          return NextResponse.json(aiModel);
        }

        if (status.status === 'FAILED') {
          throw new Error('Image generation failed');
        }

        await new Promise(resolve => setTimeout(resolve, pollInterval));
        retries++;
      }

      throw new Error('Image generation timed out');

    } catch (error) {
      console.error('Error in direct processing:', error);
      throw error;
    }

  } catch (error) {
    console.error('Error generating AI model:', error);
    return NextResponse.json({ 
      error: 'Failed to generate AI model',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
