import { NextResponse } from 'next/server';
import prisma from '@/lib/clients/prisma';
import { getCurrentUser } from '@/lib/session';
import { v2 as cloudinary } from 'cloudinary';
import { RunPodClient } from '@/lib/clients/runpod';
import { generateAIModelDetails } from '@/lib/ai-client';
import { MAGIC_AI_PROMPT } from './prompts';

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

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting AI model generation with prompt:', customPrompt);

    // Generate AI response with timeout handling
    const aiResponse = (await Promise.race([
      generateAIModelDetails(customPrompt || MAGIC_AI_PROMPT),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`AI response timed out after ${AI_TIMEOUT/1000} seconds`)), AI_TIMEOUT)
      )
    ])) as AIResponse;

    // Parse AI response
    const cleanJson = aiResponse.content.replace(/```json\n|\n```/g, '').trim();
    let aiModelDetails;
    try {
      aiModelDetails = JSON.parse(cleanJson);
    } catch (error) {
      console.error('Error parsing AI response:', error);
      throw new Error('Invalid AI response format');
    }

    // Generate image with timeout handling
    console.log('Generating image...');
    let cloudinaryImageUrl = '';
    try {
      const imagePrompt = `Stunning portrait of ${aiModelDetails.appearance}. Ultra realistic, photogenic, beautiful lighting, high fashion photography style, 8k resolution.`;
      
      // Start image generation
      const jobId = await RunPodClient.startImageGeneration(imagePrompt);
      
      // Poll for completion
      let retries = 0;
      const maxRetries = 30;
      let base64Image = '';
      
      while (retries < maxRetries) {
        const status = await RunPodClient.checkJobStatus(jobId);
        
        if (status.status === 'COMPLETED' && status.output?.image) {
          // Upload to Cloudinary via API
          const uploadResponse = await fetch(new URL('/api/upload', request.url).toString(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              base64Image: status.output.image,
              folder: 'ai-models',
              publicId: `${aiModelDetails.name}-${Date.now()}`
            })
          });

          if (!uploadResponse.ok) {
            throw new Error('Failed to upload image');
          }

          const { url } = await uploadResponse.json();
          cloudinaryImageUrl = url;
          break;
        }
        
        if (status.status === 'FAILED') {
          throw new Error('Image generation failed');
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        retries++;
      }
      
      if (!cloudinaryImageUrl) {
        throw new Error('Image generation timed out');
      }
    } catch (error) {
      console.error('Error generating or uploading image:', error);
    }

    const aiModel = await prisma.aIModel.create({
      data: {
        name: aiModelDetails.name,
        personality: aiModelDetails.personality,
        appearance: aiModelDetails.appearance,
        backstory: aiModelDetails.backstory,
        hobbies: aiModelDetails.hobbies,
        likes: aiModelDetails.likes,
        dislikes: aiModelDetails.dislikes,
        imageUrl: cloudinaryImageUrl,
        userId: currentUser.id,
        isPrivate: false,
        isAnime: false,
        isHumanX: false,
        images: {
          create: [
            {
              imageUrl: cloudinaryImageUrl,
              isNSFW: false
            }
          ]
        }
      },
      include: {
        images: true
      }
    });

    return NextResponse.json(aiModel);
  } catch (error) {
    console.error('Error in magic AI creation:', error);
    return NextResponse.json({ 
      error: 'Failed to create magic AI model',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
