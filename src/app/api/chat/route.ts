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
    const user = await getUser();
    
    if (!user) {
      console.log('No user found - unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Received POST request to /api/chat with body:', JSON.stringify(body, null, 2));

    const { action, content, chatRoomId, aiModelId, name } = body;

    switch (action) {
      case 'createChatRoom':
        try {
          console.log('Creating chat room for user:', user.id);
          const chatRoom = await ChatService.createChatRoom(name, aiModelId);
          console.log('Chat room created:', JSON.stringify(chatRoom, null, 2));
          return NextResponse.json(chatRoom);
        } catch (error) {
          console.error('Error in createChatRoom:', error);
          return NextResponse.json(
            { error: 'Failed to create chat room' }, 
            { status: 400 }
          );
        }

      case 'sendMessage':
        try {
          console.log('Sending message in chatRoomId:', chatRoomId, 'with content:', content);
          const message = await ChatService.sendMessage(content, chatRoomId, aiModelId);
          console.log('Message sent:', JSON.stringify(message, null, 2));
          return NextResponse.json(message);
        } catch (error) {
          console.error('Error in sendMessage:', error);
          return NextResponse.json(
            { 
              error: 'Failed to send message',
              details: error instanceof Error ? error.message : String(error)
            }, 
            { status: 500 }
          );
        }

      case 'deleteChatRoom':
        try {
          console.log('Deleting chat room with id:', chatRoomId);
          await ChatService.deleteChatRoom(chatRoomId);
          console.log('Chat room deleted successfully');
          return NextResponse.json({ success: true });
        } catch (error) {
          console.error('Error in deleteChatRoom:', error);
          return NextResponse.json(
            { 
              error: 'Failed to delete chat room',
              details: error instanceof Error ? error.message : String(error)
            }, 
            { status: 500 }
          );
        }

      default:
        console.error('Invalid action received:', action);
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
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
