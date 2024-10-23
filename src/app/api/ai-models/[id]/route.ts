import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
// import { AIModel } from "@/types/AIModel";
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
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const aiModelId = params.id;
  
  try {
    const aiModel = await prisma.aIModel.findUnique({
      where: { id: aiModelId },
      include: {
        createdBy: true,
      }
    });

    if (!aiModel) {
      return NextResponse.json({ error: 'AI Model not found' }, { status: 404 });
    }

    return NextResponse.json(aiModel);
  } catch (error) {
    console.error('Error fetching AI Model:', error);
    return NextResponse.json({ error: 'Failed to fetch AI Model' }, { status: 500 });
  }
}

export async function POST() {
  // Handle the POST request here
  // For example, update the AI model's follower count
  
  return NextResponse.json({ success: true });
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const data = await request.json();

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

    return NextResponse.json(updatedModel);
  } catch (error) {
    console.error('Error updating AI model:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Check if the model belongs to the current user
    const model = await prisma.aIModel.findUnique({
      where: { id, userId: currentUser.id },
    });

    if (!model) {
      return NextResponse.json({ error: 'AI Model not found or you do not have permission to delete it' }, { status: 404 });
    }

    // Delete the model
    await prisma.aIModel.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'AI Model deleted successfully' });
  } catch (error) {
    console.error('Error deleting AI model:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
