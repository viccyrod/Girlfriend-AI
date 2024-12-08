// Importing necessary modules and functions from external libraries
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Initializing the Prisma client for database operations
const prisma = new PrismaClient();

// Handles GET requests to check if the current user is following a specific AI model
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Retrieve the current user using the Kinde session
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  // If the user is not authenticated, return a 401 Unauthorized response
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Retrieve the AI model ID from the request parameters
  const aiModelId = params.id;

  // Check if the user follows the AI model
  const follow = await prisma.follow.findFirst({
    where: {
      userId: user.id,
      aiModelId: aiModelId,
    },
  });

  // Return whether the user is following the AI model
  return NextResponse.json({ isFollowing: !!follow });
}

// Handles POST requests to follow or unfollow a specific AI model
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Retrieve the current user using the Kinde session
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  // If the user is not authenticated, return a 401 Unauthorized response
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Retrieve the AI model ID from the request parameters
  const aiModelId = params.id;

  try {
    // Check if the AI model exists
    const aiModel = await prisma.aIModel.findUnique({
      where: { id: aiModelId },
    });

    // If the AI model is not found, return a 404 Not Found response
    if (!aiModel) {
      return NextResponse.json({ error: 'AI Model not found' }, { status: 404 });
    }

    // Check if the user already follows the AI model
    const existingFollow = await prisma.follow.findUnique({
      where: {
        userId_aiModelId: {
          userId: user.id,
          aiModelId: aiModelId,
        },
      },
    });

    if (existingFollow) {
      // If the user is already following, unfollow the AI model
      await prisma.$transaction([
        prisma.follow.delete({
          where: {
            userId_aiModelId: {
              userId: user.id,
              aiModelId: aiModelId,
            },
          },
        }),
        prisma.aIModel.update({
          where: { id: aiModelId },
          data: { followerCount: { decrement: 1 } },
        }),
      ]);
      return NextResponse.json({ isFollowing: false });
    } else {
      // If the user is not following, follow the AI model
      await prisma.$transaction([
        prisma.follow.create({
          data: {
            user: { connect: { id: user.id } },
            aiModel: { connect: { id: aiModelId } },
          },
        }),
        prisma.aIModel.update({
          where: { id: aiModelId },
          data: { followerCount: { increment: 1 } },
        }),
      ]);
      return NextResponse.json({ isFollowing: true });
    }
  } catch (error) {
    console.error('Error in follow/unfollow:', error);
    // If an error occurs during follow/unfollow process, return a 500 Internal Server Error response
    return NextResponse.json({ error: 'Failed to update follow status' }, { status: 500 });
  }
}

// This code defines two API endpoints for managing the follow status of an AI model by a user.
// Here's an in-depth explanation of what the code does:
// 1. The `GET` handler checks whether the current user is following a specific AI model.
//    - It uses the `getKindeServerSession()` function to retrieve the current user from the session.
//    - If the user is not authenticated, it returns a 401 Unauthorized response.
//    - It then queries the database to check if there is a follow relationship between the user and the AI model.
//    - Finally, it returns whether the user is following the AI model.
// 2. The `POST` handler is used for toggling the follow status of an AI model.
//    - It also retrieves the current user using the session.
//    - If the AI model does not exist, it returns a 404 Not Found response.
//    - If the user already follows the AI model, the endpoint allows the user to unfollow it, decrementing the follower count.
//    - If the user does not follow the AI model, it creates a follow relationship and increments the follower count.
//    - The `$transaction` method is used to ensure that both the follow/unfollow operation and the follower count update are executed together atomically.
// 3. Both endpoints handle errors gracefully by logging them and returning a 500 Internal Server Error response when necessary.
