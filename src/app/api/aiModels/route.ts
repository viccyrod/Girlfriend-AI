import { NextResponse } from 'next/server';
import prisma from '@/lib/clients/prisma';
import { getCurrentUser } from '@/lib/session';
import OpenAI from 'openai';
import { v2 as cloudinary } from 'cloudinary';

// Initialize the OpenAI client with the API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Ensure Cloudinary is configured with credentials from environment variables
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * This function handles the GET request to fetch public AI models.
 * It retrieves the models based on search parameters, allowing for filtering of anime models,
 * and returns up to 50 public models sorted by follower count.
 * 
 * @param {Request} request - The incoming request object.
 * @returns {NextResponse} - The response object containing the public AI models or an error message.
 */
export async function GET(request: Request) {
  try {
    // Extract search parameters from the request URL to determine if anime models are requested
    const { searchParams } = new URL(request.url);
    const isAnime = searchParams.get('isAnime');

    // Build the query conditions for fetching public models
    const where = {
      isPrivate: false, // Only fetch public models
      ...(isAnime !== null ? { isAnime: isAnime === 'true' } : {}) // Filter by anime if specified
    };

    // Query the database to find public AI models matching the conditions
    const publicModels = await prisma.aIModel.findMany({
      where,
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
        followerCount: 'desc' // Order the models by follower count in descending order
      },
      take: 50 // Limit the number of models returned to 50
    });

    // Return the public AI models in JSON format
    return NextResponse.json(publicModels);
  } catch (error) {
    console.error('Error fetching public AI models:', error);
    // Return a 500 response in case of an unexpected error
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * This function handles the POST request to create a new AI model.
 * It performs the following steps: authenticating the user, extracting model details from the request,
 * optionally generating an image using OpenAI's DALL-E model, uploading the image to Cloudinary, and
 * finally creating the AI model in the database.
 * 
 * @param {Request} request - The incoming request object.
 * @returns {NextResponse} - The response object containing the created AI model or an error message.
 */
export async function POST(request: Request) {
  try {
    // Get the current user to ensure they are authorized to create an AI model
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract model details from the request body
    const { 
      name, 
      personality, 
      appearance, 
      backstory, 
      hobbies, 
      likes, 
      dislikes,
      isHuman
    } = await request.json();

    // Skip DALL-E image generation if it's a human model
    let cloudinaryImageUrl;
    if (!isHuman) {
      try {
        // Generate an image for the AI model using OpenAI's DALL-E model
        const imagePrompt = `Ultra realistic portrait of ${appearance}. Photorealistic, highly detailed, 8k resolution.`;
        const imageResponse = await openai.images.generate({
          model: "dall-e-3",
          prompt: imagePrompt,
          n: 1,
          size: "1024x1024",
        });

        // Extract the generated image URL
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

        // Store the URL of the uploaded image
        cloudinaryImageUrl = uploadResponse.secure_url;
      } catch (error) {
        console.error('Error generating or uploading image:', error);
        // If image generation or upload fails, continue without an image
      }
    }

    // Create a new AI model entry in the database with the provided details
    const newAIModel = await prisma.aIModel.create({
      data: {
        name,
        personality,
        appearance,
        backstory,
        hobbies,
        likes,
        dislikes,
        imageUrl: cloudinaryImageUrl || '',
        userId: currentUser.id,
        isHumanX: isHuman,
      },
    });

    // Return the newly created AI model as a JSON response
    return NextResponse.json(newAIModel, { status: 201 });
  } catch (error) {
    console.error('Error creating AI model:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
