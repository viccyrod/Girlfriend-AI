// Importing necessary modules and functions from external libraries
import { NextResponse } from 'next/server';
import prisma from '@/lib/clients/prisma';
import { getCurrentUser } from '@/lib/session';

// Handles GET requests to fetch the news feed for the current user
export async function GET() {
  try {
    // Fetch the current user to ensure they are authenticated
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      // If the user is not authenticated, return a 401 Unauthorized response
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Fetch posts authored by users whose AI models are followed by the current user
    const posts = await prisma.post.findMany({
      where: {
        author: {
          followedAIModels: {
            some: {
              userId: currentUser.id
            }
          }
        }
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc' // Order the posts by creation date in descending order
      },
      take: 20 // Limit the number of posts to 20 for performance reasons
    });

    // Return the fetched posts in the response
    return NextResponse.json(posts);
  } catch (error) {
    console.error('Error fetching news feed:', error);
    // If an error occurs while fetching posts, return a 500 Internal Server Error response
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// This code defines an API endpoint for retrieving a user's news feed in a social media-like application. 
// The GET handler fetches a list of posts based on the user's followed AI models. 
// Here's a step-by-step explanation of how it works:
// 1. The `GET` function handles the incoming GET requests.
// 2. It calls `getCurrentUser()` to fetch the current logged-in user and checks if the user is authenticated.
//    - If the user is not authenticated, it returns a 401 Unauthorized response.
// 3. It then queries the database for posts using Prisma, looking for posts authored by users whose AI models are followed by the current user.
//    - The query filters the posts based on whether the author has AI models that the current user follows.
// 4. The response includes the author's information (ID, name, and image).
// 5. The posts are ordered by the creation date in descending order to ensure the most recent posts appear first.
// 6. The `take: 20` clause is used to limit the number of posts returned to 20, optimizing performance.
// 7. If the posts are successfully fetched, they are returned as a JSON response.
// 8. If an error occurs during the process, it catches the error, logs it to the console, and returns a 500 Internal Server Error response.
