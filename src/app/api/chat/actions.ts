import prisma from "@/db/prisma";
import { getCurrentUser } from "@/lib/session";
import { NextResponse } from 'next/server';

export async function createChatRoomAction(name: string, aiModelId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('Unauthorized');

  if (!aiModelId) {
    throw new Error('AI Model ID is required');
  }

  // Fetch the AI model
  const aiModel = await prisma.aIModel.findUnique({
    where: { id: aiModelId }
  });

  if (!aiModel) {
    throw new Error('AI Model not found');
  }

  // Create the chat room
  const chatRoom = await prisma.chatRoom.create({
    data: {
      name,
      users: {
        connect: [{ id: currentUser.id }]
      },
      aiModel: {
        connect: { id: aiModelId }
      }
    },
    include: {
      users: true,
      aiModel: true
    }
  });

  console.log('Created chat room:', JSON.stringify(chatRoom, null, 2));
  return chatRoom;
}


export async function getChatRoomsAction() {
  try {
    const currentUser = await getCurrentUser();
    console.log('Current user:', currentUser);
    if (!currentUser) throw new Error('Unauthorized');

    const chatRooms = await prisma.chatRoom.findMany({
      where: {
        users: {
          some: {
            id: currentUser.id
          }
        }
      },
      include: {
        users: true,
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        },
        aiModel: {
          select: {
            id: true,
            name: true,
            imageUrl: true
          }
        }
      }
    });

    console.log('Fetched chat rooms:', JSON.stringify(chatRooms, null, 2));
    return chatRooms.length > 0 ? chatRooms : [];
  } catch (error) {
    console.error('Error in getChatRoomsAction:', error);
    throw error;
  }
}

export async function getChatRoomMessages(chatRoomId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('Unauthorized');

  const messages = await prisma.message.findMany({
    where: {
      chatRoomId
    },
    orderBy: {
      createdAt: 'asc'
    },
    include: {
      user: true
    }
  });

  return messages;
}

export async function deleteChatRoom(roomId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('Unauthorized');

  // Delete all messages in the chat room
  await prisma.message.deleteMany({
    where: {
      chatRoomId: roomId,
    },
  });

  // Delete the chat room
  await prisma.chatRoom.delete({
    where: {
      id: roomId,
      users: {
        some: {
          id: currentUser.id
        }
      }
    }
  });

  return { success: true };
}


export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Received POST body:', JSON.stringify(body, null, 2));
    const { action, ...data } = body;
    console.log('Received action:', action);
    console.log('Received data:', JSON.stringify(data, null, 2));

    switch (action) {
      case 'createChatRoom':
        try {
          const chatRoom = await createChatRoomAction(data.name, data.aiModelId);
          return NextResponse.json(chatRoom);
        } catch (error) {
          console.error('Error in createChatRoom:', error);
          return NextResponse.json({ error: 'Failed to create chat room', details: error instanceof Error ? error.message : String(error) }, { status: 400 });
        }
      case 'sendMessage':
        try {
          const message = await sendMessage(data.content, data.chatRoomId, data.aiModelId);
          return NextResponse.json(message);
        } catch (error) {
          console.error('Error in sendMessage:', error);
          return NextResponse.json({ error: 'Failed to send message', details: error instanceof Error ? error.message : String(error) }, { status: 400 });
        }
      case 'deleteChatRoom':
        try {
          await deleteChatRoom(data.roomId);
          return NextResponse.json({ success: true });
        } catch (error) {
          console.error('Error in deleteChatRoom:', error);
          return NextResponse.json({ error: 'Failed to send message', details: error instanceof Error ? error.message : String(error) }, { status: 400 });
        }
      default:
        console.error('Invalid action:', action);
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in POST /api/chat:', error);
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function sendMessage(content: string, chatRoomId: string, aiModelId: string | null) {
  try {
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
  } catch (error) {
    console.error('Error in sendMessage:', error);
    throw error;
  }
}
