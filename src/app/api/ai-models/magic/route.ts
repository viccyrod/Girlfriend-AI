import { NextResponse } from 'next/server';
import prisma from '@/lib/clients/prisma';
import { getCurrentUser } from '@/lib/session';
import { v2 as cloudinary } from 'cloudinary';
import { RunPodClient } from '@/lib/clients/runpod';
import { generateAIModelDetails } from '@/lib/ai-client';
import { MAGIC_AI_PROMPT } from './prompts';
import { RunPodResponse } from '@/types/runpod';
import { uploadBase64Image } from '@/lib/cloudinary';

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

    // Generate image using RunPod
    const imagePrompt = `Create a photorealistic portrait of a beautiful woman with the following characteristics: ${customPrompt}. Professional photography, natural lighting, high resolution, ultra detailed, photorealistic, 8k, highly detailed skin texture and facial features, centered composition, looking at camera, head and shoulders portrait, instagram style photo, soft natural lighting, shallow depth of field, shot on Canon EOS R5, 85mm f/1.2 lens --ar 1:1 --v 5.2 --style raw`;

    console.log('Generating image with prompt:', imagePrompt);

    // Start image generation
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

    // Poll for completion
    let retries = 0;
    const maxRetries = 30;
    let imageUrl = '';
    
    while (retries < maxRetries) {
      const status = await RunPodClient.checkJobStatus(jobId);
      console.log('RunPod status:', status);
      
      if (status.status === 'COMPLETED' && status.output?.image) {
        imageUrl = status.output.image;
        break;
      }
      
      if (status.status === 'FAILED') {
        throw new Error(`Image generation failed: ${status.statusDetail?.error ?? 'Unknown error'}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      retries++;
    }

    if (!imageUrl) {
      console.error('No image output from RunPod after', maxRetries, 'retries');
      throw new Error('Image generation failed or timed out');
    }

    console.log('Generated image URL:', imageUrl);

    // Generate AI response with timeout handling
    const aiResponse = (await Promise.race([
      generateAIModelDetails(customPrompt || MAGIC_AI_PROMPT),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`AI response timed out after ${AI_TIMEOUT/1000} seconds`)), AI_TIMEOUT)
      )
    ])) as AIResponse;

    // First try to parse as JSON
    const cleanJson = aiResponse.content
      .replace(/```json\n?|\n?```/g, '')
      .replace(/^Here is a?n? .*?:\n?/i, '')
      .trim();

    console.log('Cleaned AI response:', cleanJson);

    let aiModelDetails;
    try {
      aiModelDetails = JSON.parse(cleanJson);
    } catch (error) {
      console.error('Error parsing AI response:', error);
      console.error('Raw AI response:', aiResponse.content);
      
      // If JSON parsing fails, try to extract information from the text
      const text = aiResponse.content;
      
      // Extract name (usually at the start or after "name is" or "called")
      const nameMatch = text.match(/(?:name is|called)\s+([A-Za-z\s]+?)[\.,\n]/) || 
                       text.match(/^([A-Za-z\s]+?)(?:\sis|\swould be)/) ||
                       text.match(/created\s+([A-Za-z\s]+?)[\.,\n]/);
      
      // Extract personality traits
      const personalityMatch = text.match(/personality[:\s]+([^\.]+)\./) ||
                             text.match(/character[:\s]+([^\.]+)\./);
      
      // Extract appearance details
      const appearanceMatch = text.match(/appearance[:\s]+([^\.]+)\./) ||
                            text.match(/looks[:\s]+([^\.]+)\./) ||
                            text.match(/appears[:\s]+([^\.]+)\./);
      
      // Extract backstory
      const backstoryMatch = text.match(/backstory[:\s]+([^\.]+)\./) ||
                           text.match(/background[:\s]+([^\.]+)\./);
      
      // Extract hobbies
      const hobbiesMatch = text.match(/hobbies[:\s]+([^\.]+)\./) ||
                          text.match(/enjoys[:\s]+([^\.]+)\./);
      
      // Extract likes
      const likesMatch = text.match(/likes[:\s]+([^\.]+)\./) ||
                        text.match(/loves[:\s]+([^\.]+)\./);
      
      // Extract dislikes
      const dislikesMatch = text.match(/dislikes[:\s]+([^\.]+)\./) ||
                           text.match(/hates[:\s]+([^\.]+)\./);

      aiModelDetails = {
        name: nameMatch?.[1]?.trim() || "AI Companion",
        personality: personalityMatch?.[1]?.trim() || customPrompt,
        appearance: appearanceMatch?.[1]?.trim() || customPrompt,
        backstory: backstoryMatch?.[1]?.trim() || "A fascinating individual with a unique perspective on life.",
        hobbies: hobbiesMatch?.[1]?.trim() || "Various interesting activities",
        likes: likesMatch?.[1]?.trim() || "Meeting new people and having meaningful conversations",
        dislikes: dislikesMatch?.[1]?.trim() || "Negativity and insincerity"
      };
    }

    // Flatten the nested structure
    const flattenedDetails = {
      name: aiModelDetails.name,
      personality: typeof aiModelDetails.personality === 'object' 
        ? Object.values(aiModelDetails.personality).flat().join(', ')
        : aiModelDetails.personality,
      appearance: typeof aiModelDetails.appearance === 'object'
        ? Object.values(aiModelDetails.appearance).join(', ')
        : aiModelDetails.appearance,
      backstory: aiModelDetails.backstory || 'A mysterious and intriguing individual with a story yet to be fully revealed.',
      hobbies: Array.isArray(aiModelDetails.hobbies) 
        ? aiModelDetails.hobbies.join(', ')
        : aiModelDetails.hobbies || aiModelDetails.likes || 'Various interesting activities',
      likes: Array.isArray(aiModelDetails.personality?.likes) 
        ? aiModelDetails.personality.likes.join(', ')
        : aiModelDetails.likes || 'Adventure, spontaneity, and genuine connections',
      dislikes: Array.isArray(aiModelDetails.personality?.dislikes)
        ? aiModelDetails.personality.dislikes.join(', ')
        : aiModelDetails.dislikes || 'Dishonesty and negativity'
    };

    // First upload the image to Cloudinary
    const cloudinaryImageUrl = await uploadBase64Image(imageUrl);

    const aiModel = await prisma.aIModel.create({
      data: {
        name: flattenedDetails.name,
        personality: flattenedDetails.personality,
        appearance: flattenedDetails.appearance,
        backstory: flattenedDetails.backstory,
        hobbies: flattenedDetails.hobbies,
        likes: flattenedDetails.likes,
        dislikes: flattenedDetails.dislikes,
        userId: currentUser.id,
        imageUrl: cloudinaryImageUrl,
        isPrivate: false,
        isAnime: false,
        isHumanX: false,
        images: {
          create: {
            imageUrl: cloudinaryImageUrl,
            isNSFW: false
          }
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
