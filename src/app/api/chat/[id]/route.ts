import { NextResponse } from 'next/server';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from '@/lib/clients/prisma';

// Utility function to verify chat room access
async function verifyChatRoomAccess(roomId: string, userId: string) {
  try {
    const chatRoom = await prisma.chatRoom.findFirst({
      where: {
        id: roomId,
        users: {
          some: {
            id: userId
          }
        }
      },
      include: {
        aiModel: true,
        users: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    });
    return chatRoom;
  } catch (error) {
    console.error('Error verifying chat room access:', error);
    return null;
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!params.id) {
      return NextResponse.json(
        { error: 'Chat room ID is required' },
        { status: 400 }
      );
    }

    const chatRoom = await verifyChatRoomAccess(params.id, user.id);
    if (!chatRoom) {
      return NextResponse.json(
        { error: 'Chat room not found or access denied' },
        { status: 404 }
      );
    }

    const messages = await prisma.message.findMany({
      where: {
        chatRoomId: params.id
      },
      orderBy: {
        createdAt: 'asc'
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

    return NextResponse.json({
      chatRoom,
      messages,
      success: true
    });
  } catch (error) {
    console.error('Error in chat room GET:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!params.id) {
      return NextResponse.json(
        { error: 'Chat room ID is required' },
        { status: 400 }
      );
    }

    const chatRoom = await verifyChatRoomAccess(params.id, user.id);
    if (!chatRoom) {
      return NextResponse.json(
        { error: 'Chat room not found or access denied' },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body.content !== 'string') {
      return NextResponse.json(
        { error: 'Invalid message content' },
        { status: 400 }
      );
    }

    // Check for duplicate message
    const existingMessage = await prisma.message.findFirst({
      where: {
        chatRoomId: params.id,
        content: body.content,
        userId: user.id,
        createdAt: {
          gte: new Date(Date.now() - 5000) // Within last 5 seconds
        }
      }
    });

    if (existingMessage) {
      return NextResponse.json(
        { error: 'Duplicate message', message: existingMessage },
        { status: 409 }
      );
    }

    const message = await prisma.message.create({
      data: {
        content: body.content,
        chatRoomId: params.id,
        userId: user.id,
        isAIMessage: false,
        metadata: { type: 'text' }
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

    return NextResponse.json({
      message,
      success: true
    });
  } catch (error) {
    console.error('Error in chat room POST:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
