'use strict';

import prisma from "@/lib/clients/prisma";
// Importing necessary modules and functions from external libraries
import { NextResponse } from 'next/server';
import { generateGreeting, getAIResponse } from '@/lib/clients/xai'; // Using our Grok implementation
import { retrieveMemories, storeMemory } from '@/utils/memory';
// import { Memory } from '@/types/memory';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { getChatRoomMessagesServer } from '../../serverActions';


// Handles POST requests to create a new message and generate an AI response

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get user session
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get chat room and validate access
    const chatRoom = await prisma.chatRoom.findFirst({
      where: {
        id: params.id,
        users: {
          some: {
            id: user.id
          }
        }
      },
      include: {
        aiModel: true,
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    });

    if (!chatRoom) {
      return NextResponse.json({ error: 'Chat room not found' }, { status: 404 });
    }

    // Get message content and mode
    const { content, mode = 'chat' } = await request.json();
    
    // Check if this is a greeting request or first message
    const isFirstMessage = chatRoom.messages.length === 0;
    if (mode === 'greeting' || isFirstMessage) {
      if (!chatRoom.aiModel) {
        throw new Error('AI Model not found');
      }

      const greeting = await generateGreeting(chatRoom.aiModel);
      
      // Create AI greeting message
      const greetingMessage = await prisma.message.create({
        data: {
          content: greeting,
          chatRoomId: params.id,
          isAIMessage: true,
          aiModelId: chatRoom.aiModelId,
          role: 'assistant'
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

      // If it's just a greeting request, return early
      if (mode === 'greeting') {
        return NextResponse.json({ greetingMessage });
      }
    }

    // Continue with regular message processing if content exists
    if (!content) {
      return NextResponse.json({ error: 'Message content required' }, { status: 400 });
    }

    // Create user message
    const userMessage = await prisma.message.create({
      data: {
        content,
        chatRoomId: params.id,
        userId: user.id,
        isAIMessage: false,
        role: 'user'
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

    try {
      // Get memories before generating response
      const memories = await retrieveMemories(
        chatRoom.aiModelId!,
        user.id!,
        params.id
      );

      // Get AI response with memories
      if (!chatRoom.aiModel) {
        throw new Error('AI Model not found');
      }

      const aiResponse = await getAIResponse(
        content, 
        chatRoom.aiModel,
        memories || []
      );
      
      // Create AI message
      const aiMessage = await prisma.message.create({
        data: {
          content: aiResponse,
          chatRoomId: params.id,
          isAIMessage: true,
          aiModelId: chatRoom.aiModelId,
          role: 'assistant'
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

      // Store the AI response in memory
      await storeMemory(
        chatRoom.aiModel!.id,
        user.id,
        `AI: ${aiResponse}`
      );

      return NextResponse.json({
        userMessage,
        aiMessage
      });

    } catch (error) {
      console.error('Error processing message:', error);
      return NextResponse.json({
        userMessage,
        error: 'Failed to get AI response'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in message handler:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


// Update getChatMessages to be used in GET endpoint
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const messages = await getChatRoomMessagesServer(params.id);
    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    

    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id: params.id },
      include: { users: true }
    });

    if (!chatRoom) {
      return NextResponse.json({ error: 'Chat room not found' }, { status: 404 });
    }

    // Verify user has permission to delete this room
    if (!chatRoom.users.some(roomUser => roomUser.id === user.id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete the chat room and all associated messages (using cascade)
    await prisma.chatRoom.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete chat room:', error);
    return NextResponse.json(
      { error: 'Failed to delete chat room' },
      { status: 500 }
    );
  }
}