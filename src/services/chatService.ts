// This file defines the `ChatService` class, which manages chat room and message-related operations. It uses Prisma as the database client to interact with the backend data and includes several methods:

// Importing necessary modules and services
import { AIMode, generateAIResponse } from '@/lib/ai-client';
import prisma from '@/lib/clients/prisma';
import { getCurrentUser } from '@/lib/session';
import { storeMemory } from '@/utils/memory';

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
    // Get the current user from the session
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error('Unauthorized');

    // Find the AI model by ID
    const aiModel = await prisma.aIModel.findUnique({
      where: { id: aiModelId },
      include: { createdBy: true }
    });

    if (!aiModel) {
      throw new Error('AI Model not found');
    }

    // Create a new chat room and add the current user to it
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
        aiModel: true,
        messages: true
      }
    });

    // Generate an initial greeting from the AI model
    const aiResponse = await generateAIResponse(
      "greeting",
      aiModel,
      [], // No memories for greeting
      [], // No previous messages
      "greeting" as AIMode
    );

    // Create a message with the AI's greeting in the chat room
    await prisma.message.create({
      data: {
        content: aiResponse.content,
        chatRoomId: chatRoom.id,
        aiModelId: aiModel.id,
        isAIMessage: true,
        metadata: {
          mode: "greeting",
          confidence: aiResponse.confidence
        }
      }
    });

    // Store the AI-generated greeting in memory for future context
    await storeMemory(
      aiModelId,
      currentUser.id,
      `AI: ${aiResponse.content}`
    );

    // Fetch and return the updated chat room with all relevant data
    const updatedChatRoom = await prisma.chatRoom.findUnique({
      where: { id: chatRoom.id },
      include: {
        users: true,
        aiModel: true,
        messages: true
      }
    });

    if (!updatedChatRoom) {
      throw new Error('Failed to fetch updated chat room');
    }

    return updatedChatRoom;
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


