'use server'

import { getCurrentUser } from '@/lib/session';
import prisma from '@/lib/clients/prisma';
import { messageEmitter } from '@/lib/messageEmitter';

export async function getOrCreateChatRoomServer(modelId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('Unauthorized');

  try {
    // First, verify the AI Model exists
    const aiModel = await prisma.aIModel.findUnique({
      where: { id: modelId }
    });

    if (!aiModel) {
      throw new Error(`AI Model with ID ${modelId} not found`);
    }

    // Use a transaction to handle the chat room creation atomically
    const chatRoom = await prisma.$transaction(async (tx) => {
      // Check for existing chat room within the transaction
      const existing = await tx.chatRoom.findFirst({
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
            orderBy: {
              createdAt: 'asc'
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true
                }
              }
            }
          }
        }
      });

      if (existing) {
        return existing;
      }

      // Create new chat room if none exists
      return tx.chatRoom.create({
        data: {
          name: `Chat with ${aiModel.name}`,
          aiModel: {
            connect: { id: modelId }
          },
          users: {
            connect: { id: currentUser.id }
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
            orderBy: {
              createdAt: 'asc'
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true
                }
              }
            }
          }
        }
      });
    });

    return chatRoom;

  } catch (error) {
    console.error('Error in getOrCreateChatRoom:', error);
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
    console.log('Creating message:', { chatRoomId, content, isAIMessage, userEmail });
    
    const dbUser = await prisma.user.findUnique({
      where: { email: userEmail }
    });

    if (!dbUser) {
      console.error('User not found:', userEmail);
      throw new Error('User not found');
    }

    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id: chatRoomId },
      include: { users: true, aiModel: true }
    });

    if (!chatRoom) {
      console.error('Chat room not found:', chatRoomId);
      throw new Error('Chat room not found');
    }

    if (!isAIMessage && !chatRoom.users.some(u => u.id === dbUser.id)) {
      console.error('Access denied:', {
        userId: dbUser.id,
        chatRoomUsers: chatRoom.users.map(u => u.id)
      });
      throw new Error('Access denied');
    }

    const message = await prisma.message.create({
      data: {
        content,
        chatRoomId,
        userId: isAIMessage ? null : dbUser.id,
        isAIMessage,
        aiModelId: isAIMessage ? chatRoom.aiModel?.id : null,
        metadata: isAIMessage ? { type: 'ai_response' } : {}
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    });

    console.log('Message created:', message.id);
    console.log('Emitting message event:', `chat:${chatRoomId}`);
    messageEmitter.emit(`chat:${chatRoomId}`, message);
    
    return message;
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

  if (!chatRoom.users.some(roomUser => roomUser.id === userId)) {
    throw new Error('Unauthorized');
  }

  await prisma.chatRoom.delete({
    where: { id: chatRoomId }
  });
}

export async function getChatRoomMessagesServer(chatId: string) {
  try {
    // Explicitly fetch ALL messages for the chat room
    const messages = await prisma.message.findMany({
      where: {
        chatRoomId: chatId
      },
      orderBy: {
        createdAt: 'asc'  // Show oldest messages first
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    });

    return messages;
  } catch (error) {
    console.error('Error in getChatRoomMessagesServer:', error);
    throw error;
  }
}
