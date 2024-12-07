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

export const runtime = 'nodejs'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      )
    }

    const body = await request.json()
    const validatedData = requestSchema.parse(body)

    const aiModel = await prisma.aIModel.findUnique({
      where: { id: params.id },
    })

    if (!aiModel) {
      return new NextResponse(
        JSON.stringify({ error: 'AI Model not found' }),
        { status: 404, headers: { 'content-type': 'application/json' } }
      )
    }

    const result = await generateImage(validatedData.prompt, params.id)

    return new NextResponse(
      JSON.stringify(result),
      { status: 200, headers: { 'content-type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error generating image:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Failed to generate image' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Fetching images for model:', params.id);
    const images = await prisma.image.findMany({
      where: {
        aiModelId: params.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log('Found images:', images.length);
    return new NextResponse(
      JSON.stringify(images),
      { status: 200, headers: { 'content-type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error fetching images:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Failed to fetch images' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    )
  }
} 