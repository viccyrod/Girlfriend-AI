'use server'

import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from '@/lib/clients/prisma';
import { messageEmitter } from '@/lib/messageEmitter';

export async function getOrCreateChatRoom(aiModelId: string) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user?.id) {
      throw new Error('Unauthorized');
    }

    // Find existing chat room
    let chatRoom = await prisma.chatRoom.findFirst({
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
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          }
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 10,
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

    // If no chat room exists, create one
    if (!chatRoom) {
      // Get AI model name
      const aiModel = await prisma.aIModel.findUnique({
        where: { id: aiModelId }
      });

      if (!aiModel) throw new Error('AI Model not found');

      chatRoom = await prisma.chatRoom.create({
        data: {
          name: `Chat with ${aiModel.name}`,
          aiModelId,
          users: {
            connect: {
              id: user.id
            }
          }
        },
        include: {
          aiModel: {
            include: {
              createdBy: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true
                }
              }
            }
          },
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          },
          messages: {
            orderBy: {
              createdAt: 'desc'
            },
            take: 10,
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
    }

    return chatRoom;
  } catch (error) {
    console.error('Error in getOrCreateChatRoom:', error);
    return null;
  }
}

export async function sendMessage(chatRoomId: string, content: string) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user?.id) {
      throw new Error('Unauthorized');
    }

    const message = await prisma.message.create({
      data: {
        content,
        chatRoomId,
        userId: user.id
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

    messageEmitter.emit(`chat:${chatRoomId}`, { message });
    return message;
  } catch (error) {
    console.error('Error in sendMessage:', error);
    return null;
  }
}

export async function deleteMessage(messageId: string) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user?.id) {
      throw new Error('Unauthorized');
    }

    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        userId: user.id
      }
    });

    if (!message) {
      throw new Error('Message not found or unauthorized');
    }

    await prisma.message.delete({
      where: { id: messageId }
    });

    return true;
  } catch (error) {
    console.error('Error in deleteMessage:', error);
    return false;
  }
}


