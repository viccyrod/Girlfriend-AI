import prisma from "@/db/prisma";
import { getCurrentUser } from "@/lib/session";
import { EventEmitter } from 'events';

export async function createChatRoom(name: string, aiModelId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('Unauthorized');

  // Filter out any non-existent user IDs
  const existingUsers = await prisma.user.findMany({
    where: {
      id: {
        in: [currentUser.id]
      }
    }
  });

  const existingUserIds = existingUsers.map(user => ({ id: user.id }));

  // Check if the AI model user already exists
  let aiModelUser = await prisma.user.findUnique({
    where: { id: aiModelId }
  });

  if (!aiModelUser) {
    // If the AI model user doesn't exist, create it
    const aiModel = await prisma.aIModel.findUnique({
      where: { id: aiModelId }
    });

    if (!aiModel) {
      throw new Error('AI Model not found');
    }

    aiModelUser = await prisma.user.create({
      data: {
        id: aiModelId,
        name: aiModel.name,
        email: `${aiModel.name.toLowerCase().replace(/\s+/g, '')}@ai.model`,
        isAI: true,
        image: aiModel.imageUrl
      }
    });
  }

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

export async function sendMessage(content: string, chatRoomId: string, aiModelId: string | null) {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('Unauthorized');

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

  return message;
}

export async function getChatRooms() {
  try {
    const currentUser = await getCurrentUser();
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
// Log the first room to check the data structure
    console.log('First chat room:', JSON.stringify(chatRooms[0], null, 2));
    return chatRooms;
  } catch (error) {
    console.error('Error in getChatRooms:', error);
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

