import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

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

  return message;
}

export async function createChatRoomAction(name: string, aiModelId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('Unauthorized');

  const aiModel = await prisma.aIModel.findUnique({
    where: { id: aiModelId }
  });

  if (!aiModel) {
    throw new Error('AI Model not found');
  }

  const chatRoom = await prisma.chatRoom.create({
    data: {
      name,
      users: {
        connect: { id: currentUser.id }
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

  return chatRoom;
}

export async function deleteChatRoom(chatRoomId: string) {
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
    throw new Error('User is not authorized to delete this chat room');
  }

  // Delete all messages in the chat room
  await prisma.message.deleteMany({
    where: { chatRoomId }
  });

  // Delete the chat room
  await prisma.chatRoom.delete({
    where: { id: chatRoomId }
  });

  return { success: true };
}

export async function getChatRoomsAction() {
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
      aiModel: true,
      messages: {
        orderBy: {
          createdAt: 'desc'
        },
        take: 1
      }
    }
  });

  return chatRooms;
}
