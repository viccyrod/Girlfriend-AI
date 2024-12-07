'use server'

import { getCurrentUser } from '@/lib/session';
import prisma from '@/lib/clients/prisma';
import { messageEmitter } from '@/lib/messageEmitter';

export async function getOrCreateChatRoomServer(modelId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('Unauthorized');

  try {
    // First find the AI model
    const aiModel = await prisma.aIModel.findUnique({
      where: { id: modelId },
      include: { createdBy: true }
    });

    if (!aiModel) throw new Error('AI Model not found');

    // Create or find chat room in a transaction
    const chatRoom = await prisma.$transaction(async (tx) => {
      // Find existing chat room
      const existingRoom = await tx.chatRoom.findFirst({
        where: {
          aiModelId: modelId,
          users: {
            some: {
              id: currentUser.id
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
              id: modelId
            }
          },
          users: {
            connect: {
              id: currentUser.id
            }
          },
          createdBy: {
            connect: {
              id: currentUser.id
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
    console.error('Error in getOrCreateChatRoomServer:', error);
    throw error;
  }
}

export async function createMessageServer(
  chatRoomId: string,
  kindeUserId: string,
  content: string,
  isAIMessage: boolean = false,
  userEmail?: string
) {
  try {
    console.log('Creating message:', { chatRoomId, content, isAIMessage });
    
    // Find or create user
    const dbUser = await prisma.user.findUnique({
      where: { id: kindeUserId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        isAI: true
      }
    });

    if (!dbUser) {
      throw new Error('User not found');
    }

    // Verify chat room exists and user has access
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id: chatRoomId },
      include: {
        users: true
      }
    });

    if (!chatRoom) {
      throw new Error('Chat room not found');
    }

    const hasAccess = chatRoom.users.some(user => user.id === kindeUserId);
    if (!hasAccess) {
      throw new Error('User does not have access to this chat room');
    }

    // If this is an AI message, mark previous messages as responded
    if (isAIMessage) {
      await prisma.message.updateMany({
        where: {
          chatRoomId,
          isAIMessage: false
        },
        data: {
          updatedAt: new Date()
        }
      });
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
            id: kindeUserId
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
    messageEmitter.emit('newMessage', transformedMessage);

    return transformedMessage;
  } catch (error) {
    console.error('Error in createMessageServer:', error);
    throw error;
  }
}

export async function deleteChatRoomServer(chatRoomId: string, userId: string) {
  const chatRoom = await prisma.chatRoom.findUnique({
    where: { id: chatRoomId },
    include: { users: true }
  });

  if (!chatRoom) {
    throw new Error('Chat room not found');
  }

  const hasAccess = chatRoom.users.some(user => user.id === userId);
  if (!hasAccess) {
    throw new Error('User does not have access to this chat room');
  }

  await prisma.chatRoom.delete({
    where: { id: chatRoomId }
  });
}

export async function getChatRoomMessagesServer(chatId: string) {
  try {
    console.log('Fetching messages for chat room:', chatId);
    
    // Verify chat room exists
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id: chatId },
      include: { users: true }
    });

    if (!chatRoom) {
      throw new Error('Chat room not found');
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

    console.log('Found messages:', messages.length);

    // Transform messages to ensure consistent format
    return messages.map(message => ({
      ...message,
      metadata: message.metadata || {},
      role: message.isAIMessage ? 'assistant' : 'user',
      user: message.user || null
    }));
  } catch (error) {
    console.error('Error in getChatRoomMessagesServer:', error);
    throw error;
  }
}


