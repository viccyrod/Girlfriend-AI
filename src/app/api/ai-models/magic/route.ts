import { NextResponse } from 'next/server';
import prisma from '@/lib/clients/prisma';
import { getCurrentUser } from '@/lib/session';
import { v2 as cloudinary } from 'cloudinary';
import { RunPodClient } from '@/lib/clients/runpod';
import { generateAIResponse } from '@/lib/ai-client';
import { MAGIC_AI_PROMPT } from './prompts';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  try {
    // Get any parameters from the request body if needed
    const { customPrompt } = await request.json().catch(() => ({}));

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Generating AI model details with Grok...');
    // Use customPrompt if provided, otherwise use default MAGIC_AI_PROMPT
    const promptToUse = customPrompt || MAGIC_AI_PROMPT;
    const aiResponse = await generateAIResponse(
        promptToUse,      
        {
            id: 'magic-ai',
            name: 'flirty and creative character generator',
            createdAt: new Date(),
            updatedAt: new Date(),
            likes: '',
            appearance: '',
            personality: '',
            backstory: '',
            hobbies: '',
            dislikes: '',
            followerCount: 0,
            userId: currentUser.id,
            imageUrl: '',
            isPrivate: false,
            isHumanX: false
        },
        [],
        [],
        'creative'
    );

    // Clean and parse the response
    const cleanJson = aiResponse.content.replace(/```json\n|\n```/g, '').trim();
    const aiModelDetails = JSON.parse(cleanJson);

    console.log('Generating image...');
    let cloudinaryImageUrl = '';
    try {
      const imagePrompt = `Stunning portrait of ${aiModelDetails.appearance}. Ultra realistic, photogenic, beautiful lighting, high fashion photography style, 8k resolution.`;
      const base64Image = await RunPodClient.generateImage(imagePrompt);

      const uploadResponse = await cloudinary.uploader.upload(
        `data:image/png;base64,${base64Image}`,
        {
          folder: 'ai-models',
          resource_type: 'image',
          public_id: `${aiModelDetails.name}-${Date.now()}`,
        }
      );

      cloudinaryImageUrl = uploadResponse.secure_url;
      console.log('Cloudinary Image URL:', cloudinaryImageUrl);
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
    return NextResponse.json(
      { error: 'Failed to create magic AI model' },
      { status: 500 }
    );
  }
}
