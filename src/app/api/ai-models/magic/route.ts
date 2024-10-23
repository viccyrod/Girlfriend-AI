import { NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { getCurrentUser } from '@/lib/session';
import OpenAI from 'openai';
import { v2 as cloudinary } from 'cloudinary';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

console.log('Cloudinary config:', {
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY ? 'defined' : 'undefined',
  api_secret: process.env.CLOUDINARY_API_SECRET ? 'defined' : 'undefined',
});

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { description } = await request.json();
    if (!description) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }

    console.log('Generating AI model details...');
    let aiModelDetails;
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a virtual companion creator. Given a description, create a detailed model profile including name (FIRST only), personality, appearance, backstory, hobbies, likes, and dislikes. Format the response as a flat JSON object with string values for each field.',
          },
          {
            role: 'user',
            content: description,
          },
        ],
      });

      aiModelDetails = JSON.parse(completion.choices[0].message.content || '{}');
      console.log('AI Model Details:', aiModelDetails);
    } catch (error) {
      console.error('Error generating AI model details:', error);
      return NextResponse.json({ error: 'Failed to generate AI model details. Please try again.' }, { status: 500 });
    }

    console.log('Generating image...');
    let cloudinaryImageUrl = '';
    try {
      const imagePrompt = `Ultra realistic portrait of ${aiModelDetails.appearance}. Photorealistic, highly detailed, 8k resolution.`;
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
      });

      cloudinaryImageUrl = uploadResponse.secure_url;
      console.log('Cloudinary Image URL:', cloudinaryImageUrl);
    } catch (error) {
      console.error('Error generating or uploading image:', error);
      // If image generation or upload fails, we'll continue without an image
    }

    console.log('Creating AI model in database...');
    const newAIModel = await prisma.aIModel.create({
      data: {
        name: aiModelDetails.name || 'Unnamed Model',
        personality: aiModelDetails.personality || '',
        appearance: aiModelDetails.appearance || '',
        backstory: aiModelDetails.backstory || '',
        hobbies: aiModelDetails.hobbies || '',
        likes: aiModelDetails.likes || '',
        dislikes: aiModelDetails.dislikes || '',
        imageUrl: cloudinaryImageUrl,
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
