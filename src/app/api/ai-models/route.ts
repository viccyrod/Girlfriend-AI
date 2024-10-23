import { NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { getCurrentUser } from '@/lib/session';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET() {
  try {
    const aIModels = await prisma.aIModel.findMany({
      select: {
        id: true,
        name: true,
        personality: true,
        imageUrl: true,
        followerCount: true,
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Ensure createdBy always has a name
    const sanitizedModels = aIModels.map(model => ({
      ...model,
      createdBy: {
        id: model.createdBy?.id || '',
        name: model.createdBy?.name || 'Unknown Creator'
      }
    }));

    return NextResponse.json(sanitizedModels);
  } catch (error) {
    console.error('Error fetching AI models:', error);
    return NextResponse.json({ error: 'Failed to fetch AI models' }, { status: 500 });
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

    const imageUrl = imageResponse.data[0].url;

    if (!imageUrl) {
      throw new Error('Failed to generate image');
    }

    const newAIModel = await prisma.aIModel.create({
      data: {
        name,
        personality,
        appearance,
        backstory,
        hobbies,
        likes,
        dislikes,
        imageUrl,
        userId: currentUser.id,
      },
    });

    console.log('New AI Model created:', newAIModel);

    return NextResponse.json(newAIModel, { status: 201 });
  } catch (error) {
    console.error('Error creating AI model:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
