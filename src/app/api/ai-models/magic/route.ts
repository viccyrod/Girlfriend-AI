import { NextResponse } from 'next/server';
import prisma from '@/lib/clients/prisma';
import { getDbUser } from '@/lib/actions/server/auth';
import { v2 as cloudinary } from 'cloudinary';
import { RunPodClient } from '@/lib/clients/runpod';
import { generateAIModelDetails } from '@/lib/ai-client';
import { MAGIC_AI_PROMPT } from './prompts';
import { RunPodResponse } from '@/types/runpod';
import { uploadBase64Image } from '@/lib/cloudinary';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface AIResponse {
  content: string;
}

// Increase timeout to 120 seconds (2 minutes)
const AI_TIMEOUT = 120000;

export async function POST(request: Request) {
  try {
    const { customPrompt } = await request.json().catch((error) => {
      console.error('Error parsing request body:', error);
      throw new Error('Invalid request format');
    });

    const currentUser = await getDbUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting AI model generation with prompt:', customPrompt);

    // 1. First, create a pending AI model in the database
    const pendingModel = await prisma.aIModel.create({
      data: {
        name: "AI Model (Generating...)",
        personality: customPrompt,
        appearance: "",
        backstory: "",
        hobbies: "",
        likes: "",
        dislikes: "",
        userId: currentUser.id,
        imageUrl: "", // Will be updated later
        isPrivate: false,
        isAnime: false,
        isHumanX: false,
        status: 'PENDING' // Add this status field to your schema
      }
    });

    // 2. Start the image generation asynchronously
    const imagePrompt = `Create a photorealistic portrait of a beautiful woman with the following characteristics: ${customPrompt}. Professional photography, natural lighting, high resolution, ultra detailed, photorealistic, 8k, highly detailed skin texture and facial features, centered composition, looking at camera, head and shoulders portrait, instagram style photo, soft natural lighting, shallow depth of field, shot on Canon EOS R5, 85mm f/1.2 lens --ar 1:1 --v 5.2 --style raw`;
    
    const jobId = await RunPodClient.startImageGeneration(JSON.stringify({
      prompt: imagePrompt,
      negative_prompt: "cartoon, anime, illustration, painting, drawing, artwork, 3d, render, cgi, watermark, signature, label, text, deformed, unrealistic, distorted, disfigured, bad anatomy, ugly, duplicate, extra limbs, missing limbs",
      num_inference_steps: 30,
      guidance_scale: 7.5,
      width: 768,
      height: 768,
      sampler_name: "DPM++ 2M Karras",
      seed: Math.floor(Math.random() * 999999999)
    }));

    // 3. Start the AI model details generation
    generateAIModelDetails(customPrompt || MAGIC_AI_PROMPT)
      .then(async (aiResponse: AIResponse) => {
        try {
          // Process AI response and update model details
          const cleanJson = aiResponse.content
            .replace(/```json\n?|\n?```/g, '')
            .replace(/^Here is a?n? .*?:\n?/i, '')
            .trim();

          let aiModelDetails;
          try {
            aiModelDetails = JSON.parse(cleanJson);
          } catch (error) {
            // Fallback to text extraction if JSON parsing fails
            const text = aiResponse.content;
            aiModelDetails = extractModelDetailsFromText(text, customPrompt);
          }

          // 4. Poll for image completion in a separate process
          let retries = 0;
          const maxRetries = 30;
          
          const checkImage = async () => {
            if (retries >= maxRetries) return;
            
            const status = await RunPodClient.checkJobStatus(jobId);
            console.log('RunPod status:', status);
            
            if (status.status === 'COMPLETED' && status.output?.image) {
              // Upload to Cloudinary and update the model
              const cloudinaryImageUrl = await uploadBase64Image(status.output.image);
              
              await prisma.aIModel.update({
                where: { id: pendingModel.id },
                data: {
                  imageUrl: cloudinaryImageUrl,
                  name: aiModelDetails.name,
                  personality: aiModelDetails.personality,
                  appearance: aiModelDetails.appearance,
                  backstory: aiModelDetails.backstory,
                  hobbies: aiModelDetails.hobbies,
                  likes: aiModelDetails.likes,
                  dislikes: aiModelDetails.dislikes,
                  status: 'COMPLETED',
                  images: {
                    create: {
                      imageUrl: cloudinaryImageUrl,
                      isNSFW: false
                    }
                  }
                }
              });
            } else if (status.status === 'FAILED') {
              await prisma.aIModel.update({
                where: { id: pendingModel.id },
                data: { status: 'FAILED' }
              });
            } else {
              retries++;
              setTimeout(checkImage, 2000);
            }
          };

          checkImage();
        } catch (error) {
          console.error('Error in background processing:', error);
          await prisma.aIModel.update({
            where: { id: pendingModel.id },
            data: { status: 'FAILED' }
          });
        }
      });

    // Return immediately with the pending model ID
    return NextResponse.json({ 
      id: pendingModel.id,
      message: 'AI Model creation started. Please check back in a few moments.' 
    });

  } catch (error) {
    console.error('Error in magic AI creation:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to create AI model' 
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
