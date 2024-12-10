import { NextResponse } from 'next/server';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from '@/lib/prisma';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Validate request body for POST
const CreateChatRoomSchema = z.object({
  action: z.literal('createChatRoom'),
  aiModelId: z.string().min(1)
});

// Validate request body for DELETE
const DeleteChatRoomSchema = z.object({
  roomId: z.string().min(1)
});

export async function GET() {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const chatRooms = await prisma.chatRoom.findMany({
      where: {
        users: {
          some: {
            id: user.id
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
        },
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return NextResponse.json(chatRooms);
  } catch (error) {
    console.error('Error fetching chat rooms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat rooms' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user?.id || !user.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = CreateChatRoomSchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    const { aiModelId } = validatedData.data;

    // Check if AI model exists and is accessible
    const aiModel = await prisma.aIModel.findFirst({
      where: {
        id: aiModelId,
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

    // Find or create user
    let dbUser = await prisma.user.upsert({
      where: { id: user.id },
      update: {
        email: user.email,
        name: user.given_name || user.family_name || user.email,
        image: user.picture || null
      },
      create: {
        id: user.id,
        email: user.email,
        name: user.given_name || user.family_name || user.email,
        image: user.picture || null
      }
    });

    // Find existing chat room or create new one
    const existingRoom = await prisma.chatRoom.findFirst({
      where: {
        aiModelId,
        users: {
          some: {
            id: dbUser.id
          }
        }
      }
    });

    if (existingRoom) {
      return NextResponse.json(existingRoom);
    }

    const chatRoom = await prisma.chatRoom.create({
      data: {
        name: `Chat with ${aiModel.name}`,
        aiModelId,
        users: {
          connect: { id: dbUser.id }
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

    return NextResponse.json(chatRoom);
  } catch (error) {
    console.error('Error creating chat room:', error);
    return NextResponse.json(
      { error: 'Failed to create chat room' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = DeleteChatRoomSchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    const { roomId } = validatedData.data;

    // First delete all messages in the room
    await prisma.message.deleteMany({
      where: {
        chatRoomId: roomId,
        chatRoom: {
          users: {
            some: {
              id: user.id
            }
          }
        }
      }
    });

    // Then delete the chat room
    const result = await prisma.chatRoom.deleteMany({
      where: {
        id: roomId,
        users: {
          some: {
            id: user.id
          }
        }
      }
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: 'Chat room not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting chat room:', error);
    return NextResponse.json(
      { error: 'Failed to delete chat room' },
      { status: 500 }
    );
  }
}
