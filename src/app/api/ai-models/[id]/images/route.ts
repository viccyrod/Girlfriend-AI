import { NextResponse } from 'next/server';
import prisma from '@/lib/clients/prisma';
import { getCurrentUser } from '@/lib/session';

export async function POST(
  request: Request,
  { params }: { params: { modelId: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { imageUrl, imageData, isNSFW } = await request.json();

    // Verify the AI model exists and belongs to the user
    const aiModel = await prisma.aIModel.findFirst({
      where: {
        id: params.modelId,
        userId: currentUser.id,
      },
    });

    if (!aiModel) {
      return NextResponse.json({ error: 'AI Model not found' }, { status: 404 });
    }

    // Update AI model with new image
    const updatedModel = await prisma.aIModel.update({
      where: {
        id: params.modelId,
      },
      data: {
        imageUrl: imageUrl,
        images: {
          create: {
            imageUrl,
            imageData,
            isNSFW: isNSFW || false,
          }
        }
      },
      include: {
        images: true
      }
    });

    return NextResponse.json(updatedModel);
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { modelId: string } }
) {
  try {
    const aiModel = await prisma.aIModel.findUnique({
      where: {
        id: params.modelId,
      },
      select: {
        images: true
      }
    });

    if (!aiModel) {
      return NextResponse.json({ error: 'AI Model not found' }, { status: 404 });
    }

    return NextResponse.json(aiModel.images);
  } catch (error) {
    console.error('Error fetching images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch images' },
      { status: 500 }
    );
  }
} 