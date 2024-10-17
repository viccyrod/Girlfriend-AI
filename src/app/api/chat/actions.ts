import prisma from "@/db/prisma";
import { getCurrentUser } from "@/lib/session";

export async function createChatRoom(name: string, userIds: string[]) {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('Unauthorized');

  const chatRoom = await prisma.chatRoom.create({
    data: {
      name,
      users: {
        connect: [
          { id: currentUser.id },
          ...userIds.map(id => ({ id }))
        ]
      }
    },
    include: {
      users: true
    }
  });

  return chatRoom;
}

export async function sendMessage(content: string, chatRoomId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('Unauthorized');

  const message = await prisma.message.create({
    data: {
      content,
      userId: currentUser.id,
      chatRoomId
    },
    include: {
      user: true
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
        }
      }
    });

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
