import { NextRequest, NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Validate route parameters
const RouteParamsSchema = z.object({
  id: z.string().min(1),
  messageId: z.string().min(1)
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; messageId: string } }
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

    // Get the message with access check
    const message = await prisma.message.findFirst({
      where: {
        id: params.messageId,
        chatRoomId: params.id,
        chatRoom: {
          users: {
            some: {
              id: user.id
            }
          }
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    });

    if (!message) {
      return NextResponse.json(
        { error: 'Message not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json(message);
  } catch (error) {
    console.error('Error in GET /api/chat/[id]/messages/[messageId]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch message' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; messageId: string } }
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

    // Get the message with access check
    const message = await prisma.message.findFirst({
      where: {
        id: params.messageId,
        chatRoomId: params.id,
        chatRoom: {
          users: {
            some: {
              id: user.id
            }
          }
        }
      }
    });

    if (!message) {
      return NextResponse.json(
        { error: 'Message not found or access denied' },
        { status: 404 }
      );
    }

    // Only allow users to delete their own messages
    if (message.userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this message' },
        { status: 403 }
      );
    }

    await prisma.message.delete({
      where: { id: params.messageId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/chat/[id]/messages/[messageId]:', error);
    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 }
    );
  }
} 