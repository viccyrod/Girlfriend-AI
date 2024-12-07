import { NextRequest, NextResponse } from 'next/server'
import { generateImage } from '@/lib/ai-client'
import { getCurrentUser } from '@/lib/session'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const requestSchema = z.object({
  prompt: z.string(),
  style: z.string().optional(),
  negative_prompt: z.string().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = requestSchema.parse(body)

    const aiModel = await prisma.aIModel.findUnique({
      where: { id: params.id },
    })

    if (!aiModel) {
      return NextResponse.json({ error: 'AI Model not found' }, { status: 404 })
    }

    const result = await generateImage(validatedData.prompt, params.id)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error generating image:', error)
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: Request,
  { params }: { params: { modelId: string } }
) {
  try {
    const images = await prisma.image.findMany({
      where: {
        aiModelId: params.modelId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(images);
  } catch (error) {
    console.error('Error fetching images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch images' },
      { status: 500 }
    );
  }
} 