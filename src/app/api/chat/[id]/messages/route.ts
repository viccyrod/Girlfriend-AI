'use strict';

import { NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { generateAIResponse } from '@/lib/ai-client';
import { 
  getChatRoomMessagesServer, 
  createMessageServer
} from '@/lib/actions/server/chat';
import { messageEmitter } from '@/lib/messageEmitter';
import prisma from '@/lib/clients/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content } = await request.json();
    
    // Pass the email to createMessageServer
    const userMessage = await createMessageServer(
      params.id, 
      user.id, 
      content,
      false,
      user.email
    );

    console.log('Emitting user message:', userMessage);
    messageEmitter.emit(`chat:${params.id}`, userMessage);

    // Get chat room and AI model details
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id: params.id },
      include: {
        aiModel: {
          select: {
            id: true,
            name: true,
            isPrivate: true,
            imageUrl: true,
            userId: true,
            createdAt: true,
            updatedAt: true,
            personality: true,
            appearance: true,
            backstory: true,
            hobbies: true,
            likes: true,
            dislikes: true,
            isHumanX: true
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!chatRoom?.aiModel) {
      throw new Error('Chat room or AI model not found');
    }

    // Generate AI response
    const aiResponse = await generateAIResponse(
      content,
      chatRoom.aiModel,
      chatRoom.messages.map(message => message.content).reverse(),
      chatRoom.messages,
      'creative'
    );

    // Create AI message
    const aiMessage = await prisma.message.create({
      data: {
        content: aiResponse.content,
        chatRoomId: params.id,
        isAIMessage: true,
        metadata: {
          mode: aiResponse.mode,
          confidence: aiResponse.confidence
        }
      }
    });

    console.log('Emitting AI message:', aiMessage);
    messageEmitter.emit(`chat:${params.id}`, aiMessage);

    return NextResponse.json({
      userMessage,
      aiMessage
    });
  } catch (error) {
    console.error('Error in POST /api/chat/[id]/messages:', error);
    return NextResponse.json({ 
      error: 'Failed to send message',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

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