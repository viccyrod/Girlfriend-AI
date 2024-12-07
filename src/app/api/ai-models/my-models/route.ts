import { NextResponse } from 'next/server';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from '@/lib/prisma';

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
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }

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
        createdAt: 'desc' // Order the models by creation date in descending order
      }
    });

    // Return the user's AI models in JSON format
    return new NextResponse(
      JSON.stringify(myModels),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching user\'s AI models:', error);
    // Return a 500 response in case of an unexpected error
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}
