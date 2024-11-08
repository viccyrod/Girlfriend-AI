'use server'

import prisma from '@/lib/clients/prisma';
import { getCurrentUser } from '@/lib/session';

export async function getOrCreateChatRoom(modelId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('Unauthorized');

  // First, try to find an existing chat room
  const existingChatRoom = await prisma.chatRoom.findFirst({
    where: {
      aiModelId: modelId,
      users: {
        some: {
          id: currentUser.id
        }
      }
    },
    select: {
      id: true,
      name: true,
      aiModelId: true,
      createdAt: true,
      updatedAt: true,
      messages: {
        orderBy: {
          createdAt: 'desc'
        },
        take: 1 // Only get the latest message
      },
      aiModel: {
        include: {
          createdBy: true
        }
      },
      users: true
    }
  });

  if (existingChatRoom) {
    return {
      ...existingChatRoom,
      aiModel: {
        ...existingChatRoom.aiModel,
        isHuman: false,
        isFollowing: false
      },
      aiModelImageUrl: existingChatRoom.aiModel?.imageUrl || '/default-ai-image.png'
    };
  }

  // Create new chat room if none exists
  const newChatRoom = await prisma.chatRoom.create({
    data: {
      name: `Chat with ${modelId}`,
      aiModelId: modelId,
      users: {
        connect: [{ id: currentUser.id }]
      }
    },
    include: {
      users: true,
      aiModel: {
        include: {
          createdBy: true
        }
      },
      messages: true
    }
  });

  return {
    ...newChatRoom,
    aiModel: {
      ...newChatRoom.aiModel,
      isHuman: false,
      isFollowing: false
    },
    aiModelImageUrl: newChatRoom.aiModel?.imageUrl || '/default-ai-image.png'
  };
}
