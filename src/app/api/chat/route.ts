import { NextResponse } from 'next/server';
import { ChatService } from '@/services/chatService';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from '@/lib/clients/prisma';

export async function GET() {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
        users: true,
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1, // Only get the latest message
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
    const kindeUser = await getUser();
    
    if (!kindeUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find user by email instead of ID since we're using cuid()
    let dbUser = await prisma.user.findUnique({
      where: { email: kindeUser.email || '' }
    });

    // If user doesn't exist, create them
    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          email: kindeUser.email || '',
          name: kindeUser.given_name || kindeUser.family_name || kindeUser.email || '',
          image: kindeUser.picture || null,
        }
      });
    }

    const body = await request.json();
    const { action, aiModelId } = body;

    if (action === 'createChatRoom') {
      const existingRoom = await prisma.chatRoom.findFirst({
        where: {
          aiModelId,
          users: {
            some: {
              id: dbUser.id  // Using the database-generated ID
            }
          }
        }
      });

      if (existingRoom) {
        return NextResponse.json(existingRoom);
      }

      const chatRoom = await prisma.chatRoom.create({
        data: {
          name: `Chat with ${aiModelId}`,
          aiModelId,
          users: {
            connect: { id: dbUser.id }  // Using the database-generated ID
          }
        },
        include: {
          aiModel: true,
          users: true
        }
      });

      return NextResponse.json(chatRoom);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in POST /api/chat:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { roomId } = await request.json();
    console.log('Received roomId for deletion:', roomId);

    await ChatService.deleteChatRoom(roomId);
    console.log('Chat room deleted successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/chat:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete chat room',
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    );
  }
}
