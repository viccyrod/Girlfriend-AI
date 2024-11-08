import { NextResponse } from "next/server";
import prisma from "@/lib/clients/prisma";
import { getCurrentUser } from '@/lib/session';

/**
 * This function handles the GET request for fetching a specific AI model by its ID.
 * It retrieves the ID from the request parameters, fetches the corresponding AI model
 * from the database, and returns the AI model data in JSON format.
 * 
 * @param {Request} request - The incoming request object.
 * @param {Object} params - The parameters object containing the ID of the AI model.
 * @param {string} params.id - The ID of the AI model to fetch.
 * @returns {NextResponse} - The response object containing the AI model data or an error message.
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Fetch the AI model with its creator's info
    const aiModel = await prisma.aIModel.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    if (!aiModel) {
      return NextResponse.json(
        { error: 'AI Model not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(aiModel);
  } catch (error) {
    console.error('Error fetching AI model:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI model' },
      { status: 500 }
    );
  }
}

/**
 * This function handles the POST request to update the AI model's follower count.
 * It returns a success message upon completion.
 * 
 * @returns {NextResponse} - The response object containing the success message.
 */
export async function POST() {
  // Handle the POST request here
  // For example, update the AI model's follower count
  
  return NextResponse.json({ success: true });
}

/**
 * This function handles the PUT request for updating a specific AI model by its ID.
 * It checks if the current user is authenticated, retrieves the AI model's ID and updated data from the request,
 * and updates the AI model in the database.
 * 
 * @param {Request} request - The incoming request object.
 * @param {Object} params - The parameters object containing the ID of the AI model.
 * @param {string} params.id - The ID of the AI model to update.
 * @returns {NextResponse} - The response object containing the updated AI model data or an error message.
 */
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    // Get the current user to check if they are authorized
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const data = await request.json();

    // Update the AI model with the provided data if the current user is the owner
    const updatedModel = await prisma.aIModel.update({
      where: { id, userId: currentUser.id },
      data: {
        name: data.name,
        personality: data.personality,
        appearance: data.appearance,
        backstory: data.backstory,
        hobbies: data.hobbies,
        likes: data.likes,
        dislikes: data.dislikes,
        isPrivate: data.isPrivate,
      },
    });

    // Return the updated AI model data in JSON format
    return NextResponse.json(updatedModel);
  } catch (error) {
    console.error('Error updating AI model:', error);
    // Return a 500 response in case of an unexpected error
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

/**
 * This function handles the DELETE request for deleting a specific AI model by its ID.
 * It checks if the current user is authenticated and authorized to delete the model,
 * and deletes the model if found.
 * 
 * @param {Request} request - The incoming request object.
 * @param {Object} params - The parameters object containing the ID of the AI model.
 * @param {string} params.id - The ID of the AI model to delete.
 * @returns {NextResponse} - The response object containing a success or error message.
 */
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    // Get the current user to check if they are authorized
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Check if the model belongs to the current user
    const model = await prisma.aIModel.findUnique({
      where: { id, userId: currentUser.id },
    });

    // Return a 404 response if the model is not found or the user is not authorized
    if (!model) {
      return NextResponse.json({ error: 'AI Model not found or you do not have permission to delete it' }, { status: 404 });
    }

    // Delete the model from the database
    await prisma.aIModel.delete({
      where: { id },
    });

    // Return a success message
    return NextResponse.json({ message: 'AI Model deleted successfully' });
  } catch (error) {
    console.error('Error deleting AI model:', error);
    // Return a 500 response in case of an unexpected error
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
