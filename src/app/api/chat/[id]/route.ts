import { NextResponse } from 'next/server';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from '@/lib/clients/prisma';

// Utility function to verify chat room access
async function verifyChatRoomAccess(roomId: string, userId: string) {
  const chatRoom = await prisma.chatRoom.findFirst({
    where: {
      id: roomId,
      users: {
        some: {
          id: userId
        }
      }
    }
  });
  return chatRoom;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const chatRoom = await verifyChatRoomAccess(params.id, user.id);
    if (!chatRoom) {
      return NextResponse.json({ error: 'Chat room not found' }, { status: 404 });
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

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const chatRoom = await verifyChatRoomAccess(params.id, user.id);
    if (!chatRoom) {
      return NextResponse.json({ error: 'Chat room not found' }, { status: 404 });
    }

    const { content } = await request.json();
    const message = await prisma.message.create({
      data: {
        content,
        chatRoomId: params.id,
        userId: user.id,
        isAIMessage: false
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

    return NextResponse.json(message);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
