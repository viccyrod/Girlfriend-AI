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
    // Validate route parameters
    const validatedParams = RouteParamsSchema.safeParse(params)
    if (!validatedParams.success) {
      return NextResponse.json(
        { error: 'Invalid route parameters' },
        { status: 400 }
      )
    }

    const { getUser } = getKindeServerSession()
    const user = await getUser()
    
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Validate request body
    const body = await req.json()
    const validatedData = RequestSchema.safeParse(body)
    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }

    const aiModel = await prisma.aIModel.findFirst({
      where: { 
        id: params.id,
        OR: [
          { userId: user.id },
          { isPrivate: false }
        ]
      }
    })

    if (!aiModel) {
      return NextResponse.json(
        { error: 'AI Model not found or access denied' },
        { status: 404 }
      )
    }

    const result = await generateImage(validatedData.data.prompt, params.id)
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
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate route parameters
    const validatedParams = RouteParamsSchema.safeParse(params)
    if (!validatedParams.success) {
      return NextResponse.json(
        { error: 'Invalid route parameters' },
        { status: 400 }
      )
    }

    const { getUser } = getKindeServerSession()
    const user = await getUser()
    
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch images with access check
    const images = await prisma.image.findMany({
      where: {
        aiModelId: params.id,
        aiModel: {
          OR: [
            { userId: user.id },
            { isPrivate: false }
          ]
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ images })
  } catch (error) {
    console.error('Error fetching images:', error)
    return NextResponse.json(
      { error: 'Failed to fetch images' },
      { status: 500 }
    )
  }
} 