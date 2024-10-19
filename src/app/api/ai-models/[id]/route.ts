import { NextResponse } from "next/server";
import prisma from "@/db/prisma";
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
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const AIModel = await prisma.aIModel.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!AIModel) {
      return NextResponse.json({ error: 'AI Model not found' }, { status: 404 });
    }

    return NextResponse.json(AIModel);
  } catch (error) {
    console.error('Error fetching AI model:', error);
    return NextResponse.json({ error: 'Failed to fetch AI model' }, { status: 500 });
  }
}
