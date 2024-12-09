import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import prisma from "@/lib/prisma";
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Validate route parameters
const RouteParamsSchema = z.object({
  id: z.string().min(1)
});

// Validate update data
const UpdateModelSchema = z.object({
  name: z.string().min(1).max(100),
  personality: z.string().min(1),
  appearance: z.string().min(1),
  backstory: z.string().min(1),
  hobbies: z.string().min(1),
  likes: z.string().min(1),
  dislikes: z.string().min(1),
  isPrivate: z.boolean()
});

// Update the schema to make all fields optional for PATCH
const PatchModelSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  personality: z.string().min(1).optional(),
  appearance: z.string().min(1).optional(),
  backstory: z.string().min(1).optional(),
  hobbies: z.string().min(1).optional(),
  likes: z.string().min(1).optional(),
  dislikes: z.string().min(1).optional(),
  isPrivate: z.boolean().optional()
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate route parameters
    const validatedParams = RouteParamsSchema.safeParse(params);
    if (!validatedParams.success) {
      return NextResponse.json(
        { error: 'Invalid route parameters' },
        { status: 400 }
      );
    }

    const { getUser } = getKindeServerSession();
    const user = await getUser();

    // Find AI model with access check
    const aiModel = await prisma.aIModel.findFirst({
      where: {
        id: params.id,
        OR: [
          { isPrivate: false }, // Public models are always accessible
          ...(user?.id ? [{ userId: user.id }] : []) // Only check user ownership if user is logged in
        ]
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        followers: {
          select: {
            id: true
          }
        }
      },
    });

    if (!aiModel) {
      return NextResponse.json(
        { error: 'AI Model not found or access denied' },
        { status: 404 }
      );
    }

    // Transform the response to include follower count
    const response = {
      ...aiModel,
      followerCount: aiModel.followers.length,
      followers: undefined // Remove the followers array from response
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching AI model:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI model' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate route parameters
    const validatedParams = RouteParamsSchema.safeParse(params);
    if (!validatedParams.success) {
      return NextResponse.json(
        { error: 'Invalid route parameters' },
        { status: 400 }
      );
    }

    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validate request body
    const body = await req.json();
    const validatedData = UpdateModelSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    // Check if model exists and belongs to user
    const existingModel = await prisma.aIModel.findFirst({
      where: {
        id: params.id,
        userId: user.id
      }
    });

    if (!existingModel) {
      return NextResponse.json(
        { error: 'AI Model not found or access denied' },
        { status: 404 }
      );
    }

    const updatedModel = await prisma.aIModel.update({
      where: { id: params.id },
      data: validatedData.data,
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

    return NextResponse.json(updatedModel);
  } catch (error) {
    console.error('Error updating AI model:', error);
    return NextResponse.json(
      { error: 'Failed to update AI model' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate route parameters
    const validatedParams = RouteParamsSchema.safeParse(params);
    if (!validatedParams.success) {
      return NextResponse.json(
        { error: 'Invalid route parameters' },
        { status: 400 }
      );
    }

    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validate request body
    const body = await req.json();
    const validatedData = PatchModelSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validatedData.error },
        { status: 400 }
      );
    }

    // Check if model exists and belongs to user
    const existingModel = await prisma.aIModel.findFirst({
      where: {
        id: params.id,
        userId: user.id
      }
    });

    if (!existingModel) {
      return NextResponse.json(
        { error: 'AI Model not found or access denied' },
        { status: 404 }
      );
    }

    const updatedModel = await prisma.aIModel.update({
      where: { id: params.id },
      data: validatedData.data,
      include: {
        _count: {
          select: {
            followers: true
          }
        }
      }
    });

    return NextResponse.json(updatedModel);
  } catch (error) {
    console.error('Error updating AI model:', error);
    return NextResponse.json(
      { error: 'Failed to update AI model' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate route parameters
    const validatedParams = RouteParamsSchema.safeParse(params);
    if (!validatedParams.success) {
      return NextResponse.json(
        { error: 'Invalid route parameters' },
        { status: 400 }
      );
    }

    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if model exists and belongs to user
    const model = await prisma.aIModel.findFirst({
      where: {
        id: params.id,
        userId: user.id
      }
    });

    if (!model) {
      return NextResponse.json(
        { error: 'AI Model not found or access denied' },
        { status: 404 }
      );
    }

    await prisma.aIModel.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting AI model:', error);
    return NextResponse.json(
      { error: 'Failed to delete AI model' },
      { status: 500 }
    );
  }
} 