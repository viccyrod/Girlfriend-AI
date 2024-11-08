import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import prisma from '@/lib/clients/prisma';

/**
 * This function handles the GET request to fetch all AI models created by the current user.
 * It performs the following steps: authenticating the user, querying the database for AI models,
 * and returning the models in JSON format.
 * 
 * @returns {NextResponse} - The response object containing the user's AI models or an error message.
 */
export async function GET() {
  try {
    // Get the current user to ensure they are authorized to fetch their AI models
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Query the database to find all AI models created by the current user
    const myModels = await prisma.aIModel.findMany({
      where: {
        userId: currentUser.id
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
        createdAt: 'desc' // Order the models by creation date in descending order
      }
    });

    // Return the user's AI models in JSON format
    return NextResponse.json(myModels);
  } catch (error) {
    console.error('Error fetching user\'s AI models:', error);
    // Return a 500 response in case of an unexpected error
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
