import { NextResponse } from 'next/server';
import prisma from '@/db/prisma';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function GET() {
  // Get the authenticated user using Kinde
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  // If no user is authenticated, return an unauthorized error
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('User object:', user); // Add this line for debugging

  try {
    // Fetch posts from the database using Prisma
    const posts = await prisma.post.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Return the fetched posts as a JSON response
    return NextResponse.json(posts);
  } catch (error) {
    // Log and return an error if fetching posts fails
    console.error('Error fetching posts:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    
    return NextResponse.json(
      { error: 'Failed to fetch posts', details: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { text, mediaType, mediaUrl } = await request.json();

    const newPost = await prisma.post.create({
      data: {
        text,
        mediaType,
        mediaUrl,
        userId: user.id,
        isPublic: true, // You might want to make this configurable
      },
    });

    return NextResponse.json(newPost);
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
