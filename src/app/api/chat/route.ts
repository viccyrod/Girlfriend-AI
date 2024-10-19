import { NextResponse } from 'next/server';
import { createChatRoomAction, getChatRoomsAction, deleteChatRoom } from './actions';
import { getCurrentUser } from '@/lib/session';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { action, ...data } = await request.json();
    console.log('Received action:', action);
    console.log('Received data:', data);

    switch (action) {
      case 'createChatRoom':
        try {
          const chatRoom = await createChatRoomAction(data.name, data.userIds);
          return NextResponse.json(chatRoom);
        } catch (error) {
          console.error('Error in createChatRoom:', error);
          return NextResponse.json({ error: 'Failed to create chat room. Some users may not exist.' }, { status: 400 });
        }
      case 'sendMessage':
        try {
          const message = await sendMessage(data.content, data.chatRoomId, data.aiModelId);
          return NextResponse.json(message);
        } catch (error) {
          console.error('Error in sendMessage:', error);
          return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
        }
      case 'deleteChatRoom':
        try {
          await deleteChatRoom(data.roomId);
          return NextResponse.json({ success: true });
        } catch (error) {
          console.error('Error in deleteChatRoom:', error);
          return NextResponse.json({ error: 'Failed to delete chat room' }, { status: 500 });
        }
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in POST /api/chat:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { action, roomId } = await request.json();
    console.log('Received DELETE action:', action);
    console.log('Received roomId:', roomId);

    if (action === 'deleteChatRoom') {
      try {
        await deleteChatRoom(roomId);
        return NextResponse.json({ success: true });
      } catch (error) {
        console.error('Error in deleteChatRoom:', error);
        return NextResponse.json({ error: 'Failed to delete chat room' }, { status: 500 });
      }
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in DELETE /api/chat:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      console.log('Unauthorized: No current user');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const chatRooms = await getChatRoomsAction();
    console.log('Fetched chat rooms:', JSON.stringify(chatRooms, null, 2));
    return NextResponse.json(chatRooms);
  } catch (error) {
    console.error('Error in GET /api/chat:', error);
    return NextResponse.json({ error: 'Failed to fetch chat rooms', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function sendMessage(content: string, chatRoomId: string, aiModelId: string | null) {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('Unauthorized');

  const chatRoom = await prisma.chatRoom.findUnique({
    where: { id: chatRoomId },
    include: { users: true }
  });

  if (!chatRoom) {
    throw new Error('Chat room not found');
  }

  if (!chatRoom.users.some(user => user.id === currentUser.id)) {
    throw new Error('User is not a member of this chat room');
  }

  const message = await prisma.message.create({
    data: {
      content,
      userId: currentUser.id,
      chatRoomId,
      aiModelId
    },
    include: {
      user: true,
      aiModel: true
    }
  });

  console.log('Created message:', JSON.stringify(message, null, 2));
  return message;
}
