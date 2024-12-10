import { NextResponse } from 'next/server';
import prisma from '@/lib/clients/prisma';
import { getDbUser } from '@/lib/actions/server/auth';
import { v2 as cloudinary } from 'cloudinary';
import { RunPodClient } from '@/lib/clients/runpod';
import { generateAIModelDetails } from '@/lib/ai-client';
import type { AIResponse } from '@/lib/ai-client';
import { MAGIC_AI_PROMPT } from './prompts';
import { RunPodResponse } from '@/types/runpod';
import { uploadBase64Image } from '@/lib/cloudinary';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Maximum allowed for hobby plan

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
});

// Reduced timeout to 90 seconds for faster feedback
const AI_TIMEOUT = 90000;

// Optimized image generation parameters
const IMAGE_GEN_CONFIG = {
  num_inference_steps: 25,
  guidance_scale: 7.5,
  width: 512,
  height: 512,
  sampler_name: "DPM++ 2M Karras",
};

// Add timeout utility
const timeout = (ms: number) => new Promise((_, reject) => 
  setTimeout(() => reject(new Error('Timeout')), ms)
);

// Add prompt enhancement function with timeout
async function enhanceImagePrompt(basePrompt: string): Promise<string> {
  try {
    const PROMPT_TIMEOUT = 5000; // 5 seconds timeout

    const grokPrompt = `Enhance this description for a photorealistic portrait: "${basePrompt}". Focus on physical features and styling. Be concise.`;

    // Race between prompt enhancement and timeout
    const enhancedPrompt = await Promise.race<AIResponse | null>([
      generateAIModelDetails(grokPrompt) as Promise<AIResponse>,
      timeout(PROMPT_TIMEOUT) as Promise<null>
    ]).catch(() => null);

    if (!enhancedPrompt) {
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

    const { customPrompt, isPrivate = false } = result.data;

    const currentUser = await getDbUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🚀 Starting optimized AI model generation');

    // Create pending model and enhance prompt in parallel
    const [pendingModel, enhancedPrompt] = await Promise.all([
      prisma.aIModel.create({
        data: {
          name: "AI Model (Generating...)",
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
      }),
      enhanceImagePrompt(customPrompt)
    ]);

    const imagePrompt = `Create a photorealistic portrait of a beautiful woman with the following characteristics: ${enhancedPrompt}. Professional photography, natural lighting, high resolution, ultra detailed, photorealistic, 8k, highly detailed skin texture and facial features, centered composition, looking at camera, head and shoulders portrait, instagram style photo, soft natural lighting, shallow depth of field, shot on Canon EOS R5, 85mm f/1.2 lens --ar 1:1 --v 5.2 --style raw`;

    // Start both processes in parallel
    const [imageJobId, aiDetailsPromise] = await Promise.all([
      RunPodClient.startImageGeneration(JSON.stringify({
        prompt: imagePrompt,
        negative_prompt: "cartoon, anime, illustration, painting, drawing, artwork, 3d, render, cgi, watermark, signature, label, text, deformed, unrealistic, distorted, disfigured, bad anatomy, ugly, duplicate, extra limbs, missing limbs",
        ...IMAGE_GEN_CONFIG,
        seed: Math.floor(Math.random() * 999999999)
      })),
      generateAIModelDetails(customPrompt || MAGIC_AI_PROMPT)
    ]);

    // 3. Process AI details while waiting for image
    let aiModelDetails;
    try {
      const aiResponse = await aiDetailsPromise;
      const cleanJson = aiResponse.content
        .replace(/```json\n?|\n?```/g, '')
        .replace(/^Here is a?n? .*?:\n?/i, '')
        .trim();

      try {
        aiModelDetails = JSON.parse(cleanJson);
      } catch (error) {
        aiModelDetails = extractModelDetailsFromText(aiResponse.content, customPrompt);
      }

      // Update model with AI details immediately, don't wait for image
      await prisma.aIModel.update({
        where: { id: pendingModel.id },
        data: {
          name: aiModelDetails.name,
          personality: aiModelDetails.personality,
          appearance: aiModelDetails.appearance,
          backstory: aiModelDetails.backstory,
          hobbies: aiModelDetails.hobbies,
          likes: aiModelDetails.likes,
          dislikes: aiModelDetails.dislikes,
        }
      });
    } catch (error) {
      console.error('Error processing AI details:', error);
      // Continue with image processing even if AI details fail
    }

    // 4. Start image polling process
    let retries = 0;
    const maxRetries = 20;
    const pollInterval = 3000;

    const checkImage = async () => {
      if (retries >= maxRetries) {
        await prisma.aIModel.update({
          where: { id: pendingModel.id },
          data: { status: 'FAILED' }
        });
        return;
      }

      try {
        const status = await RunPodClient.checkJobStatus(imageJobId);
        console.log(`🖼️ Image status (attempt ${retries + 1}):`, status.status);

        if (status.status === 'COMPLETED' && status.output?.image) {
          // Upload to Cloudinary with optimized parameters
          const cloudinaryImageUrl = await uploadBase64Image(
            status.output.image,
            {
              quality: 'auto:good',
              fetch_format: 'auto',
              flags: 'progressive'
            }
          );

          await prisma.aIModel.update({
            where: { id: pendingModel.id },
            data: {
              imageUrl: cloudinaryImageUrl,
              status: 'COMPLETED',
              images: {
                create: {
                  imageUrl: cloudinaryImageUrl,
                  isNSFW: false
                }
              }
            }
          });
          return;
        } 
        
        if (status.status === 'FAILED') {
          await prisma.aIModel.update({
            where: { id: pendingModel.id },
            data: { status: 'FAILED' }
          });
          return;
        }

        retries++;
        setTimeout(checkImage, pollInterval);
      } catch (error) {
        console.error('Error in image check:', error);
        retries++;
        setTimeout(checkImage, pollInterval);
      }
    };

    // Start the image polling process
    checkImage();

    // 5. Return immediately with the model ID
    return NextResponse.json({ 
      id: pendingModel.id,
      message: 'AI model creation started'
    });

  } catch (error) {
    console.error('Error in AI model creation:', error);
    return NextResponse.json({ 
      error: 'Failed to create AI model',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function extractModelDetailsFromText(text: string, customPrompt: string) {
  const nameMatch = text.match(/(?:name is|called)\s+([A-Za-z\s]+?)[\.,\n]/) || 
                   text.match(/^([A-Za-z\s]+?)(?:\sis|\swould be)/) ||
                   text.match(/created\s+([A-Za-z\s]+?)[\.,\n]/);
  
  const personalityMatch = text.match(/personality[:\s]+([^\.]+)\./) ||
                         text.match(/character[:\s]+([^\.]+)\./);
  
  const appearanceMatch = text.match(/appearance[:\s]+([^\.]+)\./) ||
                        text.match(/looks[:\s]+([^\.]+)\./) ||
                        text.match(/appears[:\s]+([^\.]+)\./);
  
  const backstoryMatch = text.match(/backstory[:\s]+([^\.]+)\./) ||
                       text.match(/background[:\s]+([^\.]+)\./);
  
  const hobbiesMatch = text.match(/hobbies[:\s]+([^\.]+)\./) ||
                      text.match(/enjoys[:\s]+([^\.]+)\./);
  
  const likesMatch = text.match(/likes[:\s]+([^\.]+)\./) ||
                    text.match(/loves[:\s]+([^\.]+)\./);
  
  const dislikesMatch = text.match(/dislikes[:\s]+([^\.]+)\./) ||
                       text.match(/hates[:\s]+([^\.]+)\./);

  return {
    name: nameMatch?.[1]?.trim() || "AI Companion",
    personality: personalityMatch?.[1]?.trim() || customPrompt,
    appearance: appearanceMatch?.[1]?.trim() || customPrompt,
    backstory: backstoryMatch?.[1]?.trim() || "A fascinating individual with a unique perspective on life.",
    hobbies: hobbiesMatch?.[1]?.trim() || "Various interesting activities",
    likes: likesMatch?.[1]?.trim() || "Meeting new people and having meaningful conversations",
    dislikes: dislikesMatch?.[1]?.trim() || "Negativity and insincerity"
  };
}
