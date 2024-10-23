import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
// import { AIModel } from "@/types/AIModel";

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
