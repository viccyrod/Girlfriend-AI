import { NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { getCurrentUser } from '@/lib/session';
import OpenAI from 'openai';
import { v2 as cloudinary } from 'cloudinary';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Ensure Cloudinary is configured
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET() {
  try {
    const publicModels = await prisma.aIModel.findMany({
      where: {
        isPrivate: false
      },
      select: {
        id: true,
        name: true,
        personality: true,
        imageUrl: true,
        followerCount: true,
        createdBy: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        followerCount: 'desc'
      },
      take: 50 // Limit to top 50 models
    });

    return NextResponse.json(publicModels);
  } catch (error) {
    console.error('Error fetching public AI models:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, personality, appearance, backstory, hobbies, likes, dislikes } = await request.json();

    // Generate image using DALL-E
    const imagePrompt = `Ultra realistic portrait of ${appearance}. Photorealistic, highly detailed, 8k resolution.`;
    const imageResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: imagePrompt,
      n: 1,
      size: "1024x1024",
    });

    const generatedImageUrl = imageResponse.data[0].url;

    if (!generatedImageUrl) {
      throw new Error('Failed to generate image');
    }

    // Upload the generated image to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(generatedImageUrl, {
      folder: 'ai-models',
      resource_type: 'image',
      public_id: `${name}-${Date.now()}`,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const cloudinaryImageUrl = uploadResponse.secure_url;

    const newAIModel = await prisma.aIModel.create({
      data: {
        name,
        personality,
        appearance,
        backstory,
        hobbies,
        likes,
        dislikes,
        imageUrl: cloudinaryImageUrl,
        userId: currentUser.id,
      },
    });

    return NextResponse.json(newAIModel, { status: 201 });
  } catch (error) {
    console.error('Error creating AI model:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
