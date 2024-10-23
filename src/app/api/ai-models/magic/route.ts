import { NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { getCurrentUser } from '@/lib/session';
import OpenAI from 'openai';
import { v2 as cloudinary } from 'cloudinary';
// import { TransformStream } from 'stream/web';
// import { ReadableStream } from 'stream/web';

// Add this after the imports
const requiredEnvVars = [
  'OPENAI_API_KEY',
  'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
];

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`Missing required environment variable: ${varName}`);
  }
});

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
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const writeToStream = (message: string) => {
        controller.enqueue(encoder.encode(JSON.stringify({ message }) + '\n'));
      };

      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          writeToStream('Unauthorized');
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { description } = await request.json();
        if (!description) {
          writeToStream('Description is required');
          return NextResponse.json({ error: 'Description is required' }, { status: 400 });
        }

        writeToStream('Starting AI model creation process');
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
          writeToStream(`AI Model Details: ${JSON.stringify(aiModelDetails)}`);
        } catch (error) {
          console.error('Error generating AI model details:', error);
          writeToStream('Error generating AI model details');
          return NextResponse.json({ error: 'Failed to generate AI model details. Please try again.' }, { status: 500 });
        }

        writeToStream('Generating image...');
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
          writeToStream(`Cloudinary Image URL: ${cloudinaryImageUrl}`);
        } catch (error) {
          console.error('Error generating or uploading image:', error);
          // If image generation or upload fails, we'll continue without an image
        }

        writeToStream('Creating AI model in database...');
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

        writeToStream(`New AI Model created: ${JSON.stringify(newAIModel)}`);
      } catch (error) {
        console.error('Error in AI model creation:', error);
        writeToStream('An unexpected error occurred');
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
