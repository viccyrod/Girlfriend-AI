import { NextResponse } from 'next/server';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from '@/lib/prisma';
import { AIModelResponse } from '@/types/ai-model';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * This function handles the GET request to fetch all AI models created by the current user.
 * It performs the following steps: authenticating the user, querying the database for AI models,
 * and returning the models in JSON format.
 * 
 * @returns {NextResponse} - The response object containing the user's AI models or an error message.
 */
export async function GET() {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user?.id) {
      console.error('No user ID found in session');
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }

    console.log('Fetching models for user:', user.id);

    // Query the database to find all AI models created by the current user
    const myModels = await prisma.aIModel.findMany({
      where: {
        userId: user.id
      },
      select: {
        id: true,
        name: true,
        personality: true,
        appearance: true,
        imageUrl: true,
        isPrivate: true,
        createdAt: true,
        updatedAt: true,
        followerCount: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('Found models:', myModels);

    // Ensure the response matches AIModelResponse type
    const formattedModels: AIModelResponse[] = myModels.map(model => ({
      ...model,
      followerCount: model.followerCount ?? 0,
      isPrivate: model.isPrivate ?? false,
      personality: model.personality ?? null,
      appearance: model.appearance ?? null,
      imageUrl: model.imageUrl ?? null,
    }));

    // Return the user's AI models in JSON format
    return new NextResponse(
      JSON.stringify(formattedModels),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching user\'s AI models:', error);
    // Return a 500 response in case of an unexpected error
    return new NextResponse(
      JSON.stringify({ 
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}
