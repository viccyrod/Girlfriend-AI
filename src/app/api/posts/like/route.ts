import { NextResponse } from 'next/server';
import prisma from '@/db/prisma';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

// This is an API route handler for GET requests
export async function POST(request: Request) {
  // Get the user session using Kinde authenticatio
  const { getUser } = getKindeServerSession();
  const user = await getUser();

// If no user is authenticated, return an unauthorized error

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const postId = body.postId;

  if (!postId) {
    return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
  }

  try {
    // Update the like status of the post
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        likes: {
          increment: 1
        },
        likedBy: {
          connect: { id: user.id }
        }
      },
      include: {
        likedBy: true // Include the likedBy relation in the response
      }
    });

    return NextResponse.json({ success: true, post: updatedPost });
  } catch (error) {
    console.error('Error liking post:', error);
    return NextResponse.json({ error: 'Failed to like post' }, { status: 500 });
  }
}
