'use server';

import { ExtendedChatRoom } from '@/types/chat';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from '@/lib/prisma';
import { messageEmitter } from '@/lib/messageEmitter';
import { Message, User } from '@prisma/client';

export async function getOrCreateChatRoom(aiModelId: string) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user?.id) {
      throw new Error('Unauthorized');
    }

    // First find the AI model
    const aiModel = await prisma.aIModel.findUnique({
      where: { id: aiModelId },
      include: { createdBy: true }
    });

    if (!aiModel) throw new Error('AI Model not found');

    // Create or find chat room in a transaction
    const chatRoom = await prisma.$transaction(async (tx) => {
      // Find existing chat room
      const existingRoom = await tx.chatRoom.findFirst({
        where: {
          aiModelId,
          users: {
            some: {
              id: user.id
            }
          }
        },
        include: {
          aiModel: {
            include: {
              createdBy: true
            }
          },
          users: true,
          messages: {
            take: 50,
            orderBy: {
              createdAt: 'desc'
            },
            include: {
              user: true
            }
          },
          createdBy: true
        }
      });

      if (existingRoom) return existingRoom;

      // Create new chat room if none exists
      return tx.chatRoom.create({
        data: {
          name: `Chat with ${aiModel.name}`,
          aiModel: {
            connect: {
              id: aiModelId
            }
          },
          users: {
            connect: {
              id: user.id
            }
          },
          createdBy: {
            connect: {
              id: user.id
            }
          }
        },
        include: {
          aiModel: {
            include: {
              createdBy: true
            }
          },
          users: true,
          messages: true,
          createdBy: true
        }
      });
    });

    return chatRoom;
  } catch (error) {
    console.error('Error in getOrCreateChatRoom:', error);
    return null;
  }
}

export async function createMessage(
  chatRoomId: string,
  content: string,
  isAIMessage: boolean = false
) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user?.id) {
      throw new Error('Unauthorized');
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        content,
        isAIMessage,
        metadata: {},
        chatRoom: {
          connect: {
            id: chatRoomId
          }
        },
        user: {
          connect: {
            id: user.id
          }
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            isAI: true
          }
        }
      }
    });

    // Transform message to ensure consistent format
    const transformedMessage = {
      ...message,
      metadata: message.metadata || {},
      role: isAIMessage ? 'assistant' : 'user',
      user: message.user || null
    };

    // Emit the message event
    messageEmitter.emit('newMessage', { message: transformedMessage });

    return transformedMessage;
  } catch (error) {
    console.error('Error in createMessage:', error);
    return null;
  }
}

export async function deleteChatRoom(chatRoomId: string) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user?.id) {
      throw new Error('Unauthorized');
    }

    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id: chatRoomId },
      include: { users: true }
    });

    if (!chatRoom) {
      throw new Error('Chat room not found');
    }

    const hasAccess = chatRoom.users.some(u => u.id === user.id);
    if (!hasAccess) {
      throw new Error('User does not have access to this chat room');
    }

    await prisma.chatRoom.delete({
      where: { id: chatRoomId }
    });

    return true;
  } catch (error) {
    console.error('Error in deleteChatRoom:', error);
    return false;
  }
}

export async function getChatRoomMessages(chatId: string) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user?.id) {
      throw new Error('Unauthorized');
    }

    // Verify chat room exists and user has access
    const chatRoom = await prisma.chatRoom.findFirst({
      where: { 
        id: chatId,
        users: {
          some: {
            id: user.id
          }
        }
      }
    });

    if (!chatRoom) {
      throw new Error('Chat room not found or access denied');
    }

    // Fetch messages with user information
    const messages = await prisma.message.findMany({
      where: {
        chatRoomId: chatId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            isAI: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Transform messages to ensure consistent format
    return messages.map(message => ({
      ...message,
      metadata: message.metadata || {},
      role: message.isAIMessage ? 'assistant' : 'user',
      user: message.user || null
    }));
  } catch (error) {
    console.error('Error in getChatRoomMessages:', error);
    return null;
  }
}