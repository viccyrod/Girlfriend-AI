import { NextRequest, NextResponse } from 'next/server'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { generateImage } from '@/lib/ai-client'
import prisma from '@/lib/prisma'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Validate route parameters
const RouteParamsSchema = z.object({
  id: z.string().min(1)
})

// Validate request body
const RequestSchema = z.object({
  prompt: z.string().min(1),
  style: z.string().optional(),
  negative_prompt: z.string().optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🎨 Generating image for model:', params.id);
    
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
    const validatedData = RequestSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    const aiModel = await prisma.aIModel.findFirst({
      where: { 
        id: params.id,
        OR: [
          { userId: user.id },
          { isPrivate: false }
        ]
      }
    });

    if (!aiModel) {
      return NextResponse.json(
        { error: 'AI Model not found or access denied' },
        { status: 404 }
      );
    }

    // Generate the image
    console.log('🎨 Generating image with prompt:', validatedData.data.prompt);
    const result = await generateImage(validatedData.data.prompt, params.id);
    
    // Save the image to the database
    console.log('💾 Saving image to database:', result.imageUrl);
    const savedImage = await prisma.image.create({
      data: {
        imageUrl: result.imageUrl,
        aiModelId: params.id,
        isNSFW: false
      }
    });

    console.log('✨ Image saved successfully:', savedImage.id);

    // Update AI model's image count
    await prisma.aIModel.update({
      where: { id: params.id },
      data: {
        imageCount: {
          increment: 1
        }
      }
    });

    return NextResponse.json({
      ...result,
      id: savedImage.id,
      createdAt: savedImage.createdAt
    });
  } catch (error) {
    console.error('❌ Error generating image:', error);
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('📸 Fetching images for model:', params.id);
    
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
    
    // Find AI model first to verify access
    const aiModel = await prisma.aIModel.findFirst({
      where: {
        id: params.id,
        OR: [
          { userId: user?.id },
          { isPrivate: false }
        ]
      }
    });

    if (!aiModel) {
      console.log('❌ AI Model not found or access denied');
      return NextResponse.json(
        { error: 'AI Model not found or access denied' },
        { status: 404 }
      );
    }

    // Fetch images for the model
    const images = await prisma.image.findMany({
      where: {
        aiModelId: params.id
      },
      select: {
        id: true,
        imageUrl: true,
        createdAt: true,
        aiModelId: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`✨ Found ${images.length} images for model:`, params.id);
    
    return NextResponse.json({ images });
  } catch (error) {
    console.error('❌ Error fetching images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch images' },
      { status: 500 }
    );
  }
} 