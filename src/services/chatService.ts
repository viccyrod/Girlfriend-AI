// This file defines the `ChatService` class, which manages chat room and message-related operations. It uses Prisma as the database client to interact with the backend data and includes several methods:

// Importing necessary modules and services
// import { AIMode, generateAIResponse } from '@/lib/ai-client';
import prisma from '@/lib/clients/prisma';
import { getCurrentUser } from '@/lib/session';
// import { storeMemory } from '@/utils/memory';

// ChatService class that provides methods for managing chat rooms and messages
export class ChatService {
  // Method to send a message to a specific chat room
  static async sendMessage(content: string, chatRoomId: string, aiModelId: string | null) {
    // Get the current user from the session
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error('Unauthorized');

    // Find the chat room by ID and include its users
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id: chatRoomId },
      include: { users: true }
    });

    if (!chatRoom) {
      throw new Error('Chat room not found');
    }

    // Check if the current user is a member of the chat room
    if (!chatRoom.users.some(user => user.id === currentUser.id)) {
      throw new Error('User is not a member of this chat room');
    }

    // Create a new message in the chat room
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

  // Method to create a new chat room
  static async createChatRoom(name: string, aiModelId: string) {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('Unauthorized: Please sign in to create a chat room');
    }

    try {
      // Verify AI Model exists
      const aiModel = await prisma.aIModel.findUnique({
        where: { id: aiModelId }
      });

      if (!aiModel) {
        throw new Error('AI Model not found');
      }

      // Create chat room
      const chatRoom = await prisma.chatRoom.create({
        data: {
          name,
          aiModelId,
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
          messages: true
        }
      });

      return chatRoom;
    } catch (error) {
      console.error('Error creating chat room:', error);
      throw new Error('Failed to create chat room');
    }
  }

  // Method to delete a chat room
  static async deleteChatRoom(chatRoomId: string) {
    // Get the current user from the session
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error('Unauthorized');

    // Find the chat room by ID and include its users
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id: chatRoomId },
      include: { users: true }
    });

    if (!chatRoom) {
      throw new Error('Chat room not found');
    }

    // Check if the current user is authorized to delete the chat room
    if (!chatRoom.users.some(user => user.id === currentUser.id)) {
      throw new Error('User is not authorized to delete this chat room');
    }

    // Delete all messages in the chat room and then delete the chat room itself
    await prisma.$transaction([
      prisma.message.deleteMany({ where: { chatRoomId } }),
      prisma.chatRoom.delete({ where: { id: chatRoomId } })
    ]);

    return { success: true };
  }

  // Method to get all chat rooms for the current user
  static async getChatRooms() {
    // Get the current user from the session
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error('Unauthorized');

    // Find all chat rooms that include the current user
    return prisma.chatRoom.findMany({
      where: {
        users: {
          some: { id: currentUser.id }
        }
      },
      include: {
        users: true,
        aiModel: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1 // Include the most recent message
        }
      }
    });
  }
  static async generateImage(prompt: string, chatRoomId: string) {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error('Unauthorized');
  
    const response = await fetch(`/api/chat/${chatRoomId}/generate-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });
  
    if (!response.ok) {
      throw new Error('Failed to generate image');
    }
  
    return response.json();
  }
}


