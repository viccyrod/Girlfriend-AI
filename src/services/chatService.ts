// This file defines the `ChatService` class, which manages chat room and message-related operations. It uses Prisma as the database client to interact with the backend data and includes several methods:

// Importing necessary modules and services
import prisma from '@/lib/clients/prisma';
import { getCurrentUser } from '@/lib/session';
import { logger } from '@/lib/utils/logger';
import Anthropic from '@anthropic-ai/sdk';
import { aiRateLimiter } from '@/lib/utils/rateLimiter';
import { conversationManager } from '@/lib/chat/conversationManager';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

interface ChatContext {
  lastResponses: string[];
  currentTopic?: string;
  mood?: string;
  recentKeywords: Set<string>;
}

interface ConversationContext {
  lastResponses: string[];
  mood: string;
  topics: Set<string>;
  lastInteractionTime: number;
}

interface Message {
  content: string;
}

interface AIMode {
  type: string;
}

// ChatService class that provides methods for managing chat rooms and messages
export class ChatService {
  private static instance: ChatService;
  private conversationContexts: Map<string, ConversationContext> = new Map();
  private rateLimiter: any;

  constructor() {
    this.rateLimiter = new (require('@/lib/utils/rateLimiter'))();
  }

  static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  async generateUniqueResponse(
    content: string,
    chatRoomId: string,
    userId: string,
    previousMessages: Message[]
  ): Promise<string> {
    try {
      // Get chat room and AI model
      const chatRoom = await prisma.chatRoom.findUnique({
        where: { id: chatRoomId },
        include: { aiModel: true }
      });

      if (!chatRoom?.aiModel) {
        throw new Error('Chat room or AI model not found');
      }

      // Check rate limit
      const canProceed = await this.rateLimiter.checkLimit(userId);
      if (!canProceed) {
        return "I need a moment to process our conversation. Could you try again in a few seconds? 😊";
      }

      // Get or create conversation context
      let context = this.conversationContexts.get(chatRoomId);
      if (!context || Date.now() - context.lastInteractionTime > 3600000) {
        context = {
          lastResponses: [],
          mood: 'neutral',
          topics: new Set(),
          lastInteractionTime: Date.now()
        };
        this.conversationContexts.set(chatRoomId, context);
      }

      // Update context with new topics
      const newTopics = extractTopics(content);
      newTopics.forEach(topic => context.topics.add(topic));

      // Generate AI response with retry logic
      let retries = 0;
      const maxRetries = 2;
      let response;

      while (retries <= maxRetries) {
        try {
          response = await generateAIResponse(
            content,
            chatRoom.aiModel,
            Array.from(context.topics),
            previousMessages,
            determineResponseMode(content, context)
          );
          break;
        } catch (error) {
          console.error(`Attempt ${retries + 1} failed:`, error);
          retries++;
          if (retries > maxRetries) throw error;
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        }
      }

      if (!response) {
        throw new Error('Failed to generate response after retries');
      }

      // Update conversation context
      context.lastResponses.push(response.content);
      if (context.lastResponses.length > 5) {
        context.lastResponses.shift();
      }
      context.lastInteractionTime = Date.now();
      context.mood = calculateNewMood(content, response.content, context.mood);

      return response.content;

    } catch (error) {
      console.error('Error in generateUniqueResponse:', error);
      return "I apologize, but I'm having trouble processing that right now. Could we try again? 🙏";
    }
  }

  // Method to send a message to a specific chat room
  static async sendMessage(content: string, chatRoomId: string, aiModelId: string | null) {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error('Unauthorized');

    try {
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

      // Generate a unique response using Claude
      if (aiModelId) {
        const aiModel = await prisma.aIModel.findUnique({ where: { id: aiModelId } });
        if (aiModel) {
          const response = await ChatService.getInstance().generateUniqueResponse(content, chatRoomId, currentUser.id, []);
          await prisma.message.create({
            data: {
              content: response,
              userId: null,
              chatRoomId,
              aiModelId
            }
          });
        }
      }

      return message;
    } catch (error) {
      logger.error({
        message: 'Failed to send message',
        error: error as Error,
        userId: currentUser.id,
        chatRoomId,
        aiModelId: aiModelId || undefined,
        content: content.substring(0, 100)
      });
      throw error;
    }
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

    // Changed from /api/chat/${chatRoomId}/generate-image to /api/image
    const response = await fetch('/api/image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, chatRoomId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to generate image');
    }

    return response.json();
  }
}

// Helper function to extract topics from a message
function extractTopics(message: string): string[] {
  const topics = new Set<string>();
  
  // Extract nouns and key phrases using basic NLP
  const words = message.toLowerCase().split(/\s+/);
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']);
  
  words.forEach(word => {
    if (!stopWords.has(word) && word.length > 2) {
      topics.add(word);
    }
  });

  return Array.from(topics);
}

// Helper function to determine response mode based on context
function determineResponseMode(message: string, context: any): AIMode {
  const messageLength = message.split(/\s+/).length;
  const hasQuestion = message.includes('?');
  const isEmotional = /(!|\?{2,}|❤️|😊|😘)/.test(message);
  
  if (hasQuestion || messageLength > 15) {
    return { type: 'precise' };
  } else if (isEmotional || context.mood === 'playful') {
    return { type: 'creative' };
  }
  return { type: 'balanced' };
}

// Helper function to calculate new mood based on interaction
function calculateNewMood(
  userMessage: string,
  aiResponse: string,
  currentMood: string
): string {
  const moodMap = {
    playful: ['haha', 'lol', '😊', '😘', '💕', 'fun', 'play'],
    romantic: ['love', 'heart', 'miss', 'beautiful', 'sweet'],
    serious: ['why', 'how', 'what', 'when', 'explain'],
    neutral: []
  };

  let moodScores = {
    playful: 0,
    romantic: 0,
    serious: 0,
    neutral: 1 // Base score for neutral
  };

  // Analyze both messages for mood indicators
  const combinedText = (userMessage + ' ' + aiResponse).toLowerCase();
  
  Object.entries(moodMap).forEach(([mood, indicators]) => {
    indicators.forEach(indicator => {
      if (combinedText.includes(indicator)) {
        moodScores[mood] += 1;
      }
    });
  });

  // Add weight to current mood for smoother transitions
  moodScores[currentMood] += 2;

  // Return mood with highest score
  return Object.entries(moodScores)
    .reduce((a, b) => a[1] > b[1] ? a : b)[0];
}

// Helper function to generate AI response
async function generateAIResponse(
  content: string,
  aiModel: any,
  topics: string[],
  previousMessages: Message[],
  responseMode: AIMode
): Promise<{ content: string }> {
  // Implement AI response generation logic here
  // For demonstration purposes, return a dummy response
  return { content: 'This is a dummy AI response' };
}
