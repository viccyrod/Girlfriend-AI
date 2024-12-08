'use strict';

import { NextResponse } from 'next/server';
import { getDbUser } from '@/lib/actions/server/auth';
import prisma from '@/lib/clients/prisma';
import { OpenAIStream } from '@/lib/openai-stream';
import { streamText } from 'ai';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getDbUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content } = await req.json();

    // Get chat room and verify access
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
            createdAt: 'asc'
          },
          take: 50 // Get last 50 messages for context
        }
      }
    });

    if (!chatRoom?.aiModel) {
      return NextResponse.json({ error: 'Chat room not found' }, { status: 404 });
    }

    // Save user message
    const userMessage = await prisma.message.create({
      data: {
        content,
        chatRoomId: params.id,
        userId: user.id,
        isAIMessage: false,
        role: 'user'
      }
    });

    // Create system message with AI model's personality
    const systemMessage = {
      role: 'system',
      content: `You are ${chatRoom.aiModel.name}, an AI character with the following traits:
      Personality: ${chatRoom.aiModel.personality}
      Appearance: ${chatRoom.aiModel.appearance}
      Backstory: ${chatRoom.aiModel.backstory}
      Hobbies: ${chatRoom.aiModel.hobbies}
      Likes: ${chatRoom.aiModel.likes}
      Dislikes: ${chatRoom.aiModel.dislikes}
      
      Please respond in character, maintaining these traits consistently.`
    };

    // Format messages for OpenAI
    const messages = [
      systemMessage,
      ...chatRoom.messages.map(msg => ({
        role: msg.isAIMessage ? 'assistant' : 'user',
        content: msg.content
      })),
      { role: 'user', content }
    ];

    // Create stream
    const stream = await OpenAIStream({
      model: 'gpt-4',
      messages,
      temperature: 0.9,
      max_tokens: 500,
    });

    return new Response(stream);
  } catch (error) {
    console.error('Error in chat messages:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getDbUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const before = searchParams.get('before');
    const limit = parseInt(searchParams.get('limit') || '30');

    const messages = await prisma.message.findMany({
      where: {
        chatRoomId: params.id,
        ...(before ? { id: { lt: before } } : {}),
        chatRoom: {
          users: {
            some: {
              id: user.id
            }
          }
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit + 1 // Take one extra to check if there are more
    });

    const hasMore = messages.length > limit;
    const messagesToReturn = hasMore ? messages.slice(0, -1) : messages;

    return NextResponse.json({
      messages: messagesToReturn.reverse(), // Reverse to get chronological order
      hasMore
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
